// Terrazza Galba - galba-reviews
// GET  ?lang=it  -> recensioni per il sito: quelle inserite a mano (tabella galba_recensioni)
//                   + quelle Google lette in tempo reale (non vengono salvate: lo vietano i termini Google).
// POST {password, action, ...} -> gestione dalla pagina privata admin-recensioni.html

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
const ADMIN_PASSWORD = Deno.env.get("GALBA_ADMIN_PASSWORD");
const PLACE_ID = "ChIJEeJHlAUjJRMR66JT9enucNs"; // Appartamento Terrazza Galba su Google Maps

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
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json", ...extra },
  });

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

// ---------- Google (in tempo reale, cache solo in memoria per poche ore) ----------
type GoogleBlock = { rating: number; count: number; url: string; reviews: unknown[] } | null;
const gCache = new Map<string, { at: number; data: GoogleBlock }>();
const G_TTL = 6 * 60 * 60 * 1000;

async function googleReviews(lang: string): Promise<GoogleBlock> {
  if (!GOOGLE_KEY) return null;
  const hit = gCache.get(lang);
  if (hit && Date.now() - hit.at < G_TTL) return hit.data;
  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=${lang}`, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
    });
    if (!r.ok) {
      console.error("google", r.status, await r.text());
      return hit?.data ?? null;
    }
    const p = await r.json();
    const data: GoogleBlock = {
      rating: p.rating ?? 0,
      count: p.userRatingCount ?? 0,
      url: p.googleMapsUri ?? "",
      reviews: (p.reviews ?? []).map((v: any) => ({
        fonte: "google",
        autore: v.authorAttribution?.displayName ?? "Google",
        autoreUrl: v.authorAttribution?.uri ?? null,
        voto: v.rating ?? 5,
        data: (v.publishTime ?? "").slice(0, 10),
        testo: v.text?.text ?? v.originalText?.text ?? "",
        tradotto: !!(v.text && v.originalText && v.text.languageCode !== v.originalText.languageCode),
        linkGoogle: v.googleMapsUri ?? p.googleMapsUri ?? null,
      })).filter((v: any) => v.testo),
    };
    gCache.set(lang, { at: Date.now(), data });
    return data;
  } catch (e) {
    console.error("google err", String(e));
    return hit?.data ?? null;
  }
}

// ---------- Traduzione con Claude Haiku (per le recensioni inserite a mano) ----------
async function translateAll(text: string): Promise<{ t: Record<string, string>; source: string }> {
  if (!ANTHROPIC_API_KEY) return { t: { it: text }, source: "it" };
  const prompt =
    `You will receive a guest review of a holiday apartment. Detect its language, then translate it into ` +
    `${LANGS.map((l) => LANG_NAMES[l]).join(", ")}. Respond with ONLY a raw JSON object (no markdown) with keys ` +
    `"source" (ISO 639-1 code of the original language) and ${LANGS.map((l) => `"${l}"`).join(", ")}. ` +
    `For the original language return the text unchanged. Keep names and place names unchanged. ` +
    `Do not add or remove content.\n\nReview:\n${text}`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) return { t: { it: text }, source: "it" };
    const data = await r.json();
    const raw = (data?.content?.[0]?.text ?? "").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);
    const out: Record<string, string> = {};
    for (const l of LANGS) if (typeof parsed[l] === "string" && parsed[l].trim()) out[l] = parsed[l].trim();
    const source = LANGS.includes(parsed.source) ? parsed.source : "it";
    out[source] = text;
    return { t: out, source };
  } catch (_) {
    return { t: { it: text }, source: "it" };
  }
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // ---------- Lettura pubblica ----------
  if (req.method === "GET") {
    const u = new URL(req.url);
    const lang = LANGS.includes(u.searchParams.get("lang") ?? "") ? u.searchParams.get("lang")! : "it";
    const [rows, google] = await Promise.all([
      db("galba_recensioni?select=id,fonte,autore,voto,data_recensione,testo,lingua&visibile=eq.true&order=data_recensione.desc,id.desc")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      googleReviews(lang),
    ]);
    const manual = (rows as any[]).map((r) => ({
      fonte: r.fonte,
      autore: r.autore,
      voto: r.voto,
      data: r.data_recensione,
      testo: r.testo?.[lang] || r.testo?.it || r.testo?.en || Object.values(r.testo ?? {})[0] || "",
      tradotto: !!(r.lingua && r.lingua !== lang && r.testo?.[lang]),
    }));
    return json(
      { manual, google },
      200,
      { "cache-control": "public, max-age=300" },
    );
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // ---------- Gestione (pagina privata) ----------
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  if (!ADMIN_PASSWORD) return json({ error: "not_configured" }, 503);
  if (typeof body.password !== "string" || !safeEqual(body.password, ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: "wrong_password" }, 401);
  }

  const action = body.action;
  if (action === "list") {
    const r = await db("galba_recensioni?select=id,fonte,autore,voto,data_recensione,testo,lingua,visibile&order=data_recensione.desc,id.desc");
    return json({ ok: true, rows: await r.json() });
  }
  if (action === "hide" || action === "show") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return json({ error: "bad_id" }, 400);
    const r = await db(`galba_recensioni?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ visibile: action === "show" }),
    });
    return json({ ok: r.ok }, r.ok ? 200 : 502);
  }
  if (action === "delete") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return json({ error: "bad_id" }, 400);
    const r = await db(`galba_recensioni?id=eq.${id}`, { method: "DELETE" });
    return json({ ok: r.ok }, r.ok ? 200 : 502);
  }
  if (action === "add") {
    const fonte = ["airbnb", "google", "altro"].includes(body.fonte) ? body.fonte : "airbnb";
    const autore = String(body.autore ?? "").trim().slice(0, 60);
    const voto = Math.min(5, Math.max(1, parseInt(body.voto ?? "5", 10) || 5));
    const mese = String(body.mese ?? "");
    const testo = String(body.testo ?? "").trim();
    if (!autore || !testo || testo.length > 3000 || !/^\d{4}-\d{2}$/.test(mese)) {
      return json({ error: "invalid_fields" }, 400);
    }
    const { t, source } = await translateAll(testo);
    const r = await db("galba_recensioni", {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({ fonte, autore, voto, data_recensione: `${mese}-01`, testo: t, lingua: source }),
    });
    if (!r.ok) return json({ error: "insert_failed" }, 502);
    return json({ ok: true, row: (await r.json())[0], lingue: Object.keys(t) });
  }
  return json({ error: "unknown_action" }, 400);
});
