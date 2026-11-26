// Pagina Eventi: news ed eventi inserite dalla pagina amministratore (Supabase), tradotte in automatico
let currentLang = 'it';
try { const s = localStorage.getItem('language'); if (s === 'it' || s === 'en') currentLang = s; } catch (e) {}
let content = null;

// ---------- News ed eventi: lette da Supabase, inserite dalla pagina amministratore ----------
const NEWS_API = 'https://prmyrmpmfavppkbzdqyg.supabase.co/functions/v1/galba-news';
const NEWS_KEY = 'sb_publishable_M_ihkB0s9phBxPwDwQFd5g_KDzlQmDW';
const newsCache = {};
let newsFilter = null; // 'upcoming' | 'past'

function escNews(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// testo della news -> HTML (grassetto, elenchi, titoletti, link): vedi js/news-format.js
function newsTextToHtml(text) {
    if (window.NewsFormat) return window.NewsFormat.toHtml(text);
    return '<p>' + escNews(text).replace(/\n/g, '<br>') + '</p>';
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

async function renderEvents() {
    const container = document.getElementById('events-list');
    if (!container || !content?.[currentLang]) return;
    const cg = content[currentLang].events || {};
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
        <button type="button" class="news-filter${newsFilter === 'upcoming' ? ' active' : ''}" data-f="upcoming">${escNews(cg.upcoming || 'In arrivo')} <span>${upcoming.length}</span></button>
        <button type="button" class="news-filter${newsFilter === 'past' ? ' active' : ''}" data-f="past">${escNews(cg.past || 'Ultimi 12 mesi')} <span>${past.length}</span></button>`;
    bar.querySelectorAll('.news-filter').forEach(b => b.addEventListener('click', () => {
        newsFilter = b.dataset.f;
        renderEvents();
    }));

    const list = newsFilter === 'upcoming' ? upcoming : past;
    if (!list.length) {
        container.innerHTML = `<p class="empty-content">${escNews(newsFilter === 'upcoming' ? (cg.emptyUpcoming || 'Nessun evento in programma al momento.') : (cg.emptyPast || 'Nessuna notizia negli ultimi 12 mesi.'))}</p>`;
        return;
    }

    container.innerHTML = '';
    list.forEach(n => {
        const plain = window.NewsFormat ? window.NewsFormat.toPlain(n.testo) : String(n.testo || '').replace(/\s+/g, ' ').trim();
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
                <div class="article-full">${newsTextToHtml(n.testo)}${n.tradotto ? `<p class="news-translated">${escNews(cg.translated || '')}</p>` : ''}</div>
            </div>`;
        container.appendChild(el);
    });
    container.querySelectorAll('.article-header').forEach(header => {
        header.addEventListener('click', () => toggleArticle(header));
    });
    addReadMoreButtons(container);
    // i link nel testo non devono chiudere/aprire la scheda
    container.querySelectorAll('.article-full a').forEach(a => a.addEventListener('click', e => e.stopPropagation()));
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

function translatePage() {
    const t = content?.[currentLang];
    if (!t) return;
    document.querySelectorAll('[data-translate]').forEach(el => {
        const v = el.getAttribute('data-translate').split('.').reduce((o, k) => o && o[k], t);
        if (typeof v === 'string') el.textContent = v;
    });
    document.querySelectorAll('#langSwitch .lang-option').forEach(o =>
        o.classList.toggle('active', o.getAttribute('data-lang') === currentLang));
    document.documentElement.lang = currentLang;
}

function setupMenu() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', e => {
        e.preventDefault();
        menu.classList.toggle('active');
        toggle.classList.toggle('active');
    });
    menu.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
        menu.classList.remove('active'); toggle.classList.remove('active');
    }));
}

function setupLang() {
    const sw = document.getElementById('langSwitch');
    if (!sw) return;
    sw.addEventListener('click', () => {
        currentLang = currentLang === 'it' ? 'en' : 'it';
        try { localStorage.setItem('language', currentLang); } catch (e) {}
        translatePage();
        renderEvents();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setupMenu();
    setupLang();
    const y = document.getElementById('footerYear');
    if (y) y.textContent = new Date().getFullYear();
    try {
        const r = await fetch('content/content.json');
        content = await r.json();
    } catch (e) {
        console.error('content.json non caricato', e);
        content = {};
    }
    translatePage();
    renderEvents();
});
