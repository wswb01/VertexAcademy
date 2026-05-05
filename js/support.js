// JavaScript для страницы поддержки

document.addEventListener('DOMContentLoaded', function() {
    // Переключение категорий FAQ
    const faqCategoryTabs = document.querySelectorAll('.faq-category-tab');
    const faqCategoryContents = document.querySelectorAll('.faq-category-content');
    
    faqCategoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс со всех вкладок
            faqCategoryTabs.forEach(t => t.classList.remove('active'));
            // Добавляем активный класс на текущую вкладку
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            
            // Показываем/скрываем контент категорий
            faqCategoryContents.forEach(content => {
                content.classList.remove('active');
                
                if (content.id === `${category}-faq`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Поиск по FAQ
    const searchInput = document.querySelector('.support-search input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            
            if (searchTerm) {
                // Ищем по вопросам и ответам
                const faqItems = document.querySelectorAll('.faq-item');
                let foundItems = 0;
                
                faqItems.forEach(item => {
                    const question = item.querySelector('.faq-question h4').textContent.toLowerCase();
                    const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
                    
                    if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                        item.style.display = 'block';
                        foundItems++;
                        
                        // Раскрываем ответ
                        item.querySelector('.faq-question').classList.add('active');
                        item.querySelector('.faq-answer').classList.add('active');
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                // Показываем результат поиска
                if (foundItems > 0) {
                    searchInput.style.borderColor = 'var(--success-color)';
                } else {
                    searchInput.style.borderColor = 'var(--secondary-color)';
                    // Можно показать сообщение "Ничего не найдено"
                }
            }
        }
    }
    
    // Форма обратной связи поддержки
    const supportForm = document.getElementById('supportForm');
    if (supportForm) {
        supportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Здесь можно добавить отправку формы на сервер
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Вопрос отправлен!';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                this.reset();
            }, 3000);
        });
    }
    // Добавьте защиту формы поддержки
function initSupportForm() {
    const form = document.getElementById('supportForm');
    if(!form) return;
    
    // Добавляем honeypot
    if(!form.querySelector('[name="honeypot"]')) {
        const hp = document.createElement('input');
        hp.type = 'text';
        hp.name = 'honeypot';
        hp.style.display = 'none';
        form.appendChild(hp);
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const honeypot = form.querySelector('[name="honeypot"]');
        if(honeypot && honeypot.value) {
            alert('Ошибка: подозрительная активность');
            return;
        }
        
        // Сбор данных
        const name = document.getElementById('name')?.value;
        const email = document.getElementById('email')?.value;
        const message = document.getElementById('message')?.value;
        
        if(!name || !email || !message) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        // Имитация отправки
        console.log('[SUPPORT] Заявка отправлена:', { name, email, message });
        
        if(window.trackFeedback) {
            window.trackFeedback();
        }
        
        alert('Спасибо! Ваше сообщение отправлено. Мы ответим в ближайшее время.');
        form.reset();
    });
}

// Инициализация
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupportForm);
} else {
    initSupportForm();
}
});
