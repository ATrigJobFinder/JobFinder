#!/usr/bin/env node
// Builds data/candidates.csv, the list of companies discovery will look at, from lists already in this project:
//   the company directory and guides in src/scripts (names, careers pages, industry, state),
//   research/careers-links-found.txt and research/employers-to-check.txt, and data/candidates-extra.csv (added by hand).
// Only names and websites are taken. Run:  node jobs-import/build-candidates.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normCompany } from "./lib/util.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const out = new Map();
const rootDomain = u => { try { const h = new URL(u).hostname.replace(/^www\./, ""), p = h.split("."); return (p.length > 3 || (p.length === 3 && !/^(com|net|org|gov|edu|asn|id)$/.test(p[1]))) ? p.slice(-3).join(".") : h; } catch { return ""; } };
const add = c => {
  const name = String(c.name || "").replace(/\s+/g, " ").trim();
  if (!name) return;
  const key = normCompany(name) || name.toLowerCase(), dom = rootDomain(c.careers_url || "") || (c.website || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
  const cur = out.get(key) || out.get("d:" + dom);
  if (cur) { cur.careers_url ||= c.careers_url || ""; cur.website ||= c.website || dom; cur.industry ||= c.industry || ""; cur.hq_state ||= c.hq_state || ""; return; }
  const rec = { name, website: c.website || dom, industry: c.industry || "", hq_state: c.hq_state || "", source: c.source, careers_url: c.careers_url || "" };
  out.set(key, rec); if (dom) out.set("d:" + dom, rec);
};

// 1. the company directory: { n: "Name", i: "industry", s: "size", st: "State", u: "careers page", ... }
for (const m of read("src/scripts/04l-company-directory.js").matchAll(/\{\s*n:\s*"([^"]+)"([^}]*)\}/g)) {
  const f = k => (m[2].match(new RegExp("\\b" + k + ':\\s*"([^"]*)"')) || [])[1] || "";
  add({ name: m[1], industry: f("i"), hq_state: /^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/.test(f("st")) ? f("st") : "", careers_url: f("u"), source: "list:company-directory" });
}
// 2. the full company guides: name: "X" … careers: "URL"
for (const f of fs.readdirSync(path.join(root, "src/scripts")).filter(f => /^04[b-k]/.test(f))) {
  const t = read("src/scripts/" + f);
  const names = [...t.matchAll(/\bname:\s*"([^"]+)"/g)].map(m => ({ i: m.index, n: m[1] }));
  for (const c of t.matchAll(/\bcareers:\s*"([^"]+)"/g)) { const nm = [...names].reverse().find(x => x.i < c.index); if (nm) add({ name: nm[1] || nm.n, careers_url: c[1], source: "list:company-guides" }); }
}
// 3. employers still to look up: industry|size|states|name|ASX code
for (const l of read("research/employers-to-check.txt").split(/\r?\n/)) { const p = l.split("|"); if (p.length >= 4 && p[3].trim()) add({ name: p[3].trim(), industry: p[0].trim(), hq_state: /^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/.test((p[2] || "").trim()) ? p[2].trim() : "", source: "list:employers-to-check" }); }
// 4. added by hand
const extra = path.join(root, "data/candidates-extra.csv");
if (fs.existsSync(extra)) for (const l of fs.readFileSync(extra, "utf8").split(/\r?\n/).slice(1)) { const p = l.split(","); if (p[0]) add({ name: p[0], website: p[1], industry: p[2], hq_state: p[3], source: p[4] || "list:extra" }); }

const rows = [...new Set(out.values())];
const q = v => /[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v;
fs.writeFileSync(path.join(root, "data/candidates.csv"), "name,website,industry,hq_state,source,careers_url\n" + rows.map(r => [r.name, r.website, r.industry, r.hq_state, r.source, r.careers_url].map(q).join(",")).join("\n") + "\n");
console.log(`Wrote ${rows.length} candidates to data/candidates.csv (${rows.filter(r => r.careers_url).length} with a careers page, ${rows.filter(r => r.website).length} with a website).`);
