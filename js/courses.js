// JavaScript для страницы курсов
// Добавьте в начало или конец файла
function initCourseTracking() {
    const courseCards = document.querySelectorAll('.course-card, .course-item');
    
    courseCards.forEach((card, index) => {
        const viewBtn = card.querySelector('button, .details-btn, .view-course');
        if(viewBtn) {
            viewBtn.addEventListener('click', () => {
                const courseTitle = card.querySelector('h3, .title')?.innerText || `Course ${index + 1}`;
                if(window.trackCourseView) {
                    window.trackCourseView(courseTitle);
                }
                console.log(`[COURSES] Просмотр: ${courseTitle}`);
            });
        }
    });
    
    console.log(`[COURSES] Отслеживание активно для ${courseCards.length} курсов`);
}

// Вызов при загрузке
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCourseTracking);
} else {
    initCourseTracking();
}
document.addEventListener('DOMContentLoaded', function() {
    // Фильтрация курсов
    const filterTabs = document.querySelectorAll('.filter-tab');
    const courseCards = document.querySelectorAll('.course-card');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс со всех вкладок
            filterTabs.forEach(t => t.classList.remove('active'));
            // Добавляем активный класс на текущую вкладку
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            
            // Показываем/скрываем курсы в зависимости от фильтра
            courseCards.forEach(card => {
                const cardCategories = card.getAttribute('data-category');
                
                if (filterValue === 'all' || cardCategories.includes(filterValue)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // Сортировка курсов
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortValue = this.value;
            const coursesContainer = document.querySelector('.courses-grid.extended');
            const courseCardsArray = Array.from(courseCards);
            
            // Сортировка массива курсов
            courseCardsArray.sort((a, b) => {
                switch(sortValue) {
                    case 'new':
                        // Здесь можно добавить логику сортировки по дате добавления
                        return 0;
                    case 'price-low':
                        const priceA = parseFloat(a.querySelector('.course-price').textContent.replace(/[^\d]/g, '')) || 0;
                        const priceB = parseFloat(b.querySelector('.course-price').textContent.replace(/[^\d]/g, '')) || 0;
                        return priceA - priceB;
                    case 'price-high':
                        const priceAHigh = parseFloat(a.querySelector('.course-price').textContent.replace(/[^\d]/g, '')) || 0;
                        const priceBHigh = parseFloat(b.querySelector('.course-price').textContent.replace(/[^\d]/g, '')) || 0;
                        return priceBHigh - priceAHigh;
                    case 'duration':
                        const durationA = parseInt(a.querySelector('.course-duration').textContent) || 0;
                        const durationB = parseInt(b.querySelector('.course-duration').textContent) || 0;
                        return durationA - durationB;
                    default: // 'popular'
                        // По умолчанию оставляем как есть (популярные первыми)
                        const isFeaturedA = a.classList.contains('featured');
                        const isFeaturedB = b.classList.contains('featured');
                        return isFeaturedB - isFeaturedA;
                }
            });
            
            // Переставляем курсы в DOM
            courseCardsArray.forEach(card => {
                coursesContainer.appendChild(card);
            });
        });
    }
});
