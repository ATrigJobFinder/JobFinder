/* ===================== Tailor to a job: the resume, the cover letter, or both ===================== */
// Runs before the app shell, so it uses localStorage directly rather than lsGet.
const TAILOR_KEY = "jobfinder.tailor.v1";
const TAILOR_INTRO = {
  both: "Paste the job ad first, then add your resume (and a cover letter you've sent before, if you like). Scan, place the skills you're missing, review your tailored resume, then fit the job's criteria and write the cover letter.",
  resume: "Paste the job ad first, then add your resume. Scan, place the skills you're missing, then review and download your tailored resume.",
  letter: "Paste the job ad first, then add your resume (and a cover letter you've sent before, if you like). Scan, fit your experience to the job's criteria, then write a cover letter for this job from your own experience."
};
let tailorMode = (() => { try { const v = localStorage.getItem(TAILOR_KEY); return TAILOR_INTRO[v] ? v : "both"; } catch { return "both"; } })();
function applyTailorMode() {
  const view = $("view-scanner");
  view.dataset.tailor = tailorMode;
  $("tailorIntro").textContent = TAILOR_INTRO[tailorMode];
  document.querySelectorAll("#tailorMode [data-tm]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tm === tailorMode)));
  // renumber the steps that are showing: 1, 2, 3…
  const hide = { both: [], resume: [6, 7], letter: [4, 5] }[tailorMode];
  let n = 0;
  document.querySelectorAll("#stepper li").forEach(li => {
    const off = hide.includes(+li.dataset.step);
    li.hidden = off;
    if (!off) li.querySelector(".n").textContent = ++n;
  });
  $("clPrev").hidden = tailorMode === "resume";
  $("inLetterTag").hidden = tailorMode === "resume";
  $("fitStepNo").textContent = tailorMode === "letter" ? "4" : "6";
  $("coverStepNo").textContent = tailorMode === "letter" ? "5" : "7";
  const scanLabel = els.scan.lastChild;
  if (scanLabel && !lastResult) scanLabel.textContent = tailorMode === "letter" ? " Scan the job ad" : " Scan resume";
}
$("tailorMode").addEventListener("click", e => {
  const b = e.target.closest("[data-tm]"); if (!b) return;
  tailorMode = b.dataset.tm;
  try { localStorage.setItem(TAILOR_KEY, tailorMode); } catch { /* storage blocked */ }
  applyTailorMode();
  if (lastResult) {
    const go = tailorMode === "letter" ? $("sec-fit") : $("resultsTop");
    if (go && !go.hidden) go.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  }
});
applyTailorMode();
