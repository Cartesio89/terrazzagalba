// App State
let currentLang = 'it';
let content = null;

// PIN corretto
const CORRECT_PIN = '8008';

// Photo list
const photos = [
    { filename: '20250530_192259.jpg', alt: 'Cucina con tavolo limoni' },
    { filename: 'IMG_20240715_221057_056.jpg', alt: 'Vista serale terrazza' },
    { filename: 'dji_fly_20240728_124530_901_1722164597533_photo.jpg', alt: 'Teatro Romano drone' },
    { filename: '20240731_210142.jpg', alt: 'Terrazza serale con luci' },
    { filename: '20250530_211226.jpg', alt: 'Cucina dall\'alto' },
    { filename: 'IMG_20240715_220049_133.jpg', alt: 'Camera con divano' },
    { filename: '20240616_153645.jpg', alt: 'Bagno con specchio' },
    { filename: '20250608_164955.jpg', alt: 'Teatro Romano' },
    { filename: '20251115_120136.jpg', alt: 'Vista panoramica città' }
];

// Init
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadContent();
    setupNavigation();
    setupLanguageSwitch();
    loadGallery();
    loadReviews();
    setupContactForm();
    setupPinForm();
    updateContent();
}

// Load content from JSON
async function loadContent() {
    try {
        const response = await fetch('./content/content.json');
        content = await response.json();
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Navigation
function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            document.querySelector(target).scrollIntoView({
                behavior: 'smooth'
            });
            navMenu.classList.remove('active');
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Scroll spy
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.section, .hero');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Language Switch
function setupLanguageSwitch() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLang = btn.dataset.lang;
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateContent();
            loadReviews();
        });
    });
}

// Update content based on language
function updateContent() {
    if (!content) return;

    const lang = content[currentLang];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const value = getNestedValue(lang, key);
        
        if (value) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = value;
            } else {
                el.textContent = value;
            }
        }
    });

    // Update page title and meta
    document.title = `${lang.siteName} - ${lang.tagline}`;
    document.documentElement.lang = currentLang;
}

// Helper to get nested object value
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Load Gallery
function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    galleryGrid.innerHTML = '';

    photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="./images/${photo.filename}" alt="${photo.alt}" loading="lazy">
        `;
        
        item.addEventListener('click', () => {
            openLightbox(photo.filename);
        });
        
        galleryGrid.appendChild(item);
    });
}

// Simple lightbox
function openLightbox(filename) {
    const lightbox = document.createElement('div');
    lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = `./images/${filename}`;
    img.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain;';
    
    lightbox.appendChild(img);
    document.body.appendChild(lightbox);
    
    lightbox.addEventListener('click', () => {
        document.body.removeChild(lightbox);
    });
}

// Load Reviews
function loadReviews() {
    if (!content) return;

    const reviewsGrid = document.getElementById('reviewsGrid');
    reviewsGrid.innerHTML = '';

    const reviews = content[currentLang].reviews.items;

    reviews.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <div class="review-header">
                <span class="review-name">${review.name}</span>
                <span class="review-date">${review.date}</span>
            </div>
            <div class="review-stars">⭐⭐⭐⭐⭐</div>
            <p class="review-text">${review.text}</p>
        `;
        reviewsGrid.appendChild(card);
    });
}

// Contact Form
function setupContactForm() {
    const form = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        // In production, integrate with EmailJS or similar service
        // For now, just show success
        
        formStatus.textContent = currentLang === 'it' 
            ? 'Messaggio inviato! Ti risponderemo presto.' 
            : 'Message sent! We will reply soon.';
        formStatus.className = 'form-status success';

        form.reset();

        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 5000);
    });
}

// PIN Form for House Guide
function setupPinForm() {
    const pinForm = document.getElementById('pinForm');
    const pinInput = document.getElementById('pin');
    const pinError = document.getElementById('pinError');
    const guideLock = document.getElementById('guideLock');
    const guideContent = document.getElementById('guideContent');

    pinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const enteredPin = pinInput.value;

        if (enteredPin === CORRECT_PIN) {
            guideLock.style.display = 'none';
            guideContent.style.display = 'block';
            pinError.classList.remove('show');
        } else {
            pinError.classList.add('show');
            pinInput.value = '';
            pinInput.focus();
        }
    });
}

// Smooth scroll polyfill for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    const smoothScroll = (target) => {
        const targetPosition = target.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 1000;
        let start = null;

        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };

        const ease = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };

        requestAnimationFrame(animation);
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) smoothScroll(target);
        });
    });
}
