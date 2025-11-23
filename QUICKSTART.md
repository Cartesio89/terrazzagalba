# ⚡ QUICK START - Terrazza Galba

## 🚀 Deploy Veloce (5 minuti)

### 1. GitHub
```bash
cd terrazzagalba-site
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/terrazzagalba.git
git push -u origin main
```

### 2. Netlify
1. https://app.netlify.com → "New site from Git"
2. Scegli GitHub → Seleziona repo `terrazzagalba`
3. Deploy! ✅

### 3. Dominio Custom
1. Netlify → "Add custom domain" → `holidayhouse-terrazzagalba.com`
2. Namecheap → Advanced DNS → Aggiungi record A e CNAME che Netlify ti dà
3. Attendi 2-4 ore per propagazione DNS

---

## ✏️ Modifiche Rapide

### Cambiare Testi
Edita `content/content.json`

### Aggiungere Foto
1. Aggiungi in `images/`
2. Edita `js/app.js` riga ~8

### Cambiare PIN Guida
Edita `js/app.js` riga ~6: `const CORRECT_PIN = '8008';`

### Aggiungere Recensione
In `content/content.json` → `reviews.items`:
```json
{
  "name": "Nome",
  "date": "Mese Anno",
  "text": "Testo recensione..."
}
```

---

## 📦 Contenuto Progetto

```
terrazzagalba-site/
├── index.html           # Pagina principale
├── css/style.css        # Stili
├── js/app.js            # JavaScript
├── content/
│   └── content.json     # 📝 EDITABILE - Tutti i testi IT/EN
├── images/              # 9 foto ottimizzate
├── assets/
│   └── house-guide.pdf  # Guida casa
├── README.md            # Documentazione completa
├── DEPLOY.md            # Guida deploy dettagliata
└── netlify.toml         # Config Netlify
```

---

## 🔑 Info Tecniche

- **PIN Guida Casa:** 8008
- **Link Airbnb:** https://www.airbnb.it/rooms/1182032865433607383
- **WhatsApp:** +39 312 345 6789 (AGGIORNA in index.html riga ~220)
- **Codice identificativo:** IT059032C293SBVPQB

---

## 🌐 Dopo il Deploy

✅ Sito funzionante
✅ HTTPS automatico (dopo DNS propagation)
✅ Deploy automatico ad ogni push GitHub
✅ Bilingue IT/EN con switch
✅ Mobile responsive
✅ SEO ottimizzato

**Prossimi Passi:**
1. Google Search Console
2. Google Analytics (opzionale)
3. Condividi link sui social

---

## 📞 Supporto

- README completo: `README.md`
- Guida deploy: `DEPLOY.md`
- GitHub Issues: https://github.com/TUO_USERNAME/terrazzagalba/issues
