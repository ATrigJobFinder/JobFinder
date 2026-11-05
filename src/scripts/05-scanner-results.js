/* ===================== Rendering ===================== */
const $ = id => document.getElementById(id);
const els = {
  resume: $("resumeText"), jd: $("jobText"), title: $("jobTitle"), results: $("results"),
  scan: $("scanBtn"), err: $("formErr"), fileInput: $("fileInput"), pick: $("pickFile"), drop: $("drop"),
  fileStatus: $("fileStatus"), exampleNote: $("exampleNote"), rCount: $("resumeCount"), jCount: $("jdCount")
};
let fileInfo = null;
let lastResult = null;
let lastScan = null;
let isExample = false;
// Skills the person marked "not relevant" for this ad (cleared when the ad changes)
const scanIgnore = new Set();

const band = v => v >= 80 ? "good" : v >= 60 ? "ok" : v >= 40 ? "warn" : "bad";
const bandColor = v => ({ good: "var(--good)", ok: "var(--accent)", warn: "var(--warn)", bad: "var(--bad)" }[band(v)]);
const verdict = v => v >= 80 ? "Strong match" : v >= 60 ? "Good match, with gaps" : v >= 40 ? "Partial match" : "Low match";
const ICONS = {
  pass: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.2 6.3l2.4 2.4 5.2-5.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2.2v4.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><circle cx="6" cy="9.4" r="1.05" fill="currentColor"/></svg>',
  fail: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>',
  info: '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="2.9" r="1.05" fill="currentColor"/><path d="M6 5.2v4.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>'
};
const STATUS_LABEL = { pass: "Passed", warn: "Needs attention", fail: "Problem", info: "Note" };

function dialSVG(v) {
  const r = 64, c = 2 * Math.PI * r, off = c * (1 - v / 100);
  return `<svg viewBox="0 0 168 168" role="img" aria-label="Match score ${v} out of 100">
    <circle cx="84" cy="84" r="${r}" fill="none" stroke="var(--line)" stroke-width="12"/>
    <circle class="arc" cx="84" cy="84" r="${r}" fill="none" stroke="${bandColor(v)}" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 84 84)"/>
    <text class="score-num" x="84" y="92" text-anchor="middle">${v}</text>
    <text class="score-unit" x="84" y="114" text-anchor="middle">OUT OF 100</text>
  </svg>`;
}

function skillTable(list, id) {
  if (!list.length) return `<p class="empty">No ${id === "hard" ? "technical" : "soft"} skills from our list were found in the job ad.</p>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Skill</th><th>Priority</th><th class="num">Ad</th><th class="num">Resume</th><th>Status</th></tr></thead>
    <tbody>${list.map(x => `<tr data-found="${x.found}"><td title="${esc(x.adLine)}">${esc(x.name)}</td><td><span class="prio p-${x.priority.split(" ")[0].toLowerCase()}">${esc(x.priority)}</span></td><td class="num">${x.jd}</td><td class="num">${x.resume}</td>
      <td><span class="pill ${x.found ? "found" : "missing"}">${x.found ? "Found" : "Missing"}</span>${x.found ? "" : `<button type="button" class="x-ignore" data-ignore="${esc(x.name)}" title="Not relevant to this job: leave it out of the score" aria-label="${esc(x.name)} isn't relevant: leave it out of the score"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg></button>`}</td></tr>`).join("")}</tbody>
  </table></div>`;
}
function ignoredList(list) {
  const mine = list.filter(x => x.user);
  const learn = list.filter(x => x.priority === PRIORITY.learn || x.priority === PRIORITY.notreq);
  const other = list.filter(x => !learn.includes(x) && !x.user);
  const chips = l => `<div class="chips">${l.map(x => `<span class="chip" title="${esc(x.priority)}">${esc(x.name)}</span>`).join("")}</div>`;
  return (mine.length ? `<details class="ignored" open><summary>You marked these not relevant (${mine.length})</summary>
    <p class="small muted">They're left out of your score. Put one back if you change your mind.</p>
    <div class="chips">${mine.map(x => `<span class="chip">${esc(x.name)} <button type="button" class="linkish" data-unignore="${esc(x.name)}">Put back</button></span>`).join("")}</div></details>` : "")
    + (learn.length ? `<details class="ignored" open><summary>You'll learn these on the job, so they're not scored (${learn.length})</summary>
    <p class="small muted">The ad lists these under what you'll gain exposure to or be trained in, or says they aren't required. You don't need them yet, but saying you're keen to learn them can help in a cover letter.</p>
    ${chips(learn)}</details>` : "")
    + (other.length ? `<details class="ignored"><summary>Also mentioned in the ad, not scored (${other.length})</summary>
    <p class="small muted">These appear only in the company description, benefits, or in passing, so they aren't counted.</p>
    ${chips(other)}</details>` : "");
}

function checkList(items) {
  return `<ul class="checks">${items.map(i => `<li>
    <span class="ico ${i.status}" title="${STATUS_LABEL[i.status]}">${ICONS[i.status]}<span class="visually-hidden">${STATUS_LABEL[i.status]}</span></span>
    <div><div class="title">${esc(i.title)}</div><div class="detail">${esc(i.detail)}</div></div></li>`).join("")}</ul>`;
}

function highlightJD(text, marks, jdLines) {
  return jdLines.map(L => {
    let out = "", pos = L.s;
    for (const m of marks.filter(m => m.s >= L.s && m.e <= L.e)) {
      out += esc(text.slice(pos, m.s));
      out += `<mark class="${m.found ? "found" : "missing"}" title="${esc(m.name)}: ${m.found ? "in your resume" : "missing from your resume"}">${esc(text.slice(m.s, m.e))}</mark>`;
      pos = m.e;
    }
    out += esc(text.slice(pos, L.e));
    return L.kind === "learn" || L.kind === "notreq" ? `<span class="jd-learn">${out}</span>` : NOT_SCORED.has(L.kind) ? `<span class="jd-ignored">${out}</span>` : out;
  }).join("\n");
}

// What the button after the results says: the tailored resume page, or (cover letter only) the criteria and letter page
// What each score is, and why it matters: shown when you point at it
const CAT_HELP = {
  must: ["What the ad says you need before you can apply: work rights, licences and checks, your study stage, the qualification.", "If you can't meet one, it usually doesn't matter how strong the rest is. Green counts in full, yellow (check it yourself) counts half."],
  hard: ["Technical skills and tools the ad asks for, such as software, methods and licences.", "Employers and applicant tracking systems search for these words first, so every one missing costs you the most."],
  soft: ["Behaviours the ad asks for, like communication, teamwork or initiative.", "They decide between similar candidates, but only count when your resume shows an example."],
  edu: ["Whether your qualification meets the level the ad asks for.", "Some employers filter out applications that don't list it clearly."],
  ats: ["Whether applicant tracking software can read your resume: contact details, headings, dates and file.", "If the software can't read it, no person ever sees it."],
  tips: ["What a person notices when they skim it: numbers, length, clichés and spelling.", "It decides whether a recruiter keeps reading past the first few seconds."]
};
const openDetails = () => { const d = $("detModal"); if (d && !d.open) d.showModal(); };
const closeDetails = () => { const d = $("detModal"); if (d && d.open) d.close(); };
function render(res, jdRaw) {
  const hardFound = res.hard.filter(x => x.found).length, softFound = res.soft.filter(x => x.found).length;
  const issues = [...res.ats, ...res.tips].filter(i => i.status === "warn" || i.status === "fail").length;
  const role = detectTitle(jdRaw, els.title.value);
  els.results.innerHTML = `
  <div class="results-head" id="resultsTop">
    <h2><span class="stepno">3</span> Your results${role ? ` for ${esc(role)}` : ""}</h2>
    <p class="small muted">Start with the score and "Fix these first", then place your missing skills just below. "Details" jumps to what the job needs, line by line.</p>
  </div>
  <section class="summary" id="summary" aria-label="Match summary">
    <div class="dial">${dialSVG(res.overall)}
      <div class="verdict" style="color:${bandColor(res.overall)}">${verdict(res.overall)}</div>
      <p class="small muted">${hardFound} of ${res.hard.length} hard skills · ${issues} issue${issues === 1 ? "" : "s"} to fix</p>
    </div>
    <div class="cats">
      <h3>Score breakdown</h3>
      ${res.cats.map(c => {
        const h = CAT_HELP[c.key] || ["", ""], tip = `<span class="cat-tip" role="tooltip" id="cat-tip-${c.key}"><b>${esc(c.label)}: ${c.weight} of 100 points</b>${esc(h[0])} <em>${esc(h[1])}</em></span>`;
        return c.value === null
          ? `<div class="cat na" tabindex="0" aria-describedby="cat-tip-${c.key}"><span>${c.label}</span><span class="small">Not in this ad</span><span class="val">–</span>${tip}</div>`
          : `<div class="cat" tabindex="0" aria-describedby="cat-tip-${c.key}"><span class="cat-name">${c.label}</span><div class="bar" aria-hidden="true"><i style="width:${c.value}%;background:${bandColor(c.value)}"></i></div><span class="val">${c.value}%</span>${tip}</div>`; }).join("")}
      <p class="cats-more"><button class="btn" type="button" data-open-details>Details</button><span class="small muted">What this job needs, the ad highlighted, ATS checks and recruiter tips</span></p>
      <p class="weights">Out of 100: must-haves 25, ATS readability 20, hard skills 20, education 15, soft skills 10, recruiter tips 10. Anything the ad doesn't mention is left out and the rest share its points.</p>
    </div>
    <div class="fixes">
      <h3>Fix these first</h3>
      ${res.fixes.length ? `<ol>${res.fixes.map(f => `<li>${f}</li>`).join("")}</ol>` : `<p class="empty">Nothing urgent. Your resume covers this ad well.</p>`}
    </div>
  </section>

  <div class="skill-area" id="sec-skillarea">
  <div class="two">
    <section class="panel" id="sec-hard">
      <div class="panel-head">
        <h2>Hard skills <span class="muted mono small">${hardFound}/${res.hard.length}</span></h2>
        <label class="toggle"><input type="checkbox" id="missingOnly"> Missing only</label>
      </div>
      ${skillTable(res.hard, "hard")}
      <p class="small muted ignore-tip">Is a missing skill not relevant to this job? Point at its row and press <b>×</b> to leave it out of the score.</p>
      ${ignoredList(res.ignored)}
    </section>
    <div class="stack">
      <section class="panel" id="sec-soft">
        <div class="panel-head"><h2>Soft skills <span class="muted mono small">${softFound}/${res.soft.length}</span></h2></div>
        ${skillTable(res.soft, "soft")}
      </section>
      <section class="panel" id="sec-terms">
        <div class="panel-head"><h2>Other key terms</h2><p>Words the ad repeats that aren't on our skills list.</p></div>
        ${res.terms.length ? `<div class="chips">${res.terms.map(t => `<span class="chip ${t.found ? "found" : "missing"}" title="${t.found ? "In your resume" : "Missing from your resume"}">${esc(t.term)}<b>×${t.n}</b></span>`).join("")}</div>
        <div class="legend"><span><i style="background:var(--hl-found)"></i>In your resume</span><span><i style="background:var(--hl-missing)"></i>Missing</span></div>`
        : `<p class="empty">No other terms repeat often in this ad.</p>`}
      </section>
    </div>
  </div>
  <section class="panel" id="sec-place">
    <div class="place-intro">
      <div style="display:grid;gap:4px">
        <h2><span class="stepno">4</span> Place your missing skills</h2>
        <p>Have some of the missing skills above but haven't mentioned them? Drag each one to the job or section where you used it, or to "Not applicable". Save your answers to your profile and they're remembered for future job ads.</p>
      </div>
    </div>
    <div class="memory-line" id="memoryLine"></div>
    <div id="placeBody"></div>
  </section>
  </div>
  <div class="tw-next tw-letter"><span class="small muted">Cover letter only:</span><button class="btn primary" type="button" data-tw-next="1">Next: fit the job's criteria and write the letter</button></div>

  <dialog class="det-modal" id="detModal" aria-labelledby="detH">
  <div class="det-card">
  <div class="det-head"><h2 id="detH">Details: what this job needs</h2><button class="btn" type="button" data-close-details>Close</button></div>
  <div class="det-body">
  ${needsHtml(res.needs)}

  <section class="panel" id="sec-jd">
    <div class="panel-head"><h2>The job ad, highlighted</h2>
      <div class="legend"><span><i style="background:var(--hl-found)"></i>Skill in your resume</span><span><i style="background:var(--hl-missing)"></i>Skill missing from your resume</span><span><i style="background:var(--line)"></i>Faded: company info and benefits, not scored</span><span><i style="background:var(--surface-2);border:1px dashed var(--muted)"></i><em>Italic</em>: things you'll learn on the job, not scored</span></div>
    </div>
    <div class="jd-hl" tabindex="0">${highlightJD(jdRaw, res.marks, res.jdLines)}</div>
  </section>

  <div class="two">
    <section class="panel" id="sec-ats">
      <div class="panel-head"><h2>ATS readability</h2><p>Can applicant tracking software read and file your resume?</p></div>
      ${checkList(res.ats)}
    </section>
    <section class="panel" id="sec-tips">
      <div class="panel-head"><h2>Recruiter tips</h2><p>What a person notices when they skim it.</p></div>
      ${checkList(res.tips)}
    </section>
  </div>
  </div>
  </div>
  </dialog>`;

  const toggle = $("missingOnly");
  toggle.addEventListener("change", () => {
    $("sec-hard").querySelectorAll("tbody tr").forEach(tr => { tr.hidden = toggle.checked && tr.dataset.found === "true"; });
  });
  setupPlace();
}

// "Not relevant" and "Put back": score again without moving the page
function rescore() {
  if (!lastScan) return;
  const y = window.scrollY, keepAi = lastResult && lastResult.needs && lastResult.needs.ai;
  lastResult = analyse(lastScan.resume, lastScan.jd, lastScan.title, fileInfo, { ignore: scanIgnore });
  if (keepAi) lastResult.needs.ai = keepAi;
  render(lastResult, lastScan.jd);
  window.scrollTo(0, y);
}
els.results.addEventListener("click", e => {
  const ig = e.target.closest("[data-ignore]"), un = e.target.closest("[data-unignore]");
  if (ig) { scanIgnore.add(ig.dataset.ignore); rescore(); return; }
  if (un) { scanIgnore.delete(un.dataset.unignore); rescore(); return; }
  if (e.target.closest("[data-tw-next]")) { goTo(tailorMode === "letter" ? "sec-fit" : "sec-download"); return; }
  if (e.target.closest("[data-open-details]")) { openDetails(); return; }
  if (e.target.closest("[data-close-details]") || e.target === $("detModal")) { closeDetails(); return; }
  const sc = e.target.closest("[data-scroll]");
  if (sc) { const t = $(sc.dataset.scroll); if (t) t.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); return; }
  needsClick(e);
});
function updateCounts() {
  const r = wordCount(els.resume.value), j = wordCount(els.jd.value);
  els.rCount.textContent = r ? `${r} words` : "";
  els.jCount.textContent = j ? `${j} words` : "";
}

const ready = () => ({ r: wordCount(els.resume.value) >= 40, j: wordCount(els.jd.value) >= 30 });
function runScan(scroll) {
  const r = els.resume.value.trim(), j = els.jd.value.trim();
  els.err.textContent = "";
  const ok = ready();
  if (!ok.r) { els.err.textContent = "Add your resume first: upload a PDF or Word file, or paste at least a few lines of text."; return; }
  if (!ok.j) { els.err.textContent = "Paste the full job ad, including the requirements, so there's something to compare against."; return; }
  if (!lastScan || lastScan.jd !== j) scanIgnore.clear();
  lastResult = analyse(r, j, els.title.value, fileInfo, { ignore: scanIgnore });
  lastScan = { resume: r, jd: j, title: els.title.value };
  downloaded = false; resumeEdit = null;
  if (tailorStage !== "scan") setTailorStage("scan", { silent: true });
  render(lastResult, j);
  $("sec-download").hidden = false;
  $("sec-fit").hidden = false;
  $("sec-cover").hidden = false;
  prefillCover();
  renderFit();
  describeCoverEngine();
  showInputs(false);
  updateFlow();
  if (scroll) $("resultsTop").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

function setExample(on) {
  isExample = on;
  els.exampleNote.hidden = !on;
}
function hideResults() {
  lastResult = null; lastScan = null; downloaded = false; resumeEdit = null;
  if (tailorStage !== "scan") setTailorStage("scan", { silent: true });
  els.results.innerHTML = "";
  $("sec-download").hidden = true; $("sec-fit").hidden = true; $("sec-cover").hidden = true; $("stale").hidden = true;
  fit.key = ""; fit.items = []; fit.done = false;
  $("clOut").innerHTML = ""; cover.draft = null; cover.draftFor = null; cover.downloaded = false; $("clGenRow").hidden = false; $("clEditNote").textContent = "";
  $("clBreak").innerHTML = `<p class="small muted">Your letter's breakdown appears here, above the preview. Select a paragraph in either to see it on the left.</p>`; $("clPaper").innerHTML = ""; $("clScore").textContent = ""; $("clActions").hidden = true;
  $("downloadStatus").textContent = "";
}
function loadExample() {
  els.resume.value = EXAMPLE_RESUME;
  els.jd.value = EXAMPLE_JD;
  els.title.value = "";
  fileInfo = null;
  els.fileStatus.textContent = "";
  els.fileStatus.classList.remove("err");
  setExample(true);
  updateCounts();
  hideResults();
  showInputs(true);
  updateFlow();
  els.scan.focus();
  els.scan.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
}
function clearAll() {
  els.resume.value = ""; els.jd.value = ""; els.title.value = "";
  fileInfo = null;
  els.fileStatus.textContent = ""; els.err.textContent = "";
  setExample(false);
  updateCounts();
  hideResults();
  showInputs(true);
  updateFlow();
  els.resume.focus();
}

