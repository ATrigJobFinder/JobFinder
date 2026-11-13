/* ===================== Writing the cover letter with AI: one prompt, split into the paragraph boxes ===================== */
// The prompt is built in 14c-letter-advice.js: a summary of the Cover Letter Advice page, your resume (the profile as resume text), the job ad and a few
// details. The AI writes the whole letter in one go; the answer is split into paragraphs and each goes in its own box (Opening, Experience,
// Education and skills, Why this company, Close). No other AI prompt writes the letter. What is left in this file is code: choosing the jobs and
// study the standard (no AI) letter uses, marking details the AI made up, and the checks run on the finished letter.

/* --- The facts the page and the standard letter use --- */
const lwClean = t => String(t || "").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();
// Strength of one line of evidence: a number and a result beat a duty
const lwStrength = b => (/\b(used in|led to|resulted in|reduced|increased|improved|saved|cut|grew|raised|delivered|launched|won|doubled|halved|informed)\b/i.test(b) ? 2 : 0) + (/\d/.test(b) ? 3 : 0) + (/[%$]/.test(b) ? 1 : 0) + (ACTION_START.test(b) ? 1 : 0) + (wordCount(b) >= 8 ? 1 : 0);
const lwBestBullets = (bullets, n) => bullets.map((b, i) => ({ b: lwClean(b), i })).filter(x => x.b)
  .map(x => ({ ...x, s: lwStrength(x.b) }))
  .sort((a, c) => c.s - a.s || a.i - c.i).slice(0, n).sort((a, c) => a.i - c.i).map(x => x.b);
// Work experience the letter can use. A resume that was uploaded keeps its jobs as drafts until each is finished in the builder, so drafts count
// here too (only a job the person hid is left out). A job's lines are its bullet points or, when it has none, what they typed in answer to the
// builder's questions (what they did, what they achieved).
function lwJobLines(e) {
  const own = (e.bullets || []).map(lwClean).filter(Boolean);
  if (own.length) return own;
  const a = e.answers || {};
  return [a.wins, a.duties].flatMap(t => String(t || "").split(/\n+|;|(?<=[.!?])\s+/)).map(lwClean).filter(x => wordCount(x) >= 3);
}
const lwWorkMemo = new WeakMap();
function lwWork(e) {   // the same job gives the same object each time, so one line of evidence is recognised as the same line
  const lines = lwJobLines(e), sig = lines.join("\n"), m = lwWorkMemo.get(e);
  if (m && m.sig === sig) return m.v;
  const v = { ...e, bullets: lines }; lwWorkMemo.set(e, { sig, v });
  return v;
}
const lwAllJobs = p => p.experience.filter(e => !e.hidden && (e.title || e.org)).map(lwWork);
// Closest to the job being applied for first (the title typed on the Layout step, the role on the letter, and the kind of work), then the most recent
function lwRankJobs(p, list) {
  const want = contentWords([p.target.title, !ltTemplate() ? BL().role : "", p.target.jobType ? jobLabel(p.target.jobType) : "", ...(COMMON_SKILLS[p.target.jobType] || { hard: [] }).hard].join(" "));
  const score = e => { let n = 0; for (const w of contentWords([e.title, e.org, ...e.bullets].join(" "))) if (want.has(w)) n += 2; return n + e.bullets.filter(b => /\d/.test(b)).length; };
  return list.map((e, i) => ({ e, i, s: score(e) })).sort((a, b) => b.s - a.s || a.i - b.i).map(x => x.e);
}
// The jobs that have something to tell, best match first
function lwJobs(p) { return lwRankJobs(p, lwAllJobs(p).filter(e => e.bullets.length)); }
// Qualifications, highest level first (a doctorate, then a master's, then an honours or bachelor's degree, and so on down to school), then newest first.
// An uploaded resume's study is a draft until it is finished in the builder: it counts here too (only study the person hid is left out).
const LW_RANK = { y10: 0, y12: 1, short: 2, other: 2, c1: 3, c2: 4, c3: 5, c4: 6, dip: 7, adip: 8, assoc: 9, bach: 10, hons: 11, gcert: 12, gdip: 13, master: 14, phd: 15 };
function lwQualRank(e) {
  if (e.level && LW_RANK[e.level] != null) return LW_RANK[e.level];
  const t = String(e.degree || "").toLowerCase();
  return /doctor|ph\.?d/.test(t) ? 15 : /master|\bm\.?(eng|sc|ba|com)\b/.test(t) ? 14 : /graduate diploma/.test(t) ? 13 : /graduate cert/.test(t) ? 12 : /honours|\bhons\b/.test(t) ? 11 : /bachelor|\bb\.?(sc|a|eng|com)\b/.test(t) ? 10 : /associate/.test(t) ? 9 : /advanced diploma/.test(t) ? 8 : /diploma/.test(t) ? 7 : /certificate iv/.test(t) ? 6 : /certificate iii/.test(t) ? 5 : /certificate/.test(t) ? 3 : /year 1[012]|hsc|vce|atar|wace|qce|sace/.test(t) ? 1 : 2;
}
function lwStudyList(p) {
  return p.education.filter(e => !e.hidden && (e.degree || e.inst)).map((e, i) => ({ e, i, r: lwQualRank(e), end: e.current ? 9e9 : (LR.parseYM(e.end, true) || 0) }))
    .sort((a, b) => b.r - a.r || b.end - a.end || a.i - b.i).map(x => x.e);
}
// The qualification the standard (no AI) letter is built around: the highest one
// (or the one the person chose in "What your letter is written from")
const lwEdu = p => { const u = (BL().use || {}).study; return (u && lwStudyList(p).find(e => lwStudyKey(e) === u)) || lwStudyList(p)[0] || null; };
// "Thesis: Title" or a plain title → "Major project: Title" (the letter always says major project)
const lwMajor = s => { const r = projRow(s); return r.title ? `Major project: ${r.title}` : ""; };
// What the AI is given about study: one line per qualification, highest first, with its project, awards and results kept on that line
function lwStudyText(p) {
  return lwStudyList(p).map((e, i) => {
    const where = lwClean(e.inst), st = lwEduStatus(e).inProgress ? "in progress" : "completed";
    const bits = [`${i + 1}. ${lwClean(e.degree) || "(qualification)"}${where ? ` at ${where}` : ""}${e.location ? ` (${lwClean(e.location)})` : ""}; ${st}${e.end ? `, ${showDate(e.end)}` : ""}`];
    if (val(e.project)) bits.push(`${lwMajor(e.project).replace(/^Major project:/, "major project")}${where ? ` (done at ${where})` : ""}`);
    for (const m of e.projectsMore || []) { const t = lwMajor(m); if (t) bits.push(`${t.replace(/^Major project:/, "major project")}${where ? ` (done at ${where})` : ""}`); }
    const aw = String(e.awards || "").split(/\n|;/).map(lwClean).filter(Boolean); if (aw.length) bits.push(`award or scholarship${where ? ` from ${where}` : ""}: ${aw.join("; ")}`);
    const g = typeof gradeText === "function" ? gradeText(e) : ""; if (g) bits.push(lwClean(g));
    return bits.join("; ");
  }).join("\n");
}
const lwStudy = e => e ? [e.degree, e.inst].filter(Boolean).join(", ") + (e.current ? (e.end ? `, finishing ${showDate(e.end)}` : ", currently studying") : e.end ? `, finished ${showDate(e.end)}` : "") : "";
const lwJobLine = e => `${[e.title, e.org].filter(Boolean).join(" at ")}${rangeOf(e) ? ` (${rangeOf(e)})` : ""}`;
// Where a degree stands today, worked out here in code and handed to the writers as words (a model guesses the tense)
function lwEduStatus(e) {
  const now = new Date(), nowM = now.getFullYear() * 12 + now.getMonth(), end = LR.parseYM(e.end, true);
  const inProgress = !!e.current || (end != null && end > nowM);
  return inProgress ? { inProgress, say: `in progress: say "I am completing", never "I hold" or "I have"` } : { inProgress, say: `completed: say "I hold" or "I recently completed"` };
}
// The names in the resume that the letter must not keep repeating: a credential or a date in one paragraph only, a tool, a project or an employer in two
function lwKeyTerms(p) {
  const out = [], seen = new Set();
  const add = (term, kind, limit) => { term = lwClean(term); const k = term.toLowerCase(); if (term.length < 3 || seen.has(k)) return; seen.add(k); out.push({ term, kind, limit }); };
  const FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dates = x => { const m = String(x || "").match(/([A-Za-z]{3})[a-z]*\.?\s*,?\s*(\d{4})/), i = m ? FULL.findIndex(f => f.slice(0, 3).toLowerCase() === m[1].toLowerCase()) : -1; return i < 0 ? [] : [`${FULL[i]} ${m[2]}`, `${FULL[i].slice(0, 3)} ${m[2]}`]; };
  for (const e of p.education.filter(e => !e.hidden)) {
    add(String(e.degree || "").replace(/\s*\(.*\)\s*$/, ""), "credential", 1); add(e.inst, "credential", 1);
    if (val(e.project)) add(lwClean(val(e.project)).replace(/^(thesis|project|capstone)\s*:\s*/i, ""), "project", 2);
    [e.start, e.end].forEach(x => dates(x).forEach(d => add(d, "date", 1)));
  }
  for (const e of p.experience.filter(e => !e.hidden)) { add(e.org, "employer", 2); [e.start, e.end].forEach(x => dates(x).forEach(d => add(d, "date", 1))); }
  for (const x of p.projects.filter(x => x.done !== false)) add(x.name, "project", 2);
  for (const t of p.skills.software) add(t, "tool", 2);
  return out;
}

// The resume the AI reads: the profile as resume text. Jobs and study that came from an uploaded resume are still drafts until each is
// finished in the builder, so they are counted here too (a job with no bullet points is told from what was typed in answer to the builder's questions).
function lwResumeText() {
  const p = P(), fin = list => (list || []).map(e => ({ ...e, done: true }));
  return profileToText({ ...p, experience: p.experience.map(e => ({ ...lwWork(e), done: true })), education: fin(p.education).map(e => ({ ...e, project: val(e.project) ? lwMajor(e.project) : "", projectsMore: (e.projectsMore || []).map(lwMajor).filter(Boolean) })), projects: fin(p.projects), volunteering: fin(p.volunteering) });
}
// What the one prompt carries besides the advice and the resume (see advicePrompt in 14c-letter-advice.js). only: the box being written, or -1 for the whole letter
function lwInputs(only) {
  const p = P(), d = BL(), tpl = ltTemplate(), extra = [];
  d.parts.forEach(x => {
    if (x.detail) extra.push(`The applicant adds, for the ${partOf(x.part).label} paragraph (their own words): ${lwClean(x.detail)}`);
    if (x.altIx) extra.push(`For the ${partOf(x.part).label} paragraph, use a different example from the resume than the most obvious one.`);
  });
  const others = only >= 0 ? d.parts.filter((x, k) => k !== only && x.text.trim() && !/[\[\]{}]/.test(x.text)).map(x => x.text.trim()) : [];
  // requirements the person chose to ignore (see the panel "What your letter is written from"): the letter must not claim or mention them
  // what the person chose in "What your letter is written from": the line to lead with, the qualification, the skills, and the proof for each requirement
  const u = lwUse(), proofs = lwProofs(), best = lwBestProof(proofs);
  if (u.proof && best) extra.push(`The applicant chose this as their strongest proof, so lead the letter with it and keep its facts exactly: "${lwClean(best.text)}"${best.kind === "own" ? " (their own words)" : best.at ? ` (from ${best.at})` : ""}`);
  if (u.study) { const e = lwEdu(p); if (e) extra.push(`Build the Education paragraph around this qualification: ${lwStudy(e)}`); }
  if (Array.isArray(u.skills) && u.skills.length) extra.push(`The applicant wants these skills named in the letter, and only these: ${u.skills.join(", ")}`);
  for (const [k, v] of Object.entries(u.needProof)) { const need = lwNeeds(proofs).find(n => lrKey(n.need) === k); if (!need) continue; extra.push(v === "-" ? `The applicant has no evidence for this requirement from the ad, so do not mention it or claim it anywhere in the letter: "${lwClean(need.need)}"` : `For the ad's requirement "${lwClean(need.need)}", use this as the proof: "${lwClean(v)}"`); }
  for (const t of Object.values(ltPlan().ignored || {})) if (t) extra.push(`The applicant has no evidence for this requirement from the ad, so do not mention it or claim it anywhere in the letter: "${lwClean(t)}"`);
  return { effort: lwTakesEffort() ? lwEffort() : "", jobWords: ltJobWords(), resume: lwResumeText(), study: lwStudyText(p), template: tpl, ad: tpl ? "" : d.ad, role: lwClean(d.role) || lwClean(p.target.title), company: lwClean(d.company), why: tpl ? "" : lwClean(d.why), avail: lwClean(d.avail) || availabilityText(p), needs: tpl ? "" : d.needs, extra, others, words: letterRange() };
}

// Put a paragraph in the letter and the box
function lwApply(i, text) {
  const p = BL().parts[i]; p.text = text;
  const el = $("ltp-" + i); if (el) el.value = text;
  lwMarkMadeUp(i);
  baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor();
}
let lwBusy = false;
// What the AI is doing, in the paragraph's own box, with the moving bar the resume builder uses
const lwProgress = i => m => { const b = $("lts-" + i); if (b) { b.dataset.menu = ""; b.innerHTML = `<p class="progress">${esc(m)}</p>`; } };
const lwProgressEnd = i => { const b = $("lts-" + i); if (b && b.querySelector(".progress") && !b._alts) b.innerHTML = ""; };
// One paragraph, from its Write with AI button: the same one prompt writes the whole letter, and only this box is filled from the answer
async function lwWriteOne(i, btn) {
  if (lwBusy) return;
  const note = $("ltx-" + i), acts = $("lta-" + i);
  if (!hasProfile(P())) { if (note) note.textContent = "Add your details in the resume builder first, so there's something to write from."; return; }
  if (!ltTemplate() && !BL().role && P().target.title) BL().role = P().target.title;
  // never without the job title, the employer and what the employer is looking for
  const g = ltGate(); if (!g.ok) { ltGateSay(g, note); return; }
  lwBusy = true; if (acts) acts.dataset.busy = "1"; if (btn) btn.disabled = true;
  try {
    const r = await adviceWrite(lwInputs(i), lwProgress(i));
    lwProgressEnd(i);
    if (acts) delete acts.dataset.busy;
    const text = r.paragraphs && r.paragraphs[i], n2 = () => $("ltx-" + i);   // (looked up again after lwApply, which redraws the buttons and the note)
    if (text) { lwApply(i, BL().parts[i].part === "closing" ? ltEnsureClose(text) : text); if (n2()) n2().textContent = `Written by ${viaWords(r.res.via)} from your resume and the Cover Letter Advice. Check every detail is true and sounds like you.`; }
    else if (r.paragraphs) { if (n2()) n2().textContent = "The AI's letter had no paragraph for this box. Try again, or write it yourself."; }
    else if (n2()) n2().innerHTML = aiMissHtml(aiMissWords(r.res)) + " Write it yourself, or start from your profile." + aiRawHtml(r.res);
  } finally { lwBusy = false; if (acts) delete acts.dataset.busy; if (btn) btn.disabled = false; }
}

// The words that belong to the job itself (its title and field), which the checks let the letter repeat, and which the AI is told it may repeat
const ltJobWords = () => { try { const p = P(), d = BL(); return clJobWords(d.role, p.target.title, p.target.jobType ? jobLabel(p.target.jobType) : ""); } catch { return []; } };
// The effort choice above Write all: low, medium or high, each with how long it should take
function ltEffortRender() {
  const box = $("ltEffort");
  if (!box) return;
  const show = lwTakesEffort();
  box.hidden = !show;
  if (!show) { box.innerHTML = ""; return; }
  const cur = lwEffort(), words = letterRange()[1];
  box.innerHTML = `<div class="q-label" id="ltEffL">How hard should the AI think? <span class="opt">(for Write all and Write with AI)</span></div><div class="seg seg-fill lt-effort-seg" role="group" aria-labelledby="ltEffL">${Object.entries(LW_EFFORT).map(([k, o]) => `<button type="button" data-lt-effort="${k}" aria-pressed="${cur === k}"><span>${o.label}${k === "high" ? " (recommended)" : ""}</span><small>${lwSayTime(lwEstimateSec(words, k))}</small></button>`).join("")}</div><p class="small muted">${esc(LW_EFFORT[cur].note)}. Times are for about ${words} words, and come from your own recent letters once there are some.</p>`;
}
onInit(() => { aiChangeListeners.add(() => ltEffortRender()); });
// The checks from the fix brief, run on the finished letter (and again whenever the preview is drawn): [{ i, type, detail }]
function ltValidate() {
  const d = BL(); if (ltTemplate()) return [];
  const idx = BL().parts.map((x, i) => i).filter(i => BL().parts[i].text.trim());
  const p = P(), creds = p.education.filter(e => !e.hidden && (e.degree || e.inst) && lwEduStatus(e).inProgress).map(e => lwClean(e.degree)).filter(Boolean);
  const issues = LR.validateLetter(idx.map(i => ({ kind: BL().parts[i].part, text: BL().parts[i].text })), { length: ltLength(), jobTitle: lwClean(d.role), employer: lwClean(d.company), creds, terms: lwKeyTerms(p), wordLimit: ltWordLimit() });
  return issues.map(x => ({ ...x, i: idx[x.i] }));
}
/* --- How long writing takes: shown under Write all, from this person's own recent times on this AI, or a rough guess for the kind of AI --- */
const LW_TIMES_KEY = "jobfinder.letterWriteTimes.v1";
const lwEngineKey = () => aiCfg.engine === "key" ? `key:${aiCfg.key.provider}:${aiCfg.key.model}` : aiCfg.engine;
const lwTimes = () => { try { const l = JSON.parse(localStorage.getItem(LW_TIMES_KEY) || "[]"); return Array.isArray(l) ? l : []; } catch { return []; } };
// How hard the AI thinks before it writes: low, medium or high (high is recommended). It only applies to AIs that think (Gemini's newer models, gpt-oss).
// Each level is taken to be about this many times as long as medium, until the person's own recent times say otherwise.
const LW_EFFORT = { low: { label: "Low", mult: 0.5, note: "A quick first draft" }, medium: { label: "Medium", mult: 1, note: "Balanced" }, high: { label: "High", mult: 2, note: "Recommended: the best writing, and the fewest fixes afterwards" } };
const lwEffort = () => { const e = (BL() || {}).effort; return LW_EFFORT[e] ? e : "high"; };
// Does the AI in use take an effort level?
const lwTakesEffort = () => aiCfg.engine === "key" && aiUsable("key") && ((aiCfg.key.provider === "gemini" && GEMINI_THINKS_RE.test(aiCfg.key.model || "")) || aiOssReasoning(aiCfg.key.model || ""));
function lwTimeSave(words, ms, eff = lwEffort()) { try { localStorage.setItem(LW_TIMES_KEY, JSON.stringify([...lwTimes(), { eng: lwEngineKey(), words, ms, eff }].slice(-16))); } catch { /* storage blocked */ } }
function lwEstimateSec(words, eff = lwEffort()) {
  const thinks = lwTakesEffort(), mult = thinks ? LW_EFFORT[eff].mult : 1, med = x => x.slice().sort((a, b) => a - b)[Math.floor(x.length / 2)];
  const mine = lwTimes().filter(x => x.eng === lwEngineKey() && x.words > 100);
  // this person's own times at this level; or at another level, scaled to this one
  const same = mine.filter(x => !thinks || (x.eff || "high") === eff).slice(-4), other = mine.slice(-4);
  if (same.length) return Math.max(5, Math.round(med(same.map(x => x.ms / 1000 / x.words)) * words));
  if (thinks && other.length) return Math.max(5, Math.round(med(other.map(x => x.ms / 1000 / x.words / LW_EFFORT[x.eff || "high"].mult)) * mult * words));
  if (BROWSER_ENGINES.has(aiCfg.engine)) { const m = browserModel(aiCfg.engine, aiCfg.engine === "tfjs" ? aiCfg.tfjsModel : aiCfg.webllmModel); return m ? Math.round(aiEstimate(aiCfg.engine, m.id, 3500, words * 7)) : 60; }
  if (aiCfg.engine === "key") return Math.round((12 + words * 0.05) * mult);   // a hosted model: a few seconds to start, then quick; thinking harder takes longer
  return Math.round(15 + words * 0.2);   // the browser's own AI
}
const lwSayTime = s => s < 50 ? `about ${Math.max(5, Math.round(s / 5) * 5)} seconds` : s < 90 ? "about a minute" : `about ${Math.round(s / 60)} minutes`;
// A progress line that also says the estimate and how long it has taken so far
function lwTimedStatus(el, estSec) {
  let base = "", t0 = Date.now(), timer = setInterval(() => draw(), 1000);
  const draw = () => { const s = Math.round((Date.now() - t0) / 1000); if (el) el.textContent = `${base} Estimated time: ${lwSayTime(estSec)}${s >= 3 ? ` (${s} s so far)` : ""}.`; };
  return { set(m) { base = String(m || "").trim(); draw(); }, stop() { clearInterval(timer); }, ms: () => Date.now() - t0 };
}
// Start from my profile / Write all: one prompt (the Cover Letter Advice, your resume and the ad) writes the whole letter, and the answer is split into the paragraph boxes
async function lwStart(btn) {
  if (lwBusy) return;
  // pressed from "Write all" above the paragraphs: the progress shows under that button; from the top of the page it shows there
  const fromAll = !!btn && btn.id === "ltWriteAll", st = (fromAll && $("ltWriteStatus")) || $("ltStatus"), tpl = ltTemplate();
  if (!tpl && !BL().role && P().target.title) BL().role = P().target.title;
  // for a specific job with no job title, employer or requirements no AI is called: say what is missing (a template needs none of them)
  if (!tpl) { const g = ltGate(); if (!g.ok) { ltShowStep(1); ltGateSay(g, st); return; } }
  if (!ltAdGate()) return;
  const fallback = letterFromProfile(P());
  lwBusy = true; btn.disabled = true; st.classList.add("busy");
  ltShowStep(1); if (!fromAll) window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
  const was = BL().parts;
  BL().parts = COVER_PARTS.map((p, k) => ({ part: p.key, text: "", detail: was[k] && was[k].detail, altIx: was[k] && was[k].altIx }));
  baseLetter.save(true); renderLetterPage();
  let r = { paragraphs: null, res: null };
  const tm = lwTimedStatus(st, lwEstimateSec(letterRange()[1])), effortUsed = lwTakesEffort() ? lwEffort() : "";
  try {
    tm.set("Writing your cover letter from your resume and the Cover Letter Advice…");
    r = await adviceWrite(lwInputs(-1), m => tm.set(m));
  } finally { tm.stop(); lwBusy = false; btn.disabled = false; st.classList.remove("busy"); }
  // The highest Gemini model is the only one that writes a cover letter. If it can't, nothing is written: the letter you had is put back, with the reason.
  if (r.res && r.res.error && r.res.error.code === "top_only") {
    BL().parts = was; baseLetter.save(true); renderLetterPage();
    st.innerHTML = aiMissHtml(r.res.error.message);
    return;
  }
  if (r.paragraphs && r.res && r.res.via === "big") lwTimeSave(wordCount(r.paragraphs.join(" ")), tm.ms(), effortUsed || "high");
  const res = r.res, stopped = !!(res && res.cancelled), noAi = !!(res && !res.tried.length && !stopped), filled = [];
  COVER_PARTS.forEach((part, i) => {
    const text = r.paragraphs && r.paragraphs[i], note = () => $("ltx-" + i);
    if (text) { lwApply(i, part.key === "closing" ? ltEnsureClose(text) : text); filled.push(i); if (note()) note().textContent = `Written by ${viaWords(res.via)}. Check every detail is true.`; }
    else if (!r.paragraphs) {
      // nothing usable from the AI: the standard version, so the letter is never left with a hole in it
      lwApply(i, part.key === "closing" ? ltEnsureClose(fallback[i].text) : fallback[i].text);
      if (note()) note().textContent = stopped ? "Stopped. The standard version (written without AI) is here instead." : noAi ? "Written without AI (none is connected)." : "The standard version, written from your profile without AI.";
    } else if (note()) note().textContent = "The AI's letter had no paragraph for this box. Press Write with AI to try again, or write it yourself.";
  });
  const todo = ltValidate().filter(x => x.type !== "spelling").length;
  const tail = (tpl && !stopped ? " This is a template for any job: the job title and company are yellow placeholders. Fill them in for each job, or choose “A specific job” for a letter written to one ad." : "")
    + (todo && !stopped ? ` ${todo} thing${todo === 1 ? "" : "s"} to look at under “Before you send it”.` : "");
  if (filled.length) st.textContent = `Written by ${viaWords(res.via)} from your resume and the Cover Letter Advice, then split into the paragraphs below${filled.length < COVER_PARTS.length ? ` (${filled.length} of ${COVER_PARTS.length}: press Write with AI on an empty box to try again)` : ""}. Check every detail is true, and make each paragraph sound like you.` + tail;
  else if (stopped) st.textContent = "Stopped. The standard version (written without AI) is in the boxes. Press Write with AI on any paragraph to try again." + tail;
  else if (noAi) st.textContent = "No AI is connected, so this was written from your profile without one. Choose an AI (top bar) and press Write with AI on any paragraph. Fill in anything in [brackets]." + tail;
  else { const raw = aiRawHtml(res); st.innerHTML = `${aiMissHtml(aiMissWords(res))} The standard version is in the boxes instead${raw ? `; here is what the AI wrote:${raw}` : "."}${esc(tail)}`; }
  syncBaseToTailor();
  // When the AI wrote the letter, it then fixes what is listed under "Before you send it". Its fix is kept only if it breaks fewer rules than the letter as written.
  if (filled.length && !stopped && !tpl && ltProblemCount(BL().parts.map(x => x.text)) > 0) {
    const wrote = st.textContent;
    btn.disabled = true; st.classList.add("busy");
    ltFull.autoNote = "";
    try { await lfRun({ into: st, auto: true, lead: `${wrote} Now fixing what is listed under “Before you send it”. ` }); }
    finally { btn.disabled = false; st.classList.remove("busy"); }
    st.textContent = `${wrote} ${ltFull.autoNote}`.trim();
  } else if (filled.length && !stopped && tpl && LT_TEMPLATE_FIX && ltProblemCount(BL().parts.map(x => x.text)) > 0) {
    // a template for any job: one sentence per problem, reworded by the small model (see 23f; LT_TEMPLATE_FIX switches it off)
    const wrote = st.textContent;
    btn.disabled = true; st.classList.add("busy");
    try { await ltTemplateFix(st, `${wrote} `); }
    finally { btn.disabled = false; st.classList.remove("busy"); }
  }
}

/* --- How many words fit the page, split between the paragraphs --- */
// Measured from the preview: how tall a word is at this design, spacing and margins, and how much of the page is left once the heading,
// address block and sign-off are in. The paragraphs get shares of it in rough proportion (see PART_SHARE).
let ltFitW = 0;
function ltFitRange() { return ltFitW ? [Math.round(ltFitW * 0.88 / 10) * 10, ltFitW] : null; }
function ltMeasureFit(root = "#ltPaper") {
  const ps = [...document.querySelectorAll(root + " .lt-p")], sheet = document.querySelector(root + " .lt-sheet");
  if (ps.length < 2 || !sheet) return false;
  const last = ps[ps.length - 1], top = ps[0].offsetTop, bottom = last.offsetTop + last.offsetHeight, bodyH = bottom - top;
  const words = ps.reduce((a, el) => a + wordCount(el.textContent), 0);
  if (bodyH < 100 || words < 40) return false;
  const name = sheet.querySelector(".lt-signname"), endY = name ? name.offsetTop + name.offsetHeight : bottom;
  const after = (endY - bottom) + (parseFloat(getComputedStyle(sheet).paddingBottom) || 0);
  const avail = 1123 - top - after;   // an A4 page is 1123 px tall in the preview
  const w = Math.floor(words * avail / bodyH * 0.97 / 10) * 10;
  if (!(w >= 150 && w <= 1200) || w === ltFitW) return false;
  ltFitW = w;
  return true;
}
function ltTargetText() {
  const el = $("ltTarget"), r = letterRange();
  if (el) el.textContent = ltFitW ? `About ${ltFitW} words fit on one page at your spacing and margins. Aim for ${r[0]} to ${r[1]} words in all, shared out between the paragraphs.` : `Aim for ${r[0]} to ${r[1]} words in all.`;
}

/* --- Made-up details: red in the paragraph; hover to keep (saved to your profile) or discard --- */
const lwEsc = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Numbers and skills in AI-written text that aren't in your profile (or already approved)
function madeUpIn(text) {
  const p = P(), d = BL(), src = [profileToText(p), (d.use || {}).proof, d.role, d.company, d.recipient, d.why, d.avail, ...(p.prefs.okFacts || [])].join("\n");
  const clean = String(text).replace(TOKEN_RE, " "), okNums = new Set(numsOf(src)), have = skillSet(src), out = new Set();
  TOKEN_RE.lastIndex = 0;
  for (const n of numsOf(clean)) if (!okNums.has(n) && !/^(19|20)\d{2}$/.test(n)) out.add(n);
  const nt = norm(clean);
  for (const [name, info] of findSkills(nt)) {
    if (info.skill.kind !== "hard" || have.has(name)) continue;
    // the words as they're written in the letter
    info.skill.re.lastIndex = 0; const m = info.skill.re.exec(nt); let surf = "";
    if (m) { const f = clean.match(new RegExp(lwEsc(m[0]), "i")); if (f) surf = f[0]; }
    if (!surf && clean.toLowerCase().includes(name.toLowerCase())) surf = name;
    if (surf) out.add(surf);
  }
  return [...out];
}
function lwMarkMadeUp(i) {
  const p = BL().parts[i];
  if (!p) return;
  p.madeUp = madeUpIn(p.text);
  lwBack(i, p.text);
}
// The sentences of paragraph i that a warning under "Before you send it" is about: [[start, end], ...] character positions in `text`.
// (a warning about the whole paragraph, such as "too short", has no sentence to mark)
function lwFlagRanges(i, text) {
  if (typeof ltQualityNow === "undefined" || !ltQualityNow.length || !String(text).trim()) return [];
  const ss = ltSentences(text), joined = ss.join("") === String(text);   // (the sentences must add up to the text, or their positions would be wrong)
  const starts = []; let at = 0;
  for (const s of ss) { starts.push(at); at += s.length; }
  const gaps = [...String(text).matchAll(new RegExp(GAP_SRC, "g"))].map(m => [m.index, m.index + m[0].length]);   // a [gap] keeps its own yellow
  const hit = new Set(), words = [];
  for (const q of ltQualityNow) if ((q.where || []).includes(i)) {
    // a warning about particular words ("Repeated words", "The same words in two paragraphs") marks just those words
    const f = (q.fixes || []).find(x => x.i === i) || q, found = lwFindMarks(text, f.marks, f.markFirst).filter(([a, z]) => !gaps.some(([ga, gz]) => a < gz && z > ga));
    if (found.length) { words.push(...found); continue; }
    if (!joined) continue;
    const t = ltFixTarget(q, i, text); if (t.sel >= 0) hit.add(t.sel);
  }
  const sents = [...hit].map(k => [starts[k], starts[k] + ss[k].replace(/\s+$/, "").length]);
  return [...sents, ...words].sort((a, b) => a[0] - b[0]);
}
// Where each word or phrase in `terms` is in `text` (whole words, any capitals, any punctuation between the words of a phrase): [[start, end], ...].
// first: only the first place each one appears (for "starts the same way")
function lwFindMarks(text, terms, first) {
  const out = [], sep = "[^\\p{L}\\p{N}]+";
  for (const term of terms || []) {
    const ws = String(term).split(/\s+/).filter(Boolean);
    if (!ws.length) continue;
    const re = new RegExp("(?<![\\p{L}\\p{N}'’-])" + ws.map(w => lwEsc(w).replace(/['’]/g, "['’]")).join(sep) + "(?![\\p{L}\\p{N}'’-])", "giu");
    for (let m; (m = re.exec(text)); ) { out.push([m.index, m.index + m[0].length]); if (first) break; if (!m[0]) re.lastIndex++; }
  }
  return out;
}
// The text behind the box: gaps in yellow, made-up details in red, and sentences with a warning in soft yellow
function lwBack(i, text) {
  const back = $("ltb-" + i);
  if (!back) return;
  const p = BL().parts[i] || {}, terms = (p.madeUp || []).filter(t => t && String(text).includes(t)).filter((t, k, a) => !a.some(o => o !== t && o.includes(t)));
  const flags = lwFlagRanges(i, String(text));
  const segs = String(text).split(new RegExp("(" + GAP_SRC + ")"));   // gaps sit at the odd places
  const draw = (s, k) => {
    if (k % 2) return gapHtml(s);
    let h = esc(s);
    for (const t of terms) { const e = esc(t); h = h.split(e).join(`<mark class="made-up" data-term="${e}">${e}</mark>`); }
    return h;
  };
  let at = 0;
  back.innerHTML = segs.map((s, k) => {
    const from = at; at += s.length;
    // cut the piece wherever a marked sentence starts or ends, and wrap the parts inside one
    const cuts = [...new Set(flags.flat().filter(x => x > from && x < at).map(x => x - from))].sort((a, b) => a - b);
    const bounds = [0, ...cuts, s.length];
    let out = "";
    for (let b = 0; b < bounds.length - 1; b++) {
      const piece = s.slice(bounds[b], bounds[b + 1]);
      if (!piece) continue;
      const mid = from + bounds[b], inside = flags.some(([a, z]) => mid >= a && mid < z);
      // a gap is never cut (the sentences are found with gaps masked), so a gap piece is always whole
      const html = draw(piece, k);
      out += inside ? `<mark class="ck-flag">${html}</mark>` : html;
    }
    return out;
  }).join("") + "\n";
}
// Keep it: it's saved to your profile, so it isn't flagged again
function lwKeep(i, term) {
  const p = P();
  if (/^[0-9]/.test(term)) { p.prefs.okFacts = [...new Set([...(p.prefs.okFacts || []), term])]; }
  else {
    const hit = findSkills(norm(term)).keys().next().value, kind = ((SKILLS.find(s => s.name === hit) || {}).kind) || "hard", list = kind === "soft" ? p.skills.soft : p.skills.hard;
    if (!list.some(x => norm(x) === norm(term))) list.push(term);
  }
  lwDropTerm(i, term);
  touchProfile("letter");
}
// Discard it: a figure becomes a gap to fill in; a skill is taken out, and the list around it tidied
function lwDiscard(i, term) {
  const bp = BL().parts[i], e = lwEsc(term);
  let t = bp.text;
  if (/^[0-9]/.test(term)) t = t.replace(new RegExp("(?<![\\w.])" + e + "(?![\\w])"), "[a figure]");
  else {
    const before = t;
    t = t.replace(new RegExp("(,\\s*)?\\band\\s+" + e + "\\b", "i"), "");
    if (t === before) t = t.replace(new RegExp("\\b" + e + "\\s*(,|and)\\s*", "i"), "");
    if (t === before) t = t.replace(new RegExp(",\\s*" + e + "\\b", "i"), "");
    if (t === before) t = t.replace(new RegExp("\\b" + e + "\\b", "i"), "");
    t = t.replace(/\s+([,.])/g, "$1").replace(/\s{2,}/g, " ").trim();
  }
  bp.text = t;
  const el = $("ltp-" + i); if (el) el.value = t;
  lwDropTerm(i, term);
  baseLetter.save(true); partCount(i); renderLetterPreview(); syncBaseToTailor();
}
function lwDropTerm(i, term) {
  const bp = BL().parts[i]; bp.madeUp = (bp.madeUp || []).filter(x => x !== term);
  lwBack(i, bp.text); baseLetter.save(true); renderLetterPreview();
}
onInit(() => {
  const parts = $("ltParts");
  if (!parts) return;
  let pop = null, hideT = 0, cur = null;
  const hide = () => { if (pop) pop.hidden = true; cur = null; };
  const hideSoon = () => { clearTimeout(hideT); hideT = setTimeout(hide, 350); };
  const make = () => {
    if (pop) return pop;
    pop = document.createElement("div"); pop.className = "made-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "A detail that isn't in your profile"); pop.hidden = true;
    pop.addEventListener("mouseenter", () => clearTimeout(hideT)); pop.addEventListener("mouseleave", hideSoon);
    pop.addEventListener("click", e => {
      const b = e.target.closest("[data-mu]"); if (!b || !cur) return;
      const { i, term } = cur; hide();
      if (b.dataset.mu === "keep") lwKeep(i, term); else lwDiscard(i, term);
    });
    document.body.appendChild(pop); return pop;
  };
  const show = (i, term, rect) => {
    clearTimeout(hideT);
    if (cur && cur.i === i && cur.term === term && pop && !pop.hidden) return;
    cur = { i, term };
    const num = /^[0-9]/.test(term), el = make();
    el.innerHTML = `<p><b>“${esc(term)}”</b> ${num ? "is a figure that isn't in your profile." : "is a skill that isn't in your profile."}</p><p class="small">${num ? "Keep it if it's true (it won't be flagged again). Discard leaves a gap to fill in." : "Keep it if you have it: it's added to your skills and won't be flagged again. Discard takes it out of the sentence."}</p><div class="b-actions"><button class="btn primary" type="button" data-mu="keep">Keep and save</button><button class="btn" type="button" data-mu="discard">Discard</button></div>`;
    el.hidden = false;
    const w = el.offsetWidth, vw = document.documentElement.clientWidth;
    el.style.left = Math.max(8, Math.min(rect.left, vw - w - 8)) + "px";
    el.style.top = Math.min(rect.bottom + 6, window.innerHeight - el.offsetHeight - 8) + "px";
  };
  // the red words sit behind the box, so find the one under the pointer by its position
  parts.addEventListener("mousemove", e => {
    const ta = e.target.closest && e.target.closest("textarea[data-ltp]"), back = ta && $("ltb-" + ta.dataset.ltp);
    if (!back) return;
    for (const m of back.querySelectorAll("mark.made-up")) for (const r of m.getClientRects()) {
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { show(+ta.dataset.ltp, m.dataset.term, r); return; }
    }
    if (pop && !pop.hidden) hideSoon();
  });
  parts.addEventListener("mouseleave", () => { if (pop && !pop.hidden) hideSoon(); });
});
