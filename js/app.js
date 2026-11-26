// Language management
let currentLang = 'it';
try {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'it' || savedLang === 'en') currentLang = savedLang;
} catch (e) { /* storage non disponibile: resta italiano */ }
let content = {};

// Recensioni: lette da Supabase (Airbnb inserite a mano + Google in tempo reale).
// Se il servizio non risponde, si usano quelle scritte in content.json.
const REVIEWS_API = 'https://prmyrmpmfavppkbzdqyg.supabase.co/functions/v1/galba-reviews';
const REVIEWS_KEY = 'sb_publishable_M_ihkB0s9phBxPwDwQFd5g_KDzlQmDW';
const reviewsCache = {};
let reviewsExpanded = false;

function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Load content
async function loadContent() {
    try {
        const response = await fetch('content/content.json');
        content = await response.json();
        updateContent();
        setupGalleryToggle(); // Setup dopo aver caricato content
        loadReviews();
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Update content based on current language
function updateContent() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        const keys = key.split('.');
        let value = content[currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return;
            }
        }
        
        if (typeof value === 'string') {
            // Check if element contains SVG (button with icon)
            const svg = element.querySelector('svg');
            if (svg) {
                // Find and update text node, or create one
                let textNode = null;
                for (let node of element.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                        textNode = node;
                        break;
                    }
                }
                
                if (textNode) {
                    // Update existing text node
                    textNode.textContent = ' ' + value;
                } else {
                    // Create new text node after SVG
                    const newTextNode = document.createTextNode(' ' + value);
                    element.appendChild(newTextNode);
                }
            } else {
                // No SVG, replace all content as before
                element.textContent = value;
            }
        }
    });
    
    // Update placeholders
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        const keys = key.split('.');
        let value = content[currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return;
            }
        }
        
        if (typeof value === 'string') {
            element.placeholder = value;
        }
    });
    
    // Update reviews
    updateReviews();
    renderDetails();
    // Update gallery toggle text
    updateGalleryToggleText();
}

// La casa in breve: servizi, regole, come arrivare
function renderDetails() {
    const d = content[currentLang] && content[currentLang].details;
    if (!d) return;
    const li = arr => (arr || []).map(x => `<li>${escapeHtml(x)}</li>`).join('');
    const sv = document.getElementById('detailsServices'); if (sv) sv.innerHTML = li(d.services);
    const ru = document.getElementById('detailsRules'); if (ru) ru.innerHTML = li(d.rules);
    const ai = document.getElementById('detailsArriveIntro'); if (ai) ai.textContent = d.arriveIntro || '';
    const ds = document.getElementById('detailsDistances');
    if (ds) ds.innerHTML = (d.distances || []).map(x => `
        <li><span class="dist-name">${escapeHtml(x.name)}</span>
            <span class="dist-values">${x.walk ? `<span class="dist-walk">🚶 ${escapeHtml(x.walk)}</span>` : ''}${x.car ? `<span class="dist-car">🚗 ${escapeHtml(x.car)}</span>` : ''}</span></li>`).join('');
}

function setupDetailsTabs() {
    const box = document.getElementById('detailsBox');
    if (!box) return;
    box.querySelectorAll('.details-tab').forEach(tab => tab.addEventListener('click', () => {
        const id = tab.getAttribute('data-panel');
        box.querySelectorAll('.details-tab').forEach(t => {
            const on = t === tab;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        box.querySelectorAll('.details-panel').forEach(pn => pn.classList.toggle('active', pn.getAttribute('data-panel') === id));
    }));
}

// Update reviews
async function loadReviews() {
    const lang = currentLang;
    if (reviewsCache[lang]) { updateReviews(); return; }
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(REVIEWS_API + '?lang=' + lang, {
            headers: { apikey: REVIEWS_KEY },
            signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error('reviews ' + res.status);
        const data = await res.json();
        if (!data || !Array.isArray(data.manual)) throw new Error('reviews format');
        reviewsCache[lang] = data;
    } catch (e) {
        console.warn('Recensioni dal servizio non disponibili, uso content.json', e);
        reviewsCache[lang] = null;
    }
    if (lang === currentLang) updateReviews();
}

function formatReviewDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
    if (isNaN(d)) return iso;
    const txt = d.toLocaleDateString(currentLang === 'it' ? 'it-IT' : 'en-GB', { month: 'long', year: 'numeric' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function makePreview(text) {
    const LIMIT = 160;
    if (text.length <= LIMIT + 30) return null;
    let cut = text.slice(0, LIMIT);
    const sp = cut.lastIndexOf(' ');
    if (sp > 80) cut = cut.slice(0, sp);
    return cut.replace(/[\s,.;:!?-]+$/, '') + '…';
}

function collectReviews() {
    const r = content[currentLang] && content[currentLang].reviews;
    const api = reviewsCache[currentLang];
    if (api) {
        const list = api.manual.map(x => Object.assign({}, x));
        const g = api.google;
        if (g && Array.isArray(g.reviews)) g.reviews.forEach(x => list.push(Object.assign({}, x)));
        list.sort((a, b) => String(b.data).localeCompare(String(a.data)));
        let total = api.manual.length, sum = api.manual.reduce((t, x) => t + (x.voto || 5), 0);
        if (g && g.count) { total += g.count; sum += (g.rating || 5) * g.count; }
        return { list, total, avg: total ? sum / total : 5, google: g && g.count ? g : null };
    }
    // ripiego: recensioni scritte in content.json
    const items = (r && r.items) || [];
    return {
        list: items.map(it => ({ fonte: 'airbnb', autore: it.name, voto: it.rating, dataLabel: it.date, testo: it.text })),
        total: items.length,
        avg: items.length ? items.reduce((t, x) => t + (x.rating || 5), 0) / items.length : 5,
        google: null
    };
}

function updateReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    if (!reviewsGrid || !content[currentLang] || !content[currentLang].reviews) return;
    const t = content[currentLang].reviews;
    const { list, total, avg, google } = collectReviews();

    // riepilogo in alto
    const num = document.getElementById('ratingNumber');
    const stars = document.getElementById('ratingStars');
    const txt = document.getElementById('ratingText');
    if (num) num.textContent = (Math.round(avg * 10) / 10).toFixed(1);
    if (stars) stars.textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
    if (txt) {
        const word = total === 1 ? (t.countOne || 'recensione') : (t.countMany || 'recensioni');
        txt.textContent = total + ' ' + word + (google ? ' · ' + (t.sources || 'Airbnb e Google') : ' · Airbnb');
    }

    const readMoreText = t.readMore || 'Leggi tutto';
    const readLessText = t.readLess || 'Mostra meno';
    const visibleCount = window.matchMedia('(max-width: 768px)').matches ? 3 : 6;

    reviewsGrid.innerHTML = '';
    list.forEach((review, index) => {
        const text = String(review.testo || '');
        const preview = makePreview(text);
        const isGoogle = review.fonte === 'google';
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card' + (index >= visibleCount && !reviewsExpanded ? ' review-card-hidden' : '');
        const nameHtml = isGoogle && review.autoreUrl
            ? `<a href="${escapeHtml(review.autoreUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(review.autore)}</a>`
            : escapeHtml(review.autore);
        const dateLabel = review.dataLabel || formatReviewDate(review.data);
        reviewCard.innerHTML = `
            <div class="review-header">
                <div class="review-author">
                    <div class="review-avatar" aria-hidden="true">${escapeHtml(String(review.autore || '?').charAt(0).toUpperCase())}</div>
                    <div>
                        <h3 class="review-name">${nameHtml}</h3>
                        <p class="review-date">${escapeHtml(dateLabel)}</p>
                    </div>
                </div>
                <div class="review-rating" aria-label="${review.voto}/5">${'★'.repeat(review.voto || 5)}</div>
            </div>
            <div class="review-content">
                <p class="review-text-preview">${escapeHtml(preview || text)}</p>
                ${preview ? `
                    <p class="review-text-full" style="display: none;">${escapeHtml(text)}</p>
                    <button class="review-toggle" type="button">
                        <span class="toggle-show">${escapeHtml(readMoreText)} ▼</span>
                        <span class="toggle-hide" style="display: none;">${escapeHtml(readLessText)} ▲</span>
                    </button>
                ` : ''}
            </div>
            <div class="review-footer">
                <span class="review-source review-source-${isGoogle ? 'google' : escapeHtml(review.fonte || 'airbnb')}">${isGoogle ? 'Google' : (review.fonte === 'altro' ? '' : 'Airbnb')}</span>
                ${review.tradotto ? `<span class="review-translated">${escapeHtml(t.translated || '')}</span>` : ''}
            </div>
        `;
        reviewsGrid.appendChild(reviewCard);
    });

    // "Leggi tutto" su ogni recensione
    reviewsGrid.querySelectorAll('.review-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.review-card');
            const preview = card.querySelector('.review-text-preview');
            const full = card.querySelector('.review-text-full');
            const showBtn = button.querySelector('.toggle-show');
            const hideBtn = button.querySelector('.toggle-hide');
            const open = full.style.display === 'none';
            preview.style.display = open ? 'none' : 'block';
            full.style.display = open ? 'block' : 'none';
            showBtn.style.display = open ? 'none' : 'inline';
            hideBtn.style.display = open ? 'inline' : 'none';
        });
    });

    // "Mostra tutte le recensioni"
    const more = document.getElementById('reviewsMore');
    if (more) {
        if (list.length > visibleCount) {
            more.hidden = false;
            more.textContent = reviewsExpanded ? (t.showFewer || 'Mostra meno recensioni')
                                               : (t.showAll || 'Mostra tutte le recensioni') + ' (' + list.length + ')';
            more.onclick = () => {
                reviewsExpanded = !reviewsExpanded;
                updateReviews();
                if (!reviewsExpanded) document.getElementById('reviews').scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
        } else {
            more.hidden = true;
        }
    }
    const gLink = document.getElementById('reviewsGoogleLink');
    if (gLink) {
        if (google && google.url) {
            gLink.hidden = false;
            gLink.href = google.url;
            gLink.textContent = (t.allOnGoogle || 'Leggi tutte le recensioni su Google') + ' →';
        } else {
            gLink.hidden = true;
        }
    }
}

// Gallery management - NON CLICKABLE
const images = Array.from({length: 18}, (_, i) => ({
    src: `images/${i}.jpg`,
    alt: `Terrazza Galba - Foto ${i + 1}`
}));

function createGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    // Clear existing to avoid duplicates
    galleryGrid.innerHTML = '';
    
    images.forEach((image) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${image.src}" alt="${image.alt}" loading="lazy">
        `;
        // NO click event - images are not clickable
        galleryGrid.appendChild(item);
    });
}

// Setup gallery toggle (chiamata dopo loadContent)
function setupGalleryToggle() {
    const galleryToggle = document.getElementById('galleryToggle');
    const galleryGrid = document.getElementById('galleryGrid');
    const galleryToggleText = document.getElementById('galleryToggleText');

    if (galleryToggle && galleryGrid && galleryToggleText) {
        galleryToggle.addEventListener('click', () => {
            const isExpanded = galleryGrid.classList.toggle('expanded');
            galleryToggle.classList.toggle('active');
            
            // Update text based on state
            if (isExpanded) {
                galleryToggleText.textContent = content[currentLang].gallery.toggle.hide;
                galleryToggleText.setAttribute('data-translate', 'gallery.toggle.hide');
            } else {
                galleryToggleText.textContent = content[currentLang].gallery.toggle.show;
                galleryToggleText.setAttribute('data-translate', 'gallery.toggle.show');
            }
        });
    }
}

// Update gallery toggle text when language changes
function updateGalleryToggleText() {
    const galleryToggleText = document.getElementById('galleryToggleText');
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (galleryToggleText && galleryGrid) {
        const isExpanded = galleryGrid.classList.contains('expanded');
        if (isExpanded) {
            galleryToggleText.textContent = content[currentLang].gallery.toggle.hide;
        } else {
            galleryToggleText.textContent = content[currentLang].gallery.toggle.show;
        }
    }
}

// Navigation setup (chiamata dopo DOM ready)
function setupNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (!navToggle || !navMenu) {
        console.log('Navigation elements not found - skipping setup');
        return;
    }

    window.addEventListener('scroll', () => {
        if (navbar && window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else if (navbar) {
            navbar.classList.remove('scrolled');
        }
    });

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
}

// Smooth scroll setup
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            
            if (target) {
                // Show hidden sections when navigating to them
                if (target.classList.contains('section-hidden')) {
                    target.style.display = 'block';
                    target.style.position = 'static';
                    target.style.visibility = 'visible';
                    target.style.height = 'auto';
                }
                
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Language switcher setup
function setupLanguageSwitcher() {
    const langSwitch = document.getElementById('langSwitch');
    const langOptions = document.querySelectorAll('.lang-option');

    if (!langOptions.length) return;

    // lingua scelta in precedenza (anche dalla Guida alla città)
    langOptions.forEach(opt => opt.classList.toggle('active', opt.getAttribute('data-lang') === currentLang));
    document.documentElement.lang = currentLang;

    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            if (lang !== currentLang) {
                currentLang = lang;
                try { localStorage.setItem('language', lang); } catch (e) {}
                document.documentElement.lang = lang;
                langOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                updateContent();
                loadReviews();
            }
        });
    });
}

// Tabs management for City Guide
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    if (!tabButtons.length) return;

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            const targetPanel = document.getElementById(`tab-${targetTab}`);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });
}

// Contact form setup
// FormSubmit: per gli invii da JavaScript va usato l'indirizzo /ajax/ (quello senza /ajax/
// mostra una pagina con captcha che da fetch non si può completare, quindi l'email non partiva).
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/terrazzagalba@gmail.com';
const FORM_CC = 'martino.cicerani@gmail.com';

function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    const status = document.getElementById('formStatus');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    const showStatus = (key, fallback, ok) => {
        const f = (content[currentLang] && content[currentLang].contact && content[currentLang].contact.form) || {};
        if (status) {
            status.textContent = f[key] || fallback;
            status.className = 'form-status ' + (ok === true ? 'form-status-ok' : ok === false ? 'form-status-err' : 'form-status-wait');
        }
    };

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const name = String(formData.get('name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const message = String(formData.get('message') || '').trim();
        if (!name || !email || !message) return;

        if (submitBtn) submitBtn.disabled = true;
        showStatus('sending', 'Invio in corso…');
        try {
            const response = await fetch(FORM_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    message: message,
                    _replyto: email,
                    _subject: 'Nuova richiesta da Terrazza Galba',
                    _cc: FORM_CC,
                    _template: 'table'
                })
            });
            const result = await response.json().catch(() => ({}));
            if (response.ok && String(result.success) !== 'false') {
                showStatus('ok', 'Messaggio inviato!', true);
                contactForm.reset();
            } else {
                console.error('FormSubmit:', response.status, result);
                showStatus('err', 'Invio non riuscito. Riprova o scrivici su WhatsApp.', false);
            }
        } catch (error) {
            console.error('FormSubmit:', error);
            showStatus('err', 'Invio non riuscito. Riprova o scrivici su WhatsApp.', false);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// Map: si carica solo quando l'utente lo chiede (Google riceve dati di navigazione)
function setupMap() {
    const box = document.getElementById('mapBox');
    const btn = document.getElementById('mapLoadBtn');
    if (!box || !btn) return;
    btn.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = box.getAttribute('data-src');
        iframe.width = '100%';
        iframe.height = '300';
        iframe.style.border = '0';
        iframe.loading = 'lazy';
        iframe.allowFullscreen = true;
        iframe.title = 'Google Maps';
        box.innerHTML = '';
        box.classList.remove('map-consent');
        box.appendChild(iframe);
    });
}

// Gallery counter on mobile carousel ("3 / 18")
function setupGalleryCounter() {
    const grid = document.getElementById('galleryGrid');
    const counter = document.getElementById('galleryCounter');
    if (!grid || !counter) return;
    const update = () => {
        const items = grid.children;
        if (!items.length) return;
        const w = items[0].getBoundingClientRect().width || 1;
        const idx = Math.min(items.length, Math.round(grid.scrollLeft / (w + 12)) + 1);
        counter.textContent = idx + ' / ' + items.length;
    };
    grid.addEventListener('scroll', () => window.requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
}

// House guide PIN setup
function setupHouseGuide() {
    const guideForm = document.querySelector('.pin-form');
    const correctPin = '8008';
    
    if (!guideForm) return;

    guideForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = document.getElementById('guidePin').value;
        
        if (pin === correctPin) {
            // Download diretto del PDF (evita popup blocker)
            const link = document.createElement('a');
            link.href = '/assets/guida-casa.pdf';
            link.download = 'Guida-Casa-Terrazza-Galba.pdf';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Mostra messaggio successo
            guideForm.style.display = 'none';
            const guideSuccess = document.getElementById('guideSuccess');
            if (guideSuccess) guideSuccess.style.display = 'block';
        } else {
            alert(currentLang === 'it' ? 'PIN errato. Riprova.' : 'Incorrect PIN. Try again.');
            document.getElementById('guidePin').value = '';
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadContent();
    createGallery();
    setupNavigation();
    setupSmoothScroll();
    setupLanguageSwitcher();
    setupTabs();
    setupContactForm();
    setupHouseGuide();
    setupMap();
    setupDetailsTabs();
    setupGalleryCounter();
    const y = document.getElementById('footerYear');
    if (y) y.textContent = new Date().getFullYear();
});
