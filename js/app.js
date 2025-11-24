// Language management
let currentLang = 'it';
let content = {};

// Load content
async function loadContent() {
    try {
        const response = await fetch('content/content.json');
        content = await response.json();
        updateContent();
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
            element.textContent = value;
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
}

// Update reviews
function updateReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    if (!reviewsGrid || !content[currentLang].reviews) return;
    
    reviewsGrid.innerHTML = '';
    content[currentLang].reviews.items.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
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
            <p class="review-text">${review.text}</p>
        `;
        reviewsGrid.appendChild(reviewCard);
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

// Gallery accordion toggle (mobile only)
const galleryToggle = document.getElementById('galleryToggle');
const galleryGrid = document.getElementById('galleryGrid');

if (galleryToggle && galleryGrid) {
    galleryToggle.addEventListener('click', () => {
        galleryGrid.classList.toggle('expanded');
        galleryToggle.classList.toggle('active');
    });
}

// Navigation
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
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

// Smooth scroll with special handling for hidden sections
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        
        if (target) {
            // Show hidden sections when navigating to them
            if (target.classList.contains('section-hidden')) {
                // Remove hidden state temporarily
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

// Language switcher
const langSwitch = document.getElementById('langSwitch');
const langOptions = document.querySelectorAll('.lang-option');

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

// Tabs management for City Guide
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and panels
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        // Add active class to clicked button and corresponding panel
        button.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
});

// Contact form
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };
    
    // Send email (using FormSubmit or similar service)
    try {
        const response = await fetch('https://formsubmit.co/appartamentoterrazzagalba@gmail.com', {
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

// House guide PIN
const guideForm = document.getElementById('guideForm');
const guideSuccess = document.getElementById('guideSuccess');
const correctPin = '8008';

guideForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = document.getElementById('guidePin').value;
    
    if (pin === correctPin) {
        guideForm.style.display = 'none';
        guideSuccess.style.display = 'block';
    } else {
        alert(currentLang === 'it' ? 'PIN errato. Riprova.' : 'Incorrect PIN. Try again.');
        document.getElementById('guidePin').value = '';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadContent();
    createGallery();
});
