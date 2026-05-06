// Страница обучения
let currentUser = null;
let currentCourse = null;
let currentModules = [];
let currentLessons = [];
let currentLesson = null;
let allLessonsMap = new Map();

document.addEventListener('DOMContentLoaded', async () => {
    await openDB();
    
    // Проверка авторизации
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    const users = await getAllUsers();
    currentUser = users.find(u => u.id == parseInt(userId));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Получаем ID курса из URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    
    if (!courseId) {
        alert('Курс не выбран');
        window.location.href = 'courses.html';
        return;
    }
    
    await loadCourse(parseInt(courseId));
    
    // Обработчики кнопок
    document.getElementById('prevLessonBtn').addEventListener('click', () => navigateLesson(-1));
    document.getElementById('nextLessonBtn').addEventListener('click', () => navigateLesson(1));
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('userId');
        window.location.href = 'index.html';
    });
    
    // Мобильное меню
    document.getElementById('navToggle')?.addEventListener('click', () => {
        document.querySelector('.nav-menu').classList.toggle('active');
    });
});

async function loadCourse(courseId) {
    currentCourse = await getCourseById(courseId);
    if (!currentCourse) {
        alert('Курс не найден');
        window.location.href = 'courses.html';
        return;
    }
    
    document.getElementById('courseTitle').textContent = currentCourse.title;
    document.title = `${currentCourse.title} - Vertex Academy`;
    
    // Загружаем модули
    currentModules = await getModulesByCourse(courseId);
    currentModules.sort((a, b) => a.orderNum - b.orderNum);
    
    // Загружаем все уроки
    for (const module of currentModules) {
        const lessons = await getLessonsByModule(module.id);
        lessons.sort((a, b) => a.orderNum - b.orderNum);
        module.lessons = lessons;
        for (const lesson of lessons) {
            allLessonsMap.set(lesson.id, lesson);
            // Проверяем прогресс
            const progress = await getProgress(currentUser.id, lesson.id);
            lesson.completed = progress && progress.completed;
            lesson.score = progress ? progress.score : 0;
        }
    }
    
    renderSidebar();
    
    // Загружаем первый урок или сохранённый прогресс
    const savedLessonId = localStorage.getItem(`last_lesson_${courseId}`);
    let firstLesson = null;
    
    for (const module of currentModules) {
        for (const lesson of module.lessons) {
            if (!firstLesson) firstLesson = lesson;
            if (savedLessonId && lesson.id == savedLessonId) {
                loadLesson(lesson.id);
                return;
            }
        }
    }
    
    if (firstLesson) loadLesson(firstLesson.id);
}

function renderSidebar() {
    const container = document.getElementById('modulesList');
    let html = '';
    
    for (const module of currentModules) {
        const completedCount = module.lessons.filter(l => l.completed).length;
        const totalCount = module.lessons.length;
        
        html += `
            <div class="module-item">
                <div class="module-header" data-module="${module.id}">
                    <span>${escapeHtml(module.title)}</span>
                    <div>
                        <span style="font-size:0.8rem; margin-right:10px;">${completedCount}/${totalCount}</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
                <div class="lessons-list" data-module-lessons="${module.id}">
        `;
        
        for (const lesson of module.lessons) {
            const completedIcon = lesson.completed ? '<i class="fas fa-check-circle" style="color:#2ed573;"></i>' : '<i class="far fa-circle"></i>';
            const testIcon = lesson.isTest ? '<i class="fas fa-question-circle"></i>' : '<i class="fas fa-play-circle"></i>';
            
            html += `
                <div class="lesson-item ${lesson.id === currentLesson?.id ? 'active' : ''} ${lesson.completed ? 'completed' : ''}" data-lesson="${lesson.id}">
                    <div class="lesson-icon">${testIcon}</div>
                    <div class="lesson-title">${escapeHtml(lesson.title)}</div>
                    <div class="lesson-status">${completedIcon}</div>
                </div>
            `;
        }
        
        html += `</div></div>`;
    }
    
    container.innerHTML = html;
    
    // Добавляем обработчики
    document.querySelectorAll('.module-header').forEach(header => {
        header.addEventListener('click', () => {
            const moduleId = header.dataset.module;
            const lessonsList = document.querySelector(`.lessons-list[data-module-lessons="${moduleId}"]`);
            header.classList.toggle('expanded');
            lessonsList.classList.toggle('active');
        });
        // Раскрываем первый модуль
        if (header.dataset.module == currentModules[0]?.id) {
            header.classList.add('expanded');
            document.querySelector(`.lessons-list[data-module-lessons="${currentModules[0].id"]`).classList.add('active');
        }
    });
    
    document.querySelectorAll('.lesson-item').forEach(item => {
        item.addEventListener('click', () => {
            const lessonId = parseInt(item.dataset.lesson);
            loadLesson(lessonId);
        });
    });
}

async function loadLesson(lessonId) {
    currentLesson = await getLessonById(lessonId);
    if (!currentLesson) return;
    
    // Сохраняем последний урок
    localStorage.setItem(`last_lesson_${currentCourse.id}`, lessonId);
    
    // Обновляем активный класс в боковой панели
    document.querySelectorAll('.lesson-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.lesson) === lessonId) {
            item.classList.add('active');
        }
    });
    
    document.getElementById('lessonTitle').textContent = currentLesson.title;
    
    // Отрисовываем контент
    const contentBody = document.getElementById('contentBody');
    
    if (currentLesson.isTest) {
        await renderTest(contentBody);
    } else {
        renderLesson(contentBody);
    }
    
    // Показываем навигацию
    document.getElementById('contentNav').style.display = 'flex';
    updateNavButtons();
}

function renderLesson(container) {
    let html = '';
    
    if (currentLesson.video_url) {
        // Извлекаем ID видео из URL YouTube
        let videoId = '';
        if (currentLesson.video_url.includes('youtube.com/embed/')) {
            videoId = currentLesson.video_url.split('/embed/')[1];
        } else if (currentLesson.video_url.includes('youtu.be')) {
            videoId = currentLesson.video_url.split('/').pop();
        } else if (currentLesson.video_url.includes('v=')) {
            videoId = currentLesson.video_url.split('v=')[1].split('&')[0];
        } else {
            videoId = 'dQw4w9WgXcQ';
        }
        
        html += `
            <div class="video-container">
                <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
    }
    
    html += currentLesson.content || '<p>Материал урока временно недоступен.</p>';
    
    // Если урок ещё не пройден, добавляем кнопку "Отметить как пройденный"
    const progress = await getProgress(currentUser.id, currentLesson.id);
    if (!progress || !progress.completed) {
        html += `
            <button class="btn btn-primary" onclick="markLessonComplete()" style="margin-top: 20px;">
                <i class="fas fa-check"></i> Отметить как пройденный
            </button>
        `;
    } else {
        html += `
            <div class="test-result success" style="margin-top: 20px;">
                <i class="fas fa-check-circle"></i> Урок пройден! (${progress.score}%)
            </div>
        `;
    }
    
    container.innerHTML = html;
}

async function renderTest(container) {
    const questions = await getTestQuestions(currentLesson.id);
    
    let html = `
        <div class="test-container">
            <h3>Проверка знаний</h3>
            <p>Ответьте на вопросы, чтобы завершить урок.</p>
            <form id="testForm">
    `;
    
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        html += `
            <div class="question-item" data-question="${q.id}" data-type="${q.type}" data-correct='${JSON.stringify(q.correct)}'>
                <div class="question-text">${i+1}. ${escapeHtml(q.text)}</div>
                <div class="options-list">
        `;
        
        for (let j = 0; j < q.options.length; j++) {
            const inputType = q.type === 'single' ? 'radio' : 'checkbox';
            const name = `q_${q.id}`;
            html += `
                <label class="option">
                    <input type="${inputType}" name="${name}" value="${j}">
                    <span>${escapeHtml(q.options[j])}</span>
                </label>
            `;
        }
        
        html += `</div></div>`;
    }
    
    const progress = await getProgress(currentUser.id, currentLesson.id);
    const alreadyCompleted = progress && progress.completed;
    
    html += `
                <button type="button" class="btn btn-primary check-test-btn" onclick="checkTest()" ${alreadyCompleted ? 'disabled' : ''}>
                    <i class="fas fa-check-double"></i> Проверить ответы
                </button>
            </form>
            <div id="testResult"></div>
        </div>
    `;
    
    container.innerHTML = html;
    
    if (alreadyCompleted) {
        document.getElementById('testResult').innerHTML = `
            <div class="test-result success">
                <i class="fas fa-check-circle"></i> Тест пройден! (${progress.score}%)
            </div>
        `;
    }
}

window.markLessonComplete = async function() {
    await saveProgress(currentUser.id, currentLesson.id, 100);
    
    // Обновляем состояние урока в памяти
    currentLesson.completed = true;
    
    // Обновляем боковую панель
    for (const module of currentModules) {
        const lesson = module.lessons.find(l => l.id === currentLesson.id);
        if (lesson) lesson.completed = true;
    }
    renderSidebar();
    
    // Перезагружаем контент
    await loadLesson(currentLesson.id);
    
    // Показываем уведомление
    showNotification('Урок отмечен как пройденный!', 'success');
};

window.checkTest = async function() {
    const questions = await getTestQuestions(currentLesson.id);
    let correctCount = 0;
    let totalQuestions = questions.length;
    
    for (const q of questions) {
        const inputs = document.querySelectorAll(`input[name="q_${q.id}"]:checked`);
        const selectedValues = Array.from(inputs).map(input => parseInt(input.value));
        
        let isCorrect = false;
        if (q.type === 'single') {
            isCorrect = selectedValues.length === 1 && selectedValues[0] === q.correct;
        } else {
            const correctArray = q.correct;
            isCorrect = selectedValues.length === correctArray.length && 
                        selectedValues.every(v => correctArray.includes(v));
        }
        
        if (isCorrect) correctCount++;
        
        // Подсвечиваем правильные/неправильные ответы
        const questionDiv = document.querySelector(`.question-item[data-question="${q.id}"]`);
        questionDiv.style.borderLeft = isCorrect ? '3px solid #2ed573' : '3px solid #e65c5c';
    }
    
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;
    
    const resultDiv = document.getElementById('testResult');
    resultDiv.innerHTML = `
        <div class="test-result ${passed ? 'success' : 'error'}">
            <h4>${passed ? '✅ Тест пройден!' : '❌ Тест не пройден'}</h4>
            <p>Правильных ответов: ${correctCount} из ${totalQuestions} (${score}%)</p>
            ${passed ? '<p>Отлично! Вы можете переходить к следующему уроку.</p>' : '<p>Пожалуйста, повторите материал и попробуйте снова.</p>'}
        </div>
    `;
    
    if (passed) {
        await saveProgress(currentUser.id, currentLesson.id, score);
        
        // Обновляем боковую панель
        for (const module of currentModules) {
            const lesson = module.lessons.find(l => l.id === currentLesson.id);
            if (lesson) lesson.completed = true;
        }
        renderSidebar();
        
        // Отключаем кнопку проверки
        document.querySelector('.check-test-btn').disabled = true;
    }
};

function updateNavButtons() {
    // Находим текущий урок во всех модулях
    let allLessons = [];
    for (const module of currentModules) {
        allLessons.push(...module.lessons);
    }
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');
    
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= allLessons.length - 1;
}

function navigateLesson(direction) {
    let allLessons = [];
    for (const module of currentModules) {
        allLessons.push(...module.lessons);
    }
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < allLessons.length) {
        loadLesson(allLessons[newIndex].id);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ed573' : '#e65c5c'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
