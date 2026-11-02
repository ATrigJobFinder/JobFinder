// Working out which hiring system a company uses, from its careers page (reliable) or from its name (a light fallback).
import { normText, normCompany } from "./util.mjs";
import { ATS } from "./mappers.mjs";

const bad = (...x) => new Set(x);
// How each hiring system shows up in a careers page: its address, or its embed. token() pulls the board name out of the match.
export const SYSTEMS = [
  // --- feeds we can read ---
  { ats: "greenhouse", re: /(?:boards|job-boards)(?:\.eu)?\.greenhouse\.io\/(?:embed\/job_board(?:\/js)?\?for=)?([A-Za-z0-9_-]+)/g, skip: bad("embed", "jobs", "v1", "js") },
  { ats: "lever_eu", re: /jobs\.eu\.lever\.co\/([A-Za-z0-9_.-]+)/g, skip: bad() },
  { ats: "lever", re: /jobs\.lever\.co\/([A-Za-z0-9_.-]+)/g, skip: bad() },
  { ats: "ashby", re: /jobs\.ashbyhq\.com\/([A-Za-z0-9_.%-]+)/g, skip: bad("api") },
  { ats: "workable", re: /apply\.workable\.com\/([A-Za-z0-9_-]+)/g, skip: bad("j", "api", "www") },
  { ats: "smartrecruiters", re: /(?:jobs|careers)\.smartrecruiters\.com\/(?:oneclick-ui\/company\/)?([A-Za-z0-9_-]+)/g, skip: bad("oneclick-ui", "company", "api") },
  { ats: "recruitee", re: /([a-z0-9-]+)\.recruitee\.com/g, skip: bad("www", "api", "careers", "app") },
  { ats: "personio", re: /([a-z0-9-]+)\.jobs\.personio\.(?:de|com)/g, skip: bad("www", "api") },
  { ats: "teamtailor", re: /([a-z0-9-]+)\.teamtailor\.com/g, skip: bad("www", "app", "api", "career", "support", "docs", "partner", "scripts", "assets", "cdn") },
  // --- seen, but with no official public feed: saved as paused for you to decide on ---
  { ats: "workday", re: /([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com/g, skip: bad("www"), unsupported: true },
  { ats: "pageup", re: /([a-z0-9-]+)\.pageuppeople\.com|pageuppeople\.com\/(\d+)/g, skip: bad("www", "secure", "careers"), unsupported: true },
  { ats: "successfactors", re: /career\d*\.successfactors\.(?:com|eu)\/(?:career|careers)\?company=([A-Za-z0-9_-]+)/g, skip: bad(), unsupported: true },
  { ats: "taleo", re: /([a-z0-9-]+)\.taleo\.net/g, skip: bad("www"), unsupported: true },
  { ats: "oracle", re: /([a-z0-9-]+)\.fa\.[a-z0-9]+\.oraclecloud\.com/g, skip: bad(), unsupported: true },
  { ats: "icims", re: /([a-z0-9-]+)\.icims\.com/g, skip: bad("www", "careers"), unsupported: true },
  { ats: "jobadder", re: /apply\.jobadder\.com\/(\d+)/g, skip: bad(), unsupported: true },
  { ats: "bamboohr", re: /([a-z0-9-]+)\.bamboohr\.com/g, skip: bad("www", "api"), unsupported: true },
  { ats: "breezy", re: /([a-z0-9-]+)\.breezy\.hr/g, skip: bad("www", "api", "app"), unsupported: true }
];
export const isSupported = ats => !!ATS[ats];

// Every hiring system address found in some page text: [{ ats, token, count, supported }], supported ones and the most mentioned first
export function detectInText(text) {
  const t = String(text || ""), found = new Map();
  for (const s of SYSTEMS) {
    s.re.lastIndex = 0;
    for (let m; (m = s.re.exec(t)); ) {
      const tok = (m[1] || m[2] || "").replace(/[.]+$/, "");
      if (!tok || s.skip.has(tok.toLowerCase())) continue;
      const k = s.ats + "/" + (s.ats === "greenhouse" || s.ats === "recruitee" || s.ats === "personio" || s.ats === "teamtailor" || s.ats === "lever" || s.ats === "lever_eu" ? tok.toLowerCase() : tok);
      const e = found.get(k) || { ats: s.ats, token: k.slice(k.indexOf("/") + 1), count: 0, supported: !s.unsupported };
      e.count++; found.set(k, e);
    }
  }
  // "jobs.lever.co" matches both lever patterns' hosts only once: drop a plain lever hit that is really an eu one
  const out = [...found.values()];
  return out.filter(e => !(e.ats === "lever" && out.some(o => o.ats === "lever_eu" && o.token === e.token))).sort((a, b) => (b.supported - a.supported) || (b.count - a.count));
}

// Links on a page that probably lead to its careers section
export function careersLinks(html, base) {
  const out = new Set();
  for (const m of String(html || "").matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi)) {
    const href = m[1].trim(), label = m[2].replace(/<[^>]+>/g, " ");
    if (!/career|\bjobs?\b|join[- ]us|work[- ]with[- ]us|work[- ]at|vacanc|opportunit|we.re hiring/i.test(href + " " + label)) continue;
    if (/^(mailto|tel|javascript):/i.test(href)) continue;
    try { const u = new URL(href, base); if (/^https?:$/.test(u.protocol)) out.add(u.href.replace(/#.*$/, "")); } catch { /* not a link */ }
  }
  return [...out];
}
const sameCompany = (u, website) => { try { const a = new URL(u).hostname.replace(/^www\./, ""), b = new URL(website).hostname.replace(/^www\./, ""); const root = h => h.split(".").slice(-3).join("."); return a === b || a.endsWith("." + b) || b.endsWith("." + a) || root(a).split(".")[0] === root(b).split(".")[0]; } catch { return false; } };

// Find the boards on a company's own website. web is makeWeb() from http.mjs (it obeys robots.txt and is polite).
export async function findBoards(c, web, { maxPages = 6 } = {}) {
  const tried = [];
  const seen = new Set();
  const found = new Map();
  const take = (text, via) => { for (const d of detectInText(text)) { const k = d.ats + "/" + d.token; if (!found.has(k)) found.set(k, { ...d, via }); } };
  const fetchPage = async url => {
    if (seen.has(url) || tried.length >= maxPages) return null;
    seen.add(url); tried.push(url);
    const r = await web.page(url);
    if (r.ok && r.text) { take(r.text, r.url); take(r.url, r.url); }
    return r;
  };
  const home = c.website && /^https?:/.test(c.website) ? c.website : c.website ? "https://" + c.website : "";
  if (c.careers_url) {
    const r = await fetchPage(c.careers_url);
    if (r && r.ok && !hasSupported(found) && !found.size) for (const l of careersLinks(r.text, r.url).filter(l => !home || sameCompany(l, home) || /careers|jobs/i.test(l)).slice(0, 2)) await fetchPage(l);
  }
  if (home && !found.size) {
    const r = await fetchPage(home);
    const links = r && r.ok ? careersLinks(r.text, r.url).filter(l => sameCompany(l, home)) : [];
    const guesses = ["/careers", "/jobs", "/join-us", "/work-with-us"].map(p => { try { return new URL(p, home).href; } catch { return ""; } }).filter(Boolean);
    for (const l of [...links, ...guesses]) { if (found.size) break; await fetchPage(l); }
  }
  return { found: [...found.values()].sort((a, b) => (b.supported - a.supported) || (b.count - a.count)), tried };
}
const hasSupported = f => [...f.values()].some(x => x.supported);

/* --- the name-guessing fallback --- */
const LEGAL = /\b(pty|ltd|limited|group|holdings?|australia|australian|the|inc|corporation|corp|co|company|services|and|of)\b/g;
export const domainRoot = website => { try { const h = new URL(/^https?:/.test(website) ? website : "https://" + website).hostname.replace(/^www\./, ""); return h.split(".")[0]; } catch { return ""; } };
export function guessTokens(name, website) {
  const base = String(name || "").toLowerCase().replace(/['’.]/g, "").replace(/&/g, " and ");
  const words = base.replace(LEGAL, " ").replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const all = base.replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const out = [domainRoot(website || ""), words.join(""), words.join("-"), words[0], words.slice(0, 2).join(""), all.join("")].filter(t => t && t.length >= 3);
  return [...new Set(out)].slice(0, 5);
}
// A guessed board is only accepted when its jobs clearly belong to this company: the company's website name or its full name shows up in them
export function looksLikeCompany(sampleText, name, website) {
  const text = normText(sampleText), root = domainRoot(website || "");
  if (root.length >= 4 && new RegExp("\\b" + root + "\\b", "i").test(String(sampleText))) return true;
  const key = normCompany(name);
  return key.length >= 4 && (" " + text + " ").includes(" " + key + " ");
}
