// JavaScript для страниц аутентификации
// Добавьте в начало файла после существующего кода
import { sanitizeInput, trackEvent } from './main.js'; // если используете модули

// Или просто добавьте эти функции (если без модулей)
function protectAuthForms() {
    const forms = document.querySelectorAll('#loginForm, #registerForm, #resetForm');
    forms.forEach(form => {
        // Добавляем honeypot
        if(!form.querySelector('[name="honeypot"]')) {
            const hp = document.createElement('input');
            hp.type = 'text';
            hp.name = 'honeypot';
            hp.style.display = 'none';
            form.appendChild(hp);
        }
        
        form.addEventListener('submit', function(e) {
            const honeypot = form.querySelector('[name="honeypot"]');
            if(honeypot && honeypot.value) {
                e.preventDefault();
                alert('Ошибка безопасности');
                return false;
            }
            
            // Санитизация email и пароля (пароль не трогаем)
            const emailField = form.querySelector('input[type="email"]');
            if(emailField) {
                emailField.value = emailField.value.trim().toLowerCase();
            }
            
            trackEvent('auth', form.id || 'auth_form', 'submit');
        });
    });
}

// Вызовите эту функцию при загрузке
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectAuthForms);
} else {
    protectAuthForms();
}
document.addEventListener('DOMContentLoaded', function() {
    // Общие элементы для обеих страниц
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    // Переключение видимости пароля
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Страница входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            const emailError = document.getElementById('emailError');
            const passwordError = document.getElementById('passwordError');
            
            let isValid = true;
            
            // Валидация email
            if (!validateEmail(email)) {
                emailError.textContent = 'Введите корректный email адрес';
                isValid = false;
            } else {
                emailError.textContent = '';
            }
            
            // Валидация пароля
            if (password.length < 6) {
                passwordError.textContent = 'Пароль должен содержать минимум 6 символов';
                isValid = false;
            } else {
                passwordError.textContent = '';
            }
            
            if (isValid) {
                // Здесь можно добавить отправку данных на сервер
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                
                submitBtn.textContent = 'Вход...';
                submitBtn.disabled = true;
                
                // Имитация запроса к серверу
                setTimeout(() => {
                    // В реальном приложении здесь будет проверка учетных данных
                    // Если успешно - перенаправление на главную страницу
                    // Если ошибка - показать сообщение
                    
                    // Для демонстрации просто показываем успешный вход
                    submitBtn.textContent = 'Успешно!';
                    submitBtn.style.backgroundColor = 'var(--success-color)';
                    
                    setTimeout(() => {
                        // Перенаправление на главную страницу
                        window.location.href = 'index.html';
                    }, 1000);
                    
                }, 1500);
            }
        });
    }
    
    // Страница регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const strengthFill = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('passwordStrengthText');
        const hints = {
            length: document.getElementById('lengthHint'),
            uppercase: document.getElementById('uppercaseHint'),
            number: document.getElementById('numberHint'),
            special: document.getElementById('specialHint')
        };
        
        // Проверка надежности пароля в реальном времени
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                const password = this.value;
                checkPasswordStrength(password);
            });
        }
        
        // Проверка совпадения паролей в реальном времени
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                const password = passwordInput.value;
                const confirmPassword = this.value;
                const errorElement = document.getElementById('confirmPasswordError');
                
                if (confirmPassword && password !== confirmPassword) {
                    errorElement.textContent = 'Пароли не совпадают';
                } else {
                    errorElement.textContent = '';
                }
            });
        }
        
        // Обработка отправки формы регистрации
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            const terms = document.getElementById('terms').checked;
            
            const firstNameError = document.getElementById('firstNameError');
            const lastNameError = document.getElementById('lastNameError');
            const emailError = document.getElementById('registerEmailError');
            const confirmPasswordError = document.getElementById('confirmPasswordError');
            const termsError = document.getElementById('termsError');
            
            let isValid = true;
            
            // Валидация имени
            if (firstName.length < 2) {
                firstNameError.textContent = 'Имя должно содержать минимум 2 символа';
                isValid = false;
            } else {
                firstNameError.textContent = '';
            }
            
            // Валидация фамилии
            if (lastName.length < 2) {
                lastNameError.textContent = 'Фамилия должна содержать минимум 2 символа';
                isValid = false;
            } else {
                lastNameError.textContent = '';
            }
            
            // Валидация email
            if (!validateEmail(email)) {
                emailError.textContent = 'Введите корректный email адрес';
                isValid = false;
            } else {
                emailError.textContent = '';
            }
            
            // Валидация пароля
            const passwordStrength = calculatePasswordStrength(password);
            if (passwordStrength < 3) { // Минимум средняя надежность
                emailError.textContent = 'Пароль недостаточно надежный';
                isValid = false;
            }
            
            // Проверка совпадения паролей
            if (password !== confirmPassword) {
                confirmPasswordError.textContent = 'Пароли не совпадают';
                isValid = false;
            } else {
                confirmPasswordError.textContent = '';
            }
            
            // Проверка принятия условий
            if (!terms) {
                termsError.textContent = 'Необходимо принять условия использования';
                isValid = false;
            } else {
                termsError.textContent = '';
            }
            
            if (isValid) {
                // Здесь можно добавить отправку данных на сервер
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                
                submitBtn.textContent = 'Создание аккаунта...';
                submitBtn.disabled = true;
                
                // Имитация запроса к серверу
                setTimeout(() => {
                    // В реальном приложении здесь будет создание пользователя
                    
                    // Для демонстрации просто показываем успешную регистрацию
                    submitBtn.textContent = 'Аккаунт создан!';
                    submitBtn.style.backgroundColor = 'var(--success-color)';
                    
                    setTimeout(() => {
                        // Перенаправление на страницу входа или сразу вход
                        window.location.href = 'login.html?registered=true';
                    }, 1000);
                    
                }, 1500);
            }
        });
    }
    
    // Социальные кнопки
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', function() {
            const provider = this.classList.contains('google-btn') ? 'google' :
                           this.classList.contains('vk-btn') ? 'vk' : 'github';
            
            // Здесь можно добавить OAuth аутентификацию
            alert(`Аутентификация через ${provider} будет реализована позже`);
        });
    });
    
    // Вспомогательные функции
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        // Длина
        if (password.length >= 8) {
            strength += 1;
            hints.length.classList.add('valid');
            hints.length.querySelector('i').style.color = 'var(--success-color)';
        } else {
            hints.length.classList.remove('valid');
            hints.length.querySelector('i').style.color = 'var(--gray-light)';
        }
        
        // Заглавные и строчные буквы
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
            strength += 1;
            hints.uppercase.classList.add('valid');
            hints.uppercase.querySelector('i').style.color = 'var(--success-color)';
        } else {
            hints.uppercase.classList.remove('valid');
            hints.uppercase.querySelector('i').style.color = 'var(--gray-light)';
        }
        
        // Цифры
        if (/\d/.test(password)) {
            strength += 1;
            hints.number.classList.add('valid');
            hints.number.querySelector('i').style.color = 'var(--success-color)';
        } else {
            hints.number.classList.remove('valid');
            hints.number.querySelector('i').style.color = 'var(--gray-light)';
        }
        
        // Специальные символы
        if (/[^A-Za-z0-9]/.test(password)) {
            strength += 1;
            hints.special.classList.add('valid');
            hints.special.querySelector('i').style.color = 'var(--success-color)';
        } else {
            hints.special.classList.remove('valid');
            hints.special.querySelector('i').style.color = 'var(--gray-light)';
        }
        
        return strength;
    }
    
    function checkPasswordStrength(password) {
        const strength = calculatePasswordStrength(password);
        
        // Обновляем индикатор
        let width = 0;
        let color = '';
        let text = '';
        
        switch(strength) {
            case 0:
            case 1:
                width = 25;
                color = '#ff4757'; // Красный
                text = 'Слабый';
                break;
            case 2:
                width = 50;
                color = '#ffa502'; // Оранжевый
                text = 'Средний';
                break;
            case 3:
                width = 75;
                color = '#2ed573'; // Зеленый
                text = 'Хороший';
                break;
            case 4:
                width = 100;
                color = '#2ed573'; // Зеленый
                text = 'Отличный';
                break;
        }
        
        if (strengthFill) {
            strengthFill.style.width = `${width}%`;
            strengthFill.style.backgroundColor = color;
        }
        
        if (strengthText) {
            strengthText.textContent = text;
            strengthText.style.color = color;
        }
    }
    
    // Проверка, если пользователь только что зарегистрировался
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        // Можно показать сообщение об успешной регистрации
        setTimeout(() => {
            alert('Регистрация прошла успешно! Теперь вы можете войти в свой аккаунт.');
        }, 500);
    }
});
