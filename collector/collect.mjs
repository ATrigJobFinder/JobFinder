#!/usr/bin/env node
// Job Finder collector: gathers current jobs from company career sites and job APIs,
// removes duplicates, and writes jobs.json for Job Finder's "Import listings".
//
//   node collect.mjs                       uses sources.json, writes jobs.json
//   node collect.mjs --sources my.json --out feed.json
//   node collect.mjs --fixtures ./fixtures  reads saved responses instead of the network (for testing)
//
// Only official, public job feeds are used: the posting APIs that hiring systems publish for
// their customers' career pages, job-board APIs that you have a key for, and job pages that
// mark themselves up for search engines (schema.org JobPosting), checked against robots.txt.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const DEDUP = require(path.join(here, "dedup.cjs"));

const arg = (name, dflt) => { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : dflt; };
const SOURCES = arg("sources", path.join(here, "sources.json"));
const OUT = arg("out", path.join(here, "jobs.json"));
const FIXTURES = arg("fixtures", "");
const UA = "JobFinderCollector/1.0 (+job listings for a job search site; contact the site owner)";
const DESC_MAX = 1500;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- fetching (politely) ---------- */
let lastHit = new Map();
async function get(url, { json = true, fixture } = {}) {
  if (FIXTURES) {
    if (!fixture) throw new Error("no fixture for " + url);
    const raw = fs.readFileSync(path.join(FIXTURES, fixture), "utf8");
    return json ? JSON.parse(raw) : raw;
  }
  const host = new URL(url).host;
  const wait = 1000 - (Date.now() - (lastHit.get(host) || 0));   // at most one request a second per site
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: json ? "application/json" : "text/html" } });
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return json ? res.json() : res.text();
  }
  throw new Error("gave up after retries: " + url);
}
const robotsCache = new Map();
async function robotsAllows(url) {
  if (FIXTURES) return true;
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    let rules = [];
    try {
      const txt = await get(u.origin + "/robots.txt", { json: false });
      let applies = false;
      for (const line of txt.split(/\r?\n/)) {
        const [k, ...rest] = line.split(":"); const v = rest.join(":").trim(); const key = k.trim().toLowerCase();
        if (key === "user-agent") applies = v === "*" || /jobfinder/i.test(v);
        else if (applies && key === "disallow" && v) rules.push(v);
      }
    } catch { rules = []; }
    robotsCache.set(u.origin, rules);
  }
  return !robotsCache.get(u.origin).some(r => u.pathname.startsWith(r.replace(/\*.*$/, "")));
}

/* ---------- cleaning ---------- */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", bull: "•" };
const decode = s => String(s || "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m);
const text = html => decode(decode(String(html || ""))   // some APIs double-escape their HTML
  .replace(/<(br|\/p|\/li|\/h\d|\/div)[^>]*>/gi, "\n").replace(/<li[^>]*>/gi, "- ").replace(/<[^>]+>/g, " "))
  .replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
const clip = s => { const t = text(s); return t.length <= DESC_MAX ? t : t.slice(0, DESC_MAX).replace(/\s+\S*$/, "") + "…"; };
const day = d => { if (d == null || d === "") return ""; const x = new Date(typeof d === "number" ? d : String(d)); return isNaN(x) ? "" : x.toISOString().slice(0, 10); };
const WORK = [[/full[\s_-]?time|permanent|fulltime/i, "Full time"], [/part[\s_-]?time|parttime/i, "Part time"], [/casual/i, "Casual"], [/contract|temp|fixed[\s-]?term/i, "Contract"], [/intern/i, "Internship"], [/graduate/i, "Graduate program"]];
const workType = s => { for (const [re, v] of WORK) if (re.test(String(s || ""))) return v; return ""; };
const money = (min, max, cur = "AUD", per = "") => { const f = n => "$" + Math.round(n).toLocaleString("en-AU"); if (!min && !max) return ""; const unit = /hour/i.test(per) || Math.max(min || 0, max || 0) < 300 ? " an hour" : ""; return (min && max && min !== max ? `${f(min)} to ${f(max)}` : f(min || max)) + (cur && cur !== "AUD" ? " " + cur : "") + unit; };
const job = o => ({
  id: String(o.id || "").slice(0, 80), title: String(o.title || "").trim(), company: String(o.company || "").trim(), location: String(o.location || "").trim(),
  workType: o.workType || "", remote: o.remote || "", salary: o.salary || "", posted: o.posted || "", closes: o.closes || "",
  url: o.url || "", source: o.source, sourceType: o.sourceType, description: clip(o.description), ref: o.ref || ""
});

/* ---------- one reader per kind of source ---------- */
const READERS = {
  // Greenhouse job boards: https://developers.greenhouse.io/job-board.html
  async greenhouse(s) {
    const d = await get(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(s.board)}/jobs?content=true`, s);
    return (d.jobs || []).map(j => job({ id: "gh-" + j.id, title: j.title, company: s.company, location: j.location && j.location.name, posted: day(j.first_published || j.updated_at), url: j.absolute_url, description: j.content, ref: j.requisition_id, workType: workType(j.title + " " + ((j.metadata || []).map(m => m.value).join(" "))), remote: /remote/i.test(j.location && j.location.name) ? "Remote" : "", source: s.company + " careers", sourceType: "ats" }));
  },
  // Lever postings API: https://github.com/lever/postings-api
  async lever(s) {
    const d = await get(`https://api${s.region === "eu" ? ".eu" : ""}.lever.co/v0/postings/${encodeURIComponent(s.site)}?mode=json`, s);
    return (Array.isArray(d) ? d : []).map(j => job({ id: "lv-" + j.id, title: j.text, company: s.company, location: (j.categories || {}).location || (j.categories && (j.categories.allLocations || []).join(", ")), workType: workType((j.categories || {}).commitment), remote: j.workplaceType === "remote" ? "Remote" : j.workplaceType === "hybrid" ? "Hybrid" : j.workplaceType === "onsite" ? "On-site" : "", salary: j.salaryRange ? money(j.salaryRange.min, j.salaryRange.max, j.salaryRange.currency, j.salaryRange.interval) : "", posted: day(j.createdAt), url: j.hostedUrl, description: [j.descriptionPlain, ...(j.lists || []).map(l => l.text + "\n" + text(l.content))].join("\n"), source: s.company + " careers", sourceType: "ats" }));
  },
  // Ashby job postings API: https://developers.ashbyhq.com/docs/public-job-posting-api
  async ashby(s) {
    const d = await get(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(s.board)}?includeCompensation=true`, s);
    return (d.jobs || []).filter(j => j.isListed !== false).map(j => job({ id: "as-" + j.id, title: j.title, company: s.company, location: j.location, workType: workType(j.employmentType), remote: j.isRemote ? "Remote" : (j.workplaceType || ""), salary: (j.compensation || {}).compensationTierSummary || "", posted: day(j.publishedAt), url: j.jobUrl, description: j.descriptionPlain || j.descriptionHtml, source: s.company + " careers", sourceType: "ats" }));
  },
  // SmartRecruiters posting API: https://developers.smartrecruiters.com/docs/posting-api
  async smartrecruiters(s) {
    const out = [];
    for (let offset = 0; offset < (s.max || 300); offset += 100) {
      const d = await get(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(s.companyId)}/postings?limit=100&offset=${offset}${s.country ? "&country=" + s.country : ""}`, s);
      for (const j of d.content || []) {
        const loc = j.location || {};
        out.push(job({ id: "sr-" + j.id, title: j.name, company: s.company || (j.company || {}).name, location: [loc.city, loc.region].filter(Boolean).join(", "), workType: workType((j.typeOfEmployment || {}).label), remote: loc.remote ? "Remote" : "", posted: day(j.releasedDate), url: `https://jobs.smartrecruiters.com/${encodeURIComponent(s.companyId)}/${j.id}`, ref: j.refNumber, description: (j.function || {}).label ? `${(j.function || {}).label}. ${(j.experienceLevel || {}).label || ""}` : "", source: (s.company || s.companyId) + " careers", sourceType: "ats" }));
      }
      if (FIXTURES || !d.content || d.content.length < 100) break;
    }
    return out;
  },
  // Workable widget API (the feed behind Workable career pages)
  async workable(s) {
    const d = await get(`https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(s.account)}?details=true`, s);
    return (d.jobs || []).map(j => job({ id: "wk-" + j.shortcode, title: j.title, company: s.company || d.name, location: [j.city, j.state].filter(Boolean).join(", ") || j.country, workType: workType(j.employment_type), remote: j.telecommuting ? "Remote" : "", posted: day(j.published_on || j.created_at), url: j.url || j.shortlink, description: j.description, source: (s.company || d.name) + " careers", sourceType: "ats" }));
  },
  // Recruitee careers site API
  async recruitee(s) {
    const d = await get(`https://${encodeURIComponent(s.site)}.recruitee.com/api/offers/`, s);
    return (d.offers || []).map(j => job({ id: "rc-" + j.id, title: j.title, company: s.company || j.company_name, location: j.location || [j.city, j.state_code].filter(Boolean).join(", "), workType: workType(j.employment_type_code), remote: j.remote ? "Remote" : j.hybrid ? "Hybrid" : "", salary: j.salary && j.salary.min ? money(+j.salary.min, +j.salary.max, j.salary.currency, j.salary.period) : "", posted: day(j.published_at), url: j.careers_url, description: [j.description, j.requirements].join("\n"), source: (s.company || j.company_name) + " careers", sourceType: "ats" }));
  },
  // Adzuna search API (an aggregator; needs a free app id and key): https://developer.adzuna.com
  async adzuna(s) {
    const id = s.appId || process.env.ADZUNA_APP_ID, key = s.appKey || process.env.ADZUNA_APP_KEY;
    if (!id || !key) { if (!FIXTURES) throw new Error("set ADZUNA_APP_ID and ADZUNA_APP_KEY"); }
    const out = [];
    for (let page = 1; page <= (s.pages || 2); page++) {
      const q = new URLSearchParams({ app_id: id || "", app_key: key || "", results_per_page: "50", what: s.what || "", where: s.where || "", max_days_old: String(s.maxDaysOld || 30), "content-type": "application/json" });
      const d = await get(`https://api.adzuna.com/v1/api/jobs/${s.country || "au"}/search/${page}?${q}`, { ...s, fixture: s.fixture });
      for (const j of d.results || []) out.push(job({ id: "az-" + j.id, title: text(j.title), company: (j.company || {}).display_name, location: (j.location || {}).display_name, workType: workType(j.contract_time + " " + j.contract_type), salary: j.salary_is_predicted === "1" ? "" : money(j.salary_min, j.salary_max), posted: day(j.created), url: j.redirect_url, description: j.description, source: "Adzuna", sourceType: "aggregator" }));
      if (FIXTURES || !(d.results || []).length) break;
    }
    return out;
  },
  // Any career page that marks its jobs up for search engines (schema.org JobPosting in JSON-LD)
  async jsonld(s) {
    const out = [];
    for (const url of s.urls || [s.url]) {
      if (!(await robotsAllows(url))) { console.warn(`  skipped ${url}: robots.txt asks robots not to read it`); continue; }
      const html = await get(url, { json: false, fixture: s.fixture });
      for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        let data; try { data = JSON.parse(m[1].trim()); } catch { continue; }
        const items = [].concat(data).flatMap(x => x && x["@graph"] ? x["@graph"] : [x]).filter(x => x && [].concat(x["@type"]).includes("JobPosting"));
        for (const j of items) {
          if (j.validThrough && new Date(j.validThrough) < new Date()) continue;
          const addr = [].concat(j.jobLocation || []).map(l => (l && l.address) || {})[0] || {};
          const pay = (j.baseSalary && j.baseSalary.value) || {};
          out.push(job({ id: "ld-" + ((j.identifier && (j.identifier.value || j.identifier)) || j.url || j.title), title: j.title, company: (j.hiringOrganization || {}).name || s.company, location: [addr.addressLocality, addr.addressRegion].filter(Boolean).join(", "), workType: workType([].concat(j.employmentType || []).join(" ")), remote: j.jobLocationType === "TELECOMMUTE" ? "Remote" : "", salary: money(pay.minValue || pay.value, pay.maxValue, (j.baseSalary || {}).currency, pay.unitText), posted: day(j.datePosted), closes: day(j.validThrough), url: j.url || url, description: j.description, ref: j.identifier && (j.identifier.value || ""), source: (s.company || (j.hiringOrganization || {}).name || new URL(url).hostname) + " careers", sourceType: "company" }));
        }
      }
    }
    return out;
  }
};

/* ---------- run ---------- */
const cfg = JSON.parse(fs.readFileSync(SOURCES, "utf8"));
const all = [], report = [];
for (const s of cfg.sources || []) {
  const reader = READERS[s.type];
  const label = `${s.type}: ${s.company || s.board || s.site || s.account || s.companyId || s.what || s.url || ""}`;
  if (!reader) { report.push({ source: label, error: "unknown type" }); continue; }
  try {
    let jobs = (await reader(s)).filter(j => j.title && j.company);
    if (s.onlyLocations) { const re = new RegExp(s.onlyLocations, "i"); jobs = jobs.filter(j => re.test(j.location) || /remote/i.test(j.remote)); }
    all.push(...jobs);
    report.push({ source: label, jobs: jobs.length });
    console.log(`  ${label}: ${jobs.length} jobs`);
  } catch (e) {
    report.push({ source: label, error: e.message });
    console.warn(`  ${label}: failed (${e.message})`);
  }
}
const today = new Date().toISOString().slice(0, 10);
const current = all.filter(j => !j.closes || j.closes >= today);
const merged = DEDUP.cluster(current).map(j => ({ ...j, also: (j.also || []).slice(0, 8) }));
fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), counts: { listings: current.length, jobs: merged.length, duplicatesMerged: current.length - merged.length }, sources: report, jobs: merged }, null, 1));
console.log(`\n${current.length} listings, ${merged.length} jobs after merging ${current.length - merged.length} duplicates. Wrote ${OUT}`);
if (report.some(r => r.error)) process.exitCode = 2;
