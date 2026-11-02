// Running every employer's feed each week, and keeping the employer list healthy.
import { ATS } from "./mappers.mjs";
import { fetchEmployer } from "./sources.mjs";
import { Gate, pool } from "./http.mjs";
import { normCompany } from "./util.mjs";

export const MAX_ERRORS = 3;       // this many failures in a row and an employer is marked broken
export const MAX_ZERO_WEEKS = 8;   // this many weeks with no Australian jobs and it is marked no_au_jobs

// What to write back to an employer's row after a fetch. result = { ok, total, au } or { ok: false, error }
export function nextHealth(emp, result, now = new Date()) {
  const at = now.toISOString();
  if (!result.ok) {
    const errors = (emp.consecutive_errors || 0) + 1;
    return { last_checked_at: at, consecutive_errors: errors, last_error: String(result.error || "failed").slice(0, 300), ...(errors >= MAX_ERRORS ? { status: "broken" } : {}) };
  }
  const patch = { last_checked_at: at, last_success_at: at, last_total_jobs: result.total, last_au_jobs: result.au, consecutive_errors: 0, last_error: null };
  if (result.au > 0) { patch.zero_au_weeks = 0; if (emp.status === "no_au_jobs") patch.status = "active"; }
  else { patch.zero_au_weeks = (emp.zero_au_weeks || 0) + 1; if (patch.zero_au_weeks >= MAX_ZERO_WEEKS && emp.status === "active") patch.status = "no_au_jobs"; }
  return patch;
}
export const nameKey = name => normCompany(name);

// Fetch every employer, a few at a time per hiring system (all the hiring systems run side by side).
// onResult(employer, outcome) is called as each one finishes, so its jobs can be saved straight away instead of all being held in memory.
export async function runEmployerFeeds({ employers, engineeringOnly = false, fetchImpl, log = () => {}, onResult, perSystem = 5, gap = 250 }) {
  const gate = new Gate({ max: perSystem, gap });
  const groups = new Map();
  for (const e of employers) { const k = String(e.ats).toLowerCase(); (groups.get(k) || groups.set(k, []).get(k)).push(e); }
  const stats = { ok: 0, failed: 0, total: 0, au: 0, notAu: 0, notEng: 0, newlyBroken: 0, problems: [] };
  await Promise.all([...groups].map(([ats, list]) => pool(list, perSystem, async emp => {
    let out;
    if (!ATS[ats]) { out = { ok: false, error: `Unsupported hiring system “${emp.ats}”`, unsupported: true }; }
    else {
      try { const r = await fetchEmployer(emp, { engineeringOnly, fetchImpl, gate }); out = { ok: true, total: r.total, au: r.rows.length, notAu: r.notAu, notEng: r.notEng, rows: r.rows }; }
      catch (e) { out = { ok: false, error: e.message }; }
    }
    if (out.ok) { stats.ok++; stats.total += out.total; stats.au += out.au; stats.notAu += out.notAu; stats.notEng += out.notEng; log(`${emp.name} (${emp.ats}): ${out.total} jobs, ${out.au} kept`); }
    else { stats.failed++; stats.problems.push(`${emp.name} (${emp.ats}/${emp.token}): ${out.error}. Its existing jobs were left alone.`); }
    out.patch = nextHealth(emp, out);
    if (out.patch.status === "broken" && emp.status !== "broken") stats.newlyBroken++;
    if (onResult) { try { await onResult(emp, out); } catch (e) { stats.problems.push(`${emp.name}: couldn't save (${e.message})`); } }
    delete out.rows;
  })));
  return stats;
}
