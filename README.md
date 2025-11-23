# Terrazza Galba - Sito Web

Sito web per appartamento vacanze Terrazza Galba a Terracina.

## Caratteristiche

- ✅ Bilingue (Italiano/Inglese)
- ✅ Responsive (mobile-first)
- ✅ SEO ottimizzato
- ✅ Galleria fotografica
- ✅ Recensioni Airbnb
- ✅ Form contatti
- ✅ Guida casa con PIN (8008)
- ✅ Mappa Google Maps
- ✅ Link Airbnb e WhatsApp

## Struttura File

```
terrazzagalba-site/
├── index.html              # Pagina principale
├── css/
│   └── style.css          # Stili CSS
├── js/
│   └── app.js             # JavaScript
├── images/                # Foto ottimizzate
├── content/
│   └── content.json       # Contenuti bilingue (EDITABILE)
├── assets/
│   └── house-guide.pdf    # Guida casa PDF
└── netlify.toml           # Configurazione Netlify
```

## Setup GitHub + Netlify

### 1. Crea Repository GitHub

```bash
cd terrazzagalba-site
git init
git add .
git commit -m "Initial commit - Terrazza Galba website"
git branch -M main
git remote add origin https://github.com/cartesio89/terrazzagalba.git
git push -u origin main
```

### 2. Deploy su Netlify

1. Vai su https://app.netlify.com
2. Click "New site from Git"
3. Scegli "GitHub"
4. Seleziona repository `terrazzagalba`
5. Impostazioni:
   - Branch: `main`
   - Build command: (lascia vuoto)
   - Publish directory: `.`
6. Click "Deploy site"

### 3. Collega Dominio Custom

1. Nel dashboard Netlify, vai su "Domain settings"
2. Click "Add custom domain"
3. Inserisci: `holidayhouse-terrazzagalba.com`
4. Netlify ti darà i DNS records da configurare
5. Vai su Namecheap > Domain > Advanced DNS
6. Aggiungi i record DNS che Netlify ti fornisce

**IMPORTANTE:** Dovrai probabilmente aggiornare i DNS su Namecheap con quelli di Netlify invece di quelli che hai messo ora.

Netlify ti darà qualcosa tipo:
```
CNAME Record: www -> [tuo-sito].netlify.app
A Record: @ -> 75.2.60.5 (potrebbe essere diverso)
```

## Modificare Contenuti

### Testi, Recensioni, Info

Edita il file `content/content.json`. Puoi modificare:
- Descrizioni
- Recensioni
- Info utili
- Testi form
- Tutto il contenuto bilingue

Esempio per aggiungere una recensione:

```json
{
  "name": "Mario Rossi",
  "date": "Dicembre 2025",
  "text": "Esperienza fantastica! Torneremo sicuramente."
}
```

### Foto

1. Aggiungi foto nella cartella `images/`
2. Edita `js/app.js` alla riga ~8 per aggiungere alla lista:

```javascript
const photos = [
    // ... foto esistenti ...
    { filename: 'nuova-foto.jpg', alt: 'Descrizione foto' }
];
```

3. Commit e push:

```bash
git add images/nuova-foto.jpg js/app.js
git commit -m "Aggiungi nuova foto"
git push
```

Netlify rebuilderà automaticamente il sito.

### Cambiare PIN Guida Casa

Edita `js/app.js` alla riga ~6:

```javascript
const CORRECT_PIN = '8008'; // Cambia qui
```

### Contatti

Per cambiare numero WhatsApp, edita `index.html` alla riga ~220:

```html
<a href="https://wa.me/393123456789" ...>
```

Sostituisci con il tuo numero (formato internazionale senza +).

## Aggiornare Contenuti via GitHub

### Metodo 1: GitHub Web Interface

1. Vai su https://github.com/cartesio89/terrazzagalba
2. Naviga al file da modificare (es: `content/content.json`)
3. Click icona matita (Edit)
4. Modifica
5. Click "Commit changes"
6. Netlify rebuilderà automaticamente

### Metodo 2: Git Locale

```bash
git pull                     # Scarica ultime modifiche
# Modifica i file
git add .
git commit -m "Descrizione modifiche"
git push                     # Upload
```

## SEO

Il sito include:
- Meta tags ottimizzati
- Schema.org markup
- Sitemap.xml
- Robots.txt
- Immagini ottimizzate
- Link interni
- Contenuto bilingue

Per migliorare il ranking:
1. Registra il sito su Google Search Console
2. Registra su Bing Webmaster Tools
3. Aggiungi link al sito nella bio Instagram
4. Condividi sui social

## Supporto

Per problemi tecnici:
- GitHub Issues: https://github.com/cartesio89/terrazzagalba/issues
- O contattami via chat Claude

## Note Tecniche

- **Hosting:** Netlify (gratuito)
- **Dominio:** holidayhouse-terrazzagalba.com (~12€/anno)
- **Database:** Nessuno (tutto statico)
- **Build:** Nessun build step (HTML/CSS/JS puro)
- **Deploy:** Automatico ad ogni push su GitHub
