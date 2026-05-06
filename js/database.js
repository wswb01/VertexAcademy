// ========== БАЗА ДАННЫХ INDEXEDDB ==========
const DB_NAME = 'VertexAcademyDB';
const DB_VERSION = 3;

let db = null;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db && db.name === DB_NAME && !db.isClosed) {
            resolve(db);
            return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('Ошибка БД:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('БД успешно открыта');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Обновление структуры БД...');
            
            // Удаляем старые хранилища
            if (db.objectStoreNames.contains('users')) db.deleteObjectStore('users');
            if (db.objectStoreNames.contains('courses')) db.deleteObjectStore('courses');
            if (db.objectStoreNames.contains('enrollments')) db.deleteObjectStore('enrollments');
            if (db.objectStoreNames.contains('aiHistory')) db.deleteObjectStore('aiHistory');
            if (db.objectStoreNames.contains('modules')) db.deleteObjectStore('modules');
            if (db.objectStoreNames.contains('lessons')) db.deleteObjectStore('lessons');
            if (db.objectStoreNames.contains('progress')) db.deleteObjectStore('progress');
            if (db.objectStoreNames.contains('testQuestions')) db.deleteObjectStore('testQuestions');
            
            // 1. Пользователи
            const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            usersStore.createIndex('email', 'email', { unique: true });
            
            // 2. Курсы (для совместимости)
            const coursesStore = db.createObjectStore('courses', { keyPath: 'id', autoIncrement: true });
            
            // 3. Модули курса
            const modulesStore = db.createObjectStore('modules', { keyPath: 'id', autoIncrement: true });
            modulesStore.createIndex('courseId', 'courseId');
            modulesStore.createIndex('orderNum', 'orderNum');
            
            // 4. Уроки
            const lessonsStore = db.createObjectStore('lessons', { keyPath: 'id', autoIncrement: true });
            lessonsStore.createIndex('moduleId', 'moduleId');
            lessonsStore.createIndex('orderNum', 'orderNum');
            lessonsStore.createIndex('isTest', 'isTest');
            
            // 5. Вопросы для тестов
            const questionsStore = db.createObjectStore('testQuestions', { keyPath: 'id', autoIncrement: true });
            questionsStore.createIndex('lessonId', 'lessonId');
            
            // 6. Прогресс пользователя
            const progressStore = db.createObjectStore('progress', { keyPath: 'id', autoIncrement: true });
            progressStore.createIndex('userId', 'userId');
            progressStore.createIndex('lessonId', 'lessonId');
            progressStore.createIndex('userId_lessonId', ['userId', 'lessonId'], { unique: true });
            
            // 7. Записи на курсы
            const enrollmentsStore = db.createObjectStore('enrollments', { keyPath: 'id', autoIncrement: true });
            enrollmentsStore.createIndex('userId', 'userId');
            enrollmentsStore.createIndex('courseId', 'courseId');
            
            // 8. История AI
            db.createObjectStore('aiHistory', { keyPath: 'id', autoIncrement: true });
            
            // ========== ТЕСТОВЫЕ ДАННЫЕ ==========
            
            // Пользователи
            usersStore.add({ email: 'student@test.com', password: '123456', name: 'Студент', role: 'user', createdAt: new Date().toISOString() });
            usersStore.add({ email: 'admin@vertex.com', password: 'admin123', name: 'Администратор', role: 'admin', createdAt: new Date().toISOString() });
            
            // Курс
            const courseId = 1;
            coursesStore.add({ id: courseId, title: 'Blender за 30 дней', description: 'Освоите Blender с нуля', price: 0, duration: '30 дней', students: 0 });
            
            // Модули курса
            const modules = [
                { id: 1, courseId: courseId, title: 'Модуль 1: Введение в 3D-моделирование', description: 'Основные понятия и знакомство с Blender', orderNum: 1 },
                { id: 2, courseId: courseId, title: 'Модуль 2: Основы моделирования', description: 'Создание простых объектов', orderNum: 2 }
            ];
            modules.forEach(m => modulesStore.add(m));
            
            // Уроки для модуля 1
            const lessons = [
                { id: 1, moduleId: 1, title: 'Что такое 3D-графика?', content: '<p>3D-графика — это раздел компьютерной графики, посвящённый созданию трёхмерных объектов.</p><p><strong>Ключевые понятия:</strong></p><ul><li><strong>Вершина (Vertex)</strong> — точка в пространстве</li><li><strong>Ребро (Edge)</strong> — линия, соединяющая две вершины</li><li><strong>Полигон (Face)</strong> — грань, образуемая рёбрами</li><li><strong>Меш (Mesh)</strong> — совокупность полигонов</li></ul>', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', isTest: false, orderNum: 1 },
                { id: 2, moduleId: 1, title: 'Интерфейс Blender', content: '<p>Blender имеет мощный, но сложный интерфейс.</p><p><strong>Основные области:</strong></p><ul><li>3D Viewport — основное окно для работы</li><li>Outliner — список объектов</li><li>Properties — свойства выбранного объекта</li><li>Timeline — временная шкала для анимации</li></ul><p><strong>Горячие клавиши:</strong> G — перемещение, R — вращение, S — масштабирование</p>', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', isTest: false, orderNum: 2 },
                { id: 3, moduleId: 1, title: 'Проверка знаний: Введение в 3D', content: '', video_url: '', isTest: true, orderNum: 3 }
            ];
            lessons.forEach(l => lessonsStore.add(l));
            
            // Уроки для модуля 2
            const lessons2 = [
                { id: 4, moduleId: 2, title: 'Создание простых мешей', content: '<p>В Blender можно создавать примитивы: куб, сферу, цилиндр.</p><p>Нажмите <strong>Shift + A</strong> для вызова меню добавления объектов.</p>', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', isTest: false, orderNum: 1 },
                { id: 5, moduleId: 2, title: 'Редактирование объектов', content: '<p>Переключитесь в режим редактирования (Tab).</p><p>Вы можете перемещать вершины, рёбра и полигоны.</p>', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', isTest: false, orderNum: 2 },
                { id: 6, moduleId: 2, title: 'Тест: Основы моделирования', content: '', video_url: '', isTest: true, orderNum: 3 }
            ];
            lessons2.forEach(l => lessonsStore.add(l));
            
            // Вопросы для теста урока 3
            const testQuestions1 = [
                { id: 1, lessonId: 3, text: 'Что такое вершина (Vertex) в 3D-графике?', type: 'single', options: ['Точка в пространстве', 'Линия', 'Грань', 'Объект'], correct: 0 },
                { id: 2, lessonId: 3, text: 'Какие клавиши используются для перемещения объекта?', type: 'single', options: ['R', 'S', 'G', 'Ctrl+Z'], correct: 2 },
                { id: 3, lessonId: 3, text: 'Какие элементы составляют меш (Mesh)? (Выберите все подходящие)', type: 'multiple', options: ['Вершины', 'Рёбра', 'Полигоны', 'Материалы'], correct: [0,1,2] }
            ];
            testQuestions1.forEach(q => questionsStore.add(q));
            
            // Вопросы для теста урока 6
            const testQuestions2 = [
                { id: 4, lessonId: 6, text: 'Какая клавиша переключает режим редактирования?', type: 'single', options: ['Tab', 'Esc', 'Enter', 'Space'], correct: 0 },
                { id: 5, lessonId: 6, text: 'Что можно редактировать в режиме редактирования?', type: 'multiple', options: ['Вершины', 'Рёбра', 'Полигоны', 'Цвет фона'], correct: [0,1,2] }
            ];
            testQuestions2.forEach(q => questionsStore.add(q));
            
            console.log('Тестовые данные добавлены');
        };
    });
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ ==========

async function getUserByEmail(email) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('users', 'readonly');
        const request = tx.objectStore('users').index('email').get(email);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

async function addUser(user) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('users', 'readwrite');
        const request = tx.objectStore('users').add(user);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllUsers() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = db.transaction('users', 'readonly').objectStore('users').getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function getAllCourses() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = db.transaction('courses', 'readonly').objectStore('courses').getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function getCourseById(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = db.transaction('courses', 'readonly').objectStore('courses').get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

async function getModulesByCourse(courseId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('modules', 'readonly');
        const index = tx.objectStore('modules').index('courseId');
        const request = index.getAll(courseId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function getLessonsByModule(moduleId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('lessons', 'readonly');
        const index = tx.objectStore('lessons').index('moduleId');
        const request = index.getAll(moduleId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function getLessonById(lessonId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = db.transaction('lessons', 'readonly').objectStore('lessons').get(lessonId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

async function getTestQuestions(lessonId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('testQuestions', 'readonly');
        const index = tx.objectStore('testQuestions').index('lessonId');
        const request = index.getAll(lessonId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function getProgress(userId, lessonId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('progress', 'readonly');
        const index = tx.objectStore('progress').index('userId_lessonId');
        const request = index.get([userId, lessonId]);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

async function saveProgress(userId, lessonId, score = 100) {
    const db = await openDB();
    const existing = await getProgress(userId, lessonId);
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction('progress', 'readwrite');
        const store = tx.objectStore('progress');
        
        const progress = {
            userId: userId,
            lessonId: lessonId,
            completed: true,
            score: score,
            completedAt: new Date().toISOString()
        };
        
        let request;
        if (existing && existing.id) {
            progress.id = existing.id;
            request = store.put(progress);
        } else {
            request = store.add(progress);
        }
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getUserProgressForCourse(userId, courseId) {
    const modules = await getModulesByCourse(courseId);
    let totalLessons = 0;
    let completedLessons = 0;
    
    for (const module of modules) {
        const lessons = await getLessonsByModule(module.id);
        for (const lesson of lessons) {
            totalLessons++;
            const progress = await getProgress(userId, lesson.id);
            if (progress && progress.completed) completedLessons++;
        }
    }
    
    return {
        total: totalLessons,
        completed: completedLessons,
        percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    };
}

async function addEnrollment(enrollment) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('enrollments', 'readwrite');
        const request = tx.objectStore('enrollments').add(enrollment);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getEnrollmentsByUser(userId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('enrollments', 'readonly');
        const index = tx.objectStore('enrollments').index('userId');
        const request = index.getAll(userId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function addAIInteraction(data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = db.transaction('aiHistory', 'readwrite').objectStore('aiHistory').add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Делаем функции доступными глобально
window.openDB = openDB;
window.getUserByEmail = getUserByEmail;
window.addUser = addUser;
window.getAllUsers = getAllUsers;
window.getAllCourses = getAllCourses;
window.getCourseById = getCourseById;
window.getModulesByCourse = getModulesByCourse;
window.getLessonsByModule = getLessonsByModule;
window.getLessonById = getLessonById;
window.getTestQuestions = getTestQuestions;
window.getProgress = getProgress;
window.saveProgress = saveProgress;
window.getUserProgressForCourse = getUserProgressForCourse;
window.addEnrollment = addEnrollment;
window.getEnrollmentsByUser = getEnrollmentsByUser;
window.addAIInteraction = addAIInteraction;
