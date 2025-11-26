// Script per gestire la pagina Guida alla città
// con DEBUG per trovare il problema

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DEBUG: Script guida-citta.js caricato');
    
    // Elementi DOM
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const storiaContainer = document.getElementById('storia-articles');
    const notizieContainer = document.getElementById('notizie-articles');
    const langSwitch = document.querySelector('.lang-switch');

    console.log('🔍 DEBUG: Tab buttons trovati:', tabButtons.length);
    console.log('🔍 DEBUG: Tab contents trovati:', tabContents.length);
    console.log('🔍 DEBUG: Container storia:', storiaContainer ? 'OK' : 'MISSING');
    console.log('🔍 DEBUG: Container notizie:', notizieContainer ? 'OK' : 'MISSING');

    // Lingua corrente (di default italiano)
    let currentLang = localStorage.getItem('language') || 'it';
    console.log('🔍 DEBUG: Lingua corrente:', currentLang);

    // Carica contenuti
    loadContent(currentLang);

    // Gestione tab
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            console.log('🔍 DEBUG: Click su tab:', tabId);
            
            // Rimuovi active da tutti
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Aggiungi active al tab selezionato
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Switch lingua
    if (langSwitch) {
        langSwitch.addEventListener('click', function() {
            currentLang = currentLang === 'it' ? 'en' : 'it';
            console.log('🔍 DEBUG: Cambio lingua a:', currentLang);
            localStorage.setItem('language', currentLang);
            loadContent(currentLang);
            updateLangButton(currentLang);
        });
        updateLangButton(currentLang);
    }

    // Funzione per caricare i contenuti
    function loadContent(lang) {
        console.log('🔍 DEBUG: Inizio caricamento contenuti per lingua:', lang);
        
        // Prova diversi percorsi per il content.json
        const possiblePaths = [
            './content/content.json',
            '../content/content.json',
            '/content/content.json',
            'content/content.json'
        ];

        tryLoadContent(possiblePaths, 0, lang);
    }

    function tryLoadContent(paths, index, lang) {
        if (index >= paths.length) {
            console.error('❌ DEBUG: Nessun percorso valido trovato per content.json');
            showError('Impossibile caricare i contenuti. Percorsi provati: ' + paths.join(', '));
            return;
        }

        const path = paths[index];
        console.log('🔍 DEBUG: Provo a caricare da:', path);

        fetch(path)
            .then(response => {
                console.log('🔍 DEBUG: Risposta fetch da', path, '- Status:', response.status);
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('🔍 DEBUG: Content.json caricato con successo da:', path);
                console.log('🔍 DEBUG: Dati completi:', data);
                
                const content = data[lang];
                if (!content) {
                    console.error('❌ DEBUG: Lingua non trovata nei dati:', lang);
                    console.log('🔍 DEBUG: Lingue disponibili:', Object.keys(data));
                    return;
                }

                console.log('🔍 DEBUG: Contenuto cityguide:', content.cityguide);

                // Carica articoli Storia
                if (content.cityguide && content.cityguide.storia) {
                    console.log('🔍 DEBUG: Articoli Storia:', content.cityguide.storia.articles);
                    loadArticles(storiaContainer, content.cityguide.storia.articles, 'storia');
                } else {
                    console.warn('⚠️ DEBUG: Sezione storia non trovata');
                }

                // Carica articoli Notizie
                if (content.cityguide && content.cityguide.notizie) {
                    console.log('🔍 DEBUG: Articoli Notizie:', content.cityguide.notizie.articles);
                    loadArticles(notizieContainer, content.cityguide.notizie.articles, 'notizie');
                } else {
                    console.warn('⚠️ DEBUG: Sezione notizie non trovata');
                }

                // Aggiorna titolo e subtitle
                updatePageContent(content);
            })
            .catch(error => {
                console.warn('⚠️ DEBUG: Errore caricamento da', path, ':', error.message);
                // Prova il percorso successivo
                tryLoadContent(paths, index + 1, lang);
            });
    }

    function loadArticles(container, articles, type) {
        if (!container) {
            console.error('❌ DEBUG: Container non trovato per tipo:', type);
            return;
        }

        console.log('🔍 DEBUG: Caricamento articoli per', type, '- Count:', articles ? articles.length : 0);

        if (!articles || articles.length === 0) {
            container.innerHTML = '<p class="no-articles">Contenuti in arrivo...</p>';
            console.log('✅ DEBUG: Mostrato messaggio "Contenuti in arrivo" per', type);
            return;
        }

        // Ordina per data se è sezione notizie
        if (type === 'notizie') {
            articles.sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log('🔍 DEBUG: Articoli notizie ordinati per data');
        }

        let html = '';
        articles.forEach((article, index) => {
            const dateStr = article.date ? `<span class="article-date">${formatDate(article.date)}</span>` : '';
            html += `
                <div class="article-item">
                    <div class="article-header" data-index="${index}">
                        <h3>${article.title}</h3>
                        ${dateStr}
                        <span class="article-toggle">▼</span>
                    </div>
                    <div class="article-content">
                        <div class="article-preview">${article.preview}</div>
                        <div class="article-full">${article.content}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log('✅ DEBUG: HTML articoli generato per', type);

        // Aggiungi event listener per accordion
        const headers = container.querySelectorAll('.article-header');
        console.log('🔍 DEBUG: Header trovati per accordion:', headers.length);
        
        headers.forEach(header => {
            header.addEventListener('click', function() {
                const item = this.parentElement;
                const toggle = this.querySelector('.article-toggle');
                
                console.log('🔍 DEBUG: Click su articolo');
                
                if (item.classList.contains('expanded')) {
                    item.classList.remove('expanded');
                    toggle.textContent = '▼';
                } else {
                    // Chiudi tutti gli altri
                    container.querySelectorAll('.article-item').forEach(i => {
                        i.classList.remove('expanded');
                        i.querySelector('.article-toggle').textContent = '▼';
                    });
                    item.classList.add('expanded');
                    toggle.textContent = '▲';
                }
            });
        });
    }

    function updatePageContent(content) {
        console.log('🔍 DEBUG: Aggiornamento contenuto pagina');
        
        // Aggiorna titolo hero se presente
        const heroTitle = document.querySelector('.hero h1');
        if (heroTitle && content.cityguide && content.cityguide.title) {
            heroTitle.textContent = content.cityguide.title;
        }

        // Aggiorna subtitle se presente
        const heroSubtitle = document.querySelector('.hero .subtitle');
        if (heroSubtitle && content.cityguide && content.cityguide.subtitle) {
            heroSubtitle.textContent = content.cityguide.subtitle;
        }

        // Aggiorna testi dei tab
        const storiaTab = document.querySelector('[data-tab="storia"]');
        if (storiaTab && content.cityguide && content.cityguide.storia) {
            storiaTab.textContent = content.cityguide.storia.title || 'Storia';
        }

        const notizieTab = document.querySelector('[data-tab="notizie"]');
        if (notizieTab && content.cityguide && content.cityguide.notizie) {
            notizieTab.textContent = content.cityguide.notizie.title || 'Notizie';
        }
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(currentLang === 'it' ? 'it-IT' : 'en-US', options);
    }

    function updateLangButton(lang) {
        if (langSwitch) {
            langSwitch.textContent = lang === 'it' ? 'IT | EN' : 'EN | IT';
        }
    }

    function showError(message) {
        console.error('❌ DEBUG: Errore:', message);
        if (storiaContainer) {
            storiaContainer.innerHTML = `<p class="error-message">⚠️ ${message}</p>`;
        }
        if (notizieContainer) {
            notizieContainer.innerHTML = `<p class="error-message">⚠️ ${message}</p>`;
        }
    }
});
