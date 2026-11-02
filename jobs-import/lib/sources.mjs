// The three sources. Each returns { rows, calls, notes } and never throws for one bad search: it records the problem and carries on.
import { Budget, BudgetSpent, fetchJSON, limiter } from "./util.mjs";
import { mapAdzuna, mapJooble, mapEmployerJob, ATS } from "./mappers.mjs";
import { isAustralian } from "./au.mjs";
import { isEngineering } from "./engineering.mjs";

const keep = (cfg, row) => !cfg.engineering_only || isEngineering(row);
const isoDaysAgo = d => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);

/* ---------- Adzuna ---------- */
// Docs: https://developer.adzuna.com/ . Each call asks for up to 50 of the newest ads for one category or keyword in one place.
export async function runAdzuna({ cfg, appId, appKey, max, fetchImpl, log = () => {} }) {
  const budget = new Budget(max), wait = limiter(1000), rows = new Map(), notes = [];
  const base = "https://api.adzuna.com/v1/api/jobs/au";
  const auth = `app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}`;
  const a = cfg.adzuna || {};
  try {
    // the category list is fetched once, so a wrong category tag in the config is noticed
    let tags = null;
    try { const c = await fetchJSON(`${base}/categories?${auth}`, { budget, wait, fetchImpl }); tags = new Set((c.results || []).map(x => x.tag)); } catch (e) { if (e.budgetSpent) throw e; notes.push(`Couldn't read Adzuna's category list: ${e.message}`); }
    const searches = [...(a.categories || []).filter(t => { const ok = !tags || tags.has(t); if (!ok) notes.push(`Adzuna has no category “${t}”; skipped.`); return ok; }).map(category => ({ category })), ...(a.keywords || []).map(what => ({ what }))];
    // Page 1 of every city comes before page 2 of any city, so a small budget still covers the whole country
    for (const s of searches) {
      let active = [...(a.locations || ["Australia"])];
      for (let page = 1; page <= (a.max_pages || 6) && active.length; page++) {
        for (const where of [...active]) {
          const q = [auth, "results_per_page=50", "sort_by=date", `max_days_old=${a.max_days_old || 8}`, "content-type=application/json", s.category && `category=${encodeURIComponent(s.category)}`, s.what && `what=${encodeURIComponent(s.what)}`, where && where !== "Australia" && `where=${encodeURIComponent(where)}`].filter(Boolean).join("&");
          let d;
          try { d = await fetchJSON(`${base}/search/${page}?${q}`, { budget, wait, fetchImpl }); }
          catch (e) { if (e.budgetSpent) throw e; notes.push(`Adzuna ${s.category || s.what} in ${where}, page ${page}: ${e.message}`); active = active.filter(x => x !== where); continue; }
          const list = d.results || [];
          for (const r of list) { try { const row = mapAdzuna(r); if (row.url && row.title && keep(cfg, row) && !rows.has(row.source_id)) rows.set(row.source_id, row); } catch (e) { notes.push(`Skipped an Adzuna ad: ${e.message}`); } }
          log(`Adzuna ${s.category || s.what} / ${where} / page ${page}: ${list.length} ads (${budget.used} of ${max} calls used)`);
          if (list.length < 50) active = active.filter(x => x !== where);
        }
      }
    }
  } catch (e) { if (!e.budgetSpent) throw e; notes.push(`Stopped cleanly: all ${max} Adzuna calls for this run were used.`); }
  return { rows: [...rows.values()], calls: budget.used, notes, stoppedAtBudget: budget.spent };
}

/* ---------- Jooble ---------- */
// Docs: https://jooble.org/api/about . POST https://jooble.org/api/{key} with { keywords, location, page, datecreatedfrom }.
// Locations are written "Sydney, Australia": a bare state name like "New South Wales" is read as somewhere in the USA.
export async function runJooble({ cfg, key, max, fetchImpl, log = () => {} }) {
  const budget = new Budget(max), wait = limiter(1000), rows = new Map(), notes = [], seenIds = new Set();
  const j = cfg.jooble || {};
  try {
    for (const keywords of j.keywords || []) for (const location of j.locations || ["Australia"]) {
      for (let page = 1; page <= (j.max_pages || 3); page++) {
        let d;
        try { d = await fetchJSON(`https://jooble.org/api/${encodeURIComponent(key)}`, { method: "POST", body: { keywords, location, page, datecreatedfrom: isoDaysAgo(j.max_days_old || 8) }, budget, wait, fetchImpl }); }
        catch (e) { if (e.budgetSpent) throw e; notes.push(`Jooble “${keywords}” in ${location}, page ${page}: ${e.message}`); break; }
        const list = d.jobs || [];
        const seenBefore = list.length > 0 && list.every(r => rows.has(String(r.id)) || seenIds.has(String(r.id)));
        list.forEach(r => seenIds.add(String(r.id)));
        for (const r of list) {
          try {
            const row = mapJooble(r);
            if (row.url && row.title && isAustralian({ location: r.location }) && keep(cfg, row) && !rows.has(row.source_id)) rows.set(row.source_id, row);
          } catch (e) { notes.push(`Skipped a Jooble ad: ${e.message}`); }
        }
        log(`Jooble “${keywords}” / ${location} / page ${page}: ${list.length} ads (${budget.used} of ${max} calls used)`);
        if (!list.length || list.length < 10 || seenBefore) break;   // nothing new here: don't spend calls on later pages
      }
    }
  } catch (e) { if (!e.budgetSpent) throw e; notes.push(`Stopped cleanly: all ${max} Jooble calls for this run were used.`); }
  return { rows: [...rows.values()], calls: budget.used, notes, stoppedAtBudget: budget.spent };
}

/* ---------- Employer feeds ---------- */
// One employer: fetch its whole public feed, keep the Australian jobs. A failed fetch throws, so nothing is deleted for it.
export async function fetchEmployer(emp, { cfg, fetchImpl, wait = limiter(1000) } = {}) {
  const ats = String(emp.ats || "").toLowerCase(), a = ATS[ats];
  if (!a) throw new Error(`Unknown ats “${emp.ats}” for ${emp.name}`);
  const budget = new Budget(60);
  let all = [], offset = 0;
  for (let i = 0; i < 20; i++) {
    const d = await fetchJSON(ats === "smartrecruiters" ? a.url(emp.token, offset) : a.url(emp.token), { budget, wait, fetchImpl });
    const list = a.list(d);
    all.push(...list);
    if (a.more && list.length && a.more(d, offset)) { offset += 100; continue; }
    break;
  }
  const rows = [];
  let total = all.length, notAu = 0, notEng = 0;
  for (const raw of all) {
    const { row, country } = mapEmployerJob(ats, raw, emp);
    if (!row.url || !row.title) continue;
    if (!isAustralian({ location: row.location, country, isRemote: row.is_remote, extra: row.title })) { notAu++; continue; }
    if (!(emp.all || !cfg || keep(cfg, row))) { notEng++; continue; }
    rows.push(row);
  }
  return { rows, total, notAu, notEng, ids: all.length };
}
export async function runEmployers({ cfg, employers, fetchImpl, log = () => {} }) {
  const wait = limiter(1000), results = [], notes = [];
  let calls = 0;
  for (const emp of employers.filter(e => e.active !== false)) {
    try {
      const r = await fetchEmployer(emp, { cfg, fetchImpl, wait });
      calls++;
      results.push({ employer: emp, ok: true, ...r });
      log(`${emp.name} (${emp.ats}): ${r.total} jobs, ${r.rows.length} kept (${r.notAu} outside Australia, ${r.notEng} not engineering)`);
    } catch (e) {
      calls++;
      results.push({ employer: emp, ok: false, error: e.message });
      notes.push(`${emp.name} (${emp.ats}/${emp.token}): ${e.message}. Its existing jobs were left alone.`);
    }
  }
  return { results, rows: results.flatMap(r => (r.ok ? r.rows : [])), calls, notes };
}
