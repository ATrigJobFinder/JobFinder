// Looking at one company: find its job board, check it works and has Australian jobs, and make the row for the employers table.
import { findBoards, detectInText, guessTokens, looksLikeCompany, isSupported } from "./detect.mjs";
import { fetchEmployer } from "./sources.mjs";
import { nameKey } from "./employers.mjs";

export const PROBE_SYSTEMS = ["greenhouse", "lever", "ashby", "workable", "smartrecruiters", "recruitee"];   // the six with documented public boards
const LABELS = { workday: "Workday", pageup: "PageUp", successfactors: "SAP SuccessFactors", taleo: "Taleo", oracle: "Oracle Recruiting", icims: "iCIMS", jobadder: "JobAdder", bamboohr: "BambooHR", breezy: "Breezy HR" };

// Open a board and count its jobs. trust = it came from the company's own careers page, so no need to check it belongs to them.
export async function checkBoard(c, ats, token, { gate, fetchImpl, trust }) {
  try {
    const r = await fetchEmployer({ name: c.name, ats, token }, { engineeringOnly: false, gate, fetchImpl, tries: trust ? 2 : 1, timeout: 15000 });   // a guess that doesn't exist should fail at once, not be retried
    if (!r.total) return { ok: false, reason: "the board is empty" };
    if (!trust && !(r.rows.length && looksLikeCompany(r.sample, c.name, c.website))) return { ok: false, reason: "its jobs don't clearly belong to this company" };
    return { ok: true, total: r.total, au: r.rows.length, titles: r.rows.slice(0, 5).map(j => `${j.title} | ${j.location}`) };
  } catch (e) { return { ok: false, reason: e.message }; }
}

// The row to save in employers. method: careers_page | slug_probe
export function employerRow(c, ats, token, method, res, now = new Date()) {
  const at = now.toISOString(), unsupported = !isSupported(ats);
  return {
    name: c.name, website: c.website || null, ats, token, careers_url: c.careers_url || null,
    status: unsupported ? "paused" : res.au > 0 ? "active" : "no_au_jobs", discovered_via: c.via || method, industry: c.industry || null, hq_state: c.hq_state || null,
    last_checked_at: at, last_success_at: unsupported ? null : at, last_total_jobs: unsupported ? null : res.total, last_au_jobs: unsupported ? null : res.au, consecutive_errors: 0,
    notes: unsupported ? `Uses ${LABELS[ats] || ats}, which has no official public job feed. Waiting for your approval (Tier 3).` : `From ${c.source || "a manual add"}.`,
    name_key: nameKey(c.name) || null, zero_au_weeks: 0
  };
}

// Returns { found: [...], row?, reason }
export async function evaluateCandidate(c, { web, gate, fetchImpl }) {
  const out = { candidate: c, found: [], row: null, reason: "", method: "" };
  // A. the careers page (most reliable)
  if (c.careers_url || c.website) {
    const r = await findBoards(c, web);
    out.found = r.found; out.pages = r.tried.length;
    for (const b of r.found.filter(b => b.supported)) {
      const res = await checkBoard(c, b.ats, b.token, { gate, fetchImpl, trust: true });
      if (res.ok) { out.row = employerRow(c, b.ats, b.token, "careers_page", res); out.res = res; out.method = "careers_page"; return out; }
      out.reason = `${b.ats}/${b.token}: ${res.reason}`;
    }
    const un = r.found.find(b => !b.supported);
    if (un && !out.row) { out.row = employerRow(c, un.ats, un.token, "careers_page", {}); out.method = "careers_page"; out.reason = "needs approval"; return out; }
    if (r.found.length) return out;   // it uses a system we looked at and it failed: don't guess names over a known board
  }
  // B. guess from the name, lightly, and only accept a board that clearly belongs to the company
  const tokens = guessTokens(c.name, c.website);
  for (const ats of PROBE_SYSTEMS) for (const token of tokens) {
    const res = await checkBoard(c, ats, token, { gate, fetchImpl, trust: false });
    if (res.ok) { out.row = employerRow(c, ats, token, "slug_probe", res); out.res = res; out.method = "slug_probe"; return out; }
  }
  if (!out.reason) out.reason = out.pages === 0 ? "its website couldn't be read" : "no job board found";
  return out;
}
export { detectInText };
