// Small helpers shared by the importer: settings, polite fetching with retries, a call budget, text cleaning.
import crypto from "node:crypto";
import fs from "node:fs";

export const UA = "JobFinderImporter/1.0 (weekly job listings for a job search site)";
export const sleep = ms => new Promise(r => setTimeout(r, ms));

// Read a .env file when running on your own computer (GitHub supplies these as secrets instead)
export function loadDotEnv(file = ".env") {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
export const env = (name, dflt = "") => (process.env[name] === undefined || process.env[name] === "" ? dflt : process.env[name]);
export const intEnv = (name, dflt) => { const n = parseInt(env(name), 10); return Number.isFinite(n) ? n : dflt; };
export const boolEnv = name => /^(1|true|yes)$/i.test(env(name));

// A cap on how many calls a source may make in one run
export class Budget {
  constructor(max) { this.max = max; this.used = 0; }
  get left() { return this.max - this.used; }
  get spent() { return this.used >= this.max; }
  take() { if (this.spent) return false; this.used++; return true; }
}
export class BudgetSpent extends Error { constructor() { super("call budget spent"); this.budgetSpent = true; } }

// At most one request every `ms` milliseconds from this limiter
export function limiter(ms) {
  let last = 0;
  return async () => { const wait = ms - (Date.now() - last); if (wait > 0) await sleep(wait); last = Date.now(); };
}

// JSON over HTTP: waits and tries again (up to 3 times) on 429 and 5xx. Every attempt counts against the budget.
export async function fetchJSON(url, { method = "GET", headers = {}, body, budget, wait, tries = 3, fetchImpl = fetch } = {}) {
  let last;
  for (let t = 1; t <= tries; t++) {
    if (budget && !budget.take()) throw new BudgetSpent();
    if (wait) await wait();
    try {
      const res = await fetchImpl(url, { method, headers: { "User-Agent": UA, Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
      if (res.status === 429 || res.status >= 500) { last = Object.assign(new Error(`HTTP ${res.status} from ${new URL(url).host}`), { status: res.status }); if (t < tries) await sleep(1000 * 2 ** t); continue; }
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} from ${new URL(url).host}`), { status: res.status, fatal: true });
      return await res.json();
    } catch (e) {
      if (e.fatal || e.budgetSpent) throw e;
      last = e;
      if (t < tries) await sleep(1000 * 2 ** t);
    }
  }
  throw last;
}

/* --- Text --- */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", bull: "•" };
export const decodeEntities = s => String(s ?? "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
});
// Descriptions are saved as safe HTML: scripts, styles, frames, event handlers and javascript: links are removed,
// and only simple formatting tags are kept.
const KEEP = new Set(["p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "u", "h1", "h2", "h3", "h4", "h5", "h6", "div", "span", "a", "blockquote", "table", "thead", "tbody", "tr", "td", "th"]);
export function sanitizeHtml(html) {
  let s = String(html ?? "");
  if (/^\s*&lt;/.test(s) || (!/</.test(s) && /&lt;\w+/.test(s))) s = decodeEntities(s);   // Greenhouse sends its HTML escaped
  s = s.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|iframe|object|embed|noscript|template|svg|math|form)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|noscript|template|svg|math|form|link|meta|base|input|button|textarea|select)\b[^>]*>/gi, "");
  s = s.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (m, tag, attrs) => {
    tag = tag.toLowerCase();
    if (!KEEP.has(tag)) return "";
    if (m.startsWith("</")) return `</${tag}>`;
    if (tag === "a") {
      const h = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i), url = h ? decodeEntities(h[1] ?? h[2] ?? h[3]).trim() : "";
      return /^https?:\/\//i.test(url) ? `<a href="${url.replace(/"/g, "&quot;")}" rel="nofollow noopener noreferrer" target="_blank">` : "<a>";
    }
    return tag === "br" ? "<br>" : `<${tag}>`;
  });
  return s.replace(/<(p|div|span|li)>\s*<\/\1>/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 30000);
}
export const htmlToText = html => decodeEntities(sanitizeHtml(html).replace(/<(br|\/p|\/div|\/li|\/h\d)\s*>/gi, "\n").replace(/<[^>]+>/g, " ")).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();

/* --- Duplicates: the same job from different sources gets the same key --- */
const COMPANY_NOISE = /\b(pty\.?|ltd\.?|limited|australia|australian|australasia|inc\.?|incorporated|group|holdings|co\.?|corporation|corp\.?|the)\b/g;
export const normText = s => String(s ?? "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
export const normCompany = s => normText(s).replace(COMPANY_NOISE, " ").replace(/\s+/g, " ").trim();
export function dedupeKey({ title, company, city }) {
  const t = normText(title).replace(/\b(m\s*f\s*d|m\/f\/d)\b/g, "").replace(/\s+/g, " ").trim();
  return crypto.createHash("sha1").update([t, normCompany(company), normText(city)].join("|")).digest("hex");
}
export const sha1 = s => crypto.createHash("sha1").update(String(s)).digest("hex");

export const toISO = v => {
  if (v == null || v === "") return null;
  const d = typeof v === "number" ? new Date(v < 1e12 ? v * 1000 : v) : new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(String(v)) ? v : String(v).includes("T") ? v + "Z" : v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
export const num = v => { const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^0-9.]/g, "")); return Number.isFinite(n) && n > 0 ? n : null; };
