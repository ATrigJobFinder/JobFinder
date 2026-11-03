/* ===================== Version 22: the cover letter page works like the resume builder ===================== */
// Sections (Layout, Cover letter), a choice between a letter for one job and a template,
// and a dot beside Create or edit resume / cover letter in the menu while there's something unfinished.

const LT_STEPS = [["Layout", "Pick a design and set the spacing"], ["Cover letter", "Write the paragraphs"]];
let ltStep = 0;
function ltShowStep(n) {
  ltStep = n;
  document.querySelectorAll("#view-letter [data-ltstep]").forEach(el => { el.hidden = +el.dataset.ltstep !== n; });
  const ol = $("ltSteps");
  if (ol) ol.innerHTML = LT_STEPS.map(([t], i) => `<li class="${i === n ? "current" : i < n ? "done" : ""}"><button type="button" data-ltgo="${i}" aria-current="${i === n ? "step" : "false"}"><span class="n">${i + 1}</span><span class="t">${esc(t)}</span></button></li>`).join("");
}
const stageOfLetter = () => { try { return letterStage(); } catch { return ""; } };
function ltV22Preview() { navDots(); }

function ltModeRender() {
  const t = ltTemplate();
  document.querySelectorAll("#ltMode [data-lt-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.ltMode === (t ? "template" : "job"))));
  const f = $("ltFields"); if (f) f.hidden = t;
  const i = $("ltModeInfo");
  if (i && !i.firstChild) i.innerHTML = `<button type="button" class="hinfo" data-l1="A specific job" data-l2="A template for any job" data-what="Fill in the job and company, and the letter uses them." data-why="A template you can reuse for any job. The job title, company and who it's addressed to stay as yellow placeholders, and the greeting is “Dear Hiring Manager,”. Fill them in when you send it. Paragraphs you've already written aren't changed: press Start from my profile to write them again with placeholders." aria-label="Who is this letter for: what the two choices do" aria-expanded="false">i</button>`;
}
function ltV22Render() {
  ltModeRender();
  ltShowStep(ltStep);
  ltNextCards();
  navDots();
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
    const pending = !!val(p.summary) && !p.summaryOk;
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
    const go = e.target.closest("[data-ltgo]");
    if (go) { ltShowStep(+go.dataset.ltgo); window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" }); return; }
    const m = e.target.closest("[data-lt-mode]");
    if (m) { BL().mode = m.dataset.ltMode === "template" ? "template" : "job"; baseLetter.save(); ltModeRender(); letterEdited(); renderLetterPage(); return; }
    const nx = e.target.closest("[data-nx]");
    if (nx) openView(nx.dataset.nx);
  });
  onProfile(() => navDots());
  setTimeout(navDots, 1200);   // the saved letter arrives a moment after the page loads
  setInterval(navDots, 5000);
});
