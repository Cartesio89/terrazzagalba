// City Guide Page - Standalone version
// Carica content.json direttamente e gestisce tutto

let currentLang = localStorage.getItem('language') || 'it';
let content = null;

// Load content.json
async function loadContent() {
    try {
        const response = await fetch('content/content.json');
        content = await response.json();
        console.log('Content loaded successfully');
        initializePage();
    } catch (error) {
        console.error('Error loading content:', error);
        showError('Impossibile caricare i contenuti');
    }
}

// Initialize page after content is loaded
function initializePage() {
    if (!content) return;
    
    updateTabLabels();
    renderStoriaArticles();
    renderNotizieArticles();
    handleAnchorLinks();
    setupLanguageSwitcher();
    setupTabs();
}

// Setup language switcher
function setupLanguageSwitcher() {
    const langSwitch = document.getElementById('langSwitch');
    if (!langSwitch) return;
    
    // Update button text
    updateLangButton();
    
    // Add click handler
    langSwitch.addEventListener('click', () => {
        currentLang = currentLang === 'it' ? 'en' : 'it';
        localStorage.setItem('language', currentLang);
        updateLangButton();
        updateTabLabels();
        renderStoriaArticles();
        renderNotizieArticles();
    });
}

// Update language button text
function updateLangButton() {
    const langSwitch = document.getElementById('langSwitch');
    if (langSwitch) {
        langSwitch.textContent = currentLang === 'it' ? 'IT | EN' : 'EN | IT';
    }
}

// Setup tab switching
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active to clicked
            button.classList.add('active');
            document.getElementById(tabId)?.classList.add('active');
        });
    });
}

// Update tab labels from content.json
function updateTabLabels() {
    if (!content || !content[currentLang]) return;
    
    const storiaTab = document.querySelector('[data-tab="storia"]');
    const notizieTab = document.querySelector('[data-tab="notizie"]');
    
    if (storiaTab && content[currentLang].cityguide?.tabs?.storia) {
        storiaTab.textContent = content[currentLang].cityguide.tabs.storia;
    }
    
    if (notizieTab && content[currentLang].cityguide?.tabs?.notizie) {
        notizieTab.textContent = content[currentLang].cityguide.tabs.notizie;
    }
}

// Render Storia articles
function renderStoriaArticles() {
    const container = document.getElementById('storia-articles');
    if (!container || !content || !content[currentLang]) return;
    
    const articles = content[currentLang].cityguide?.storia?.articles || [];
    
    if (articles.length === 0) {
        container.innerHTML = `<p class="empty-content">${content[currentLang].cityguide?.storia?.empty || 'Contenuti in arrivo...'}</p>`;
        return;
    }
    
    container.innerHTML = '';
    articles.forEach((article, index) => {
        const articleEl = document.createElement('div');
        articleEl.className = 'article-item';
        articleEl.setAttribute('data-article-id', article.id);
        articleEl.innerHTML = `
            <div class="article-header" data-index="${index}">
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
    container.querySelectorAll('.article-header').forEach(header => {
        header.addEventListener('click', () => toggleArticle(header));
    });
}

// Render Notizie articles
function renderNotizieArticles() {
    const container = document.getElementById('notizie-articles');
    if (!container || !content || !content[currentLang]) return;
    
    const articles = content[currentLang].cityguide?.notizie?.articles || [];
    
    if (articles.length === 0) {
        container.innerHTML = `<p class="empty-content">${content[currentLang].cityguide?.notizie?.empty || 'Contenuti in arrivo...'}</p>`;
        return;
    }
    
    // Sort by date descending
    const sortedArticles = [...articles].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    container.innerHTML = '';
    sortedArticles.forEach((article, index) => {
        const articleEl = document.createElement('div');
        articleEl.className = 'article-item';
        articleEl.setAttribute('data-article-id', article.id);
        
        // Format date
        const dateObj = new Date(article.date);
        const formattedDate = dateObj.toLocaleDateString(currentLang === 'it' ? 'it-IT' : 'en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        articleEl.innerHTML = `
            <div class="article-header" data-index="${index}">
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
    container.querySelectorAll('.article-header').forEach(header => {
        header.addEventListener('click', () => toggleArticle(header));
    });
}

// Toggle article accordion
function toggleArticle(header) {
    const item = header.closest('.article-item');
    const arrow = header.querySelector('.article-toggle');
    
    if (item.classList.contains('expanded')) {
        item.classList.remove('expanded');
        arrow.textContent = '▼';
    } else {
        // Close all other articles in same container
        const container = item.parentElement;
        container.querySelectorAll('.article-item').forEach(i => {
            i.classList.remove('expanded');
            i.querySelector('.article-toggle').textContent = '▼';
        });
        
        item.classList.add('expanded');
        arrow.textContent = '▲';
    }
}

// Handle anchor links (e.g., #tempio-giove)
function handleAnchorLinks() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    
    setTimeout(() => {
        const articleEl = document.querySelector(`[data-article-id="${hash}"]`);
        if (articleEl) {
            const header = articleEl.querySelector('.article-header');
            if (header) {
                toggleArticle(header);
                setTimeout(() => {
                    articleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        }
    }, 500);
}

// Show error message
function showError(message) {
    const storiaContainer = document.getElementById('storia-articles');
    const notizieContainer = document.getElementById('notizie-articles');
    
    if (storiaContainer) {
        storiaContainer.innerHTML = `<p class="empty-content" style="color: #dc2626;">${message}</p>`;
    }
    if (notizieContainer) {
        notizieContainer.innerHTML = `<p class="empty-content" style="color: #dc2626;">${message}</p>`;
    }
}

// Start loading when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContent);
} else {
    loadContent();
}
