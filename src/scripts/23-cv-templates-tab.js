/* ===================== CV templates tab ===================== */
const FORMALITY_WORDS = ["", "Casual", "Relaxed", "Balanced", "Professional", "Formal"];
const JOB_TIPS = {
  graduate: ["Put education first and include your grades if they're a credit average or better.", "Graduate programs screen with applicant tracking systems, so a single-column design is the safe choice."],
  engineering: ["Name the software and standards you've used. Recruiters search for them.", "Projects with numbers (loads, savings, tolerances) carry weight."],
  corporate: ["Keep it conservative: one accent colour, serif or clean sans type.", "Lead each bullet point with a result: money, time or risk."],
  government: ["Many agencies ask for a two-page resume plus a pitch or selection criteria. Keep the design plain.", "Use the words from the capabilities in the ad."],
  tech: ["Put your skills and stack near the top.", "Link your GitHub or portfolio, and show what you shipped."],
  health: ["List registrations, checks and certificates clearly. They're often mandatory.", "A calm, readable design suits most health and education employers."],
  creative: ["A designed layout is welcome, but keep it readable and link your portfolio.", "If you're applying through an online portal, also keep a single-column version."],
  hospitality: ["Put your availability near the top. Managers roster around it.", "Include RSA, food safety and first aid certificates."],
  trades: ["Put licences and tickets near the top. They're often the first filter.", "List the equipment and tools you can use."],
  academic: ["Academic CVs can run longer than two pages. Put publications and research first.", "Use the citation style of your field."]
};
const cvState = { selected: "", rendered: false, filter: [], kind: "resume", show: 24 };
const cvLetters = () => cvState.kind === "letter";
// A template's preview: the resume, or the matching cover letter
function tplPreview(t, acc, data) { return cvLetters() ? letterHtml(baseLetterParts(), letterStyle(t, acc)) : cvHtml(cvModel(data || cvData(), t), t, { accent: acc }); }
const cvData = () => hasProfile(P()) ? P() : SAMPLE_PROFILE;
const cvPrefs = () => P().cv;
// With "match" off, cover letter designs are picked on their own and the resume keeps its design
const letterMatched = () => P().prefs.letterMatch !== false;
const cvSep = () => cvLetters() && !letterMatched();
const cvTplPref = () => cvSep() ? (cvPrefs().letterTemplate || cvPrefs().template) : cvPrefs().template;
const cvAccentPref = () => cvSep() ? cvPrefs().letterAccent : cvPrefs().accent;
function cvJobType() { return cvPrefs().jobType || P().target.jobType || ""; }
function cvFormality() { const f = +cvPrefs().formality; if (f) return f; const jt = jobTypeOf(cvJobType()); return jt ? jt.formality : 3; }
function rankTemplates() {
  const jt = cvJobType(), f = cvFormality();
  // the 18 original designs come before their variations when they match equally well
  return CV_TEMPLATES.map((t, i) => ({ t, i, rec: !!jt && fitsJob(t, jt), dist: Math.abs(t.formality - f) }))
    .sort((a, b) => (b.rec - a.rec) || (a.dist - b.dist) || ((a.t.family ? 1 : 0) - (b.t.family ? 1 : 0)) || (a.i - b.i));
}
function selectedTpl() {
  const k = cvSep() ? (cvState.selectedLetter || cvTplPref()) : (cvState.selected || cvPrefs().template);
  return CV_TEMPLATES.some(t => t.key === k) ? tplByKey(k) : rankTemplates()[0].t;
}
function renderCvFilters() {
  const jt = cvJobType();
  $("cvJobs").innerHTML = JOB_TYPES.map(j => `<button type="button" class="opt-tile" data-job="${j.key}" aria-pressed="${jt === j.key}">${esc(j.label)}</button>`).join("");
  const f = cvFormality();
  $("cvFormal").value = f;
  $("cvFormalOut").textContent = FORMALITY_WORDS[f];
}
function renderCvSource() {
  const box = $("cvSource"), p = P();
  if (cvLetters()) {
    const own = blText().length > 0;
    box.classList.toggle("sample", !own);
    box.innerHTML = own ? `<span>Showing <b>your cover letter</b>${BL().role ? ` for ${esc(BL().role)}` : ""}. It uses the same fonts and colour as the resume design you pick, so the two look like a set.</span>`
      : `<span><b>These previews use a sample letter.</b> Write yours once and see it in every design.</span><span class="acts"><button class="btn primary" type="button" data-cv="letter">Write my cover letter</button></span>`;
    return;
  }
  const own = hasProfile(p);
  box.classList.toggle("sample", !own);
  if (!own) {
    const fromScan = els.resume.value.trim() && wordCount(els.resume.value) > 40;
    box.innerHTML = `<span><b>These previews use made-up details.</b> Add yours to see your own resume in every design.</span><span class="acts"><button class="btn primary" type="button" data-cv="build">Answer the questions</button><button class="btn" type="button" data-cv="import">Upload my resume</button>${fromScan ? '<button class="btn" type="button" data-cv="scan">Use the resume from Tailor to a job</button>' : ""}</span>`;
  } else {
    const jobs = p.experience.filter(e => e.title || e.org).length;
    box.innerHTML = `<span>Showing <b>${esc(p.contact.name || "your details")}</b>${p.target.title ? `, ${esc(p.target.title)}` : ""}: ${jobs} job${jobs === 1 ? "" : "s"}, ${p.education.filter(e => e.degree || e.inst).length} qualification${p.education.length === 1 ? "" : "s"}. Changes in the resume builder show up here.</span>`;
  }
}
function renderGallery() {
  const ranked = rankTemplates(), sel = selectedTpl().key;
  const data = cvData();
  const best = ranked.filter(r => r.rec).slice(0, 3).map(r => r.t.key);
  const f = $("cvTplFilter"); if (f) f.innerHTML = tplFilterHtml(cvState.filter, "data-tplf");
  const matches = ranked.filter(({ t }) => tplMatches(t, cvState.filter) || t.key === sel);
  const showing = matches.slice(0, cvState.show);
  if (!showing.some(r => r.t.key === sel)) { const s = matches.find(r => r.t.key === sel); if (s) showing.unshift(s); }
  $("cvGallery").innerHTML = showing.map(({ t, dist }) => {
    const dots = [1, 2, 3, 4, 5].map(n => `<i class="${n <= t.formality ? "on" : ""}"></i>`).join("");
    const acc = sel === t.key && cvAccentPref() && t.accents.includes(cvAccentPref()) ? cvAccentPref() : t.accent;
    return `<button type="button" class="tpl-card${dist >= 3 && !best.includes(t.key) ? " dim" : ""}" data-tpl="${t.key}" aria-pressed="${sel === t.key}" aria-label="${esc(t.name)}: ${esc(FORMALITY_WORDS[t.formality])}. ${esc(t.goodFor)}">
      <span class="tpl-thumb"><div>${tplPreview(t, acc, data)}</div></span>
      <span class="tpl-name">${esc(t.name)}<span class="tpl-dots" title="${esc(FORMALITY_WORDS[t.formality])}">${dots}</span></span>
      ${best.includes(t.key) || t.ats ? `<span class="tpl-badges">${best.includes(t.key) ? `<span class="tpl-badge">Best match</span>` : ""}${t.ats ? '<span class="tpl-badge ats">ATS-friendly</span>' : ""}</span>` : ""}
      <span class="tpl-good">${esc(t.goodFor)}</span>
    </button>`;
  }).join("") || '<p class="small muted">No design matches all of those filters. Untick one.</p>';
  const left = matches.length - showing.length;
  let more = $("cvMore");
  if (!more) { more = document.createElement("div"); more.id = "cvMore"; more.className = "b-actions cv-more"; $("cvGallery").insertAdjacentElement("afterend", more); }
  more.innerHTML = left > 0 ? `<button class="btn" type="button" data-cvmore="1">Show ${Math.min(24, left)} more designs</button><span class="small muted">${matches.length} ${matches.length === 1 ? "match" : "matches"}</span>` : "";
  fitThumbs();
}
function fitThumbs() {
  document.querySelectorAll(".tpl-thumb").forEach(th => { const k = th.clientWidth / 794; if (k > 0) th.firstElementChild.style.transform = `scale(${k})`; });
}
function renderCvEditor() {
  const t = selectedTpl(), data = cvData();
  const accent = cvTplPref() === t.key && t.accents.includes(cvAccentPref()) ? cvAccentPref() : t.accent;
  $("cvTplName").textContent = t.name;
  $("cvTplBlurb").textContent = t.blurb;
  // the page setup (spacing, margins) chosen in the Resume creator applies here too
  const tp = tplWithPrefs(t), model = cvModel(data, tp);
  const pages = mountPaper($("cvPaper"), cvLetters() ? letterHtml(baseLetterParts(), letterStyle(t, accent)) : cvHtml(model, tp, { accent }));
  $("cvSwatches").innerHTML = t.accents.map(a => `<button type="button" class="swatch" data-accent="${a}" style="background:${a}" aria-pressed="${a === accent}" aria-label="Accent colour ${a}"></button>`).join("");
  const jt = cvJobType(), tips = commonFor(JOB_TIPS, jt, []);
  const fits = jt && fitsJob(t, jt);
  $("cvWhy").innerHTML = `<h3>About this design</h3><ul>
    <li><b>${esc(FORMALITY_WORDS[t.formality])}.</b> Good for ${esc(lowerFirst(t.goodFor))}.</li>
    <li>${t.ats ? "Single column, so applicant tracking systems read it in the right order." : "Two columns can confuse some applicant tracking systems. Use it when you email or hand in your resume, and use Professional for online portals."}</li>
    ${jt && !fits ? `<li>Not a usual pick for ${esc(jobLabel(jt).toLowerCase())}. The best matches are at the top of the list.</li>` : ""}
    ${tips.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  cvState.model = model; cvState.tpl = tp; cvState.accent = accent;
  if (cvLetters()) {
    const own = blText().length > 0, gaps = own ? (blText().join(" ").match(TOKEN_RE) || []).length : 0;
    $("cvWhy").innerHTML = `<h3>About this letter design</h3><ul>
      <li>Same fonts, colour and name style as the ${esc(t.name)} resume, so your application looks like one set.</li>
      <li>${t.layout === "band" ? "Your name sits in a coloured band across the top, like the resume." : t.layout === "sidebar" ? "A thin bar of colour down the side echoes the resume's sidebar, but the letter stays one column so it's easy to read." : "A simple rule under your name keeps it clean and formal."}</li>
      <li>Keep it to one page: about ${letterRange()[0]} to ${letterRange()[1]} words at your stage, in five paragraphs.</li></ul>`;
    $("cvPages").textContent = !own ? "Write your cover letter to download it in this design." : gaps ? `Fill in the ${gaps} gap${gaps === 1 ? "" : "s"} in [brackets] first.` : `${pages} page${pages === 1 ? "" : "s"}.${pages > 1 ? " Trim it to fit on one page." : ""}`;
    $("cvPages").classList.toggle("warn", own && (pages > 1 || gaps > 0));
    $("cvDl").disabled = !own || gaps > 0;
    return;
  }
  const own = hasProfile(P());
  const academic = (t.family || t.key) === "academic";
  $("cvPages").textContent = !own ? "Add your details to download your own version." : `${pages} page${pages === 1 ? "" : "s"}.${pages > 2 && !academic ? " Most recruiters read two pages at most, so trim older roles or bullet points." : ""}`;
  $("cvPages").classList.toggle("warn", own && pages > 2 && !academic);
  $("cvDl").disabled = !own;
}
function renderCv() {
  if (currentView !== "cv") { cvState.rendered = false; return; }
  document.querySelectorAll("#cvKind [data-kind]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.kind === cvState.kind)));
  $("cvMatch").checked = letterMatched();
  $("cvMatchNote").textContent = letterMatched() ? "On: your cover letter uses the same design, fonts and colour as your resume, so they look like a set." : cvLetters() ? "Off: you're choosing the cover letter's design on its own. Your resume keeps its design." : "Off: your cover letter has its own design. Switch to Cover letters above to choose it.";
  $("view-cv").dataset.kind = cvState.kind;
  $("cvEditBtn").textContent = cvLetters() ? "Edit my cover letter" : "Edit my details";
  $("cvGallery").setAttribute("aria-label", cvLetters() ? "Cover letter designs, best match first" : "Templates, best match first");
  renderCvSource(); renderCvFilters(); renderGallery(); renderCvEditor();
  cvState.rendered = true;
}
function setCvPref(k, v) { P().cv[k] = v; touchProfile("cv"); }
async function cvDownload(kind, btn) {
  const { model, tpl, accent } = cvState;
  if (!model) return;
  if (cvLetters()) {
    const L = baseLetterParts(), st = letterStyle(tpl, accent);
    const name = `${(L.signName || "Cover").replace(/[\\/:*?"<>|]+/g, "")} - Cover Letter${BL().role ? ` - ${BL().role.replace(/[\\/:*?"<>|]+/g, "")}` : ""}`.slice(0, 150) + "." + kind;
    if (kind === "txt") return downloadTextFile(name, letterPlainText(L), $("cvStatus"), btn);
    await downloadMade(name, () => kind === "pdf" ? buildCoverPdf(L, st) : buildCoverDocx(L, st), $("cvStatus"), btn);
    return;
  }
  if (kind === "txt") return downloadTextFile(cvFileName(model, kind, (tpl.family || tpl.key) === "academic" ? "CV" : "Resume"), profileToText(P()), $("cvStatus"), btn);
  await downloadMade(cvFileName(model, kind, (tpl.family || tpl.key) === "academic" ? "CV" : "Resume"), async () => kind === "pdf" ? (await cvPdf(model, tpl, { accent })).blob : cvDocx(model, tpl, { accent }), $("cvStatus"), btn);
}
onInit(() => {
  $("cvJobs").addEventListener("click", e => {
    const b = e.target.closest("[data-job]"); if (!b) return;
    P().cv.jobType = b.dataset.job;
    P().cv.formality = 0;   // follow the job type's usual formality until the slider moves
    cvState.selected = "";
    P().cv.template = "";
    touchProfile("cv"); renderCv();
  });
  $("cvFormal").addEventListener("input", () => { P().cv.formality = +$("cvFormal").value; $("cvFormalOut").textContent = FORMALITY_WORDS[+$("cvFormal").value]; cvState.selected = ""; P().cv.template = ""; touchProfile("cv"); renderGallery(); renderCvEditor(); });
  $("cvTplFilter").addEventListener("click", e => {
    const b = e.target.closest("[data-tplf]"); if (!b) return;
    const v = b.dataset.tplf;
    cvState.filter = v === "all" ? [] : cvState.filter.includes(v) ? cvState.filter.filter(x => x !== v) : [...cvState.filter, v];
    cvState.show = 24; renderGallery();
  });
  document.addEventListener("click", e => { if (e.target.closest("[data-cvmore]")) { cvState.show += 24; renderGallery(); } });
  $("cvGallery").addEventListener("click", e => {
    const b = e.target.closest("[data-tpl]"); if (!b) return;
    if (cvSep()) { cvState.selectedLetter = b.dataset.tpl; P().cv.letterAccent = ""; setCvPref("letterTemplate", b.dataset.tpl); }
    else { cvState.selected = b.dataset.tpl; setCvPref("template", b.dataset.tpl); }
    document.querySelectorAll("#cvGallery [data-tpl]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    renderCvEditor();
    $("cvEditorPanel").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  });
  $("cvSwatches").addEventListener("click", e => {
    const b = e.target.closest("[data-accent]"); if (!b) return;
    if (cvSep()) { P().cv.letterTemplate = selectedTpl().key; P().cv.letterAccent = b.dataset.accent; }
    else { P().cv.template = selectedTpl().key; P().cv.accent = b.dataset.accent; }
    touchProfile("cv");
    renderCvEditor();
    const card = document.querySelector(`#cvGallery [data-tpl="${selectedTpl().key}"] .tpl-thumb > div`);
    if (card) card.innerHTML = tplPreview(selectedTpl(), b.dataset.accent);
  });
  $("cvMatch").addEventListener("change", () => {
    const on = $("cvMatch").checked, c = P().cv;
    P().prefs.letterMatch = on;
    // turning it off starts the letter on the resume's current design; turning it on puts the letter back in step with the resume
    if (!on && !c.letterTemplate) { c.letterTemplate = selectedTpl().key; c.letterAccent = c.accent; }
    cvState.selectedLetter = "";
    touchProfile("cv"); renderCv();
  });
  dlMenu("cvDl", { docx: b => cvDownload("docx", b), pdf: b => cvDownload("pdf", b), txt: b => cvDownload("txt", b) });
  $("cvEditBtn").addEventListener("click", () => openView(cvLetters() ? "letter" : "builder"));
  $("cvKind").addEventListener("click", e => { const b = e.target.closest("[data-kind]"); if (!b || b.dataset.kind === cvState.kind) return; cvState.kind = b.dataset.kind; baseLetter.ready.then(renderCv); });
  $("cvSource").addEventListener("click", async e => {
    const b = e.target.closest("[data-cv]"); if (!b) return;
    if (b.dataset.cv === "build") openView("builder");
    else if (b.dataset.cv === "letter") openView("letter");
    else if (b.dataset.cv === "import") { openView("builder"); setTimeout(() => showWelcome("bPick"), 60); }
    else if (b.dataset.cv === "scan") { const st = document.createElement("p"); if (await importResumeText(finalText(), st, "the resume from Tailor to a job")) renderCv(); }
  });
  if (window.ResizeObserver) new ResizeObserver(() => { if (currentView === "cv") fitThumbs(); }).observe($("cvGallery"));
  viewHooks.cv = (opts = {}) => { if (opts.kind) cvState.kind = opts.kind; baseLetter.ready.then(renderCv); };
  let t;
  onProfile(src => { if (currentView === "cv" && src !== "cv") { clearTimeout(t); t = setTimeout(renderCv, 120); } });
});

