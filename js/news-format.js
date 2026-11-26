// Formattazione del testo delle news (usata dalla pagina Eventi e dall'anteprima in amministratore).
// Sintassi semplice, sicura e facile da tradurre:
//   **grassetto**   *corsivo*   ## Titoletto   - elenco puntato   1. elenco numerato
//   [testo del link](https://...)   oppure un indirizzo https://... scritto per esteso
// Il testo viene sempre "ripulito" prima (escape HTML): nessun codice può essere inserito.
(function (global) {
    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function inline(raw) {
        const links = [];
        // [testo](url) -> segnaposto, così l'url non viene trasformato due volte
        let s = esc(raw).replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|www\.[^\s)]+)\)/g, (m, text, url) => {
            const href = url.startsWith('http') ? url : 'https://' + url;
            links.push(`<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`);
            return '\u0000' + (links.length - 1) + '\u0000';
        });
        // indirizzi scritti per esteso
        s = s.replace(/(https?:\/\/[^\s<\u0000]+|www\.[^\s<\u0000]+)/g, m => {
            let url = m, tail = '';
            while (/[.,;:!?)\]]$/.test(url)) { tail = url.slice(-1) + tail; url = url.slice(0, -1); }
            const href = url.startsWith('http') ? url : 'https://' + url;
            links.push(`<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`);
            return '\u0000' + (links.length - 1) + '\u0000' + tail;
        });
        s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
             .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
             .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
        return s.replace(/\u0000(\d+)\u0000/g, (m, i) => links[+i]);
    }

    function toHtml(text) {
        const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
        const out = [];
        let para = [], list = null;
        const flushPara = () => { if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; } };
        const flushList = () => { if (list) { out.push(`<${list.type}>` + list.items.map(i => '<li>' + inline(i) + '</li>').join('') + `</${list.type}>`); list = null; } };
        for (const line of lines) {
            const t = line.trim();
            let m;
            if (!t) { flushPara(); flushList(); continue; }
            if ((m = t.match(/^#{1,3}\s+(.*)$/))) { flushPara(); flushList(); out.push('<h4>' + inline(m[1]) + '</h4>'); continue; }
            if ((m = t.match(/^[-•*]\s+(.*)$/))) {
                flushPara();
                if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
                list.items.push(m[1]); continue;
            }
            if ((m = t.match(/^\d+[.)]\s+(.*)$/))) {
                flushPara();
                if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
                list.items.push(m[1]); continue;
            }
            flushList();
            para.push(t);
        }
        flushPara(); flushList();
        return out.join('');
    }

    // testo semplice per l'anteprima (senza simboli di formattazione)
    function toPlain(text) {
        return String(text || '')
            .replace(/\[([^\]\n]+)\]\([^)]+\)/g, '$1')
            .replace(/\*\*([^*\n]+)\*\*/g, '$1')
            .replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1$2')
            .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1$2')
            .replace(/^\s*#{1,3}\s+/gm, '')
            .replace(/^\s*([-•*]|\d+[.)])\s+/gm, '• ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    global.NewsFormat = { toHtml, toPlain };
})(window);
