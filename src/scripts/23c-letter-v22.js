/* ===================== Version 22: the cover letter page works like the resume builder ===================== */
// Sections (Layout, Cover letter), a choice between a letter for one job and a template, one or two pages with a reason,
// and a dot beside Create or edit resume / cover letter in the menu while there's something unfinished.

const LT_STEPS = [["Layout", "Pick a design and set the spacing"], ["Cover letter", "Write the paragraphs"]];
let ltStep = 0;
function ltShowStep(n) {
  ltStep = n;
  document.querySelectorAll("#view-letter [data-ltstep]").forEach(el => { el.hidden = +el.dataset.ltstep !== n; });
  const lay = $("ltLayout"); if (lay) lay.classList.toggle("lt-solo", n === 0);
  const ol = $("ltSteps");
  if (ol) ol.innerHTML = LT_STEPS.map(([t], i) => `<li class="${i === n ? "current" : i < n ? "done" : ""}"><button type="button" data-ltgo="${i}" aria-current="${i === n ? "step" : "false"}"><span class="n">${i + 1}</span><span class="t">${esc(t)}</span></button></li>`).join("");
}
const ltPageWords = () => {
  // about how many words fill one page at the chosen spacing and margins
  const lay = typeof letterLayout === "function" ? letterLayout() : { lh: 1, mm: 23 };
  return Math.round(400 / (lay.lh || 1) * (23 / (lay.mm || 23)) ** 0.5);
};
// 1 or 2 pages, with the reason for the suggestion
function ltPagesHtml() {
  const pr = P().prefs, pages = pr.letterPages === 2 ? 2 : 1, parts = BL().parts.map(p => p.text.trim()).filter(Boolean);
  const words = parts.reduce((a, t) => a + wordCount(t), 0), one = ltPageWords();
  const jobs = P().experience.filter(e => e.done !== false && (e.title || e.org)).length, years = (() => { const ys = P().experience.map(e => monthIndex(e.start)).filter(x => x != null); return ys.length ? Math.round(((new Date().getFullYear() * 12 + new Date().getMonth()) - Math.min(...ys)) / 12) : 0; })();
  let rec, why;
  if (years >= 10 || stageOfLetter() === "senior") { rec = words > one * 1.1 ? 2 : 1; why = rec === 2 ? `You have ${years ? years + " years" : "a lot"} of experience and ${words} words to say, more than one page holds (about ${one}), so two pages is reasonable.` : `One page is still best: ${words} words fits (about ${one} fit on a page), even with your experience. Senior roles are the usual exception for two.`; }
  else { rec = 1; why = words > one ? `${words} words is a little more than one page holds (about ${one}). Most recruiters read one page, so trim to about ${one} words rather than adding a page.` : `One page is right for most roles: ${words ? words + " words fits" : "a letter of about " + one + " words fits"} (about ${one} fit on a page), and a recruiter is more likely to read all of it.`; }
  const b = n => `<button type="button" data-lt-pages="${n}" aria-pressed="${pages === n}">${n} page${n === 1 ? "" : "s"}${rec === n ? " (suggested)" : ""}</button>`;
  return `<div class="q"><div class="q-label" id="ltPagesL">How long should it be?</div><div class="seg" role="group" aria-labelledby="ltPagesL">${b(1)}${b(2)}</div><p class="q-hint">${esc(why)}</p></div>`;
}
const stageOfLetter = () => { try { return letterStage(); } catch { return ""; } };
function ltV22Preview() { const el = $("ltPages"); if (el) el.innerHTML = ltPagesHtml(); navDots(); }

function ltModeRender() {
  const t = ltTemplate();
  document.querySelectorAll("#ltMode [data-lt-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.ltMode === (t ? "template" : "job"))));
  const f = $("ltFields"); if (f) f.hidden = t;
  const h = $("ltModeHint"); if (h) h.textContent = t ? "A template you can reuse for any job. The job title, company and who it's addressed to stay as yellow placeholders, and the greeting is “Dear Hiring Manager,”. Fill them in when you send it. Paragraphs you've already written aren't changed: press Start from my profile to write them again with placeholders." : "Fill in the job and company, and the letter uses them.";
}
function ltV22Render() {
  ltModeRender();
  ltShowStep(ltStep);
  ltNextCards();
  const p = $("ltPages"); if (p) p.innerHTML = ltPagesHtml();
  navDots();
}

/* --- Three ways to go on, at the bottom of the page --- */
function ltNextCards() {
  let box = $("ltNext");
  if (!box) { box = document.createElement("div"); box.id = "ltNext"; const w = document.querySelector("#view-letter .wrap"); if (w) w.appendChild(box); else return; }
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
    const pg = e.target.closest("[data-lt-pages]");
    if (pg) { P().prefs.letterPages = +pg.dataset.ltPages === 2 ? 2 : 1; touchProfile("letter"); renderLetterPage(); return; }
    const nx = e.target.closest("[data-nx]");
    if (nx) openView(nx.dataset.nx);
  });
  onProfile(() => navDots());
  setTimeout(navDots, 1200);   // the saved letter arrives a moment after the page loads
  setInterval(navDots, 5000);
});
