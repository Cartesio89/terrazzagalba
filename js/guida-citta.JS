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
    const container = document.getElementById('storia-articles');
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
        articleEl.setAttribute('data-article-id', article.id); // Per anchor link
        articleEl.innerHTML = `
            <div class="article-header" data-article="storia-${index}">
                <div>
                    <h3 class="article-title">${article.title}</h3>
                </div>
                <span class="article-toggle">▼</span>
            </div>
            <div class="article-content">
                <div class="article-preview">${article.preview}</div>
                <div class="article-full">${article.content}</div>
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
    const container = document.getElementById('notizie-articles');
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
        articleEl.setAttribute('data-article-id', article.id); // Per anchor link
        
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
                <span class="article-toggle">▼</span>
            </div>
            <div class="article-content">
                <div class="article-preview">${article.preview}</div>
                <div class="article-full">${article.content}</div>
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
    const item = header.closest('.article-item');
    const arrow = header.querySelector('.article-toggle');
    
    // Toggle expanded state
    if (item.classList.contains('expanded')) {
        item.classList.remove('expanded');
        arrow.textContent = '▼';
    } else {
        // Chiudi tutti gli altri articoli nello stesso container
        const container = item.parentElement;
        container.querySelectorAll('.article-item').forEach(i => {
            i.classList.remove('expanded');
            i.querySelector('.article-toggle').textContent = '▼';
        });
        
        item.classList.add('expanded');
        arrow.textContent = '▲';
    }
}

// Update tab labels from content.json
function updateTabLabels() {
    const storiaTab = document.querySelector('[data-tab="storia"]');
    const notizieTab = document.querySelector('[data-tab="notizie"]');
    
    if (storiaTab && content[currentLang].cityguide.tabs) {
        storiaTab.textContent = content[currentLang].cityguide.tabs.storia;
    }
    
    if (notizieTab && content[currentLang].cityguide.tabs) {
        notizieTab.textContent = content[currentLang].cityguide.tabs.notizie;
    }
}

// Handle anchor links to specific articles (es: #tempio-giove)
function handleAnchorLinks() {
    const hash = window.location.hash.substring(1); // Rimuove #
    if (!hash) return;
    
    // Cerca l'articolo con quell'ID
    setTimeout(() => {
        const articleEl = document.querySelector(`[data-article-id="${hash}"]`);
        if (articleEl) {
            const header = articleEl.querySelector('.article-header');
            if (header) {
                // Espandi l'articolo
                toggleArticle(header);
                
                // Scroll verso l'articolo
                setTimeout(() => {
                    articleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        }
    }, 800); // Aspetta che il contenuto sia caricato
}

// Initialize city guide page
function initCityGuidePage() {
    const storiaContainer = document.getElementById('storia-articles');
    if (!storiaContainer) return; // Non siamo nella pagina guida-citta
    
    waitForContent(() => {
        updateTabLabels(); // Aggiorna i nomi dei tab
        renderStoriaArticles();
        renderNotizieArticles();
        handleAnchorLinks(); // Gestisce link diretti agli articoli
        
        // Hook into language switcher
        const langSwitch = document.getElementById('langSwitch');
        if (langSwitch) {
            langSwitch.addEventListener('click', () => {
                // Give time for app.js to update currentLang
                setTimeout(() => {
                    updateTabLabels();
                    renderStoriaArticles();
                    renderNotizieArticles();
                }, 100);
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
