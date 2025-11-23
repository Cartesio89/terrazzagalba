# GUIDA DEPLOY: GitHub + Netlify

## STEP 1: Creare Account (se non li hai già)

### GitHub
1. Vai su https://github.com/signup
2. Username: `cartesio89` (o quello che preferisci)
3. Email: la tua email
4. Password: scegli password sicura
5. Verifica email

### Netlify
1. Vai su https://app.netlify.com/signup
2. Click "Sign up with GitHub" (usa lo stesso account)
3. Autorizza Netlify ad accedere a GitHub

---

## STEP 2: Installare Git sul Computer

### Windows
1. Scarica Git: https://git-scm.com/download/win
2. Installa (lascia tutte le opzioni di default)
3. Apri "Git Bash" dal menu Start

### Mac
1. Apri Terminal
2. Digita: `git --version`
3. Se non installato, ti chiederà di installare Command Line Tools
4. Oppure scarica da: https://git-scm.com/download/mac

### Linux
```bash
sudo apt install git
```

---

## STEP 3: Upload Progetto su GitHub

### A) Crea Repository su GitHub

1. Login su https://github.com
2. Click "+" in alto a destra → "New repository"
3. Nome repository: `terrazzagalba`
4. Descrizione: "Sito web Terrazza Galba - Appartamento vacanze Terracina"
5. Seleziona: **Public**
6. NON aggiungere README, .gitignore, o license
7. Click "Create repository"

### B) Upload Files

**Su Windows (Git Bash) o Mac/Linux (Terminal):**

```bash
# Naviga alla cartella del progetto
cd /path/to/terrazzagalba-site

# Inizializza Git
git init

# Aggiungi tutti i file
git add .

# Crea primo commit
git commit -m "Initial commit - Terrazza Galba website"

# Collega a GitHub (SOSTITUISCI 'cartesio89' con il TUO username)
git remote add origin https://github.com/cartesio89/terrazzagalba.git

# Rinomina branch in 'main'
git branch -M main

# Upload su GitHub
git push -u origin main
```

**Ti chiederà username e password GitHub.**

**IMPORTANTE:** Se Git ti chiede username/password, usa:
- Username: il tuo username GitHub
- Password: **NON la password**, ma un "Personal Access Token"

#### Come creare Personal Access Token:
1. GitHub → Settings (icona profilo) → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token (classic)
4. Note: "Netlify deploy"
5. Seleziona: `repo` (tutte le voci sotto repo)
6. Generate token
7. **COPIA IL TOKEN** (lo vedrai solo una volta!)
8. Usa questo token come password quando fai `git push`

---

## STEP 4: Deploy su Netlify

### A) Collega Repository

1. Login su https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Click "GitHub"
4. Cerca e seleziona: `terrazzagalba`
5. Impostazioni deploy:
   - **Branch to deploy:** `main`
   - **Build command:** (lascia vuoto)
   - **Publish directory:** `.` (punto)
6. Click "Deploy site"

Netlify inizierà il deploy. Dopo 1-2 minuti il sito sarà online!

### B) Ottieni URL

Netlify ti darà un URL tipo:
```
https://sparkly-unicorn-abc123.netlify.app
```

Prova ad aprirlo! Il sito dovrebbe funzionare.

---

## STEP 5: Collegare Dominio Custom

### A) Su Netlify

1. Nel dashboard del sito, click "Domain settings"
2. Click "Add custom domain"
3. Inserisci: `holidayhouse-terrazzagalba.com`
4. Click "Verify" → "Add domain"
5. Netlify ti mostrerà i **DNS records** da configurare

**Esempio di DNS che Netlify ti darà:**
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: sparkly-unicorn-abc123.netlify.app
```

### B) Su Namecheap

1. Login su https://namecheap.com
2. Dashboard → Manage → Advanced DNS
3. **CANCELLA TUTTI I RECORD ESISTENTI** (importante!)
4. Aggiungi i record che Netlify ti ha dato:

**Record A:**
- Type: `A Record`
- Host: `@`
- Value: `75.2.60.5` (l'IP che Netlify ti dà)
- TTL: `Automatic`

**Record CNAME:**
- Type: `CNAME Record`
- Host: `www`
- Value: `sparkly-unicorn-abc123.netlify.app` (il tuo URL Netlify)
- TTL: `Automatic`

5. Click "Save all changes"

### C) Attiva HTTPS (automatico)

Netlify configurerà HTTPS automaticamente dopo che i DNS si propagano (1-48 ore, di solito 2-4 ore).

Puoi controllare lo stato in Netlify → Domain settings → HTTPS.

---

## STEP 6: Modificare Contenuti in Futuro

### Via GitHub Web (più facile)

1. Vai su https://github.com/cartesio89/terrazzagalba
2. Naviga al file da modificare (es: `content/content.json`)
3. Click icona matita (✏️ Edit)
4. Modifica il contenuto
5. Scrolla giù → "Commit changes"
6. Descrivi la modifica
7. Click "Commit changes"

**Netlify rebuilderà il sito automaticamente in 1-2 minuti!**

### Via Git Locale (avanzato)

```bash
cd /path/to/terrazzagalba-site

# Scarica ultime modifiche
git pull

# Modifica i file che vuoi
# (usa un editor di testo)

# Aggiungi modifiche
git add .

# Commit
git commit -m "Aggiungi nuova foto"

# Upload
git push
```

---

## Checklist Finale

- [ ] Repository GitHub creato
- [ ] Files uploadati su GitHub
- [ ] Sito deployato su Netlify
- [ ] URL Netlify funzionante
- [ ] DNS configurati su Namecheap
- [ ] Dominio custom collegato
- [ ] HTTPS attivo
- [ ] Modifiche di test funzionanti

---

## Problemi Comuni

### "Permission denied" quando fai push

**Soluzione:** Usa Personal Access Token invece della password.

### "Repository not found"

**Soluzione:** Controlla l'URL del remote:
```bash
git remote -v
```
Se sbagliato:
```bash
git remote set-url origin https://github.com/TUO_USERNAME/terrazzagalba.git
```

### DNS non si aggiornano

**Soluzione:** I DNS impiegano tempo. Controlla dopo 4-6 ore. Puoi testare con:
```bash
nslookup holidayhouse-terrazzagalba.com
```

### Sito non si aggiorna dopo push

**Soluzione:**
1. Controlla su GitHub che i file siano aggiornati
2. Su Netlify → Deploys → controlla lo stato
3. Se serve, click "Trigger deploy" → "Clear cache and deploy site"

---

## Contatti Supporto

- **GitHub Docs:** https://docs.github.com
- **Netlify Docs:** https://docs.netlify.com
- **Namecheap Support:** https://www.namecheap.com/support/

**Per problemi tecnici con questo progetto:**
- Apri un Issue su GitHub: https://github.com/cartesio89/terrazzagalba/issues
- Oppure contattami via chat Claude
