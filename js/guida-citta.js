// City Guide Page - VERSIONE FINALE TESTATA
console.log('✅ Script caricato');

let currentLang = localStorage.getItem('language') || 'it';
let content = null;

async function loadContent() {
    try {
        const response = await fetch('content/content.json');
        content = await response.json();
        console.log('✅ Content caricato');
        initializePage();
    } catch (error) {
        console.error('❌ Errore:', error);
    }
}

function initializePage() {
    updateTabLabels();
    renderStoriaArticles();
    renderNotizieArticles();
    handleAnchorLinks();
    setupLanguageSwitcher();
    setupTabs();
    setupMobileMenu();
}

function setupMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    
    if (!navToggle) {
        console.error('❌ Menu non trovato');
        return;
    }
    
    // Check if it's home button (on guida-citta page)
    if (navToggle.classList.contains('home-button')) {
        navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html#home';
        });
        console.log('✅ Home button configured');
        return;
    }
    
    // Normal menu toggle for index.html
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) {
        console.error('❌ navMenu non trovato');
        return;
    }
    
    navToggle.addEventListener('click', (e) => {
        e.preventDefault();
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        console.log('Menu toggled');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
}

function setupLanguageSwitcher() {
    const langSwitch = document.getElementById('langSwitch');
    if (!langSwitch) return;
    
    updateLangButton();
    
    langSwitch.addEventListener('click', () => {
        currentLang = currentLang === 'it' ? 'en' : 'it';
        localStorage.setItem('language', currentLang);
        updateLangButton();
        updateTabLabels();
        renderStoriaArticles();
        renderNotizieArticles();
    });
}

function updateLangButton() {
    const langSwitch = document.getElementById('langSwitch');
    if (!langSwitch) return;
    
    const options = langSwitch.querySelectorAll('.lang-option');
    options.forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-lang') === currentLang);
    });
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId)?.classList.add('active');
        });
    });
}

function updateTabLabels() {
    if (!content?.[currentLang]) return;
    
    const storiaTab = document.querySelector('[data-tab="storia"]');
    const notizieTab = document.querySelector('[data-tab="notizie"]');
    
    if (storiaTab) storiaTab.textContent = content[currentLang].cityguide?.tabs?.storia || 'Storia';
    if (notizieTab) notizieTab.textContent = content[currentLang].cityguide?.tabs?.notizie || 'Notizie';
}

function renderStoriaArticles() {
    const container = document.getElementById('storia-articles');
    if (!container || !content?.[currentLang]) return;
    
    const articles = content[currentLang].cityguide?.storia?.articles || [];
    
    if (articles.length === 0) {
        container.innerHTML = `<p class="empty-content">Contenuti in arrivo...</p>`;
        return;
    }
    
    container.innerHTML = '';
    articles.forEach((article, index) => {
        const bookingBtn = article.bookingButton ? 
            `<div style="margin: 20px 0; text-align: center;">
                <a href="${article.bookingButton.url}" target="_blank" class="booking-button">
                    ${article.bookingButton.text}
                </a>
            </div>` : '';
        
        const articleEl = document.createElement('div');
        articleEl.className = 'article-item';
        articleEl.setAttribute('data-article-id', article.id);
        articleEl.innerHTML = `
            <div class="article-header">
                <div><h3>${article.title}</h3></div>
                <span class="article-toggle">▼</span>
            </div>
            <div class="article-content">
                <div class="article-preview">${article.preview}</div>
                <div class="article-full">${bookingBtn}${article.content}</div>
            </div>
        `;
        container.appendChild(articleEl);
    });
    
    container.querySelectorAll('.article-header').forEach(header => {
        header.addEventListener('click', () => toggleArticle(header));
    });
}

function renderNotizieArticles() {
    const container = document.getElementById('notizie-articles');
    if (!container || !content?.[currentLang]) return;
    
    const articles = content[currentLang].cityguide?.notizie?.articles || [];
    
    if (articles.length === 0) {
        container.innerHTML = `<p class="empty-content">Nessuna notizia al momento</p>`;
        return;
    }
    
    const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = '';
    sorted.forEach(article => {
        const date = new Date(article.date).toLocaleDateString(
            currentLang === 'it' ? 'it-IT' : 'en-GB',
            { year: 'numeric', month: 'long', day: 'numeric' }
        );
        
        const articleEl = document.createElement('div');
        articleEl.className = 'article-item';
        articleEl.setAttribute('data-article-id', article.id);
        articleEl.innerHTML = `
            <div class="article-header">
                <div>
                    <h3>${article.title}</h3>
                    <p class="article-date">${date}</p>
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
    
    container.querySelectorAll('.article-header').forEach(header => {
        header.addEventListener('click', () => toggleArticle(header));
    });
}

function toggleArticle(header) {
    const item = header.closest('.article-item');
    const arrow = header.querySelector('.article-toggle');
    const container = item.parentElement;
    
    if (item.classList.contains('expanded')) {
        item.classList.remove('expanded');
        arrow.textContent = '▼';
    } else {
        container.querySelectorAll('.article-item').forEach(i => {
            i.classList.remove('expanded');
            i.querySelector('.article-toggle').textContent = '▼';
        });
        item.classList.add('expanded');
        arrow.textContent = '▲';
    }
}

function handleAnchorLinks() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    
    setTimeout(() => {
        const article = document.querySelector(`[data-article-id="${hash}"]`);
        if (article) {
            const header = article.querySelector('.article-header');
            if (header) {
                toggleArticle(header);
                
                // Aspetta espansione, poi scroll preciso al titolo
                setTimeout(() => {
                    const titleElement = article.querySelector('h3');
                    if (titleElement) {
                        const navbarHeight = 80;
                        const elementTop = titleElement.getBoundingClientRect().top + window.pageYOffset;
                        window.scrollTo({
                            top: elementTop - navbarHeight,
                            behavior: 'smooth'
                        });
                    }
                }, 400);
            }
        }
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupMobileMenu();
        loadContent();
    });
} else {
    setupMobileMenu();
    loadContent();
}
