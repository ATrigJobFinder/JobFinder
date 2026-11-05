/* ===================== Tailor to a job: separate pages for each part ===================== */
// Page 1 ("scan"): the job ad, your resume (and an optional cover letter), results, and placing your skills.
// Page 2 ("resume"): Tailor to resume. The changes your answers made on the left; the resume in your design on the right, editable, with the key skills above it.
// Page 3 ("fit"): the job's criteria, matched to your resume, and a few quick questions.
// Page 4 ("letter"): the cover letter, laid out like Create or edit cover letter (the paragraphs on the left, the breakdown above the preview on the right).
// (tailorStage, resumeEdit and STAGE_OF are declared in 06; goTo in 06 switches pages for the stepper.)

function setTailorStage(st, o = {}) {
  tailorStage = st;
  $("view-scanner").dataset.stage = st;
  if (st === "resume") renderResumePage();
  if (st === "fit") { prefillCover(); renderFit(); }
  if (st === "letter") { prefillCover(); renderFit(); renderLetterDesigns("clDesigns"); if (cover.draft) renderCover(); autoWriteCover(); }
  updateFlow();
  if (!o.keepScroll && !o.silent) { const top = $("view-scanner"); if (top) top.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
}

/* --- Which skills count, and where they show up --- */
// Every skill the ad scores (hard and soft), with whether the resume you pasted already showed it
const tailorKeySkills = () => lastResult ? [...lastResult.hard, ...lastResult.soft].map(x => ({ name: x.name, kind: x.kind, found: x.found, priority: x.priority })) : [];
const tailorKeyNames = () => new Set(tailorKeySkills().map(s => s.name));
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
// A box that grows with what's typed in it (so the highlight behind it lines up and the page does the scrolling)
const growBox = el => { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; };

/* --- The cover letters in your profile: your own letter from Create or edit cover letter, then the ones you saved --- */
function profileLetters() {
  const out = [], bt = BL().parts.map(p => p.text.trim()).filter(Boolean).join("\n\n");
  if (wordCount(bt) >= 40) out.push({ name: BASE_LETTER_NAME, text: bt });
  for (const x of (savedLetters.data.list || [])) {
    const t = (x.letter.parts || []).map(p => String(p.text || "").trim()).filter(Boolean).join("\n\n");
    if (wordCount(t) >= 40 && !out.some(o => o.name === x.name)) out.push({ name: x.name, text: t, saved: x.saved });
  }
  return out;
}
// Opening the cover letter page writes the letter, using the letters you've written before (yours from Create or edit cover letter, or the
// ones you saved, when none were added on the first page). A letter already written for this job is left as it is: use Write it again for a new one.
async function autoWriteCover() {
  if (!lastResult || cover.writing) return;
  if (cover.draft && cover.draftFor === coverJobKey()) return;
  await Promise.all([coverReady, baseLetter.ready, savedLetters.ready]);
  if (tailorStage !== "letter" || !lastResult || cover.writing || (cover.draft && cover.draftFor === coverJobKey())) return;
  if (!cover.letters.length) {
    const list = profileLetters().slice(0, 3);
    if (list.length) { cover.letters = list.map(x => ({ name: x.name, text: x.text, added: new Date().toISOString() })); renderLetterFiles(); await saveCoverStore(); }
  }
  renderReady();
  if (!$("clName").value.trim()) { $("clEngine").textContent = "Add your name above, then press Write my cover letter."; return; }
  await generateCover({ auto: true });
}

/* --- Page 2: Tailor to resume --- */
// Left: what your answers changed, each with the old words, the suggestion and a Revert. Right: the resume in your design, with the ad's key
// skills listed above it (like the cover letter page's breakdown) and highlighted in it, the words your answers changed marked, and every word
// editable (see 18d-editable-previews.js): the score, the skills and the download follow what you type.
let rsSecs = [], rsItems = [], rsItemsFor = null;
function rsSplit(text) {
  const P = parseResume(text), lines = P.lines;
  return P.sections.map(s => {
    const body = lines.slice(s.start, s.end + 1); let gap = 0;
    while (body.length && !body[body.length - 1].trim()) { body.pop(); gap++; }
    return { title: s.headIdx < 0 ? "Your details" : rsTitleCase(s.title), head: s.headIdx < 0 ? null : lines[s.headIdx], type: s.type, body, gap };
  });
}
const rsJoin = secs => secs.flatMap(s => (s.head == null ? [] : [s.head]).concat(s.body, Array(s.gap).fill(""))).join("\n");
const rsBodyText = s => s.body.join("\n");
// Which part of the resume a change sits in (found by its new words; once reverted, by its old words)
function rsBuildItems() {
  const u = place.update;
  if (rsItemsFor === u) return;
  rsItemsFor = u; rsItems = [];
  if (!u) return;
  for (const c of u.changes) for (const it of c.items) {
    let sec = rsSecs.findIndex(s => it.after && rsBodyText(s).includes(it.after));
    if (sec < 0) sec = rsSecs.findIndex(s => s.title.toLowerCase() === String(c.where || "").toLowerCase());
    if (sec < 0) sec = rsSecs.length - 1;
    rsItems.push({ c, it, sec, on: true });
  }
}
// Where each change sits now (the parts are split again every time the page opens, and after every edit in the preview)
function rsLocate() {
  for (const m of rsItems) {
    const find = m.on ? m.it.after : (m.it.type === "edit" ? m.it.before : "");
    const at = find ? rsSecs.findIndex(s => rsBodyText(s).includes(find)) : -1;
    if (at >= 0) m.sec = at;
    else if (m.sec >= rsSecs.length) m.sec = rsSecs.length - 1;
  }
}
function rsApply(m, to) {
  // to "before": put the old words back; to "after": the suggestion again
  const it = m.it;
  if (it.type === "edit") {
    const from = to === "before" ? it.after : it.before, put = to === "before" ? it.before : it.after;
    const at = rsSecs.findIndex(s => rsBodyText(s).includes(from));
    if (at < 0) return false;
    rsSecs[at].body = rsBodyText(rsSecs[at]).replace(from, () => put).split("\n"); m.sec = at;
    return true;
  }
  if (it.type === "add") {
    if (to === "before") {
      for (let k = 0; k < rsSecs.length; k++) {
        const j = rsSecs[k].body.findIndex(l => l.replace(BULLET_RE, "").trim() === it.after.trim() || l.includes(it.after));
        if (j >= 0) { m.removed = { sec: k, at: j, line: rsSecs[k].body[j] }; rsSecs[k].body.splice(j, 1); m.sec = k; return true; }
      }
      return false;
    }
    const r = m.removed || { sec: m.sec, at: rsSecs[m.sec].body.length, line: "- " + it.after };
    rsSecs[r.sec].body.splice(Math.min(r.at, rsSecs[r.sec].body.length), 0, r.line); m.sec = r.sec;
    return true;
  }
  return false;
}
function rsCanTouch(m) {
  const it = m.it, text = rsJoin(rsSecs);
  if (it.type === "note") return false;
  if (m.on) return text.includes(it.after);
  return it.type === "add" ? true : text.includes(it.before);
}
function rsCardHtml(k, m) {
  const it = m.it, ok = rsCanTouch(m);
  if (it.type === "note") return `<div class="rs-card note"><span class="lab">Note</span><p>${esc(it.after)}</p></div>`;
  const was = it.type === "edit" ? `<p class="was"><span class="lab">Before</span>${esc(it.before)}</p>` : "";
  return `<div class="rs-card ${it.type}${m.on ? "" : " off"}" data-rv="${k}">
    <div class="rs-card-top"><b>${m.on ? (it.type === "add" ? "Added from your answers" : "Changed from your answers") : "Reverted"}</b></div>
    ${was}
    <p class="now"><span class="lab">${it.type === "edit" ? "Suggestion" : "Added"}</span>${esc(it.after)}</p>
    <p class="via">${esc(it.via || "")}</p>
    <div class="rs-card-acts">${m.on ? `<button class="btn" type="button" data-rv-act="revert" ${ok ? "" : "disabled"}>Revert</button>` : `<button class="btn" type="button" data-rv-act="redo" ${ok ? "" : "disabled"}>Use the suggestion again</button>`}${ok ? "" : `<span class="small muted">${m.on ? "You've edited this line, so change it in the preview." : "That part has changed."}</span>`}${m.on && m.shown ? `<button class="linkish" type="button" data-rv-act="find">Show in the preview</button>` : ""}</div>
  </div>`;
}
// The changes, a group for each part of the resume they sit in
function rsCardsHtml() {
  const groups = [];
  rsItems.forEach((m, k) => { let g = groups.find(x => x.c === m.c); if (!g) groups.push(g = { c: m.c, list: [] }); g.list.push([k, m]); });
  return groups.map(g => `<div class="rs-grp"><h4>${esc(g.c.where)}</h4>${g.list.map(([k, m]) => rsCardHtml(k, m)).join("")}</div>`).join("");
}
function rsRenderCards() {
  const box = $("rsCards");
  if (box) box.innerHTML = rsCardsHtml();
}
function renderResumePage() {
  if (!lastResult || !lastScan) return;
  rsSecs = rsSplit(finalText());
  rsBuildItems(); rsLocate();
  renderChanges();
  refreshResumeRight();
  $("dlNote").textContent = tailorMode === "resume" ? "Check it reads well, change anything that isn't right in the preview, then download it." : "Check it reads well and download it. Then fit the job's criteria and write the cover letter on the next pages.";
  $("toCover").hidden = tailorMode === "resume";
}
// Everything on this page that follows the resume: the score, the breakdown, the preview and the changes
function refreshResumeRight() {
  refreshResumeScore();
  renderResumePreview();
  rsRenderCards();
}
// The score and the key skills (not the preview, so typing in the preview isn't interrupted)
function refreshResumeScore() {
  if (!lastResult || !lastScan) return;
  const text = finalText(), skills = tailorKeySkills(), have = skillSet(text);
  const before = lastResult.overall, after = analyse(text, lastScan.jd, lastScan.title, fileInfo, { ignore: scanIgnore }).overall;
  const inIt = skills.filter(s => have.has(s.name)), added = inIt.filter(s => !s.found);
  const hardIn = inIt.filter(s => s.kind === "hard").length, hardAll = skills.filter(s => s.kind === "hard").length, softIn = inIt.length - hardIn, softAll = skills.length - hardAll;
  $("rsSummary").innerHTML = `<div class="health">${matchRing(after)}
    <div><p><b>${verdict(after)}</b></p><p class="small muted">${after !== before ? `Was ${before} when you scanned it. ` : ""}${inIt.length} of ${skills.length} key skills from the ad are in your resume (${hardIn} of ${hardAll} technical, ${softIn} of ${softAll} soft)${added.length ? `, ${added.length} of them added from your answers` : ""}.</p></div></div>`;
  const se = $("rsScore");
  if (se) se.innerHTML = `Match: <span style="color:${bandColor(after)}">${after}/100</span>`;
  const nChanged = rsItems.filter(m => m.on && m.it.type !== "note").length;
  $("rsSkills").innerHTML = `<h3>Breakdown</h3>
    <div class="cl-stats">
      <div class="cl-stat"><b>${skills.length ? `${inIt.length}/${skills.length}` : "–"}</b><span>key skills from the ad in your resume</span></div>
      <div class="cl-stat"><b>${added.length}</b><span>added from your answers</span></div>
      <div class="cl-stat"><b>${nChanged}</b><span>change${nChanged === 1 ? "" : "s"} marked in the preview</span></div>
    </div>
    ${skills.length ? `<div class="sk-review"><b>Where the ad's key skills appear</b>
      <p class="small muted">${inIt.length} of ${skills.length} key skills from the ad are in your resume, highlighted in the preview below. Select one to jump to it.</p>
      <div class="sk-chips">${skillChips(skills, have)}</div>${skillLegendHtml}</div>` : ""}`;
}
// The resume in your design: key skills highlighted, the words your answers changed marked, and every word editable
function renderResumePreview() {
  if (!lastResult || !lastScan) return;
  const text = finalText(), names = tailorKeyNames(), paper = $("rsPaper");
  const { base, tpl, accent } = resumeDesignNow();
  let pages = 1;
  try {
    pages = mountPaper(paper, cvHtml(resumeTextModel(text, tpl), tpl, { accent }));
    if ($("rsPrevHl").checked) highlightPaper(paper, names);
    rsMarkChanges(paper);
    paperEditable(paper, rsEditor);
  } catch (e) { paper.textContent = text; console.error(e); }
  $("rsDesign").textContent = `Design: ${base.name}`;
  const note = $("rsDesignNote");
  note.classList.remove("warn");
  note.textContent = `${pages} page${pages === 1 ? "" : "s"}. ${rsEditor.note}`;
}
// What changed within one edit: the words that differ (the start and end that are the same as before aren't marked)
function rsChangedPart(before, after) {
  const a = String(before || "").split(/\s+/).filter(Boolean), b = String(after || "").split(/\s+/).filter(Boolean);
  let s = 0; while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let e = 0; while (e < a.length - s && e < b.length - s && a[a.length - 1 - e] === b[b.length - 1 - e]) e++;
  return b.slice(s, b.length - e).join(" ") || String(after || "");
}
// Mark the words each change put in the preview (Highlight what changed)
function rsMarkChanges(paper) {
  for (const m of rsItems) m.shown = false;
  if (!$("rsChgHl").checked) return;
  const blocks = edBlocks(paper);
  rsItems.forEach((m, k) => {
    if (!m.on || m.it.type === "note" || !m.it.after) return;
    const whole = edFlat(m.it.after), seg = m.it.type === "edit" ? rsChangedPart(m.it.before, m.it.after) : m.it.after;
    const blk = blocks.find(b => edFlat(b.textContent).includes(whole)) || blocks.find(b => edFlat(b.textContent).includes(edFlat(seg)));
    m.shown = !!blk && edWrapIn(blk, seg, k);
  });
}
// A change in the preview goes back into the resume text where the old words were
function rsPaperApply(old, nw) {
  const out = edReplace(finalText(), old, nw);
  if (out == null) return false;
  resumeEdit = out;
  return true;
}
const rsEditor = {
  note: "Select any text in the preview to change it. The score, the skills and the download follow.",
  noteId: "rsDesignNote", locked: ".cv-h", label: "Your tailored resume. Select any text to change it.",
  apply: rsPaperApply,
  after() { rsSecs = rsSplit(finalText()); rsLocate(); refreshResumeScore(); rsRenderCards(); updateFlow(); },
  commit() { renderResumePreview(); rsRenderCards(); }
};
// The changes your answers made: the score, then each one with the old words, the suggestion and a Revert
function renderChanges() {
  const box = $("rsChanges"), u = place.update;
  if (!box) return;
  const how = `<p class="small muted rs-intro">Your resume is on the right, in your design. <b>Select any text in it to change it</b> and add the detail only you know. The score, the key skills and the download follow.</p>`;
  if (!u) { box.innerHTML = how + `<div class="rs-empty"><b>No changes from your answers</b><p class="small muted">This is your resume as you scanned it. Place your missing skills on the first page and the words they add are marked in the preview.</p></div>`; return; }
  const n = rsItems.filter(m => m.it.type !== "note").length, blocked = u.changes.reduce((a, c) => a + ((c.rejected && c.rejected.length) || 0), 0);
  box.innerHTML = how + `<div class="update-out">
    <h3 class="rs-changes-head">Changes from your answers</h3>
    <div class="score-change" aria-label="Score changes from ${u.before} to ${u.after}">
      <span class="from">${u.before}</span><span class="arrow">→</span><span class="to" style="color:${bandColor(u.after)}">${u.after}</span>
      <span class="small muted" style="font-family:var(--font-body)">${u.after > u.before ? `+${u.after - u.before} points from your answers` : "No change in score"}</span>
    </div>
    <p class="small muted">${n ? `${n} change${n === 1 ? "" : "s"}, each marked in blue in the preview, with the words it replaced. Revert any you don't want.` : "Nothing to add: every skill you placed went to Not applicable."}${blocked ? ` ${blocked} AI suggestion${blocked === 1 ? " was" : "s were"} blocked because ${blocked === 1 ? "it" : "they"} added something your answers didn't say.` : ""}</p>
    ${u.na.length ? `<p class="small muted">Left off as not applicable: ${esc(u.na.join(", "))}.</p>` : ""}
    <div id="rsCards" class="rs-cards-all"></div>
  </div>`;
  rsRenderCards();
}
// Download as Word, PDF or text: a Word file you uploaded keeps its own layout; everything else follows the design in the preview
async function downloadTailored(kind, btn) {
  const text = finalText(), st = $("downloadStatus");
  if (!text || !text.trim()) { st.textContent = "There's no resume text to download yet."; return; }
  let ok;
  if (kind === "docx" && fileInfo && fileInfo.ext === "docx" && fileInfo.buffer) ok = await exportResume(text, st, btn);
  else if (kind === "txt") ok = await downloadTextFile(exportName("txt"), text, st, btn);
  else {
    const { tpl, accent } = resumeDesignNow(), model = resumeTextModel(text, tpl);
    ok = await downloadMade(exportName(kind), async () => kind === "pdf" ? (await cvPdf(model, tpl, { accent })).blob : cvDocx(model, tpl, { accent }), st, btn);
  }
  if (ok) {
    downloaded = true; updateFlow();
    if (tailorMode !== "resume") st.textContent += " Next, fit your experience to the job's criteria, then write a cover letter to go with it.";
  }
}
onInit(() => {
  dlMenu("downloadBtn", { docx: b => downloadTailored("docx", b), pdf: b => downloadTailored("pdf", b), txt: b => downloadTailored("txt", b) });
  // a key skill: jump to it in the preview (turning the highlight on if it was off)
  $("rsSkills").addEventListener("click", e => {
    const c = e.target.closest("[data-sk]"); if (!c || c.disabled) return;
    if (!$("rsPrevHl").checked) { $("rsPrevHl").checked = true; renderResumePreview(); }
    pulseSkill($("rsPaper"), c.dataset.sk);
  });
  $("rsPrevHl").addEventListener("change", () => renderResumePreview());
  $("rsChgHl").addEventListener("change", () => { renderResumePreview(); rsRenderCards(); });
  $("rsDesignBtn").addEventListener("click", () => openView("cv"));
  // Revert a change, use it again, or find it in the preview
  $("rsChanges").addEventListener("click", e => {
    const b = e.target.closest("[data-rv-act]"); if (!b) return;
    const card = b.closest("[data-rv]"), m = rsItems[+card.dataset.rv]; if (!m) return;
    const act = b.dataset.rvAct;
    if (act === "find") {
      const hits = [...$("rsPaper").querySelectorAll(`ins.chg[data-rv="${card.dataset.rv}"]`)];
      if (!hits.length) return;
      hits[0].scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
      hits.forEach(x => { x.classList.remove("pulse"); void x.offsetWidth; x.classList.add("pulse"); });
      return;
    }
    rsSecs = rsSplit(finalText());
    if (!rsApply(m, act === "revert" ? "before" : "after")) return;
    m.on = act !== "revert";
    resumeEdit = rsJoin(rsSecs);
    refreshResumeScore(); renderResumePreview(); rsRenderCards(); updateFlow();
  });
  $("clDesigns").addEventListener("click", e => {
    const tp = e.target.closest("[data-lt-tpl]"), pf = e.target.closest("[data-lt-pref]");
    const mt = e.target.closest("[data-lt-match]");
    if (mt) { const c = P().cv; P().prefs.letterMatch = mt.checked; if (!mt.checked && !c.letterTemplate) { c.letterTemplate = letterTpl().key; c.letterAccent = c.accent; } touchProfile("letter"); renderLetterDesigns("clDesigns"); }
    else if (tp) { pickLetterTpl(tp.dataset.ltTpl); renderLetterDesigns("clDesigns"); }
    else if (pf) { P().prefs[pf.dataset.ltPref === "spacing" ? "letterSpacing" : "letterMargins"] = pf.dataset.val; touchProfile("letter"); renderLetterDesigns("clDesigns"); }
    else if (e.target.closest("#ltAllDesigns")) { openView("cv", { kind: "letter" }); return; }
    if ((tp || pf || mt) && cover.draft) clPreview();
  });
  $("clDesignBox").addEventListener("toggle", () => { if ($("clDesignBox").open) renderLetterDesigns("clDesigns"); });
  $("clDesignBtn").addEventListener("click", () => { const b = $("clDesignBox"); b.open = true; renderLetterDesigns("clDesigns"); b.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "nearest" }); });
  // The details the letter uses (Ready to write): select one to correct it
  $("clReady").addEventListener("click", e => { const b = e.target.closest("[data-focus]"); if (!b) return; readyEdit = b.dataset.focus; renderReady(); });
  $("clReady").addEventListener("input", e => { const t = e.target.closest("[data-ready-in]"); if (!t) return; const box = $(t.dataset.readyIn); box.value = t.value; box.dataset.auto = "0"; });
  $("clReady").addEventListener("keydown", e => {
    if (!e.target.matches || !e.target.matches("[data-ready-in]")) return;
    if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); readyEdit = null; renderReady(); }
  });
  $("clReady").addEventListener("focusout", e => { if (e.target.matches && e.target.matches("[data-ready-in]")) setTimeout(() => { if (readyEdit) { readyEdit = null; renderReady(); } }, 0); });

  /* --- Page 1: a cover letter from your profile --- */
  const pickBtn = $("clUseProfile"), pickBox = $("clProfilePick");
  pickBtn.addEventListener("click", async () => {
    const open = pickBox.hidden;
    pickBox.hidden = !open; pickBtn.setAttribute("aria-expanded", String(open));
    if (!open) return;
    pickBox.innerHTML = `<p class="progress">Looking in your profile…</p>`;
    await Promise.all([baseLetter.ready, savedLetters.ready]);
    const list = profileLetters();
    pickBox.innerHTML = `<div class="b-sub">Cover letters in your profile</div>` + (list.length
      ? `<ul class="saved-list">${list.map((x, k) => `<li><span class="saved-name"><b>${esc(x.name)}</b><span class="small muted">${x.saved ? `Saved ${esc(fmtSaved(x.saved))} · ` : ""}${wordCount(x.text)} words${cover.letters.some(l => l.name === x.name) ? " · already added" : ""}</span></span><span class="b-actions"><button class="btn" type="button" data-cl-use="${k}">Use it</button></span></li>`).join("")}</ul><p class="small muted">Up to 3 letters are used to match your voice and reuse real details.</p>`
      : `<p class="small muted">You haven't saved a cover letter to your profile yet. Write one in Create or edit cover letter and press <b>Save to my profile…</b>, and it will be here next time.</p>`);
    pickBox._list = list;
  });
  pickBox.addEventListener("click", async e => {
    const b = e.target.closest("[data-cl-use]"); if (!b) return;
    const x = (pickBox._list || [])[+b.dataset.clUse]; if (!x) return;
    cover.letters = [{ name: x.name, text: x.text, added: new Date().toISOString() }, ...cover.letters.filter(l => l.name !== x.name)].slice(0, 3);
    renderLetterFiles(); await saveCoverStore(); renderLetterFiles();
    pickBox.hidden = true; pickBtn.setAttribute("aria-expanded", "false");
  });

  /* --- Page 4: the paragraphs on the left, the breakdown and preview on the right, each pointing at the other --- */
  const cliOf = e => { const el = e.target.closest && e.target.closest("[data-cli]"); return el && el.closest("#sec-cover") ? el : null; };
  document.addEventListener("mouseover", e => { if (!e.target.closest || !e.target.closest("#sec-cover")) return; const el = cliOf(e); clHot(el ? +el.dataset.cli : null); });
  document.addEventListener("focusin", e => { const el = cliOf(e); if (el) clHot(+el.dataset.cli); });
  document.addEventListener("click", e => {
    if (!e.target.closest("#sec-cover")) return;
    // a skill chip: jump to it in the letter on the left
    const c = e.target.closest("#clBreak [data-sk]");
    if (c) { if (!c.disabled) pulseSkill($("clParts"), c.dataset.sk); return; }
    // craft warnings: jump to the paragraph, or fix that one paragraph's dashes or exclamation marks
    const b = e.target.closest("#clChecks [data-tk]");
    if (b && cover.draft) {
      const [kind, n] = b.dataset.tk.split(":"), i = +n, para = cover.draft.paragraphs[i];
      if (!para) return;
      if (kind === "dash" || kind === "exclaim") { para.text = (kind === "dash" ? fixDashes : fixExclaims)(para.text); const ta = $("clp-" + i); if (ta) { ta.value = para.text; growBox(ta); } clBack(i); renderBreakdown(); renderFinish(); clPreview(); }
      clFocus(i); return;
    }
    // a paragraph in the breakdown or the preview: go to it on the left
    if (e.target.closest("button, a, input, textarea")) return;
    const el = e.target.closest("#clBreak .cl-part[data-cli], #clPaper .lt-p[data-cli]");
    if (el) clFocus(+el.dataset.cli);
  });
  $("cvBack").addEventListener("click", () => setTailorStage("fit"));
  // the buttons along the bottom of the cover letter page
  dlMenu("clDl", { docx: () => downloadCover("docx"), pdf: () => downloadCover("pdf"), txt: () => downloadCover("txt") });
  $("clCopy").addEventListener("click", async () => {
    const b = $("clCopy"), text = coverPlainText();
    try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; } catch { b.textContent = "Couldn't copy here"; }
    setTimeout(() => { b.textContent = "Copy text"; }, 2200);
  });
  $("clAgain").addEventListener("click", generateCover);
  $("clSave").addEventListener("click", saveTailorLetter);
  $("clAnother").addEventListener("click", tailorAnotherJob);
});
// Back to the first page for the next ad. The resume stays as it was pasted, because the skills placed for this job were for this job only.
function tailorAnotherJob() {
  els.jd.value = ""; els.title.value = "";
  setExample(false);
  hideResults();
  updateCounts(); showInputs(true); updateFlow();
  window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
  els.jd.focus({ preventScroll: true });
  els.fileStatus.classList.remove("err");
  els.fileStatus.textContent = "Your resume is still here, as you pasted it. Paste the next job ad.";
}
// Light up paragraph i everywhere it appears (the box on the left, its card in the breakdown, its place in the preview)
function clHot(i) {
  document.querySelectorAll("#sec-cover [data-cli]").forEach(el => el.classList.toggle("hot", i != null && +el.dataset.cli === i));
}
function clFocus(i) {
  const ta = $("clp-" + i); if (!ta) return;
  const box = ta.closest(".lt-part") || ta;
  box.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
  setTimeout(() => ta.focus({ preventScroll: true }), reduceMotion() ? 0 : 300);
  box.classList.remove("flash-part"); void box.offsetWidth; box.classList.add("flash-part");
}

/* --- Page 4: the key skills named in the breakdown (the letter itself shows them highlighted, on the left) --- */
function letterSkillReview(d) {
  if (!lastResult || !d) return "";
  const skills = tailorKeySkills();
  if (!skills.length) return "";
  const text = d.paragraphs.map(p => p.text).join(" "), inL = skillSet(text);
  const mine = skills.filter(s => inL.has(s.name));
  return `<div class="sk-review"><b>Where your key skills appear</b>
    <p class="small muted">${mine.length} of ${skills.length} key skills from the ad are in your letter, highlighted in the paragraphs on the left. Select one to jump to it.</p>
    ${mine.length ? `<div class="sk-chips">${skillChips(mine, inL)}</div>` : ""}${skillLegendHtml}</div>`;
}
// Keep the cover letter (in the tailor flow) for later
async function saveTailorLetter() {
  const d = cover.draft, ctx = cover.ctx, st = $("clStatus");
  if (!d || !ctx) return;
  const gaps = missingTokens(d).length;
  const name = await askName({ title: "Save this cover letter", text: "It's saved to your profile, so you can start a later letter from it in Create or edit cover letter. Saving again with the same name replaces it.", label: "Name it", value: [ctx.title, ctx.company].filter(Boolean).join(" – ") });
  if (!name) return;
  await savedLetters.ready;
  const list = savedLetters.data.list = (savedLetters.data.list || []).filter(x => x.name.toLowerCase() !== name.toLowerCase());
  list.unshift({ id: uid8(), name, saved: new Date().toISOString(), letter: { role: ctx.title, company: ctx.company, recipient: ctx.recipient, salutation: d.salutation, parts: d.paragraphs.map(p => ({ part: p.part, text: p.text })), signoff: d.signoff } });
  if (list.length > MAX_SAVED) list.length = MAX_SAVED;
  savedLetters.save(true);
  st.textContent = `“${name}” is ${whereWords(savedLetters.where === "loading" ? profile.where : savedLetters.where)}.${gaps ? ` It has ${gaps} gap${gaps === 1 ? "" : "s"} still to fill, so fill ${gaps === 1 ? "it" : "them"} in before you send it.` : ""}`;
}
