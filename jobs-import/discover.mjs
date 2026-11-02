#!/usr/bin/env node
// Employer discovery: finds Australian employers' job boards, checks them, and adds the good ones to the employers table.
// Runs monthly on GitHub Actions (see .github/workflows/discover-employers.yml). Separate from the weekly import.
//
//   node jobs-import/discover.mjs                  full run (needs SUPABASE_URL and SUPABASE_SERVICE_KEY)
//   node jobs-import/discover.mjs --dry            look and report, change nothing (no database needed)
//   node jobs-import/discover.mjs --limit 50       only the first 50 new candidates
//   node jobs-import/discover.mjs --no-recheck     skip re-checking broken and no_au_jobs employers
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDotEnv, env, boolEnv, normCompany } from "./lib/util.mjs";
import { Gate, makeWeb, pool } from "./lib/http.mjs";
import { connect } from "./lib/db.mjs";
import { evaluateCandidate, checkBoard } from "./lib/discovery.mjs";
import { findBoards } from "./lib/detect.mjs";
import { nameKey } from "./lib/employers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotEnv(path.join(root, ".env"));
const args = process.argv.slice(2), flag = n => args.includes("--" + n), opt = n => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : ""; };
const DRY = flag("dry") || boolEnv("DRY_RUN");
const LIMIT = +opt("limit") || 0;
const db = !DRY && env("SUPABASE_URL") && env("SUPABASE_SERVICE_KEY") ? connect({ url: env("SUPABASE_URL"), key: env("SUPABASE_SERVICE_KEY") }) : null;
if (!DRY && !db) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY, or run with --dry."); process.exit(2); }

function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some(x => x)) rows.push(row); row = []; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...rest] = rows;
  return rest.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
}
const t0 = Date.now(), log = m => console.log(m);
const web = makeWeb({ gate: new Gate({ max: 2, gap: 1500 }) });   // employers' own websites: gentle
const apiGate = new Gate({ max: 5, gap: 250 });                  // the hiring systems' public boards

/* ---- 1. candidates ---- */
let cands = parseCsv(fs.readFileSync(path.join(root, "data/candidates.csv"), "utf8")).map(c => ({ ...c, source: c.source || "list" }));
let existing = [];
if (db) {
  existing = await db.listEmployers();
  // companies that turn up most in Adzuna and Jooble results but aren't employers yet: the list grows by itself
  for (const a of await db.topAggregatorCompanies(300)) cands.push({ name: a.name, website: "", industry: "", hq_state: "", source: "learned:aggregators", careers_url: "" });
}
const known = new Set(existing.map(e => e.name_key || nameKey(e.name)));
const domains = new Set(existing.map(e => (e.website || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "")).filter(Boolean));
const seen = new Set();
cands = cands.filter(c => {
  const k = nameKey(c.name), d = (c.website || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
  if (!k || known.has(k) || (d && domains.has(d)) || seen.has(k) || (d && seen.has("d:" + d))) return false;
  seen.add(k); if (d) seen.add("d:" + d); return true;
});
if (LIMIT) cands = cands.slice(0, LIMIT);
log(`${cands.length} new candidates to look at (${existing.length} employers already in the database).`);

/* ---- 2. look at each ---- */
const results = [], pending = [];
let done = 0;
async function flush(force) {
  if (!db || (!force && pending.length < 25)) return;
  const rows = pending.splice(0, pending.length);
  if (rows.length) { try { await db.addEmployers(rows); } catch (e) { log(`  ! couldn't save ${rows.length} employers: ${e.message}`); } }
}
await pool(cands, 8, async c => {
  let r;
  try { r = await evaluateCandidate(c, { web, gate: apiGate }); } catch (e) { r = { candidate: c, found: [], row: null, reason: e.message }; }
  results.push(r);
  if (r.row) { pending.push(r.row); const x = r.row; log(`+ ${c.name}: ${x.ats}/${x.token} ${x.status}${r.res ? ` (${r.res.au} Australian of ${r.res.total} jobs)` : ""}`); }
  if (++done % 25 === 0) log(`... ${done} of ${cands.length} looked at (${Math.round((Date.now() - t0) / 60000)} min)`);
  await flush();
});
await flush(true);

/* ---- 3. re-check employers that were broken, or had no Australian jobs ---- */
const rechecked = { fixed: 0, revived: 0, stillBroken: 0, stillNone: 0 };
if (db && !flag("no-recheck")) {
  for (const e of existing.filter(e => e.status === "broken" || e.status === "no_au_jobs")) {
    try {
      if (e.status === "no_au_jobs") {
        const res = await checkBoard(e, e.ats, e.token, { gate: apiGate, trust: true });
        if (res.ok && res.au > 0) { await db.patchEmployer(e.id, { status: "active", last_au_jobs: res.au, last_total_jobs: res.total, last_success_at: new Date().toISOString(), consecutive_errors: 0, zero_au_weeks: 0 }); rechecked.revived++; } else rechecked.stillNone++;
        continue;
      }
      // broken: has it moved to a different board?
      const r = e.careers_url || e.website ? await findBoards({ website: e.website, careers_url: e.careers_url }, web) : { found: [] };
      let fixed = false;
      for (const b of r.found.filter(b => b.supported)) {
        const res = await checkBoard(e, b.ats, b.token, { gate: apiGate, trust: true });
        if (res.ok) { await db.patchEmployer(e.id, { ats: b.ats, token: b.token, status: res.au > 0 ? "active" : "no_au_jobs", last_au_jobs: res.au, last_total_jobs: res.total, last_success_at: new Date().toISOString(), consecutive_errors: 0, last_error: null, notes: `Moved to ${b.ats} (found ${new Date().toISOString().slice(0, 10)}).` }); fixed = true; break; }
      }
      if (fixed) rechecked.fixed++; else rechecked.stillBroken++;
    } catch (err) { log(`  ! re-check of ${e.name} failed: ${err.message}`); }
  }
}

/* ---- 4. the report ---- */
const added = results.filter(r => r.row), active = added.filter(r => r.row.status === "active"), none = added.filter(r => r.row.status === "no_au_jobs"), paused = added.filter(r => r.row.status === "paused");
const byAts = rows => rows.reduce((a, r) => (a[r.row.ats] = (a[r.row.ats] || 0) + 1, a), {});
const auJobs = active.reduce((a, r) => a + (r.res ? r.res.au : 0), 0);
const reasons = results.filter(r => !r.row).reduce((a, r) => { const k = (r.reason || "unknown").replace(/[a-z0-9_-]+\/[A-Za-z0-9_.-]+: /, "").slice(0, 60); a[k] = (a[k] || 0) + 1; return a; }, {});
const top = [...active].sort((a, b) => b.res.au - a.res.au).slice(0, 20);
const md = `# Employer discovery report

Run: ${new Date().toISOString()}${DRY ? " (dry run: nothing was saved)" : ""}  ·  took ${Math.round((Date.now() - t0) / 60000)} minutes

| | |
|---|---|
| Candidates checked | ${results.length} |
| Boards found (employers added) | ${added.length} |
| Active (at least 1 Australian job) | ${active.length} |
| Works but no Australian jobs yet (no_au_jobs) | ${none.length} |
| Use a system with no official feed, saved as paused (Workday, PageUp and so on) | ${paused.length} |
| No board found or it failed | ${results.length - added.length} |
| Australian jobs the new active employers add | ${auJobs} |

## Active employers by hiring system
${Object.entries(byAts(active)).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- none"}

## Paused (needs your approval), by system
${Object.entries(byAts(paused)).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- none"}

## Top 20 new employers by Australian jobs
${top.map((r, i) => `${i + 1}. ${r.candidate.name} (${r.row.ats}): ${r.res.au} Australian jobs`).join("\n") || "none"}

## Why the rest weren't added
${Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- none"}

## Re-checks
Fixed broken employers: ${rechecked.fixed} · still broken: ${rechecked.stillBroken} · back to active: ${rechecked.revived} · still no Australian jobs: ${rechecked.stillNone}
`;
fs.mkdirSync(path.join(root, "data"), { recursive: true });
fs.writeFileSync(path.join(root, "data/discovery-report.md"), md);
if (DRY) fs.writeFileSync(path.join(root, "data/discovery-dry.json"), JSON.stringify(results.map(r => ({ name: r.candidate.name, website: r.candidate.website, source: r.candidate.source, found: r.found, row: r.row, reason: r.reason })), null, 1));
console.log("\n" + md);
if (db) { try { await db.logRun({ started_at: new Date(t0).toISOString(), finished_at: new Date().toISOString(), status: "discovery", dry_run: false, summary: { discovery: { candidates: results.length, added: added.length, active: active.length, no_au_jobs: none.length, paused: paused.length, au_jobs: auJobs, rechecked } }, api_calls: {}, errors: [] }); } catch (e) { console.error("Couldn't write the run log: " + e.message); } }
