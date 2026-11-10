/* ===================== Version 22: the cover letter page works like the resume builder ===================== */
// Sections (Layout, Cover letter), a choice between a letter for one job and a template,
// and a dot beside Create or edit resume / cover letter in the menu while there's something unfinished.

const LT_STEPS = [["Layout", "Pick a design and set the spacing"], ["Cover letter", "Write the paragraphs"]];
let ltStep = 0;
function ltShowStep(n) {
  ltStep = n;
  document.querySelectorAll("#view-letter [data-ltstep]").forEach(el => { el.hidden = +el.dataset.ltstep !== n; });
  // the design thumbnails were sized while hidden (zero width), so size them again now they show
  if (n === 0 && typeof fitThumbs === "function") { fitThumbs(); requestAnimationFrame(fitThumbs); }
  const ol = $("ltSteps");
  if (ol) ol.innerHTML = `<li class="${ltWelcomeOn ? "current" : "done"}"><button type="button" data-ltup="1"${ltWelcomeOn ? ' aria-current="step"' : ""} title="${ltWelcomeOn ? "" : "Complete. "}Bring in your resume or LinkedIn, or start from scratch"><span class="n">0</span><span class="t">Upload</span>${ltWelcomeOn ? "" : '<span class="visually-hidden"> (complete)</span>'}</button></li>` + LT_STEPS.map(([t], i) => `<li class="${i === n ? "current" : i < n ? "done" : ""}"><button type="button" data-ltgo="${i}" aria-current="${i === n ? "step" : "false"}"><span class="n">${i + 1}</span><span class="t">${esc(t)}</span></button></li>`).join("");
}
function ltV22Preview() { navDots(); }
// The letter's strength out of 100, shown above the preview like the resume's: paragraphs written, each long enough, the whole letter's length,
// no gaps left (a template is meant to have them), and no warnings from the checks under the letter
function letterScore(parts, r, wc, gaps, quality, forJob) {
  const filled = parts.filter(p => p.text.trim()).length;
  if (!filled) return 0;
  const met = parts.filter(p => wordCount(p.text) >= partMin(p.part, r)).length;
  const len = wc >= r[0] && wc <= r[1] ? 1 : wc < r[0] ? wc / r[0] : Math.max(0, 1 - (wc - r[1]) / r[1]);
  const gapPart = !forJob && ltTemplate() ? 1 : Math.max(0, 1 - gaps / 5);
  const clean = Math.max(0, 1 - quality.length * 0.25);
  return Math.round(35 * filled / parts.length + 20 * met / parts.length + 20 * len + 10 * gapPart + 15 * clean);
}

// "Job title you are applying for?": typed in, shown first so the designs and the AI both know. The kind of work is worked out from the title.
function renderLetterKind() {
  const box = $("ltJobType");
  if (!box) return;
  const cur = P().target.title || "", inp = $("ltJobTitle");
  if (inp) { if (document.activeElement !== inp) inp.value = cur; return; }   // already drawn: don't disturb someone who is typing
  const id = "ltJobTitle";
  box.innerHTML = `<div class="q"><label class="q-label" for="${id}">Job title you are applying for?</label><div class="q-body"><div class="pick sugg"><input type="text" id="${id}" data-lt-title="1" data-suggest="titles" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-sl" aria-describedby="${id}_h" autocomplete="off" autocapitalize="words" value="${esc(cur)}" placeholder="e.g. Graduate Civil Engineer"><ul class="pick-list" id="${id}-sl" role="listbox" aria-label="Job title suggestions" hidden></ul></div><p class="q-hint" id="${id}_h">Designs that suit this kind of job are shown first, and the AI writes with it in mind.</p></div></div>`;
}
// Typing a title keeps it in your profile; once it's entered the kind of work follows from it (and the designs are ranked again)
function ltTitleCommit(v) {
  const t = P().target, old = t.title || "", d = BL();
  t.title = v;
  const kind = titleKind(v);
  if (kind) { if (kind !== t.jobType) t.jobSub = ""; t.jobType = kind; }
  // the letter's own "Role you're applying for" follows, unless it was changed by hand to something else
  if (!ltTemplate() && (!d.role || d.role === old)) {
    d.role = v;
    const r = $("lt-role"); if (r && document.activeElement !== r) { r.value = v; r.classList.toggle("gap-input", !v.trim()); }
    letterEdited();
  }
  touchProfile("letter");
  renderLetterDesigns();
}
function ltModeRender() {
  const t = ltTemplate();
  document.querySelectorAll("#ltMode [data-lt-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.ltMode === (t ? "template" : "job"))));
  const f = $("ltFields"); if (f) f.hidden = t;
  const i = $("ltModeInfo");
  if (i && !i.firstChild) i.innerHTML = `<button type="button" class="hinfo" data-l1="A template for any job" data-l2="A specific job" data-what="A letter you can reuse for any job. The job title, company and who it's addressed to stay as yellow placeholders, and the greeting is “Dear Hiring Manager,”. Fill them in when you send it. Paragraphs you've already written aren't changed: press Start from my profile to write them again with placeholders." data-why="Fill in the job and company, and the letter uses them." aria-label="Who is this letter for: what the two choices do" aria-expanded="false">i</button>`;
}
function ltV22Render() {
  ltModeRender();
  renderLetterKind();
  ltShowStep(ltStep);
  ltNextCards();
  navDots();
  if (typeof renderLetterSources === "function") renderLetterSources();
  applyLtWelcome();
}

/* --- Three ways to go on, at the bottom of the page --- */
function ltNextCards() {
  const box = $("ltNext");
  if (!box) return;
  const card = (nx, tag, head, text, go) => `<button type="button" class="nx-card" data-nx="${nx}"><span class="nx-tag">${tag}</span><b>${head}</b><span class="nx-text">${text}</span><span class="nx-go">${go} <i aria-hidden="true">→</i></span></button>`;
  box.innerHTML = `<div class="b-sub">What next?</div><p class="q-hint">Your letter is written. These three make it work harder for you.</p><div class="b-next nx">`
    + card("scanner", "Most useful", "Tailor this letter to a real job", "Paste a job ad and Job Finder reshapes your resume and this letter around what that job asks for, crediting each job correctly.", "Tailor to a job")
    + card("linkedin", "Do this next", "Make your LinkedIn match", "Get a headline, About section and skills list written from your profile, so recruiters see the same strong story everywhere.", "Improve my LinkedIn")
    + card("interview", "Quick win", "Practise the interview", "Pick a question, type your answer and get feedback in a minute. Letters often lead to calls.", "Practise answers")
    + `</div>`;
}

/* --- A dot in the menu while something is unfinished --- */
function navDots() {
  const set = (view, todo, why) => document.querySelectorAll(`.sn-item[data-view="${view}"]`).forEach(a => { a.classList.toggle("has-todo", !!todo); if (todo) a.setAttribute("data-todo", why); else a.removeAttribute("data-todo"); });
  try {
    const p = P(), drafts = draftsIn(p).length, noneYet = !p.experience.some(e => e.done !== false && hasContent(e)) && !p.education.some(e => e.done !== false && hasContent(e));
    const pending = false;   // (the summary has nothing to accept now)
    set("builder", drafts || pending || noneYet, drafts ? `${drafts} draft${drafts === 1 ? "" : "s"} not on your resume yet` : pending ? "Your summary isn't accepted yet" : "Nothing on your resume yet");
  } catch { /* profile not ready */ }
  try {
    const parts = BL().parts, filled = parts.filter(x => x.text.trim()), TOKEN = /\[[^\]\n]{2,}\]/;
    const gaps = filled.some(x => TOKEN.test(x.text)), tpl = ltTemplate();
    set("letter", filled.length < parts.length || (gaps && !tpl), filled.length < parts.length ? `${parts.length - filled.length} paragraph${parts.length - filled.length === 1 ? "" : "s"} still to write` : "Gaps still to fill in");
  } catch { /* letter not ready */ }
}

onInit(() => {
  const v = $("view-letter");
  if (!v) return;
  v.addEventListener("click", e => {
    if (e.target.closest("[data-ltup]")) { ltGoStart(); return; }
    const go = e.target.closest("[data-ltgo]");
    if (go) { ltShowStep(+go.dataset.ltgo); window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" }); return; }
    const m =e.target.closest("[data-lt-mode]");
    if (m) { BL().mode = m.dataset.ltMode === "template" ? "template" : "job"; baseLetter.save(); ltModeRender(); letterEdited(); renderLetterPage(); return; }
    const nx = e.target.closest("[data-nx]");
    if (nx) openView(nx.dataset.nx);
  });
  // the title box: kept as you type (the type-ahead sends an input and a change when a suggestion is picked)
  v.addEventListener("change", e => { if (e.target.matches && e.target.matches("[data-lt-title]")) ltTitleCommit(e.target.value.trim()); });
  onProfile(() => navDots());
  setTimeout(navDots, 1200);   // the saved letter arrives a moment after the page loads
  setInterval(navDots, 5000);
});
