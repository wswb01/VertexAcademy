// ========== БАЗА ДАННЫХ INDEXEDDB ==========
const DB_NAME = 'VertexAcademyDB';
const DB_VERSION = 2;  // ← увеличил версию, чтобы пересоздать структуру

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
            
            // Удаляем старые хранилища, если они есть (чистый старт)
            if (db.objectStoreNames.contains('users')) {
                db.deleteObjectStore('users');
            }
            if (db.objectStoreNames.contains('courses')) {
                db.deleteObjectStore('courses');
            }
            if (db.objectStoreNames.contains('enrollments')) {
                db.deleteObjectStore('enrollments');
            }
            if (db.objectStoreNames.contains('aiHistory')) {
                db.deleteObjectStore('aiHistory');
            }
            
            // Создаём хранилища заново
            const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            usersStore.createIndex('email', 'email', { unique: true });
            
            const coursesStore = db.createObjectStore('courses', { keyPath: 'id', autoIncrement: true });
            
            const enrollmentsStore = db.createObjectStore('enrollments', { keyPath: 'id', autoIncrement: true });
            enrollmentsStore.createIndex('userId', 'userId');
            enrollmentsStore.createIndex('courseId', 'courseId');
            
            db.createObjectStore('aiHistory', { keyPath: 'id', autoIncrement: true });
            
            // Добавляем тестовые данные (без указания ID, пусть автоинкремент сам ставит)
            try {
                // Пользователи
                usersStore.add({ email: 'student@test.com', password: '123456', name: 'Студент', role: 'user', createdAt: new Date().toISOString() });
                usersStore.add({ email: 'admin@vertex.com', password: 'admin123', name: 'Администратор', role: 'admin', createdAt: new Date().toISOString() });
                
                // Курсы
                coursesStore.add({ title: 'Blender за 30 дней', description: 'Освоите Blender с нуля', price: 0, duration: '30 дней', students: 0 });
                coursesStore.add({ title: 'Создание игрового персонажа', description: 'Полный пайплайн персонажа', price: 12900, duration: '45 дней', students: 0 });
                coursesStore.add({ title: 'Основы текстурирования', description: 'PBR-текстурирование', price: 8900, duration: '25 дней', students: 0 });
                
                console.log('Тестовые данные добавлены');
            } catch(err) {
                console.warn('Ошибка при добавлении тестовых данных:', err);
            }
        };
    });
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С БАЗОЙ ==========

async function getUserByEmail(email) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction('users', 'readonly');
            const store = tx.objectStore('users');
            const index = store.index('email');
            const request = index.get(email);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
            tx.onerror = () => reject(tx.error);
        } catch(e) {
            reject(e);
        }
    });
}

async function addUser(user) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            const request = store.add(user);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            tx.onerror = () => reject(tx.error);
        } catch(e) {
            reject(e);
        }
    });
}

async function getAllUsers() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        try {
            const request = db.transaction('users', 'readonly').objectStore('users').getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        } catch(e) {
            reject(e);
        }
    });
}

async function getAllCourses() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        try {
            const request = db.transaction('courses', 'readonly').objectStore('courses').getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        } catch(e) {
            reject(e);
        }
    });
}

async function addEnrollment(enrollment) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction('enrollments', 'readwrite');
            const store = tx.objectStore('enrollments');
            const request = store.add(enrollment);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            tx.onerror = () => reject(tx.error);
        } catch(e) {
            reject(e);
        }
    });
}

async function getEnrollmentsByUser(userId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction('enrollments', 'readonly');
            const store = tx.objectStore('enrollments');
            const index = store.index('userId');
            const request = index.getAll(userId);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
            tx.onerror = () => reject(tx.error);
        } catch(e) {
            reject(e);
        }
    });
}

async function addAIInteraction(data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        try {
            const request = db.transaction('aiHistory', 'readwrite').objectStore('aiHistory').add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch(e) {
            reject(e);
        }
    });
}

// Делаем функции доступными глобально
window.openDB = openDB;
window.getUserByEmail = getUserByEmail;
window.addUser = addUser;
window.getAllUsers = getAllUsers;
window.getAllCourses = getAllCourses;
window.addEnrollment = addEnrollment;
window.getEnrollmentsByUser = getEnrollmentsByUser;
window.addAIInteraction = addAIInteraction;