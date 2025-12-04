// Language management
let currentLang = 'it';
let content = {};

// Load content
async function loadContent() {
    try {
        const response = await fetch('content/content.json');
        content = await response.json();
        updateContent();
        setupGalleryToggle(); // Setup dopo aver caricato content
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
    // Update gallery toggle text
    updateGalleryToggleText();
}

// Update reviews
function updateReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    if (!reviewsGrid || !content[currentLang].reviews) return;
    
    reviewsGrid.innerHTML = '';
    content[currentLang].reviews.items.forEach((review, index) => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        
        const hasPreview = review.preview && review.preview !== review.text;
        const readMoreText = content[currentLang].reviews.readMore || 'Leggi tutto';
        const readLessText = content[currentLang].reviews.readLess || 'Mostra meno';
        
        reviewCard.innerHTML = `
            <div class="review-header">
                <div class="review-author">
                    <div class="review-avatar">${review.name.charAt(0)}</div>
                    <div>
                        <h3 class="review-name">${review.name}</h3>
                        <p class="review-date">${review.date}</p>
                    </div>
                </div>
                <div class="review-rating">${'★'.repeat(review.rating)}</div>
            </div>
            <div class="review-content">
                <p class="review-text-preview">${hasPreview ? review.preview : review.text}</p>
                ${hasPreview ? `
                    <p class="review-text-full" style="display: none;">${review.text}</p>
                    <button class="review-toggle" data-review-index="${index}">
                        <span class="toggle-show">${readMoreText} ▼</span>
                        <span class="toggle-hide" style="display: none;">${readLessText} ▲</span>
                    </button>
                ` : ''}
            </div>
        `;
        reviewsGrid.appendChild(reviewCard);
    });
    
    // Add toggle functionality
    document.querySelectorAll('.review-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.review-card');
            const preview = card.querySelector('.review-text-preview');
            const full = card.querySelector('.review-text-full');
            const showBtn = button.querySelector('.toggle-show');
            const hideBtn = button.querySelector('.toggle-hide');
            
            if (full.style.display === 'none') {
                preview.style.display = 'none';
                full.style.display = 'block';
                showBtn.style.display = 'none';
                hideBtn.style.display = 'inline';
            } else {
                preview.style.display = 'block';
                full.style.display = 'none';
                showBtn.style.display = 'inline';
                hideBtn.style.display = 'none';
            }
        });
    });
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

    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            if (lang !== currentLang) {
                currentLang = lang;
                langOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                updateContent();
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
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };
        
        // Send email (using FormSubmit)
        try {
            const response = await fetch('https://formsubmit.co/terrazzagalba@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    message: data.message,
                    _subject: 'Nuova richiesta da Terrazza Galba',
                    _cc: 'martino.cicerani@gmail.com',
                    _template: 'table'
                })
            });
            
            if (response.ok) {
                alert(currentLang === 'it' ? 'Messaggio inviato con successo!' : 'Message sent successfully!');
                contactForm.reset();
            } else {
                throw new Error('Failed to send');
            }
        } catch (error) {
            alert(currentLang === 'it' ? 'Errore nell\'invio del messaggio. Riprova più tardi.' : 'Error sending message. Please try again later.');
        }
    });
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
});
