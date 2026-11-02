#!/usr/bin/env node
// Weekly Australian jobs import.  Runs on GitHub Actions (never on the website's host).
//
//   node jobs-import/import-jobs.mjs                       the full weekly run
//   DRY_RUN=true node jobs-import/import-jobs.mjs          fetch and count, write nothing
//   node jobs-import/import-jobs.mjs --only employers      just one source: employers, adzuna or jooble
//   node jobs-import/import-jobs.mjs --check-employer greenhouse examplecompany
//   node jobs-import/import-jobs.mjs --report              totals in the database, by source and state
//
// Order: employer feeds (from the employers table), Adzuna, Jooble, clean-up, then a summary row in import_runs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDotEnv, env, intEnv, boolEnv } from "./lib/util.mjs";
import { parseList } from "./lib/yaml.mjs";
import { ATS_NAMES } from "./lib/mappers.mjs";
import { runAdzuna, runJooble, fetchEmployer } from "./lib/sources.mjs";
import { runEmployerFeeds, nameKey } from "./lib/employers.mjs";
import { connect } from "./lib/db.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
loadDotEnv(path.join(root, ".env"));
const args = process.argv.slice(2);
const flag = n => args.includes("--" + n);
const opt = n => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : ""; };
const cfg = JSON.parse(fs.readFileSync(path.join(root, "config", "search.json"), "utf8"));
const log = m => console.log(m);

/* ---- Helper: does this employer's feed work, and how many Australian jobs does it have? ---- */
if (flag("check-employer")) {
  const i = args.indexOf("--check-employer"), ats = args[i + 1], token = args[i + 2];
  if (!ATS_NAMES.includes(ats) || !token) { console.error(`Usage: --check-employer <${ATS_NAMES.join("|")}> <board token>`); process.exit(2); }
  try {
    const eng = flag("engineering");
    const r = await fetchEmployer({ name: token, ats, token }, { engineeringOnly: eng });
    console.log(`${ats}/${token}: ${r.total} jobs in the feed, ${r.rows.length} Australian${eng ? " engineering" : ""} jobs (${r.notAu} outside Australia${eng ? `, ${r.notEng} not engineering` : ""}).`);
    for (const j of r.rows.slice(0, 5)) console.log(`  - ${j.title} | ${j.location}`);
    process.exit(r.total ? 0 : 1);
  } catch (e) { console.error(`${ats}/${token}: not working (${e.message})`); process.exit(1); }
}

const DRY = boolEnv("DRY_RUN");
const MAX_AGE = intEnv("MAX_AGE_DAYS", 30);
const only = opt("only");
const want = s => !only || only.split(",").includes(s);
const url = env("SUPABASE_URL"), key = env("SUPABASE_SERVICE_KEY");
const db = url && key ? connect({ url, key }) : null;

if (flag("report")) {
  if (!db) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY first."); process.exit(2); }
  const t = await db.totals(), share = await db.employerShare();
  console.log("Jobs by source:", t.bySource, "\nJobs by state:", t.byState, `\nShown on the site (one per duplicate group): ${share.total}, of which ${share.direct} (${share.percent}%) come straight from employers`);
  process.exit(0);
}
if (!DRY && !db) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY (or run with DRY_RUN=true)."); process.exit(2); }

const run = { started_at: new Date().toISOString(), dry_run: DRY, summary: {}, api_calls: {}, errors: [], deleted_old: 0, deleted_closed: 0 };
const sourceResult = {};   // name → ok | failed | skipped
const note = (src, m) => { run.errors.push(`${src}: ${m}`); log(`  ! ${m}`); };

// Save one source's rows; counts what's new and what's updated
async function save(source, rows, existing) {
  const have = new Set(existing), fresh = rows.filter(r => !have.has(r.source_id)).length;
  if (!DRY) await db.upsert(rows);
  return { inserted: fresh, updated: rows.length - fresh };
}

/* 1. Employer feeds: every active employer in the employers table */
if (want("employers")) {
  log("\n== Employer feeds ==");
  try {
    let employers;
    let tableMissing = false;
    if (db) try { await db.listEmployers(["active"]); } catch (e) { if (/HTTP (404|400)/.test(e.message)) { tableMissing = true; note("employers", "The employers table doesn't exist yet, so employers were read from config/employers.yaml. Run supabase/migrations/002_employers.sql in Supabase."); } else throw e; }
    if (db && !tableMissing) {
      let all = await db.listEmployers();
      // the first time, the employers table is filled from config/employers.yaml; after that the table is the only list
      if (!all.length && !DRY) {
        const seed = parseList(fs.readFileSync(path.join(root, "config", "employers.yaml"), "utf8")).filter(e => e.name && e.ats && e.token);
        if (seed.length) { await db.addEmployers(seed.map(e => ({ name: e.name, ats: e.ats, token: String(e.token), status: e.active === false ? "paused" : "active", discovered_via: "manual", name_key: nameKey(e.name), notes: "Moved from config/employers.yaml." }))); all = await db.listEmployers(); log(`Filled the employers table with ${seed.length} employers from config/employers.yaml.`); }
      }
      employers = all.filter(e => e.status === "active");
    } else employers = parseList(fs.readFileSync(path.join(root, "config", "employers.yaml"), "utf8")).filter(e => e.name && e.ats && e.token && e.active !== false);
    const s = run.summary.employers = { active: employers.length, fetched: 0, kept: 0, inserted: 0, updated: 0, skipped: 0, ok: 0, failed: 0, newly_broken: 0, closed_removed: 0 };
    const stats = await runEmployerFeeds({
      employers, engineeringOnly: cfg.employers_engineering_only === true, log,
      onResult: async (emp, out) => {
        if (out.ok) {
          const source = `employer:${emp.ats === "lever_eu" ? "lever" : emp.ats}`;
          const existing = db && !DRY ? await db.existingIds(source, emp.token + ":") : [];
          const c = await save(source, out.rows, existing);
          s.inserted += c.inserted; s.updated += c.updated;
          // a feed is the complete list: jobs we hold that it no longer shows have closed
          // (an empty feed when we hold many jobs looks like a glitch, so nothing is removed that week)
          if (db && !DRY) {
            const live = new Set(out.rows.map(r => r.source_id)), gone = existing.filter(id => !live.has(id));
            if (out.total === 0 && existing.length > 5) note("employers", `${emp.name}: its feed was empty this week, so its ${existing.length} jobs were kept.`);
            else if (gone.length) { const n = await db.deleteIds(source, gone); s.closed_removed += n; run.deleted_closed += n; }
          }
        }
        if (db && !DRY && emp.id) await db.patchEmployer(emp.id, out.patch);
      }
    });
    Object.assign(s, { fetched: stats.total, kept: stats.au, skipped: stats.notAu + stats.notEng, ok: stats.ok, failed: stats.failed, newly_broken: stats.newlyBroken });
    stats.problems.forEach(m => note("employers", m));
    sourceResult.employers = stats.ok > 0 || !employers.length ? "ok" : "failed";
  } catch (e) { sourceResult.employers = "failed"; note("employers", e.message); }
} else sourceResult.employers = "skipped";

/* 2. Adzuna */
if (want("adzuna")) {
  log("\n== Adzuna ==");
  const appId = env("ADZUNA_APP_ID"), appKey = env("ADZUNA_APP_KEY");
  if (!appId || !appKey) { sourceResult.adzuna = "skipped"; note("adzuna", "ADZUNA_APP_ID and ADZUNA_APP_KEY are not set, so it was skipped."); }
  else try {
    const r = await runAdzuna({ cfg, appId, appKey, max: intEnv("ADZUNA_MAX_CALLS_PER_RUN", 200), log });
    run.api_calls.adzuna = r.calls; r.notes.forEach(m => note("adzuna", m));
    const existing = DRY || !db ? [] : await db.existingIds("adzuna");
    const c = await save("adzuna", r.rows, existing);
    run.summary.adzuna = { fetched: r.rows.length, ...c, skipped: 0, stopped_at_budget: r.stoppedAtBudget };
    sourceResult.adzuna = r.calls > 0 && (r.rows.length || !r.notes.some(n => /HTTP/.test(n))) ? "ok" : "failed";
  } catch (e) { sourceResult.adzuna = "failed"; note("adzuna", e.message); }
} else sourceResult.adzuna = "skipped";

/* 3. Jooble */
if (want("jooble")) {
  log("\n== Jooble ==");
  const jk = env("JOOBLE_API_KEY");
  if (!jk) { sourceResult.jooble = "skipped"; note("jooble", "JOOBLE_API_KEY is not set, so it was skipped."); }
  else try {
    const r = await runJooble({ cfg, key: jk, max: intEnv("JOOBLE_MAX_CALLS_PER_RUN", 200), log });
    run.api_calls.jooble = r.calls; r.notes.forEach(m => note("jooble", m));
    const existing = DRY || !db ? [] : await db.existingIds("jooble");
    const c = await save("jooble", r.rows, existing);
    run.summary.jooble = { fetched: r.rows.length, ...c, skipped: 0, stopped_at_budget: r.stoppedAtBudget };
    sourceResult.jooble = r.calls > 0 && (r.rows.length || !r.notes.some(n => /HTTP/.test(n))) ? "ok" : "failed";
  } catch (e) { sourceResult.jooble = "failed"; note("jooble", e.message); }
} else sourceResult.jooble = "skipped";

/* 4. Clean-up */
if (!DRY && !only) {
  log("\n== Clean-up ==");
  try { run.deleted_old = await db.deleteOld(MAX_AGE); const runs = await db.deleteOldRuns(90); log(`Removed ${run.deleted_old} listings older than ${MAX_AGE} days, ${run.deleted_closed} closed employer jobs, and ${runs} old log rows.`); }
  catch (e) { note("cleanup", e.message); }
}
// The number to watch: how much of the site's jobs come straight from employers
if (!DRY && db) { try { run.summary.employer_share = await db.employerShare(); } catch (e) { note("summary", e.message); } }

/* 5. Summary */
run.finished_at = new Date().toISOString();
const results = Object.values(sourceResult), ran = results.filter(r => r !== "skipped");
run.status = DRY ? "dry run" : ran.length && ran.every(r => r === "failed") ? "failed" : ran.some(r => r === "failed") ? "partly failed" : "ok";
log("\n== Summary ==\n" + JSON.stringify({ status: run.status, sources: sourceResult, ...run.summary, api_calls: run.api_calls, deleted_old: run.deleted_old, deleted_closed: run.deleted_closed, problems: run.errors.length }, null, 2));
if (run.summary.employer_share) log(`\nEmployer feeds are ${run.summary.employer_share.percent}% of the site's jobs (${run.summary.employer_share.direct} of ${run.summary.employer_share.total}).`);
if (!DRY) { try { await db.logRun({ started_at: run.started_at, finished_at: run.finished_at, status: run.status, dry_run: false, summary: run.summary, api_calls: run.api_calls, deleted_old: run.deleted_old, deleted_closed: run.deleted_closed, errors: run.errors.slice(0, 50) }); } catch (e) { console.error("Couldn't write the run log: " + e.message); } }
process.exit(run.status === "failed" ? 1 : 0);
