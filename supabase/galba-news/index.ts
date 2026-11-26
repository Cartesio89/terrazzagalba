// Terrazza Galba - galba-news
// GET  ?lang=it  -> news ed eventi visibili (per la Guida alla città)
// POST {password, action, ...} -> gestione dalla pagina privata amministratore.html

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ADMIN_PASSWORD = Deno.env.get("GALBA_ADMIN_PASSWORD");

const LANGS = ["it", "en", "fr", "es", "de", "no"];
const LANG_NAMES: Record<string, string> = {
  it: "Italian", en: "English", fr: "French", es: "Spanish", de: "German", no: "Norwegian",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json", ...extra } });

const db = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

type Tr = { titolo: Record<string, string>; testo: Record<string, string>; source: string };

async function translate(titolo: string, testo: string): Promise<Tr> {
  const fallback: Tr = { titolo: titolo ? { it: titolo } : {}, testo: { it: testo }, source: "it" };
  if (!ANTHROPIC_API_KEY) return fallback;
  const prompt =
    `You will receive a short news item / event announcement for a holiday-apartment website in Terracina (Italy). ` +
    `It has a TITLE (may be empty) and a TEXT. Detect the original language, then translate both into ` +
    `${LANGS.map((l) => LANG_NAMES[l]).join(", ")}.\n` +
    `Rules: keep every URL, email address, phone number, date, time and price EXACTLY as written; ` +
    `keep names of places, events and venues unchanged; keep line breaks; do not add or remove content. ` +
    `The text may use simple Markdown: keep **bold**, *italic*, "## " headings, "- " and "1. " list markers, ` +
    `[link text](url) links and all emoji exactly in place, translating only the words (inside links translate the link text, never the url). ` +
    `If the title is empty, return empty strings for the titles.\n` +
    `Respond with ONLY a raw JSON object (no markdown) shaped like ` +
    `{"source":"<ISO 639-1>", ${LANGS.map((l) => `"${l}":{"titolo":"...","testo":"..."}`).join(", ")}}. ` +
    `For the original language return title and text unchanged.\n\nTITLE:\n${titolo}\n\nTEXT:\n${testo}`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 8000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return fallback;
    const data = await r.json();
    const raw = (data?.content?.[0]?.text ?? "").replace(/```json|```/g, "").trim();
    const p = JSON.parse(raw);
    const source = LANGS.includes(p.source) ? p.source : "it";
    const out: Tr = { titolo: {}, testo: {}, source };
    for (const l of LANGS) {
      const v = p[l];
      if (v && typeof v.testo === "string" && v.testo.trim()) out.testo[l] = v.testo.trim();
      if (v && typeof v.titolo === "string" && v.titolo.trim()) out.titolo[l] = v.titolo.trim();
    }
    out.testo[source] = testo;
    if (titolo) out.titolo[source] = titolo;
    return out;
  } catch (_) {
    return fallback;
  }
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const pick = (o: Record<string, string> | null, lang: string) =>
  (o && (o[lang] || o.it || o.en || Object.values(o)[0])) || "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (req.method === "GET") {
    const u = new URL(req.url);
    const lang = LANGS.includes(u.searchParams.get("lang") ?? "") ? u.searchParams.get("lang")! : "it";
    const r = await db("galba_news?select=id,data_inizio,data_fine,titolo,testo,lingua&visibile=eq.true&order=data_inizio.desc,id.desc");
    if (!r.ok) return json({ error: "db" }, 502);
    const rows = await r.json();
    const items = rows.map((n: any) => ({
      id: n.id,
      dataInizio: n.data_inizio,
      dataFine: n.data_fine,
      titolo: pick(n.titolo, lang),
      testo: pick(n.testo, lang),
      tradotto: !!(n.lingua && n.lingua !== lang && n.testo?.[lang]),
    }));
    return json({ items }, 200, { "cache-control": "public, max-age=120" });
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  if (!ADMIN_PASSWORD) return json({ error: "not_configured" }, 503);
  if (typeof body.password !== "string" || !safeEqual(body.password, ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: "wrong_password" }, 401);
  }

  const action = body.action;
  const id = Number(body.id);
  if (action === "list") {
    const r = await db("galba_news?select=id,data_inizio,data_fine,titolo,testo,lingua,visibile&order=data_inizio.desc,id.desc");
    return json({ ok: true, rows: await r.json() });
  }
  if (action === "hide" || action === "show") {
    if (!Number.isInteger(id)) return json({ error: "bad_id" }, 400);
    const r = await db(`galba_news?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ visibile: action === "show" }) });
    return json({ ok: r.ok }, r.ok ? 200 : 502);
  }
  if (action === "delete") {
    if (!Number.isInteger(id)) return json({ error: "bad_id" }, 400);
    const r = await db(`galba_news?id=eq.${id}`, { method: "DELETE" });
    return json({ ok: r.ok }, r.ok ? 200 : 502);
  }
  if (action === "add" || action === "update") {
    const titolo = String(body.titolo ?? "").trim().slice(0, 160);
    const testo = String(body.testo ?? "").trim();
    const dataInizio = body.dataInizio;
    const dataFine = body.dataFine ? body.dataFine : null;
    if (!testo || testo.length > 5000 || !isDate(dataInizio) || (dataFine && (!isDate(dataFine) || dataFine < dataInizio))) {
      return json({ error: "invalid_fields" }, 400);
    }
    if (action === "update" && !Number.isInteger(id)) return json({ error: "bad_id" }, 400);
    const t = await translate(titolo, testo);
    const payload = JSON.stringify({ data_inizio: dataInizio, data_fine: dataFine, titolo: t.titolo, testo: t.testo, lingua: t.source });
    const r = action === "add"
      ? await db("galba_news", { method: "POST", headers: { prefer: "return=representation" }, body: payload })
      : await db(`galba_news?id=eq.${id}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: payload });
    if (!r.ok) return json({ error: "save_failed" }, 502);
    return json({ ok: true, row: (await r.json())[0], lingue: Object.keys(t.testo) });
  }
  return json({ error: "unknown_action" }, 400);
});
