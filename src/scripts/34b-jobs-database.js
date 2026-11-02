/* ===================== Find jobs: the weekly imported listings (Supabase) ===================== */
// A weekly import (see docs/jobs-import.md) saves Australian jobs from Adzuna, Jooble and employers' own career feeds in a Supabase database.
// This page only reads them, with the public (anon) key, which the database allows to read and nothing else.
// The address and public key are JOBS_CFG in 07a. Leave them empty and Find jobs shows its examples.
const jobsDbOn = () => !!(JOBS_CFG.url && JOBS_CFG.anonKey);
const DB_PAGE = 20;
const dbJobs = { rows: [], total: 0, page: 0, ready: false, loading: false, error: "", updated: "", sig: "", seq: 0, timer: null };
const DB_SOURCES = { adzuna: { name: "Adzuna", url: "https://www.adzuna.com.au", type: "aggregator" }, jooble: { name: "Jooble", url: "https://au.jooble.org", type: "aggregator" } };
const dbHeaders = () => ({ apikey: JOBS_CFG.anonKey, Authorization: "Bearer " + JOBS_CFG.anonKey, "Content-Type": "application/json" });
const dbBase = () => JOBS_CFG.url.replace(/\/+$/, "") + "/rest/v1";
// HTML saved by the importer → plain text (parsed without running anything)
function dbText(html) {
  const h = String(html || "");
  if (!/[<&]/.test(h)) return h;
  try {
    const d = new DOMParser().parseFromString(h.replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr)\s*\/?>/gi, "\n").replace(/<li>/gi, "• "), "text/html");
    return (d.body.textContent || "").replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
  } catch { return h.replace(/<[^>]+>/g, " "); }
}
const dbMoney = n => "$" + Math.round(n).toLocaleString("en-AU");
function dbRowToJob(r) {
  const emp = String(r.source).startsWith("employer:"), src = DB_SOURCES[r.source];
  const salary = r.salary_text && !r.salary_min ? r.salary_text : r.salary_min ? `${dbMoney(r.salary_min)}${r.salary_max && r.salary_max !== r.salary_min ? " to " + dbMoney(r.salary_max) : ""}` : "";
  return {
    id: "db" + r.id, key: "db" + r.id, fromDb: true, title: r.title, company: r.company || "", location: r.location || [r.city, r.state].filter(Boolean).join(", "),
    workType: r.job_type || "", remote: r.is_remote ? "Remote" : "", salary, posted: (r.posted_at || r.first_seen_at || "").slice(0, 10),
    source: emp ? `${r.company || "Employer"} careers` : src ? src.name : r.source, srcUrl: src ? src.url : "", sourceType: emp ? "company" : "aggregator", dbSource: r.source,
    url: safeUrl(r.url), description: dbText(r.description), also: []
  };
}
const dbFeed = () => dbJobs.rows.map(dbRowToJob);
const STATE_CODES = /^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/i;
function dbQuery() {
  const w = jobsUI.where.trim(), state = STATE_CODES.test(w) ? w.toUpperCase() : "";
  return { q: jobsUI.q.trim(), p_state: state, p_where: state ? "" : w, p_type: jobsUI.type || "", p_category: "" };
}
async function loadDbJobs(force) {
  if (!jobsDbOn()) return;
  const args = dbQuery(), sig = JSON.stringify([args, dbJobs.page]);
  if (!force && sig === dbJobs.sig && dbJobs.ready) return;
  const seq = ++dbJobs.seq;
  dbJobs.loading = true; dbJobs.error = "";
  if (currentView === "jobs") renderJobs();
  try {
    const res = await fetch(dbBase() + "/rpc/search_jobs", { method: "POST", headers: dbHeaders(), body: JSON.stringify({ ...args, lim: DB_PAGE, off: dbJobs.page * DB_PAGE }), signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(res.status === 404 ? "The jobs tables aren't set up in the database yet." : `The jobs database answered with an error (${res.status}).`);
    const rows = await res.json();
    if (seq !== dbJobs.seq) return;
    dbJobs.rows = rows; dbJobs.total = rows.length ? +rows[0].total : 0; dbJobs.ready = true; dbJobs.sig = sig;
    if (!dbJobs.updated) fetch(dbBase() + "/last_import?select=finished_at", { headers: dbHeaders(), signal: AbortSignal.timeout(15000) }).then(r => r.json()).then(d => { dbJobs.updated = (d[0] && d[0].finished_at) || ""; if (currentView === "jobs") renderJobs(); }).catch(() => {});
  } catch (e) {
    if (seq !== dbJobs.seq) return;
    dbJobs.error = e.name === "TimeoutError" || /fetch|network|load/i.test(e.message) ? "Couldn't reach the jobs database from here. Check your connection." : e.message;
  }
  dbJobs.loading = false;
  if (currentView === "jobs") renderJobs();
}
// below the list: which page, attribution, and when it was last updated
function renderDbExtras(list) {
  const box = $("jbList");
  if (!box) return;
  let el = $("jbDbFoot");
  if (!el) { el = document.createElement("div"); el.id = "jbDbFoot"; el.className = "jb-dbfoot"; box.insertAdjacentElement("afterend", el); }
  if (!jobsDbOn()) { el.innerHTML = ""; return; }
  const pages = Math.max(1, Math.ceil(dbJobs.total / DB_PAGE)), sum = $("jbSummary");
  const ad = dbJobs.rows.some(r => r.source === "adzuna"), jo = dbJobs.rows.some(r => r.source === "jooble");
  const when = dbJobs.updated ? new Date(dbJobs.updated).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";
  if (sum && dbJobs.ready) sum.innerHTML += ` <b>${dbJobs.total.toLocaleString("en-AU")}</b> imported listing${dbJobs.total === 1 ? "" : "s"} match${dbJobs.total === 1 ? "es" : ""} your search${dbJobs.loading ? " (updating…)" : ""}.`;
  if (sum && dbJobs.loading && !dbJobs.ready) sum.textContent = "Loading imported jobs…";
  el.innerHTML = `${dbJobs.error ? `<p class="note-bar" role="alert">${esc(dbJobs.error)} The examples and your own jobs are still shown.</p>` : ""}
    ${dbJobs.ready && pages > 1 ? `<nav class="jb-pager" aria-label="Pages of imported jobs"><button class="btn" type="button" data-jb-page="-1"${dbJobs.page <= 0 || dbJobs.loading ? " disabled" : ""}>← Previous</button><span class="small">Page ${dbJobs.page + 1} of ${pages}</span><button class="btn" type="button" data-jb-page="1"${dbJobs.page >= pages - 1 || dbJobs.loading ? " disabled" : ""}>Next →</button></nav>` : ""}
    <p class="small muted">${when ? `Last updated: ${esc(when)}. ` : ""}Imported every week from employers' own career pages${ad ? ` and <a href="https://www.adzuna.com.au" target="_blank" rel="noopener">Adzuna</a>` : ""}${jo ? `${ad ? " and " : " and "}<a href="https://au.jooble.org" target="_blank" rel="noopener">Jooble</a>` : ""}. Select a job to open the original ad in a new tab.${ad ? ' <a href="https://www.adzuna.com.au" target="_blank" rel="noopener"><b>Jobs by Adzuna</b></a>' : ""}</p>`;
}
onInit(() => {
  if (!jobsDbOn()) return;
  const prev = viewHooks.jobs;
  viewHooks.jobs = () => { if (prev) prev(); loadDbJobs(); };
  const again = () => { dbJobs.page = 0; clearTimeout(dbJobs.timer); dbJobs.timer = setTimeout(() => loadDbJobs(), 350); };
  $("view-jobs").addEventListener("input", e => { if (e.target.dataset.jbf && ["q", "where"].includes(e.target.dataset.jbf)) again(); });
  $("view-jobs").addEventListener("change", e => { if (e.target.dataset.jbf && ["type", "where", "q"].includes(e.target.dataset.jbf)) again(); });
  $("view-jobs").addEventListener("click", e => {
    const b = e.target.closest("[data-jb-page]");
    if (!b) return;
    dbJobs.page = Math.max(0, dbJobs.page + +b.dataset.jbPage);
    loadDbJobs();
    smoothTo($("jbList"), 90);
  });
});
