/* ===================== Page flow ===================== */
let downloaded = false;
// Tailor to a job is four pages: the scan (job ad, resume, results, placing skills), Tailor to resume, Fit the job's criteria, then the cover letter
let tailorStage = "scan";
// An edit made on the tailored resume page (null = use the updated resume from placing skills, or the scanned one)
let resumeEdit = null;
const STAGE_OF = { "step-jd": "scan", "step-resume": "scan", scanRow: "scan", "sec-place": "scan", "sec-needs": "scan", "sec-jd": "scan", "sec-download": "resume", "sec-fit": "fit", "sec-cover": "letter" };
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function showInputs(on) {
  $("inputs").hidden = !on;
  $("scanRow").hidden = !on && !!lastResult;
  $("inputsBar").hidden = on || !lastResult;
  if (!on && lastResult) {
    $("barResume").textContent = fileInfo ? fileInfo.name : `Pasted text, ${wordCount(els.resume.value)} words`;
    const role = detectTitle(els.jd.value, els.title.value);
    $("barJob").textContent = role || `Pasted ad, ${wordCount(els.jd.value)} words`;
  }
}
function goTo(id) {
  const st = STAGE_OF[id];
  if (st && st !== tailorStage) setTailorStage(st, { keepScroll: true });
  if (["step-resume", "step-jd", "scanRow"].includes(id)) showInputs(true);
  const el = $(id);
  if (!el || el.hidden) return;
  el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  const focusable = el.matches("button, textarea") ? el : el.querySelector("textarea, button");
  if (focusable) focusable.focus({ preventScroll: true });
}
const finalText = () => resumeEdit != null ? resumeEdit : ($("newResume") ? $("newResume").value : els.resume.value);
function isStale() {
  return !!lastScan && (els.resume.value.trim() !== lastScan.resume || els.jd.value.trim() !== lastScan.jd || els.title.value !== lastScan.title);
}
function updateFlow() {
  const ok = ready(), stale = isStale();
  const scanned = !!lastResult && !stale;
  const missing = lastResult ? [...lastResult.hard, ...lastResult.soft].filter(x => !x.found).length : 0;
  const placed = scanned && (!!$("newResume") || missing === 0);
  const fitDone = scanned && typeof fit !== "undefined" && fit.done;
  const done = { 1: ok.j, 2: ok.r, 3: scanned, 4: placed, 5: scanned && downloaded, 6: fitDone, 7: scanned && cover.downloaded };
  const hiddenSteps = new Set([...document.querySelectorAll("#stepper li[hidden]")].map(li => +li.dataset.step));
  let current = [1, 2, 3, 4, 5, 6, 7].filter(n => !hiddenSteps.has(n)).find(n => !done[n]) || 7;
  // once you're on one of the later pages, the bar follows the page, and the steps before it count as done
  const onStep = scanned ? { resume: 5, fit: 6, letter: 7 }[tailorStage] : 0;
  if (onStep && !hiddenSteps.has(onStep)) { current = onStep; for (let n = 1; n < onStep; n++) done[n] = true; }
  document.querySelectorAll("#stepper li").forEach(li => {
    const n = +li.dataset.step;
    li.classList.toggle("done", !!done[n]);
    li.classList.toggle("current", n === current);
    const b = li.querySelector("button");
    if (n === current) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    b.disabled = n >= 4 && !lastResult;
  });
  els.scan.disabled = !(ok.r && ok.j);
  els.scan.lastChild.textContent = lastResult ? " Scan again" : $("view-scanner").dataset.tailor === "letter" ? " Scan the job ad" : " Scan resume";
  $("scanHint").textContent = !ok.r && !ok.j ? "Add the job ad (step 1) and your resume (step 2) to scan."
    : !ok.r ? "Add your resume in step 2. Upload a file or paste at least a few lines."
    : !ok.j ? "Paste the full job ad in step 1, including the requirements."
    : lastResult && !stale ? "" : "Ready. You'll get a match score, missing skills, ATS checks and recruiter tips.";
  $("exampleText").innerHTML = lastResult ? "These results are for a made-up resume and job ad. Select <b>Start over</b> to scan your own." : "A made-up resume and job ad are loaded. Select <b>Scan resume</b> to see how it works, or replace them with your own.";
  $("stale").hidden = !(lastResult && stale);
  $("rescan").hidden = !$("scanRow").hidden;   // the main Scan button is already on screen
  els.results.classList.toggle("is-stale", !!(lastResult && stale));
  // Step 5 copy
  if (lastResult) {
    $("dlWhich").textContent = resumeEdit != null ? "Includes your changes from step 4 and your edits in the preview." : $("newResume") ? "Includes your changes from step 4, plus any edits you made in the preview." : missing ? "This is your resume as scanned. Place your missing skills in step 4 first to tailor it." : "This is your resume as scanned.";
  }
}

