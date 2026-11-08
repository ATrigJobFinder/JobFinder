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
  for (const e of shown(p.experience)) {
    if (!(e.title || e.org)) continue;
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
function lwNeeds(proofs) {
  const d = BL(), ad = String(d.ad || "").trim();
  if (wordCount(ad) < 15) return [];
  const items = [];
  readJobAd(ad).forEach((L, i) => {
    const t = L.text.replace(BULLET_RE, "").trim().replace(/[.\s]+$/, "");
    if (!t || L.heading || !["req", "duty", "body"].includes(L.kind)) return;
    const n = wordCount(t);
    if (n < 4 || n > 40 || LINE_BOILER.test(t) || LINE_NOTREQ.test(t) || LINE_LEARN.test(t) || /\?\s*$/.test(t) || /^(please note|applications? (close|open)|click|to apply|note:)/i.test(t)) return;
    let s = L.kind === "req" ? 3 : L.kind === "duty" ? 2 : 1;
    if (LINE_REQ.test(t)) s += 2;
    if (L.cue) s += 1;
    s += Math.min(2, findSkills(norm(t)).size);
    if (BULLET_RE.test(L.text)) s += 0.5;
    items.push({ text: t.split(/\s+/).slice(0, 28).join(" "), s, i, cw: contentWords(t) });
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
  const p = P(), c = p.contact, proofs = lwProofs(), edu = shown(p.education).find(e => e.degree || e.inst);
  const skills = [...p.skills.hard, ...p.skills.software, ...p.skills.soft];
  const best = proofs.slice().sort((a, b) => lwStrength(b.text) - lwStrength(a.text))[0];
  const go = `<button class="linkish" type="button" data-nx="builder">Add it in the resume builder</button>`;
  const row = (state, label, text) => `<li class="${state}"><span class="mk" aria-hidden="true">${state === "ok" ? "✓" : state === "warn" ? "!" : "–"}</span><span><b>${label}</b> ${text}</span></li>`;
  return [
    c.name && (c.email || c.phone) ? row("ok", "Your details", `${esc(c.name)}${c.location ? ` · ${esc(c.location)}` : ""}. They go in the letter head.`) : row("warn", "Your details", `${c.name ? "" : "No name yet. "}${c.email || c.phone ? "" : "No phone or email yet. "}The letter head needs them. ${go}`),
    best ? (/\d/.test(best.text) ? row("ok", "Your best proof", `“${esc(lwShortText(best.text))}” (${esc(best.at)}). The opening leads with a result like this.`) : row("warn", "Your best proof", `“${esc(lwShortText(best.text))}” has no number. A figure (how many, how much, how fast) makes the opening much stronger. ${go}`)) : row("warn", "Your best proof", `No job, project or volunteering with results yet, so the letter can only describe your study and skills. ${go}`),
    edu ? row("ok", "Your study", esc(lwStudy(edu))) : row("opt", "Your study", `Not added. ${go}`),
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
  if (wordCount(ad) < 15) return ad ? `<li class="opt"><span class="mk" aria-hidden="true">–</span><span>That is too short to read. Paste the whole ad.</span></li>` : "";
  const needs = lwNeeds(lwProofs());
  if (!needs.length) return `<li class="opt"><span class="mk" aria-hidden="true">–</span><span>Couldn't pick out what the ad asks for. The letter will use your resume's strongest evidence instead.</span></li>`;
  return `<li class="head"><b>What the ad asks for most, and your proof for each</b></li>` + needs.map((n, i) => `<li class="${n.proof ? "ok" : "warn"}"><span class="mk" aria-hidden="true">${i + 1}</span><span><b>They ask for:</b> ${esc(n.need)}<br><span class="small muted">${n.proof ? `Your proof: “${esc(lwShortText(n.proof.text))}” (${esc(n.proof.at)})` : lwSkillNote(n.need)}</span></span></li>`).join("");
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
        <p class="small muted lt-src-note" id="ltSrcNote" role="status"></p>
        <ul class="lt-src-list" id="ltSrcNeeds"></ul>
        <div class="q-grid">
          <label class="field" for="lt-why">Why this employer, in your own words<input type="text" id="lt-why" data-lt="why" autocomplete="off" placeholder="The part AI can't write for you. e.g. I use their app myself, or I like how their graduate program rotates teams"></label>
          <label class="field" for="lt-avail">When you can start<input type="text" id="lt-avail" data-lt="avail" autocomplete="off" placeholder="Optional. e.g. from 13 January, or with two weeks' notice"></label>
        </div>
      </div>
    </div>`;
    let t = 0;
    box.addEventListener("input", e => { if (e.target.id === "lt-ad") { clearTimeout(t); t = setTimeout(() => { const n = $("ltSrcNeeds"); if (n) n.innerHTML = lwNeedRows(); }, 500); } });
    box.addEventListener("change", e => { if (e.target.id === "lt-ad") lwAdFill(e.target.value); });
  }
  $("ltSrcResume").innerHTML = lwResumeRows();
  $("ltSrcJob").hidden = !job;
  $("ltSrcNeeds").innerHTML = job ? lwNeedRows() : "";
  for (const [id, k] of [["lt-ad", "ad"], ["lt-why", "why"], ["lt-avail", "avail"]]) { const el = $(id); if (el && document.activeElement !== el) el.value = d[k] || ""; }
}
// A pasted ad fills in the job title, company, who it is addressed to and the reference number, where they are blank
function lwAdFill(ad) {
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
