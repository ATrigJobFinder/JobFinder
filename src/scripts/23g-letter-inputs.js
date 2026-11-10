/* ===================== What the cover letter is written from: the resume, the job ad and your own reasons ===================== */
// The advice says a strong letter proves the employer's two or three top requirements with real evidence, gives one specific reason for
// wanting this employer, and says when you can start. So the letter writer (23e) is given exactly that:
//   - the resume: your name and contact details, your best proof (a result with a number), your study and your skills
//   - the job ad (optional): its top requirements, each paired with the line of your resume that answers it best
//   - your own reason for choosing the employer, and your start date
// This file finds that evidence and shows it above the paragraphs, so the person can see what the AI will use and what is missing.

/* --- The evidence in the resume: every line that says what you did --- */
function lwProofs() {
  const p = P(), out = [];
  for (const e of lwAllJobs(p)) {
    for (const b of e.bullets) { const t = lwClean(b); if (t) out.push({ text: t, kind: "job", e, at: lwJobLine(e) }); }
  }
  for (const x of p.projects) if (x.done !== false && x.name && lwClean(x.details)) out.push({ text: lwClean(x.details).slice(0, 300), kind: "project", x, at: `${lwClean(x.name)}${x.org ? ` (${lwClean(x.org)})` : ""}` });
  for (const v of p.volunteering) if (v.done !== false && (v.role || v.org) && lwClean(v.details)) out.push({ text: lwClean(v.details).slice(0, 300), kind: "volunteering", v, at: [v.role, v.org].filter(Boolean).join(" at ") });
  return out;
}
// The resume line that answers a requirement best: shared words, and shared skills count double
function lwMatch(need, proofs, taken) {
  const cw = contentWords(need), sk = new Set(findSkills(norm(need)).keys());
  let best = null, bs = 0;
  for (const pr of proofs) {
    if (taken.has(pr)) continue;
    let s = 0;
    for (const w of contentWords(pr.text)) if (cw.has(w)) s++;
    for (const k of findSkills(norm(pr.text)).keys()) if (sk.has(k)) s += 2;
    if (s > 0) s += lwStrength(pr.text) >= 3 ? 0.5 : 0;
    if (s > bs) { bs = s; best = pr; }
  }
  return bs >= 1 ? best : null;
}
/* --- The ad: the three things it asks for most --- */
// → [{ need, proof }]  (proof: the resume evidence for it, or null)
// What the employer is looking for, typed one to a line by the person when they have no ad (two or three things)
const lwTypedNeeds = d => String(d.needs || "").split(/\n|;/).map(lwClean).filter(t => wordCount(t) >= 2).slice(0, 3);
const lwIgnored = () => ltPlan().ignored || {};
function lwNeeds(proofs) {
  const d = BL(), ad = String(d.ad || "").trim(), ign = lwIgnored();
  if (wordCount(ad) < 15) {
    const taken = new Set();
    return lwTypedNeeds(d).filter(t => !ign[lrKey(t)]).map(t => { const proof = lwMatch(t, proofs || lwProofs(), taken); if (proof) taken.add(proof); return { need: t, proof }; });
  }
  const items = [];
  readJobAd(ad).forEach((L, i) => {
    const t = L.text.replace(BULLET_RE, "").trim().replace(/[.\s]+$/, "");
    if (!t || L.heading || !["req", "duty", "body"].includes(L.kind)) return;
    const n = wordCount(t);
    if (n < 4 || n > 40 || LINE_BOILER.test(t) || LINE_NOTREQ.test(t) || LINE_LEARN.test(t) || /\?\s*$/.test(t) || /^(please note|applications? (close|open|to|should|must|can|are|via)|apply (to|by|via|online)|send (your|applications)|click|to apply|note:)/i.test(t)) return;
    let s = L.kind === "req" ? 3 : L.kind === "duty" ? 2 : 1;
    if (LINE_REQ.test(t)) s += 2;
    if (L.cue) s += 1;
    s += Math.min(2, findSkills(norm(t)).size);
    if (BULLET_RE.test(L.text)) s += 0.5;
    const text = t.split(/\s+/).slice(0, 28).join(" ");
    if (ign[lrKey(text)]) return;   // (a requirement the person chose to ignore)
    items.push({ text, s, i, cw: contentWords(t) });
  });
  items.sort((a, b) => b.s - a.s || a.i - b.i);
  const picked = [];
  for (const it of items) {
    // two lines that say nearly the same thing count once
    if (picked.some(q => { let n = 0; for (const w of it.cw) if (q.cw.has(w)) n++; return n / Math.max(1, Math.min(it.cw.size, q.cw.size)) > 0.6; })) continue;
    picked.push(it);
    if (picked.length === 3) break;
  }
  const taken = new Set();
  return (picked || []).map(q => { const proof = lwMatch(q.text, proofs || lwProofs(), taken); if (proof) taken.add(proof); return { need: q.text, proof }; });
}

/* --- The panel above the paragraphs --- */
const lwShortText = (t, n = 110) => { const s = String(t || ""); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; };
function lwResumeRows() {
  const p = P(), c = p.contact, proofs = lwProofs(), edu = lwEdu(p), moreEdu = lwStudyList(p).length - 1;
  const skills = [...p.skills.hard, ...p.skills.software, ...p.skills.soft];
  const best = proofs.slice().sort((a, b) => lwStrength(b.text) - lwStrength(a.text))[0];
  const go = `<button class="linkish" type="button" data-nx="builder">Add it in the resume builder</button>`;
  const row = (state, label, text) => `<li class="${state}"><span class="mk" aria-hidden="true">${state === "ok" ? "✓" : state === "warn" ? "!" : "–"}</span><span><b>${label}</b> ${text}</span></li>`;
  return [
    c.name && (c.email || c.phone) ? row("ok", "Your details", `${esc(c.name)}${c.location ? ` · ${esc(c.location)}` : ""}. They go in the letter head.`) : row("warn", "Your details", `${c.name ? "" : "No name yet. "}${c.email || c.phone ? "" : "No phone or email yet. "}The letter head needs them. ${go}`),
    best ? (/\d/.test(best.text) ? row("ok", "Your best proof", `“${esc(lwShortText(best.text))}” (${esc(best.at)}). The opening leads with a result like this.`) : row("warn", "Your best proof", `“${esc(lwShortText(best.text))}” has no number. A figure (how many, how much, how fast) makes the opening much stronger. ${go}`)) : row("warn", "Your best proof", `No job, project or volunteering with results yet, so the letter can only describe your study and skills. ${go}`),
    edu ? row("ok", "Your study", esc(lwStudy(edu)) + (moreEdu > 0 ? ` and ${moreEdu} more` : "")) : row("opt", "Your study", `Not added. ${go}`),
    skills.length ? row("ok", "Your skills", esc(listJoin(skills.slice(0, 4))) + (skills.length > 4 ? ` and ${skills.length - 4} more` : "")) : row("opt", "Your skills", `None added. ${go}`)
  ].join("");
}
// A requirement no job line answers may still be named in your skills: say so, and what to add
function lwSkillNote(need) {
  const p = P(), n = norm(need), have = [...p.skills.hard, ...p.skills.software, ...p.skills.soft].filter(k => norm(k).length > 2 && n.includes(norm(k)));
  return have.length ? `Your skills list has ${esc(listJoin(have.slice(0, 3)))}, but no example of using it. The letter will mention it without claiming a result. An example in your resume makes it stronger.` : "Nothing in your resume answers this yet, so the letter won't claim it. Add it to your resume if you have done it.";
}
function lwNeedRows() {
  const ad = String(BL().ad || "").trim();
  if (wordCount(ad) < 15 && !lwTypedNeeds(BL()).length) return ad ? `<li class="opt"><span class="mk" aria-hidden="true">–</span><span>That is too short to read. Paste the whole ad.</span></li>` : "";
  const needs = lwNeeds(lwProofs());
  if (!needs.length) return `<li class="opt"><span class="mk" aria-hidden="true">–</span><span>Couldn't pick out what the ad asks for. The letter will use your resume's strongest evidence instead.</span></li>`;
  return `<li class="head"><b>What the ad asks for most, and your proof for each</b></li>` + needs.map((n, i) => `<li class="${n.proof ? "ok" : "warn"}"><span class="mk" aria-hidden="true">${i + 1}</span><span><b>They ask for:</b> ${esc(n.need)}<br><span class="small muted">${n.proof ? `Your proof: “${esc(lwShortText(n.proof.text))}” (${esc(n.proof.at)})` : `${lwSkillNote(n.need)} <button class="linkish lt-ignore" type="button" data-lt-ignore="${esc(lrKey(n.need))}" data-lt-ignore-text="${esc(n.need)}" title="Leave this out of the letter: it won't be asked about or claimed">Ignore</button>`}</span></span></li>`).join("") + lwIgnoredRow();
}
// Requirements set aside with Ignore, and a way to bring them back
function lwIgnoredRow() {
  const n = Object.keys(lwIgnored()).length;
  return n ? `<li class="opt"><span class="mk" aria-hidden="true">–</span><span class="small muted">${n} requirement${n === 1 ? " is" : "s are"} ignored, so the letter leaves ${n === 1 ? "it" : "them"} out. <button class="linkish" type="button" data-lt-unignore="1">Show ${n === 1 ? "it" : "them"} again</button></span></li>` : "";
}
function renderLetterSources() {
  const box = $("ltSources");
  if (!box) return;
  const d = BL(), job = !ltTemplate();
  if (!box.dataset.built) {
    box.dataset.built = "1";
    box.innerHTML = `<div class="lt-src">
      <div class="b-sub">What your letter is written from</div>
      <p class="q-hint">The AI writes as you, only from what is listed here. It never adds a fact of its own: anything missing is left out or left as a yellow gap.</p>
      <ul class="lt-src-list" id="ltSrcResume"></ul>
      <div id="ltSrcJob">
        <label class="field" for="lt-ad">The job ad (recommended)
          <textarea id="lt-ad" data-lt="ad" rows="4" spellcheck="false" placeholder="Paste the whole ad. Job Finder fills in the job title and company, picks out what it asks for most, and finds your proof for each."></textarea></label>
        <label class="field" for="lt-needs">…or what the employer is looking for (two or three things, one to a line)
          <textarea id="lt-needs" data-lt="needs" rows="3" spellcheck="true" placeholder="Use this if you have no ad. Say what the job asks for in your own words, one to a line."></textarea></label>
        <p class="small muted lt-src-note" id="ltSrcNote" role="status"></p>
        <ul class="lt-src-list" id="ltSrcNeeds"></ul>
        <div class="q-grid">
          <label class="field" for="lt-why">Why this employer, in your own words<input type="text" id="lt-why" data-lt="why" autocomplete="off" placeholder="The part AI can't write for you. e.g. I use their app myself, or I like how their graduate program rotates teams"></label>
          <label class="field" for="lt-avail">When you can start<input type="text" id="lt-avail" data-lt="avail" autocomplete="off" placeholder="Optional. e.g. from 13 January, or with two weeks' notice"></label>
        </div>
        <div class="lr-plan" id="ltPlan"></div>
      </div>
    </div>`;
    let t = 0;
    box.addEventListener("input", e => { if (e.target.id === "lt-ad" || e.target.id === "lt-needs") { clearTimeout(t); t = setTimeout(() => { const n = $("ltSrcNeeds"); if (n) n.innerHTML = lwNeedRows(); }, 500); } });
    box.addEventListener("change", e => { if (e.target.id === "lt-ad") lwAdFill(e.target.value); });
    // Ignore: this one requirement is set aside for this letter (it is not asked about, and the AI is told not to claim it)
    box.addEventListener("click", e => {
      const b = e.target.closest("[data-lt-ignore], [data-lt-unignore]"); if (!b) return;
      const pl = ltPlan();
      if (b.dataset.ltIgnore) { pl.ignored = { ...(pl.ignored || {}), [b.dataset.ltIgnore]: b.dataset.ltIgnoreText || "x" }; }
      else pl.ignored = {};
      baseLetter.save(true); ltInfoMemo.key = "";
      const n = $("ltSrcNeeds"); if (n) n.innerHTML = lwNeedRows();
      renderLetterPlan();
    });
    // what the questions and the situation depend on: the reason, the start date, the ad
    box.addEventListener("change", e => { if (["lt-why", "lt-avail", "lt-ad", "lt-needs"].includes(e.target.id)) { ltInfoMemo.key = ""; renderLetterPlan(); } });
  }
  $("ltSrcResume").innerHTML = lwResumeRows();
  $("ltSrcJob").hidden = !job;
  $("ltSrcNeeds").innerHTML = job ? lwNeedRows() : "";
  renderLetterPlan();
  for (const [id, k] of [["lt-ad", "ad"], ["lt-needs", "needs"], ["lt-why", "why"], ["lt-avail", "avail"]]) { const el = $(id); if (el && document.activeElement !== el) el.value = d[k] || ""; }
}
// A pasted ad fills in the job title, company, who it is addressed to and the reference number, where they are blank
function lwAdFill(ad) {
  ltAdOverride = false;   // a new ad: the "not wanted" and "pitch" notices are read again
  const d = BL(), done = [];
  const set = (k, v, label) => {
    if (!v || String(d[k] || "").trim()) return;
    d[k] = v; done.push(label);
    const el = document.querySelector(`[data-lt="${k}"]`);
    if (el) { el.value = v; el.classList.remove("gap-input"); }
  };
  if (wordCount(ad) >= 15) {
    set("role", detectTitle(ad, ""), "job title");
    set("company", companyFrom(ad), "company");
    set("recipient", recipientFrom(ad), "who it is addressed to");
    const ref = (ad.match(/\b(?:job\s*)?(?:ref(?:erence)?|req(?:uisition)?)(?:\s*(?:no\.?|number|#|id))?\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{3,})\b/i) || [])[1];
    set("ref", ref && /\d/.test(ref) ? ref : "", "reference number");
  }
  const note = $("ltSrcNote");
  if (note) note.textContent = done.length ? `Filled in the ${listJoin(done)} from the ad. Check ${done.length === 1 ? "it" : "they"} read${done.length === 1 ? "s" : ""} right.` : "";
  letterEdited();
  const n = $("ltSrcNeeds"); if (n) n.innerHTML = lwNeedRows();
}
onInit(() => {
  onProfile(() => { if (currentView === "letter") { const r = $("ltSrcResume"); if (r) r.innerHTML = lwResumeRows(); const n = $("ltSrcNeeds"); if (n && !ltTemplate()) n.innerHTML = lwNeedRows(); } });
});

/* --- Before the AI writes: the job title, the employer, and what the employer is looking for --- */
// The AI never writes without them (and never from a template with gaps in it). Each is read from its own box with the spaces trimmed:
// the example text shown inside an empty box is a placeholder, not a value, and is never read.
function ltGate() {
  const d = BL(), role = String(d.role || "").trim() || String(P().target.title || "").trim(), missing = [];
  if (ltTemplate()) return { ok: true, template: true, missing };   // a template for any job has no job to name: the AI writes it from the profile, with [job title] and [company] left as gaps
  if (!role) missing.push({ id: "lt-role", label: "the job title" });
  if (!String(d.company || "").trim()) missing.push({ id: "lt-company", label: "the employer" });
  if (wordCount(String(d.ad || "")) < 15 && lwTypedNeeds(d).length < 2) missing.push({ id: "lt-ad", label: "the job ad, or two things the employer is looking for" });
  return { ok: !missing.length, template: false, missing, role };
}
// Says what is missing (in the status line and the first box), without calling any writer
function ltGateSay(g, el) {
  const msg = g.template
    ? "The AI writes for a specific job. Choose “A specific job”, then add the job title, the employer and what they are looking for. A template for any job is written from your profile without AI."
    : `Before the AI writes, add ${listJoin(g.missing.map(m => m.label))}. It writes only from facts you have given it.`;
  if (el) el.textContent = msg;
  const f = g.missing[0] && $(g.missing[0].id);
  if (f) { f.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" }); setTimeout(() => f.focus({ preventScroll: true }), 300); }
  return msg;
}
