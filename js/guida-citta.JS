// City Guide Page - Articles Management

// Render Storia articles
function renderStoriaArticles() {
    const container = document.getElementById('storiaArticles');
    if (!container) return;
    
    const articles = content[currentLang].cityguide.storia.articles;
    
    if (!articles || articles.length === 0) {
        container.innerHTML = `<p class="empty-content" data-translate="cityguide.storia.empty">${content[currentLang].cityguide.storia.empty}</p>`;
        return;
    }
    
    container.innerHTML = '';
    articles.forEach((article, index) => {
        const articleEl = document.createElement('div');
        articleEl.className = 'article-item';
        articleEl.id = article.id; // Add ID for direct linking
        
        let contentHTML = article.content;
        
        // Add booking button for Ponza article if present
        if (article.bookingButton) {
            contentHTML = `<a href="${article.bookingButton.url}" target="_blank" rel="noopener noreferrer" class="booking-button">${article.bookingButton.text}</a>${contentHTML}`;
        }
        
        articleEl.innerHTML = `
            <div class="article-header" data-article="storia-${index}">
                <h3 class="article-title">${article.title}</h3>
                <span class="article-arrow">▼</span>
            </div>
            <div class="article-preview">${article.preview}</div>
            <div class="article-content" id="storia-${index}">
                ${contentHTML}
            </div>
        `;
        container.appendChild(articleEl);
    });
    
    // Add click handlers
    document.querySelectorAll('.article-header[data-article^="storia-"]').forEach(header => {
        header.addEventListener('click', () => toggleArticle(header));
    });
    
    // Auto-expand article if URL has hash
    autoExpandArticle();
}

// Render Notizie articles (sorted by date DESC)
function renderNotizieArticles() {
    const container = document.getElementById('notizieArticles');
    if (!container) return;
    
    const articles = content[currentLang].cityguide.notizie.articles;
    
    if (!articles || articles.length === 0) {
        container.innerHTML = `<p class="empty-content" data-translate="cityguide.notizie.empty">${content[currentLang].cityguide.notizie.empty}</p>`;
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
    if (document.getElementById('storiaArticles')) {
        renderStoriaArticles();
        renderNotizieArticles();
    }
}

// Auto-expand article based on URL hash
function autoExpandArticle() {
    const hash = window.location.hash.substring(1); // Remove #
    if (!hash) return;
    
    // Find article by ID
    const articleEl = document.getElementById(hash);
    if (!articleEl || !articleEl.classList.contains('article-item')) return;
    
    // Expand the article
    const header = articleEl.querySelector('.article-header');
    if (header) {
        articleEl.classList.add('expanded');
        const content = articleEl.querySelector('.article-content');
        const arrow = header.querySelector('.article-arrow');
        if (content) {
            content.style.maxHeight = content.scrollHeight + 'px';
        }
        if (arrow) {
            arrow.style.transform = 'rotate(180deg)';
        }
        
        // Scroll to article
        setTimeout(() => {
            articleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// Re-render on language change
const originalUpdateContent = updateContent;
updateContent = function() {
    originalUpdateContent();
    if (document.getElementById('storiaArticles')) {
        renderStoriaArticles();
        renderNotizieArticles();
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCityGuidePage);
} else {
    initCityGuidePage();
}
