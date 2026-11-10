/* ===================== Cover letters: the plan and the quick questions ===================== */
// Shared by Create or edit cover letter (23a, 23e) and Tailor to a job (15). The idea (see 14b):
//   the person supplies the facts and the reason, the AI supplies the wording, and code checks every number, every name and every banned phrase.
// What is here:
//   - the situation the letter is written for (first job, career change, returning to work...), worked out from the resume and changeable
//   - the length (standard or short), the quick questions that make the letter theirs, and the extras (a referral, a move, a trial shift)
//   - the notes about all of that, which the writers put in their facts
//   - Add a detail and Different example on each paragraph; the "not wanted" and "pitch" notices; Copy as email

const lcFirst = t => String(t || "").replace(/^[A-Z](?![A-Z])/, c => c.toLowerCase());
const fieldLabel = k => k ? lcFirst(typeof jobLabel === "function" ? jobLabel(k) || k : k) : "";
const LR_SIT_OPTS = Object.entries(LR.SITUATIONS);

/* --- The situation, worked out from the resume --- */
function lrRolesOf(p) {
  return shown(p.experience).filter(e => e.title || e.org).map(e => ({ title: e.title, org: e.org, start: e.start, end: e.end, current: !!e.current, paid: true, field: titleKind(e.title) || "" }));
}
// → { value, auto, reason, from_field, to_field, mods } for a job (role, ad) and a profile
function lrSituation(p, job, override) {
  const roles = lrRolesOf(p), jobField = titleKind(job.role || p.target.title) || p.target.jobType || "";
  const nowY = new Date().getFullYear() * 12, recent = x => { const e = LR.parseYM(x, true); return e != null && e >= nowY - 24; };
  const kinds = [...p.volunteering.filter(v => v.done !== false).map(v => titleKind(v.title || v.role || "")), ...p.education.filter(e => e.done !== false && (e.current || recent(e.end))).map(e => titleKind(e.subject || e.degree || ""))].filter(Boolean);
  const nowD = new Date(), nowM = nowD.getFullYear() * 12 + nowD.getMonth();
  const nearDegree = p.education.filter(e => !e.hidden && (e.degree || e.inst)).some(e => {
    const end = LR.parseYM(e.end, true);
    return e.current || end == null ? !!e.current && (end == null || end - nowM <= 24) : end > nowM ? end - nowM <= 24 : nowM - end <= 12;
  });
  const entryTitle = /graduate|intern|internship|cadet|vacation|trainee|entry.level|junior/i.test(String(job.role || p.target.title || ""));
  const graduate = nearDegree && (entryTitle || LR.monthsIn(roles, jobField) < 24);
  const d = LR.deriveSituation({ roles, jobField, recentInJobField: !!jobField && kinds.includes(jobField), expressionOfInterest: !!job.eoi, graduate }, nowD);
  const value = override && LR.SITUATIONS[override] ? override : d.situation;
  const latest = roles.slice().sort((a, b) => (LR.parseYM(b.start) || 0) - (LR.parseYM(a.start) || 0))[0];
  return { value, auto: d.situation, reason: d.reason, from_field: d.from_field || (latest && latest.field) || "", to_field: d.to_field || jobField, mods: d.modifiers };
}
// the length the letter is written to: the person's choice, or the default for the situation and the kind of job
// A paid trial shift is offered for casual hospitality and retail jobs, and is ticked by default for a first job
const lrTrialFits = (adText, role, type) => type === "casual" && /restaurant|cafe|café|\bbar\b|barista|retail|store|\bshop\b|hospitality|kitchen|waiter|waitress/i.test(String(adText || "") + " " + String(role || ""));
const lrTrialOn = (plan, sit, fits) => !fits ? false : plan.trial === undefined || plan.trial === null ? sit === "first_job" : !!plan.trial;
const lrLengthOf = (plan, sit, ad) => plan.length === "short" || plan.length === "standard" ? plan.length : LR.lengthDefault(sit, ad.employmentType);

/* --- Notes the writers are given, one block for each part of the letter --- */
// plan: the saved answers; sit: the situation; info: { role, company, years, ad } → lines of text (each starting "Note:")
function lrNotes(part, plan, sit, info) {
  const L = [], s = sit.value, from = fieldLabel(sit.from_field), to = fieldLabel(sit.to_field);
  if (part === "experience" || part === "education") {
    if (s === "graduate") L.push("Note: use internship and work evidence first, then projects. Refer to the degree as \"my degree\" or \"my master's\" without repeating its full name.");
  }
  if (part === "closing") {
    if (s === "graduate") L.push("Note: say when you can start: the program start, or a start date after you finish. If an earlier paragraph already gives the finish date, do not repeat it.");
  }
  if (part === "opening") {
    if (s === "career_change") L.push(`Note: you are changing careers${from ? ` from ${from}` : ""}${to ? ` to ${to}` : ""}. Say so near the start, with the new training or experience, then name one skill from your old work that carries over.`);
    if (s === "graduate") L.push("Note: you are a student or recent graduate. Lead with the job and the strongest proof (your best internship, work or project result). Then name the degree and university once, using the status on the Study line. Do not name the degree again in later paragraphs.");
    if (s === "first_job") L.push("Note: this is your first job. Say who you are now (your study or school) and the job. Don't apologise for having no experience.");
    if (s === "returning") L.push(`Note: you are returning to work after ${plan.breakLen ? plan.breakLen : "a break"}${plan.breakWhy ? `, as ${plan.breakWhy}` : ""}. Mention it once, plainly, with no apology, and say what you did to stay current.`);
    if (s === "stepping_back") L.push(`Note: you are moving from a more senior role to a hands-on one${plan.steppingWhy ? `: ${plan.steppingWhy}` : ""}. Give the reason in one plain sentence.`);
    if (s === "internal") L.push(`Note: you already work at ${info.company || "this employer"}. Mention your current role.`);
    if (s === "expression_of_interest") L.push(`Note: no job is advertised. Name the kind of role you want ("${plan.target || info.role || "the role"}") instead of a job title.`);
    if (plan.referrer && plan.referrer.name && plan.referrer.permission) L.push(`Note: ${plan.referrer.name}${plan.referrer.team ? ` in your ${plan.referrer.team}` : ""} suggested you apply. Say so in the first sentence, after the role and company.`);
    if (plan.move && plan.move.city) L.push(`Note: you are moving to ${plan.move.city}${plan.move.date ? ` in ${plan.move.date}` : ""}${plan.move.start ? ` and can start from ${plan.move.start}` : ""}. Say so in one short clause.`);
    if (info.years) L.push(`Experience: ${info.years}`);
    if (plan.hookNum) L.push(`More about the strongest proof (the applicant's own words): ${plan.hookNum}`);
  }
  return L;
}

/* --- What the page knows, in one place (so the panel and the writer agree) --- */
let ltInfoMemo = { key: "", v: null };
function ltInfo() {
  const p = P(), d = BL(), pl = ltPlan();
  const key = [d.ad, d.role, d.company, d.why, d.avail, JSON.stringify(pl), p.experience.length, p.education.length, p.volunteering.length, (profile.data || {}).updated || ""].join("|");
  if (ltInfoMemo.key === key) return ltInfoMemo.v;
  const ad = LR.adInstructions(d.ad), sit = lrSituation(p, { role: d.role, eoi: pl.situation === "expression_of_interest" }, pl.situation);
  const length = lrLengthOf(pl, sit.value, ad), roles = lrRolesOf(p), field = (roles[0] && roles[0].field) || sit.from_field;
  const months = field ? LR.monthsIn(roles, field, new Date()) : 0, years = LR.yearsText(months, fieldLabel(field));
  const v = { ad, sit, length, years };
  ltInfoMemo = { key, v };
  return v;
}
const ltPlan = () => { const d = BL(); if (!d.plan || typeof d.plan !== "object") d.plan = {}; return d.plan; };
// the page's length choice, used by letterRange (15)
const ltLength = () => { try { return ltInfo().length; } catch { return "standard"; } };
const ltWordLimit = () => { try { return ltTemplate() ? 0 : ltInfo().ad.wordLimit || 0; } catch { return 0; } };

/* --- The questions --- */
// Sentences in the ad that say something about the employer, so the person can see what to react to ("From the ad:"). They are hints only.
function lrEmployerFacts(ad, company) {
  const co = String(company || "").trim().toLowerCase(), out = [];
  for (const s of LR.sentences(String(ad || "").replace(/\n+/g, ". "))) {
    const w = LR.words(s), low = s.toLowerCase();
    if (w < 6 || w > 30 || /\b(apply|applications?|close[sd]?|must|essential|experience|you will|you'll|required)\b/i.test(s)) continue;
    if ((co && low.includes(co)) || /^(we|our)\b/i.test(s)) out.push(s.replace(/[.\s]+$/, ""));
    if (out.length >= 3) break;
  }
  return out;
}
const lrKey = t => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 32);
function ltQuestions() {
  const p = P(), d = BL(), pl = ltPlan(), info = ltInfo(), proofs = lwProofs(), needs = lwNeeds(proofs);
  const best = proofs.slice().sort((a, b) => lwStrength(b.text) - lwStrength(a.text))[0];
  const gaps = needs.filter(n => !n.proof && !(pl.gaps && pl.gaps[lrKey(n.need)])).map(n => ({ id: lrKey(n.need), text: n.need }));
  const known = LR.nameAllowlist([profileToText(p), d.ad, d.company, d.role, d.recipient, d.avail]);
  const others = LR.unknownNames(String(d.why || ""), known);
  const ad = String(d.ad || ""), shift = /casual|part[- ]time|roster|shift|weekend/i.test(ad) || info.ad.employmentType === "casual";
  return LR.questions({ whyGiven: !!lwClean(d.why), hookText: best && !pl.hookNum ? best.text : "", gaps, needAvailability: shift || info.sit.value === "graduate", availabilityGiven: !!lwClean(d.avail) || !!availabilityText(p), salaryRequested: info.ad.salaryRequested, salaryGiven: !!pl.salary, otherNames: others });
}

/* --- The panel (the same markup in both places; it reads and writes the plan it is given) --- */
// opts: { plan, sit, length, ad, qs, joggers[], forJob, showTrial, lengthAuto }
function lrPlanHtml(o) {
  const pl = o.plan, s = o.sit.value, e = esc;
  const sel = LR_SIT_OPTS.map(([k, l]) => `<option value="${k}"${(pl.situation || "") === k ? " selected" : ""}>${e(l)}</option>`).join("");
  const seg = (k, l) => `<button type="button" data-lrp-set="length:${k}" aria-pressed="${(pl.length || "") === k}">${l}</button>`;
  const q = (t, label, ph, path, key, val) => `<label class="field lr-q" data-lr-q="${t}"><span>${e(label)}</span><input type="text" data-lrp="${path}"${key ? ` data-lrp-key="${e(key)}"` : ""} value="${e(val || "")}" placeholder="${e(ph)}" autocomplete="off"></label>`;
  const asked = o.qs.map(x => {
    if (x.type === "hook_number") return q(x.type, x.question, x.example, "hookNum", "", pl.hookNum);
    if (x.type === "gap") return q(x.type, x.question, x.example, "gaps", x.target_id, (pl.gaps || {})[x.target_id]);
    if (x.type === "salary") return q(x.type, x.question, x.example, "salary", "", pl.salary);
    if (x.type === "why_them") return `<p class="lr-q lr-note" data-lr-q="why_them"><b>Why this employer?</b> This is the part AI can't write for you. Type one real reason in the box above, in your own words.${o.joggers.length ? `<span class="small muted lr-jog">From the ad: ${o.joggers.map(j => `“${e(j)}”`).join(" · ")}</span>` : ""}<span class="small muted lr-jog">Do you use their products or services, or know someone who works there?</span></p>`;
    if (x.type === "availability") return `<p class="lr-q lr-note" data-lr-q="availability"><b>${e(x.question)}</b> Add it to “When you can start” above (${e(x.example)}).</p>`;
    if (x.type === "check_name") return `<p class="lr-q lr-note warn" data-lr-q="check_name"><b>${e(x.question)}</b> A name that isn't in your resume or the ad will be refused when the letter is written.</p>`;
    return "";
  }).join("");
  const r = pl.referrer || {}, m = pl.move || {};
  return `<div class="lr-plan-in">
    <div class="lr-plan-row">
      <label class="field">Written as <select data-lrp="situation"><option value=""${pl.situation ? "" : " selected"}>Auto: ${e(LR.SITUATIONS[o.sit.auto])}</option>${sel}</select></label>
      <div class="q"><div class="q-label" id="lrLenL">Length</div><div class="seg" role="group" aria-labelledby="lrLenL">${seg("", `Auto (${o.length})`)}${seg("standard", "Standard")}${seg("short", "Short")}</div></div>
    </div>
    <p class="small muted lr-why">${o.sit.reason && !pl.situation ? e(o.sit.reason) + " " : ""}${o.length === "short" ? `Short: about ${LR.LENGTH.short[0]} to ${LR.LENGTH.short[1]} words.` : `Standard: about ${LR.LENGTH.standard[0]} to ${LR.LENGTH.standard[1]} words.`}${o.ad.wordLimit ? ` The ad sets a limit of ${o.ad.wordLimit} words, so the letter is kept inside it.` : ""}</p>
    <p class="small muted lr-privacy">When you press Write, your resume details and the job ad are sent to the AI you chose in Choose your AI, and only then.</p>
    ${asked ? `<div class="lr-asks"><div class="b-sub">A few quick questions</div>${asked}</div>` : ""}
    <details class="lr-more"><summary>More: a referral, moving, a trial shift${s === "returning" ? ", your break" : s === "stepping_back" ? ", why you're stepping back" : s === "expression_of_interest" ? ", the role you want" : ""}</summary>
      <div class="q-grid">
        ${s === "expression_of_interest" ? q("target", "The kind of role you want", "e.g. Marketing Coordinator", "target", "", pl.target) : ""}
        ${s === "returning" ? q("break", "How long was the break?", "e.g. two years", "breakLen", "", pl.breakLen) + q("breakWhy", "Why (optional, only if you want to say)", "e.g. caring for family", "breakWhy", "", pl.breakWhy) : ""}
        ${s === "stepping_back" ? q("stepping", "Why you want a hands-on role", "e.g. I want to work with customers again", "steppingWhy", "", pl.steppingWhy) : ""}
        ${q("ref1", "Someone suggested you apply: their name", "e.g. Priya Rahman", "referrer.name", "", r.name)}
        ${q("ref2", "…and their team", "e.g. Parramatta store", "referrer.team", "", r.team)}
        <label class="q-check lr-check"><input type="checkbox" data-lrp="referrer.permission"${r.permission ? " checked" : ""}> They're happy for me to mention them</label>
        ${q("mv1", "Moving to (city)", "e.g. Brisbane", "move.city", "", m.city)}
        ${q("mv2", "…when", "e.g. January", "move.date", "", m.date)}
        ${q("mv3", "…and you can start from", "e.g. 1 February", "move.start", "", m.start)}
        ${o.showTrial ? `<label class="q-check lr-check"><input type="checkbox" data-lrp="trial"${lrTrialOn(pl, s, true) ? " checked" : ""}> Offer a paid trial shift</label>` : ""}
      </div>
    </details>
  </div>`;
}
// root: where the panel is; api: { get() → plan, save(), redraw() }
function lrPlanBind(root, api) {
  const setPath = (obj, path, v, key) => {
    const parts = path.split(".");
    let o = obj; for (const k of parts.slice(0, -1)) o = o[k] = o[k] && typeof o[k] === "object" ? o[k] : {};
    const last = parts[parts.length - 1];
    if (key) { o[last] = o[last] && typeof o[last] === "object" ? o[last] : {}; o[last][key] = v; } else o[last] = v;
  };
  root.addEventListener("input", e => { const t = e.target.closest("[data-lrp]"); if (!t || t.tagName === "SELECT" || t.type === "checkbox") return; setPath(api.get(), t.dataset.lrp, t.value, t.dataset.lrpKey); api.save(); });
  root.addEventListener("change", e => {
    const t = e.target.closest("[data-lrp]"); if (!t) return;
    setPath(api.get(), t.dataset.lrp, t.type === "checkbox" ? t.checked : t.value, t.dataset.lrpKey); api.save();
    if (t.tagName === "SELECT" || t.type === "checkbox") api.redraw();
  });
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-lrp-set]"); if (!b) return;
    const [k, v] = b.dataset.lrpSet.split(":"); api.get()[k] = v; api.save(); api.redraw();
  });
}

/* --- Create or edit cover letter: the panel in "What your letter is written from" --- */
function renderLetterPlan() {
  const box = $("ltPlan");
  if (!box) return;
  const d = BL(), job = !ltTemplate(), info = ltInfo(), pl = ltPlan();
  box.hidden = !job;
  if (!job) { box.innerHTML = ""; return; }
  const open = box.querySelector(".lr-more") && box.querySelector(".lr-more").open;
  const hadFocus = document.activeElement && box.contains(document.activeElement) ? document.activeElement.getAttribute("data-lrp") : "";
  const showTrial = lrTrialFits(d.ad, d.role, info.ad.employmentType);
  box.innerHTML = lrPlanHtml({ plan: pl, sit: info.sit, length: info.length, ad: info.ad, qs: ltQuestions(), joggers: lrEmployerFacts(d.ad, d.company), showTrial });
  const more = box.querySelector(".lr-more"); if (more && open) more.open = true;
  if (hadFocus) { const f = box.querySelector(`[data-lrp="${hadFocus}"]`); if (f && f.tagName !== "SELECT") f.focus(); }
  renderLetterNotices();
}
// The ad says not to send a letter, or asks for a pitch or selection criteria instead: say so, never quietly write a standard letter
function lrAdNotice(ad) {
  if (ad.coverLetter === "not_wanted") return "The ad says not to send a cover letter. Job Finder won't write one unless you choose to.";
  if (ad.selectionCriteria || ad.pitch) return "This job asks for a pitch or responses to selection criteria rather than a cover letter. Follow the job pack exactly, use STAR examples (Situation, Task, Action, Result) and stay within the word limit.";
  return "";
}
let ltAdOverride = false;
function renderLetterNotices() {
  const note = $("ltSrcNote"); if (!note || ltTemplate()) return;
  const m = lrAdNotice(ltInfo().ad), cur = note.dataset.lr || "";
  if (m) { note.dataset.lr = "1"; note.textContent = m; note.classList.add("warn"); }
  else if (cur) { note.dataset.lr = ""; note.textContent = ""; note.classList.remove("warn"); }
}
// Pressed Start from my profile / Write with AI: true when it may go ahead
function ltAdGate() {
  if (ltTemplate() || ltAdOverride) return true;
  const m = lrAdNotice(ltInfo().ad);
  if (!m) return true;
  const st = $("ltStatus"); if (st) st.innerHTML = `${esc(m)} <button class="linkish" type="button" id="ltAdGo">Write a letter anyway</button>`;
  const go = $("ltAdGo"); if (go) go.addEventListener("click", () => { ltAdOverride = true; if (st) st.textContent = ""; const b = $("ltFromProfile"); if (b) b.click(); }, { once: true });
  return false;
}
onInit(() => {
  const box = document.getElementById("ltSources");
  if (box) lrPlanBind(box, { get: ltPlan, save: () => { baseLetter.save(); letterEdited(); const n = $("ltSrcNeeds"); if (n) renderLetterNotices(); }, redraw: () => { ltInfoMemo.key = ""; renderLetterPlan(); COVER_PARTS.forEach((_, i) => partCount(i)); ltTargetText(); } });
  onProfile(() => { ltInfoMemo.key = ""; });
  const parts = $("ltParts");
  if (parts) {
    parts.addEventListener("click", e => {
      const dt = e.target.closest("[data-lt-detail]"), df = e.target.closest("[data-lt-diff]"), go = e.target.closest("[data-lt-detail-go]"), no = e.target.closest("[data-lt-detail-no]");
      if (dt) { ltDetailBox(+dt.dataset.ltDetail); return; }
      if (go) { ltDetailGo(+go.dataset.ltDetailGo, go); return; }
      if (no) { const b = $("lts-" + no.dataset.ltDetailNo); if (b) b.innerHTML = ""; return; }
      if (df) { ltDifferent(+df.dataset.ltDiff, df); }
    });
  }
  const em = $("ltCopyEmail");
  if (em) em.addEventListener("click", async () => {
    const t = ltEmailText();
    try { await navigator.clipboard.writeText(t); em.textContent = "Copied"; } catch { em.textContent = "Couldn't copy"; }
    setTimeout(() => { em.textContent = "Copy as email"; }, 1800);
  });
});

/* --- On each paragraph: Add a detail, Different example --- */
function ltPartExtras(i) {
  const p = BL().parts[i]; if (!p) return "";
  const has = p.text.trim() && !ltBracketOnly(p.text), evidence = ["experience", "education"].includes(p.part), other = ["opening", "experience"].includes(p.part);
  return `${evidence && !ltTemplate() ? `<button class="btn ghost" type="button" data-lt-detail="${i}" title="A short story or result behind this paragraph. It goes in as one of your facts.">Add a detail</button>` : ""}${other && has && !ltTemplate() ? `<button class="btn ghost" type="button" data-lt-diff="${i}" title="Write it again from a different job or result">Different example</button>` : ""}`;
}
function ltDetailBox(i) {
  const b = $("lts-" + i), p = BL().parts[i]; if (!b || !p) return;
  b.dataset.menu = ""; b._alts = null;
  b.innerHTML = `<div class="lr-detail"><label class="q-label" for="ltDetail${i}">Is there a short story or result behind this? <span class="opt">It becomes one of your facts for this paragraph.</span></label><textarea id="ltDetail${i}" rows="3" placeholder="e.g. A customer disputed a refund; I checked the receipt with them and kept them as a regular">${esc(p.detail || "")}</textarea><div class="b-actions"><button class="btn primary" type="button" data-lt-detail-go="${i}">Rewrite with this</button><button class="linkish" type="button" data-lt-detail-no="${i}">Cancel</button></div></div>`;
  const t = $("ltDetail" + i); if (t) t.focus();
}
async function ltDetailGo(i, btn) {
  const t = $("ltDetail" + i), p = BL().parts[i]; if (!t || !p) return;
  p.detail = t.value.trim(); baseLetter.save(true);
  const b = $("lts-" + i); if (b) b.innerHTML = "";
  await lwWriteOne(i, btn);
}
async function ltDifferent(i, btn) {
  const p = BL().parts[i]; if (!p) return;
  p.altIx = (p.altIx || 0) + 1; baseLetter.save(true);
  await lwWriteOne(i, btn);
}

/* --- Copy as email: no letter head, no date; the subject line, then the letter, with the resume attached in the close --- */
function ltEmailText() {
  const L = baseLetterParts(), d = BL();
  const paras = L.paragraphs.slice();
  if (paras.length) paras[paras.length - 1] = "My resume is attached. " + paras[paras.length - 1];
  const mobile = (P().contact.phone || "").trim();
  const subject = LR.emailSubject(d.role || P().target.title || "the role", L.name, d.ref);
  return [`Subject: ${subject}`, "", L.salutation, "", ...paras.flatMap(p => [p, ""]), L.signoff, L.name, mobile].filter((x, k, a) => !(x === "" && a[k - 1] === "")).join("\n").trim();
}
// What the Re: line says: the title, and the job's place and reference when the ad gives them
function ltReLine() {
  const d = BL(), p = P();
  const title = d.role || p.target.title || "";
  if (!title) return "";
  return LR.reLine(title, { location: d.location || LR.adLocation(d.ad, title), ref: String(d.ref || "").trim() });
}

/* --- Close: the parts of it that are facts are put in by code if the writer left them out --- */
const lrHas = (text, bit) => { const w = LR.straight(bit).toLowerCase().match(/[a-z0-9]{4,}/g) || []; if (!w.length) return true; const t = LR.straight(text).toLowerCase(); return w.filter(x => t.includes(x)).length >= Math.ceil(w.length / 2); };
// o: { salary, trial, held[] } (held: the licences and checks the ad asks for that the person has)
function lrEnsureClose(text, o) {
  const add = [];
  if (o.salary && !lrHas(text, o.salary)) add.push(`My salary expectation is ${String(o.salary).replace(/[.\s]+$/, "")}.`);
  if ((o.held || []).length && !o.held.every(c => lrHas(text, c))) add.push(`I hold ${LR.listAnd(o.held)}.`);
  if (o.trial && !/trial shift/i.test(text)) add.push("I'd be happy to do a paid trial shift whenever suits you.");
  if (!add.length) return text;
  // before the thanks and the invitation, which are the last things a close says
  const ss = LR.sentences(text), at = ss.findIndex(s => /^(thank you|i would welcome|i'd welcome|i would be glad)/i.test(s));
  ss.splice(at >= 0 ? at : ss.length, 0, ...add);
  return ss.join(" ");
}
function ltEnsureClose(text) {
  const d = BL(), pl = ltPlan();
  const held = LR.adInstructions(profileToText(P())).checks.filter(c => (LR.adInstructions(d.ad).checks || []).includes(c));
  return lrEnsureClose(text, { salary: pl.salary, trial: lrTrialOn(pl, ltInfo().sit.value, lrTrialFits(d.ad, d.role, ltInfo().ad.employmentType)), held });
}
// "Ref CS-2231" in the ad
const lrAdRef = ad => { const m = String(ad || "").match(/\b(?:job\s*)?(?:ref(?:erence)?|req(?:uisition)?)(?:\s*(?:no\.?|number|#|id))?\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{3,})\b/i); return m && /\d/.test(m[1]) ? m[1] : ""; };

/* --- Tailor to a job: Add a detail on each paragraph --- */
function clPartActs(i) {
  const box = $("cla-" + i), d = cover.draft; if (!box || !d || !d.paragraphs[i]) return;
  const p = d.paragraphs[i], evidence = ["experience", "education"].includes(p.part);
  box.innerHTML = `${evidence ? `<button class="btn ghost" type="button" data-cl-detail="${i}" title="A short story or result behind this paragraph. It becomes one of your facts.">Add a detail</button>` : ""}`;
}
function clDetailBox(i) {
  const b = $("clx-" + i), d = cover.draft; if (!b || !d) return;
  const part = d.paragraphs[i].part;
  b.innerHTML = `<div class="lr-detail"><label class="q-label" for="clDetail${i}">Is there a short story or result behind this? <span class="opt">The letter is written again with it.</span></label><textarea id="clDetail${i}" rows="3" placeholder="e.g. A customer disputed a refund; I checked the receipt with them and kept them as a regular">${esc((cover.plan.details || {})[part] || "")}</textarea><div class="b-actions"><button class="btn primary" type="button" data-cl-detail-go="${i}">Write it again with this</button></div></div>`;
  const t = $("clDetail" + i); if (t) t.focus();
}
function clDetailGo(i) {
  const t = $("clDetail" + i), d = cover.draft; if (!t || !d) return;
  const part = d.paragraphs[i].part;
  (cover.plan.details = cover.plan.details || {})[part] = t.value.trim();
  generateCover();
}

/* --- Tailor to a job: the same panel, on the cover letter step --- */
function renderCoverPlan() {
  const box = $("clPlan");
  if (!box || typeof lastResult === "undefined" || !lastResult || !lastScan) return;
  const plan = cover.plan || (cover.plan = {}), jd = lastScan.jd, ad = LR.adInstructions(jd);
  const role = ($("clRole").value || "").trim() || detectTitle(jd, lastScan.title) || "", company = ($("clCompany").value || "").trim();
  const prof = hasProfile(P()) ? P() : null;
  const sit = prof ? lrSituation(prof, { role, eoi: plan.situation === "expression_of_interest" }, plan.situation) : { value: plan.situation || "standard", auto: "standard", reason: "", from_field: "", to_field: "" };
  const length = lrLengthOf(plan, sit.value, ad);
  const why = ($("clWhy").value || "").trim() || (typeof fitWhyText === "function" ? fitWhyText().join(" ") : ""), avail = ($("clAvail").value || "").trim() || (typeof fitAvailText === "function" ? fitAvailText() : "");
  const have = skillSet(finalText()), missing = (lastResult.hard || []).filter(x => x.priority === "Required" && !have.has(x.name)).slice(0, 1).map(x => ({ id: x.name, text: x.name }));
  const best = prof ? lwProofs().slice().sort((a, b) => lwStrength(b.text) - lwStrength(a.text))[0] : null;
  const shift = /casual|part[- ]time|roster|shift|weekend/i.test(jd) || ad.employmentType === "casual";
  const qs = LR.questions({ whyGiven: !!why, hookText: best && !plan.hookNum ? best.text : "", gaps: missing.filter(g => !(plan.gaps && plan.gaps[g.id])), needAvailability: shift, availabilityGiven: !!avail, salaryRequested: ad.salaryRequested, salaryGiven: !!plan.salary });
  const showTrial = lrTrialFits(jd, role, ad.employmentType);
  const open = box.querySelector(".lr-more") && box.querySelector(".lr-more").open, notice = lrAdNotice(ad);
  const focus = document.activeElement && box.contains(document.activeElement) ? document.activeElement.getAttribute("data-lrp") : "";
  box.innerHTML = `<div class="b-sub">Before we write: what the letter is for</div>${notice ? `<p class="lr-notice small" role="status">${esc(notice)}</p>` : ""}` + lrPlanHtml({ plan, sit, length, ad, qs, joggers: lrEmployerFacts(jd, company), showTrial });
  const more = box.querySelector(".lr-more"); if (more && open) more.open = true;
  if (focus) { const f = box.querySelector(`[data-lrp="${focus}"]`); if (f && f.tagName !== "SELECT") f.focus(); }
}
onInit(() => {
  const root = $("clPlan");
  if (root) lrPlanBind(root, { get: () => cover.plan || (cover.plan = {}), save: () => {}, redraw: renderCoverPlan });
  for (const id of ["clWhy", "clAvail", "clRole", "clCompany"]) { const el = $(id); if (el) el.addEventListener("change", () => renderCoverPlan()); }
});
