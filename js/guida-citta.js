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
    handleAnchorLinks();
    setupLanguageSwitcher();
    setupTabs();
    setupMobileMenu();
}

function setupMobileMenu() {
    // viene chiamata due volte (avvio + initializePage): il menu va collegato una volta sola
    if (setupMobileMenu.done) return;
    setupMobileMenu.done = true;
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
    document.querySelectorAll('#navMenu [data-translate]').forEach(el => {
        const v = el.getAttribute('data-translate').split('.').reduce((o, k) => o && o[k], content[currentLang]);
        if (typeof v === 'string') el.textContent = v;
    });
    const cgTitle = document.getElementById('cityGuideTitle');
    const cgSub = document.getElementById('cityGuideSubtitle');
    if (cgTitle && content[currentLang].cityguide?.title) cgTitle.textContent = content[currentLang].cityguide.title;
    if (cgSub && content[currentLang].cityguide?.subtitle) cgSub.textContent = content[currentLang].cityguide.subtitle;
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
    addReadMoreButtons(container);
}

// ---------- Schede espandibili: pulsanti "Leggi tutto" / "Mostra meno" ben visibili ----------
function addReadMoreButtons(container) {
    const t = (content && content[currentLang] && content[currentLang].reviews) || {};
    const more = t.readMore || 'Leggi tutto';
    const less = t.readLess || 'Mostra meno';
    container.querySelectorAll('.article-item').forEach(item => {
        const header = item.querySelector('.article-header');
        const preview = item.querySelector('.article-preview');
        const full = item.querySelector('.article-full');
        if (!header || !preview || !full || item.querySelector('.article-more')) return;
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'article-more';
        open.innerHTML = `${more} <span aria-hidden="true">▾</span>`;
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'article-more article-less';
        close.innerHTML = `${less} <span aria-hidden="true">▴</span>`;
        const wrapOpen = document.createElement('div');
        wrapOpen.className = 'article-more-wrap';
        wrapOpen.appendChild(open);
        preview.appendChild(wrapOpen);
        const wrapClose = document.createElement('div');
        wrapClose.className = 'article-more-wrap';
        wrapClose.appendChild(close);
        full.appendChild(wrapClose);
        [open, close].forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggleArticle(header); }));
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleArticle(header); } });
    });
}

function toggleArticle(header) {
    const item = header.closest('.article-item');
    const container = item.parentElement;
    const willOpen = !item.classList.contains('expanded');
    container.querySelectorAll('.article-item.expanded').forEach(i => {
        i.classList.remove('expanded');
        const h = i.querySelector('.article-header'); if (h) h.setAttribute('aria-expanded', 'false');
    });
    if (willOpen) {
        item.classList.add('expanded');
        header.setAttribute('aria-expanded', 'true');
    }
    // la freccia ruota solo via CSS (prima veniva girata due volte e restava sempre verso il basso)
    // dopo l'apertura/chiusura riporta il titolo in vista: chiudere la scheda sopra non deve far "saltare" la pagina
    requestAnimationFrame(() => {
        const top = item.getBoundingClientRect().top;
        if (top < 70 || top > window.innerHeight * 0.6) {
            window.scrollTo({ top: window.pageYOffset + top - 80, behavior: 'smooth' });
        }
    });
}

function handleAnchorLinks() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    
    setTimeout(() => {
        const article = document.querySelector(`[data-article-id="${hash}"]`);
        if (article) {
            const header = article.querySelector('.article-header');
            if (header) {
                if (!article.classList.contains('expanded')) toggleArticle(header);
                
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

window.addEventListener('hashchange', handleAnchorLinks);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupMobileMenu();
        loadContent();
    });
} else {
    setupMobileMenu();
    loadContent();
}
