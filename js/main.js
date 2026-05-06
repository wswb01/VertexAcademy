let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await openDB(); // Дожидаемся полного открытия и инициализации БД
    await checkLoginStatus();
    
    // Ждём, пока БД точно наполнится тестовыми данными
    await ensureCoursesLoaded();
    
    await loadPopularCourses();
    setupEventListeners();
    initAIAssistant();
});

// Новая функция: проверяет, есть ли курсы в БД, и если нет — добавляет
async function ensureCoursesLoaded() {
    const courses = await getAllCourses();
    if (courses.length === 0) {
        console.log('База данных пуста, добавляем тестовые курсы...');
        const db = await openDB();
        const tx = db.transaction('courses', 'readwrite');
        const store = tx.objectStore('courses');
        
        const testCourses = [
            { title: 'Blender за 30 дней', description: 'Освоите Blender с нуля', price: 0, duration: '30 дней', students: 0 },
            { title: 'Создание игрового персонажа', description: 'Полный пайплайн персонажа', price: 12900, duration: '45 дней', students: 0 },
            { title: 'Основы текстурирования', description: 'PBR-текстурирование', price: 8900, duration: '25 дней', students: 0 }
        ];
        
        for (const course of testCourses) {
            store.add(course);
        }
        
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
        
        console.log('Тестовые курсы добавлены');
    }
}

async function checkLoginStatus() {
    const userId = sessionStorage.getItem('userId');
    if (userId) {
        const users = await getAllUsers();
        currentUser = users.find(u => u.id == userId);
        if (currentUser) {
            // Обновляем UI для авторизованного пользователя
            document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'inline-block');
            document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
            
            // Обновляем кнопки входа/выхода
            const loginBtn = document.getElementById('loginBtn');
            const registerBtn = document.getElementById('registerBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            const startBtn = document.querySelector('.hero-buttons .btn-primary');
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (startBtn && startBtn.textContent.includes('Начать бесплатно')) {
                startBtn.href = 'dashboard.html';
                startBtn.textContent = 'Мои курсы';
            }
            
            const roleSpan = document.getElementById('userRole');
            if (roleSpan) roleSpan.textContent = currentUser.role === 'admin' ? '👑 Админ' : '👤 Пользователь';
            
            return currentUser;
        }
    }
    
    currentUser = null;
    sessionStorage.removeItem('userId');
    document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'inline-block');
    return null;
}

async function loadPopularCourses() {
    const container = document.getElementById('popularCourses');
    if (!container) return;
    
    try {
        const courses = await getAllCourses();
        console.log('Загружено курсов:', courses.length);
        
        if (!courses || courses.length === 0) {
            container.innerHTML = '<p>Курсы загружаются... Обновите страницу.</p>';
            return;
        }
        
        container.innerHTML = courses.slice(0, 3).map(course => `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-icon"><i class="fas fa-cube"></i></div>
                <h3>${escapeHtml(course.title)}</h3>
                <p>${escapeHtml(course.description)}</p>
                <div class="course-meta">
                    <span><i class="far fa-clock"></i> ${course.duration}</span>
                    <span class="course-price">${course.price === 0 ? 'Бесплатно' : course.price + ' ₽'}</span>
                </div>
                <button class="btn btn-secondary" onclick="showCourseDetails(${course.id})">Подробнее</button>
                <button class="btn btn-primary enroll-btn" data-id="${course.id}" data-title="${escapeHtml(course.title)}" style="margin-top:10px;">Записаться</button>
            </div>
        `).join('');
        
        // Привязываем обработчики к кнопкам записи
        document.querySelectorAll('.enroll-btn').forEach(btn => {
            btn.removeEventListener('click', handleEnroll);
            btn.addEventListener('click', handleEnroll);
        });
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        container.innerHTML = '<p>Ошибка загрузки курсов. Пожалуйста, обновите страницу.</p>';
    }
}

async function handleEnroll(e) {
    const btn = e.currentTarget;
    if (!currentUser) {
        if (confirm('Нужно войти. Перейти на страницу входа?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    const courseId = parseInt(btn.dataset.id);
    const courseTitle = btn.dataset.title;
    
    try {
        const enrollments = await getEnrollmentsByUser(currentUser.id);
        if (enrollments.some(e => e.courseId === courseId)) {
            alert('Вы уже записаны на этот курс!');
            return;
        }
        
        await addEnrollment({ 
            userId: currentUser.id, 
            courseId: courseId, 
            enrolledAt: new Date().toISOString() 
        });
        
        // Обновляем счётчик студентов
        const courses = await getAllCourses();
        const course = courses.find(c => c.id === courseId);
        if (course && window.updateCourse) {
            await updateCourse(courseId, { students: (course.students || 0) + 1 });
        }
        
        alert(`✅ Вы записаны на курс "${courseTitle}"!`);
    } catch (error) {
        console.error('Ошибка записи:', error);
        alert('Произошла ошибка при записи. Попробуйте позже.');
    }
}

function initAIAssistant() {
    if (document.querySelector('.ai-assistant')) return;
    
    const aiHTML = `
    <div class="ai-assistant">
        <div class="ai-toggle" id="aiToggle">🤖</div>
        <div class="ai-window" id="aiWindow">
            <div class="ai-header">
                <strong>🤖 AI-помощник</strong>
                <button id="aiClose" style="background:none; border:none; color:white; cursor:pointer;">✕</button>
            </div>
            <div class="ai-messages" id="aiMessages">
                <div class="ai-message bot">Здравствуйте! Я помогу выбрать курс или отвечу на вопросы.</div>
            </div>
            <div class="ai-input-area">
                <input type="text" id="aiInput" placeholder="Напишите ваш вопрос...">
                <button id="askAiBtn">➤</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', aiHTML);
    
    document.getElementById('aiToggle')?.addEventListener('click', () => {
        document.getElementById('aiWindow')?.classList.toggle('active');
    });
    document.getElementById('aiClose')?.addEventListener('click', () => {
        document.getElementById('aiWindow')?.classList.remove('active');
    });
    
    const askBtn = document.getElementById('askAiBtn');
    const aiInput = document.getElementById('aiInput');
    
    if (askBtn) {
        askBtn.addEventListener('click', askAI);
    }
    if (aiInput) {
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') askAI();
        });
    }
}

async function askAI() {
    const input = document.getElementById('aiInput');
    const question = input?.value.trim();
    
    if (!question) return;
    
    if (!currentUser) {
        alert('Войдите в аккаунт для общения с AI');
        return;
    }
    
    let answer = '🤖 ';
    const q = question.toLowerCase();
    
    if (q.includes('курс') || q.includes('blender')) {
        answer += 'У нас есть курсы: Blender за 30 дней, Создание игрового персонажа, Основы текстурирования.';
    } else if (q.includes('цена') || q.includes('стои') || q.includes('руб')) {
        answer += 'Цены от 0 до 12900 ₽. Есть бесплатные курсы!';
    } else if (q.includes('контакт') || q.includes('поддержк')) {
        answer += 'Напишите support@vertex-academy.ru';
    } else {
        answer += 'Спросите про курсы, цены или контакты поддержки.';
    }
    
    const messagesDiv = document.getElementById('aiMessages');
    messagesDiv.innerHTML += `
        <div class="ai-message user">${escapeHtml(question)}</div>
        <div class="ai-message bot">${escapeHtml(answer)}</div>
    `;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    input.value = '';
    
    // Сохраняем в БД
    try {
        await addAIInteraction({ 
            userId: currentUser.id, 
            question: question, 
            answer: answer, 
            date: new Date().toISOString() 
        });
    } catch (e) {
        console.log('Не удалось сохранить историю AI:', e);
    }
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

function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', () => window.location.href = 'login.html');
    if (registerBtn) registerBtn.addEventListener('click', () => window.location.href = 'register.html');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('userId');
        window.location.reload();
    });
    
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    }
}

function showCourseDetails(courseId) {
    alert('Полная информация о курсе появится позже.');
}

// Делаем функции глобальными
window.showCourseDetails = showCourseDetails;
window.currentUser = () => currentUser;
