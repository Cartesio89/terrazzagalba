// City Guide Page - Articles Management

// Wait for content to be loaded by app.js
function waitForContent(callback) {
    if (typeof content !== 'undefined' && content.it && content.en) {
        callback();
    } else {
        setTimeout(() => waitForContent(callback), 100);
    }
}

// Render Storia articles
function renderStoriaArticles() {
    const container = document.getElementById('storiaArticles');
    if (!container) return;
    
    const articles = content[currentLang].cityguide.storia.articles;
    
    if (!articles || articles.length === 0) {
        container.innerHTML = `<p class="empty-content">${content[currentLang].cityguide.storia.empty}</p>`;
        return;
    }
    
    container.innerHTML = '';
    articles.forEach((article, index) => {
        const articleEl = document.createElement('div');
        articleEl.className = 'article-item';
        articleEl.innerHTML = `
            <div class="article-header" data-article="storia-${index}">
                <h3 class="article-title">${article.title}</h3>
                <span class="article-arrow">▼</span>
            </div>
            <div class="article-preview">${article.preview}</div>
            <div class="article-content" id="storia-${index}">
                ${article.content}
            </div>
        `;
        container.appendChild(articleEl);
    });
    
    // Add click handlers
    document.querySelectorAll('.article-header[data-article^="storia-"]').forEach(header => {
        header.addEventListener('click', () => toggleArticle(header));
    });
}

// Render Notizie articles (sorted by date DESC)
function renderNotizieArticles() {
    const container = document.getElementById('notizieArticles');
    if (!container) return;
    
    const articles = content[currentLang].cityguide.notizie.articles;
    
    if (!articles || articles.length === 0) {
        container.innerHTML = `<p class="empty-content">${content[currentLang].cityguide.notizie.empty}</p>`;
        return;
    }
    
    // Sort by date descending (most recent first)
    const sortedArticles = [...articles].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    container.innerHTML = '';
    sortedArticles.forEach((article, index) => {
        const articleEl = document.createElement('div');
        articleEl.className = 'article-item';
        
        // Format date
        const dateObj = new Date(article.date);
        const formattedDate = dateObj.toLocaleDateString(currentLang === 'it' ? 'it-IT' : 'en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        articleEl.innerHTML = `
            <div class="article-header" data-article="notizie-${index}">
                <div>
                    <h3 class="article-title">${article.title}</h3>
                    <p class="article-date">${formattedDate}</p>
                </div>
                <span class="article-arrow">▼</span>
            </div>
            <div class="article-preview">${article.preview}</div>
            <div class="article-content" id="notizie-${index}">
                ${article.content}
            </div>
        `;
        container.appendChild(articleEl);
    });
    
    // Add click handlers
    document.querySelectorAll('.article-header[data-article^="notizie-"]').forEach(header => {
        header.addEventListener('click', () => toggleArticle(header));
    });
}

// Toggle article accordion
function toggleArticle(header) {
    const articleId = header.getAttribute('data-article');
    const content = document.getElementById(articleId);
    const arrow = header.querySelector('.article-arrow');
    const item = header.closest('.article-item');
    
    // Toggle expanded state
    const isExpanded = item.classList.toggle('expanded');
    
    if (isExpanded) {
        content.style.maxHeight = content.scrollHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        content.style.maxHeight = '0';
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Initialize city guide page
function initCityGuidePage() {
    if (!document.getElementById('storiaArticles')) return;
    
    waitForContent(() => {
        renderStoriaArticles();
        renderNotizieArticles();
        
        // Hook into language switcher
        const originalLangSwitch = document.getElementById('langSwitch');
        if (originalLangSwitch) {
            originalLangSwitch.addEventListener('click', (e) => {
                // Give time for app.js to update currentLang
                setTimeout(() => {
                    renderStoriaArticles();
                    renderNotizieArticles();
                }, 50);
            });
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCityGuidePage);
} else {
    initCityGuidePage();
}
