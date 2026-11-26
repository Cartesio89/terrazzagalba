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
}

// ---------- News ed eventi: lette da Supabase, inserite dalla pagina amministratore ----------
const NEWS_API = 'https://prmyrmpmfavppkbzdqyg.supabase.co/functions/v1/galba-news';
const NEWS_KEY = 'sb_publishable_M_ihkB0s9phBxPwDwQFd5g_KDzlQmDW';
const newsCache = {};
let newsFilter = null; // 'upcoming' | 'past'

function escNews(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// testo semplice -> paragrafi con link cliccabili (sicuro: prima si fa l'escape)
function newsTextToHtml(text) {
    const linkify = s => s.replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/g, m => {
        let url = m, tail = '';
        while (/[.,;:!?)\]]$/.test(url)) { tail = url.slice(-1) + tail; url = url.slice(0, -1); }
        const href = url.startsWith('http') ? url : 'https://' + url;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>${tail}`;
    });
    return String(text || '').split(/\n\s*\n/).map(par =>
        '<p>' + linkify(escNews(par.trim())).replace(/\n/g, '<br>') + '</p>'
    ).join('');
}

function todayIso() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function newsDateLabel(a, b) {
    const loc = currentLang === 'it' ? 'it-IT' : 'en-GB';
    const d = iso => new Date(iso + 'T12:00:00');
    const f = (iso, o) => d(iso).toLocaleDateString(loc, o);
    const full = { day: 'numeric', month: 'long', year: 'numeric' };
    if (!b || b === a) return f(a, full);
    const A = d(a), B = d(b);
    if (A.getFullYear() === B.getFullYear() && A.getMonth() === B.getMonth())
        return A.getDate() + '–' + f(b, full);                       // 21–28 novembre 2026
    if (A.getFullYear() === B.getFullYear())
        return f(a, { day: 'numeric', month: 'long' }) + ' – ' + f(b, full); // 21 novembre – 3 dicembre 2026
    return f(a, full) + ' – ' + f(b, full);
}

async function fetchNews(lang) {
    if (newsCache[lang]) return newsCache[lang];
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(NEWS_API + '?lang=' + lang, { headers: { apikey: NEWS_KEY }, signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error('news ' + res.status);
        const data = await res.json();
        newsCache[lang] = Array.isArray(data.items) ? data.items : [];
    } catch (e) {
        console.warn('News non disponibili', e);
        // ripiego: eventuali notizie scritte in content.json
        const old = (content?.[lang]?.cityguide?.notizie?.articles) || [];
        return old.map((a, i) => ({ id: a.id || 'n' + i, dataInizio: (a.date || '').slice(0, 10), dataFine: null, titolo: a.title, testo: (a.content || '').replace(/<[^>]+>/g, '\n'), tradotto: false }));
    }
    return newsCache[lang];
}

async function renderNotizieArticles() {
    const container = document.getElementById('notizie-articles');
    if (!container || !content?.[currentLang]) return;
    const cg = content[currentLang].cityguide || {};
    const lang = currentLang;
    const items = await fetchNews(lang);
    if (lang !== currentLang) return;

    const today = todayIso();
    const limit = new Date(); limit.setFullYear(limit.getFullYear() - 1);
    const limitIso = limit.toISOString().slice(0, 10);
    const upcoming = items.filter(n => (n.dataFine || n.dataInizio) >= today)
                          .sort((a, b) => a.dataInizio.localeCompare(b.dataInizio));
    const past = items.filter(n => (n.dataFine || n.dataInizio) < today && n.dataInizio >= limitIso)
                      .sort((a, b) => b.dataInizio.localeCompare(a.dataInizio));
    if (!newsFilter) newsFilter = upcoming.length || !past.length ? 'upcoming' : 'past';

    // filtri
    let bar = document.getElementById('newsFilters');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'newsFilters';
        bar.className = 'news-filters';
        container.parentElement.insertBefore(bar, container);
    }
    bar.innerHTML = `
        <button type="button" class="news-filter${newsFilter === 'upcoming' ? ' active' : ''}" data-f="upcoming">${escNews(cg.newsUpcoming || 'In arrivo')} <span>${upcoming.length}</span></button>
        <button type="button" class="news-filter${newsFilter === 'past' ? ' active' : ''}" data-f="past">${escNews(cg.newsPast || 'Ultimi 12 mesi')} <span>${past.length}</span></button>`;
    bar.querySelectorAll('.news-filter').forEach(b => b.addEventListener('click', () => {
        newsFilter = b.dataset.f;
        renderNotizieArticles();
    }));

    const list = newsFilter === 'upcoming' ? upcoming : past;
    if (!list.length) {
        container.innerHTML = `<p class="empty-content">${escNews(newsFilter === 'upcoming' ? (cg.newsEmptyUpcoming || 'Nessun evento in programma al momento.') : (cg.newsEmptyPast || 'Nessuna notizia negli ultimi 12 mesi.'))}</p>`;
        return;
    }

    container.innerHTML = '';
    list.forEach(n => {
        const plain = String(n.testo || '').replace(/\s+/g, ' ').trim();
        let preview = plain;
        if (plain.length > 180) {
            preview = plain.slice(0, 160);
            const sp = preview.lastIndexOf(' ');
            if (sp > 80) preview = preview.slice(0, sp);
            preview += '…';
        }
        const el = document.createElement('div');
        el.className = 'article-item news-item';
        el.setAttribute('data-article-id', 'news-' + n.id);
        el.innerHTML = `
            <div class="article-header">
                <div>
                    <p class="article-date news-date">${escNews(newsDateLabel(n.dataInizio, n.dataFine))}</p>
                    ${n.titolo ? `<h3>${escNews(n.titolo)}</h3>` : ''}
                </div>
                <span class="article-toggle">▼</span>
            </div>
            <div class="article-content">
                <div class="article-preview">${escNews(preview)}</div>
                <div class="article-full">${newsTextToHtml(n.testo)}${n.tradotto ? `<p class="news-translated">${escNews(cg.newsTranslated || '')}</p>` : ''}</div>
            </div>`;
        container.appendChild(el);
    });
    container.querySelectorAll('.article-header').forEach(header => {
        header.addEventListener('click', () => toggleArticle(header));
    });
    // i link nel testo non devono chiudere/aprire la scheda
    container.querySelectorAll('.article-full a').forEach(a => a.addEventListener('click', e => e.stopPropagation()));
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
