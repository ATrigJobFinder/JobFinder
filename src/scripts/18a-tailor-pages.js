/* ===================== Tailor to a job: separate pages for the tailored resume and the cover letter ===================== */
// Page 1 ("scan"): the job ad, your resume (and an optional cover letter), results, and placing your skills.
// Page 2 ("resume"): your tailored resume, laid out like the summary in Create or edit resume, with the ad's key skills highlighted.
// Page 3 ("letter"): the job's criteria and the cover letter, laid out like Create or edit cover letter, with the key skills highlighted.
// (tailorStage, resumeEdit and STAGE_OF are declared in 06; goTo in 06 switches pages for the stepper.)

function setTailorStage(st, o = {}) {
  tailorStage = st;
  $("view-scanner").dataset.stage = st;
  if (st === "resume") renderResumePage();
  if (st === "letter") { prefillCover(); renderFit(); renderLetterDesigns("clDesigns"); }
  updateFlow();
  if (!o.keepScroll && !o.silent) { const top = $("view-scanner"); if (top) top.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
}

/* --- Which skills count, and where they show up --- */
// Every skill the ad scores (hard and soft), with whether the resume you pasted already showed it
const tailorKeySkills = () => lastResult ? [...lastResult.hard, ...lastResult.soft].map(x => ({ name: x.name, kind: x.kind, found: x.found, priority: x.priority })) : [];
// The text with each key skill wrapped in <mark>, in the same positions as the original (norm() never changes the length)
function skillHighlightHtml(text, names) {
  const t = String(text || "");
  const marks = [];
  for (const [name, h] of findSkills(norm(t))) if (names.has(name)) for (const [s, e] of h.ranges) marks.push({ s, e, name, kind: h.skill.kind });
  marks.sort((a, b) => a.s - b.s || (b.e - b.s) - (a.e - a.s));
  const clean = [];
  for (const m of marks) if (!clean.length || m.s >= clean[clean.length - 1].e) clean.push(m);
  let out = "", pos = 0;
  for (const m of clean) {
    out += esc(t.slice(pos, m.s));
    out += `<mark class="sk-hit ${m.kind}" data-sk="${esc(m.name)}" title="${esc(m.name)}: a key skill from the ad">${esc(t.slice(m.s, m.e))}</mark>`;
    pos = m.e;
  }
  return out + esc(t.slice(pos));
}
// Chips for every key skill: in the text (already there, or added by you), or not in it
function skillChips(skills, inText) {
  return skills.map(sk => {
    const inIt = inText.has(sk.name), state = inIt ? (sk.found ? "was" : "added") : "out";
    return `<button type="button" class="sk-chip ${sk.kind} ${state}" data-sk="${esc(sk.name)}" ${inIt ? "" : "disabled"} title="${esc(sk.name)}: ${inIt ? (sk.found ? "already in your resume" : "added from your answers") : "not in the text"}">${esc(sk.name)}${state === "added" ? " <i>added</i>" : ""}</button>`;
  }).join("");
}
const skillLegendHtml = '<div class="legend"><span><i class="sk-sw hard"></i>Technical skill</span><span><i class="sk-sw soft"></i>Soft skill</span><span><i class="sk-sw out"></i>Not in the text</span></div>';
function pulseSkill(root, name) {
  const hits = [...root.querySelectorAll("mark.sk-hit")].filter(m => m.dataset.sk === name);
  if (!hits.length) return;
  hits[0].scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
  hits.forEach(m => { m.classList.remove("pulse"); void m.offsetWidth; m.classList.add("pulse"); });
}

/* --- Page 2: your tailored resume --- */
let rsTimer = null;
function renderResumePage(keepEdit) {
  if (!lastResult || !lastScan) return;
  const text = finalText(), skills = tailorKeySkills(), have = skillSet(text), names = new Set(skills.map(s => s.name));
  const before = lastResult.overall, after = analyse(text, lastScan.jd, lastScan.title, fileInfo, { ignore: scanIgnore }).overall;
  const inIt = skills.filter(s => have.has(s.name)), added = inIt.filter(s => !s.found);
  const hardIn = inIt.filter(s => s.kind === "hard").length, hardAll = skills.filter(s => s.kind === "hard").length, softIn = inIt.length - hardIn, softAll = skills.length - hardAll;
  $("rsSummary").innerHTML = `<div class="health"><div class="health-num" style="border-color:${bandColor(after)}"><div><b>${after}</b><span>match</span></div></div>
    <div><p><b>${verdict(after)}</b></p><p class="small muted">${after !== before ? `Was ${before} when you scanned it. ` : ""}${inIt.length} of ${skills.length} key skills from the ad are in your resume (${hardIn} of ${hardAll} technical, ${softIn} of ${softAll} soft)${added.length ? `, ${added.length} of them added from your answers` : ""}.</p></div></div>`;
  $("rsSkills").innerHTML = skills.length ? `<h3>Where the ad's key skills appear</h3><p class="small muted">Highlighted in your resume below. Select a skill to jump to it.</p><div class="sk-chips">${skillChips(skills, have)}</div>${skillLegendHtml}` : "";
  $("rsPaper").innerHTML = skillHighlightHtml(text, names);
  const ed = $("rsEdit");
  if (ed && !keepEdit && document.activeElement !== ed) ed.value = text;
  $("dlNote").textContent = tailorMode === "resume" ? "Check it reads well, change anything that isn't right, then download it." : "Check it reads well and download it. Then fit the job's criteria and write the cover letter on the next page.";
}
onInit(() => {
  $("rsSkills").addEventListener("click", e => { const c = e.target.closest("[data-sk]"); if (c && !c.disabled) pulseSkill($("rsPaper"), c.dataset.sk); });
  $("rsEdit").addEventListener("input", e => {
    resumeEdit = e.target.value;
    clearTimeout(rsTimer);
    rsTimer = setTimeout(() => { renderResumePage(true); updateFlow(); }, 300);
  });
  $("clDesigns").addEventListener("click", e => {
    const tp = e.target.closest("[data-lt-tpl]"), pf = e.target.closest("[data-lt-pref]");
    const mt = e.target.closest("[data-lt-match]");
    if (mt) { const c = P().cv; P().prefs.letterMatch = mt.checked; if (!mt.checked && !c.letterTemplate) { c.letterTemplate = letterTpl().key; c.letterAccent = c.accent; } touchProfile("letter"); renderLetterDesigns("clDesigns"); }
    else if (tp) { pickLetterTpl(tp.dataset.ltTpl); renderLetterDesigns("clDesigns"); }
    else if (pf) { P().prefs[pf.dataset.ltPref === "spacing" ? "letterSpacing" : "letterMargins"] = pf.dataset.val; touchProfile("letter"); renderLetterDesigns("clDesigns"); }
    else if (e.target.closest("#ltAllDesigns")) openView("cv", { kind: "letter" });
  });
  $("clDesignBox").addEventListener("toggle", () => { if ($("clDesignBox").open) renderLetterDesigns("clDesigns"); });
  document.addEventListener("click", e => { const c = e.target.closest("#clBreak [data-sk]"); if (c && !c.disabled) pulseSkill($("clBreak"), c.dataset.sk); });
  // craft warnings: jump to the paragraph, or fix that one paragraph's dashes or exclamation marks
  document.addEventListener("click", e => {
    const b = e.target.closest("#clBreak [data-tk]");
    if (!b || !cover.draft) return;
    const [kind, n] = b.dataset.tk.split(":"), i = +n, para = cover.draft.paragraphs[i], el = document.querySelector(`#clOut .l-para[data-i="${i}"]`);
    if (!para || !el) return;
    if (kind === "dash" || kind === "exclaim") { para.text = (kind === "dash" ? fixDashes : fixExclaims)(para.text); el.innerHTML = gapHtml(para.text); renderBreakdown(); renderFinish(); }
    smoothTo(el, 90);
    el.classList.remove("flash-part"); void el.offsetWidth; el.classList.add("flash-part");
    setTimeout(() => el.focus({ preventScroll: true }), reduceMotion() ? 0 : 350);
  });
});

/* --- Page 3: the cover letter, with the key skills highlighted --- */
function letterSkillReview(d) {
  if (!lastResult || !d) return "";
  const skills = tailorKeySkills(), names = new Set(skills.map(s => s.name));
  if (!skills.length) return "";
  const text = d.paragraphs.map(p => p.text).join(" "), inL = skillSet(text);
  const mine = skills.filter(s => inL.has(s.name));
  return `<div class="sk-review"><b>Where your key skills appear</b>
    <p class="small muted">${mine.length} of ${skills.length} key skills from the ad are in your letter, highlighted below. Select one to jump to it.</p>
    ${mine.length ? `<div class="sk-chips">${skillChips(mine, inL)}</div>` : ""}
    <div class="sk-letter">${d.paragraphs.map(p => `<p>${skillHighlightHtml(p.text, names)}</p>`).join("")}</div>${skillLegendHtml}</div>`;
}
// Keep the cover letter (in the tailor flow) for later, even with gaps still to fill
async function saveTailorLetter() {
  const d = cover.draft, ctx = cover.ctx, st = $("clStatus");
  if (!d || !ctx) return;
  const gaps = missingTokens(d).length + (ctx.company ? 0 : 1) + (ctx.recipient ? 0 : 1);
  const name = await askName({ title: "Save this cover letter", text: "It's saved to your profile, so you can start a later letter from it in Create or edit cover letter. Saving again with the same name replaces it.", label: "Name it", value: [ctx.title, ctx.company].filter(Boolean).join(" – ") });
  if (!name) return;
  await savedLetters.ready;
  const list = savedLetters.data.list = (savedLetters.data.list || []).filter(x => x.name.toLowerCase() !== name.toLowerCase());
  list.unshift({ id: uid8(), name, saved: new Date().toISOString(), letter: { role: ctx.title, company: ctx.company, recipient: ctx.recipient, salutation: d.salutation, parts: d.paragraphs.map(p => ({ part: p.part, text: p.text })), signoff: d.signoff } });
  if (list.length > MAX_SAVED) list.length = MAX_SAVED;
  savedLetters.save(true);
  st.textContent = `“${name}” is ${whereWords(savedLetters.where === "loading" ? profile.where : savedLetters.where)}.${gaps ? ` It has ${gaps} gap${gaps === 1 ? "" : "s"} still to fill, so fill ${gaps === 1 ? "it" : "them"} in before you send it.` : ""}`;
}
