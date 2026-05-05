// ========== ГЛАВНЫЙ JS ФАЙЛ ==========
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await openDB();
    await checkLoginStatus();
    loadPopularCourses();
    setupEventListeners();
    initAIAssistant();
});

async function checkLoginStatus() {
    const userId = sessionStorage.getItem('userId');
    if (userId) {
        const users = await getAllUsers();
        currentUser = users.find(u => u.id == userId);
        if (currentUser) {
            document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'inline-block');
            document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
            
            const roleSpan = document.getElementById('userRole');
            if (roleSpan) roleSpan.textContent = currentUser.role === 'admin' ? '👑 Админ' : '👤 Пользователь';
            
            // Показываем ссылку на личный кабинет/админку
            if (currentUser.role === 'admin') {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.textContent = 'Админ-панель';
                adminLink.className = 'admin-link';
                document.querySelector('.nav-menu')?.insertBefore(adminLink, document.querySelector('.nav-menu .guest-only'));
            }
            return;
        }
    }
    currentUser = null;
    sessionStorage.removeItem('userId');
    document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'inline-block');
}

function setupEventListeners() {
    // Кнопки входа/выхода
    document.getElementById('loginBtn')?.addEventListener('click', () => window.location.href = 'login.html');
    document.getElementById('registerBtn')?.addEventListener('click', () => window.location.href = 'register.html');
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        sessionStorage.removeItem('userId');
        window.location.reload();
    });
    
    // Мобильное меню
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    }
}

async function loadPopularCourses() {
    const courses = await getAllCourses();
    const container = document.getElementById('popularCourses');
    if (!container) return;
    
    container.innerHTML = courses.slice(0, 3).map(course => `
        <div class="course-card">
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
    
    document.querySelectorAll('.enroll-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!currentUser) {
                if (confirm('Нужно войти. Перейти на страницу входа?')) window.location.href = 'login.html';
                return;
            }
            const courseId = parseInt(btn.dataset.id);
            const courseTitle = btn.dataset.title;
            
            const enrollments = await getEnrollmentsByUser(currentUser.id);
            if (enrollments.some(e => e.courseId === courseId)) {
                alert('Вы уже записаны на этот курс!');
                return;
            }
            
            await addEnrollment({ userId: currentUser.id, courseId: courseId, enrolledAt: new Date().toISOString() });
            
            // Обновляем счётчик студентов
            const courses = await getAllCourses();
            const course = courses.find(c => c.id === courseId);
            if (course) await updateCourse(courseId, { students: (course.students || 0) + 1 });
            
            alert(`✅ Вы записаны на курс "${courseTitle}"!`);
        });
    });
}

function showCourseDetails(courseId) {
    alert('Полная информация о курсе появится позже.');
}

function initAIAssistant() {
    if (document.querySelector('.ai-assistant')) return;
    
    const aiHTML = `
    <div class="ai-assistant">
        <div class="ai-toggle" id="aiToggle">🤖</div>
        <div class="ai-window" id="aiWindow">
            <div class="ai-header"><strong>🤖 AI-помощник</strong><button id="aiClose" style="background:none; border:none; color:white; cursor:pointer;">✕</button></div>
            <div class="ai-messages" id="aiMessages"><div class="ai-message bot">Здравствуйте! Я помогу выбрать курс или отвечу на вопросы.</div></div>
            <div class="ai-input-area"><input type="text" id="aiInput" placeholder="Напишите ваш вопрос..."><button id="askAiBtn">➤</button></div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', aiHTML);
    
    document.getElementById('aiToggle')?.addEventListener('click', () => document.getElementById('aiWindow').classList.toggle('active'));
    document.getElementById('aiClose')?.addEventListener('click', () => document.getElementById('aiWindow').classList.remove('active'));
    document.getElementById('askAiBtn')?.addEventListener('click', askAI);
    document.getElementById('aiInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') askAI(); });
}

async function askAI() {
    const input = document.getElementById('aiInput');
    const question = input?.value.trim();
    if (!question || !currentUser) {
        if (!currentUser) alert('Войдите в аккаунт для общения с AI');
        return;
    }
    
    let answer = '🤖 ';
    const q = question.toLowerCase();
    if (q.includes('курс')) answer += 'У нас есть курсы: Blender за 30 дней, Создание игрового персонажа, Основы текстурирования.';
    else if (q.includes('цена')) answer += 'Цены от 0 до 12900 ₽. Есть бесплатные курсы!';
    else if (q.includes('контакт')) answer += 'Напишите support@vertex-academy.ru';
    else answer += 'Спросите про курсы, цены или контакты поддержки.';
    
    const messagesDiv = document.getElementById('aiMessages');
    messagesDiv.innerHTML += `<div class="ai-message user">${escapeHtml(question)}</div><div class="ai-message bot">${escapeHtml(answer)}</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    input.value = '';
    
    await addAIInteraction({ userId: currentUser.id, question, answer, date: new Date().toISOString() });
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

window.showCourseDetails = showCourseDetails;

// ========== ДОБАВЛЯЕМ СОХРАНЕНИЕ В БД (без изменения дизайна) ==========
// Сохраняем оригинальную функцию отправки сообщения
const originalSendMessage = window.sendAIMessage || function() {};

// После отправки сообщения сохраняем в БД
document.addEventListener('DOMContentLoaded', function() {
    // Ждём появления AI-чата
    const observer = new MutationObserver(function() {
        const askBtn = document.getElementById('askAiBtn');
        const aiInput = document.getElementById('aiInput');
        
        if (askBtn && aiInput && !askBtn.hasAttribute('data-bd-connected')) {
            askBtn.setAttribute('data-bd-connected', 'true');
            
            // Добавляем сохранение в БД при отправке
            const originalClick = askBtn.onclick;
            askBtn.addEventListener('click', async function() {
                if (window.currentUser && aiInput.value.trim()) {
                    try {
                        await addAIInteraction({
                            userId: window.currentUser?.id,
                            question: aiInput.value.trim(),
                            answer: 'Ответ от AI',
                            date: new Date().toISOString()
                        });
                    } catch(e) { console.log('БД не инициализирована'); }
                }
            });
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});