/* ===================== Wiring ===================== */
els.scan.addEventListener("click", () => runScan(true));
$("loadExample").addEventListener("click", loadExample);
$("clearAll").addEventListener("click", clearAll);
els.pick.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", () => handleFile(els.fileInput.files[0]));
["dragenter", "dragover"].forEach(t => $("step-resume").addEventListener(t, e => { e.preventDefault(); els.drop.classList.add("over"); }));
["dragleave", "drop"].forEach(t => $("step-resume").addEventListener(t, e => { e.preventDefault(); if (t === "drop" || !$("step-resume").contains(e.relatedTarget)) els.drop.classList.remove("over"); }));
$("step-resume").addEventListener("drop", e => handleFile(e.dataTransfer && e.dataTransfer.files[0]));
// Small edits keep the link to the uploaded file (so the download keeps its layout); pasting a different resume drops it
function stillSameFile() {
  if (!fileInfo || !fileInfo.text) return false;
  const a = new Set(fileInfo.text.split("\n").map(flat).filter(Boolean)), b = els.resume.value.split("\n").map(flat).filter(Boolean);
  return b.length && b.filter(l => a.has(l)).length / Math.max(a.size, b.length) >= 0.5;
}
function updateDownloadBtn() { updateFlow(); }
[els.resume, els.jd, els.title].forEach(t => t.addEventListener("input", () => {
  updateCounts();
  if (isExample && t !== els.title) setExample(false);
  if (t === els.resume && fileInfo && !stillSameFile()) fileInfo = null;
  updateFlow();
}));
$("downloadBtn").addEventListener("click", async () => {
  if (await exportResume(finalText(), $("downloadStatus"), $("downloadBtn"))) {
    downloaded = true; updateFlow();
    $("downloadStatus").textContent += tailorMode === "resume" ? "" : " Next, fit your experience to the job's criteria, then write a cover letter to go with it.";
    if (tailorMode !== "resume") $("toCover").focus({ preventScroll: true });
  }
});
$("toCover").addEventListener("click", () => { prefillCover(); renderFit(); goTo("sec-fit"); });
$("rsBack").addEventListener("click", () => setTailorStage("scan"));
$("ltBack").addEventListener("click", () => setTailorStage(tailorMode === "letter" ? "scan" : "resume"));
$("clPick").addEventListener("click", () => $("clFile").click());
$("clFile").addEventListener("change", async () => { await addLetterFiles($("clFile").files); $("clFile").value = ""; });
["dragenter", "dragover"].forEach(t => $("clDrop").addEventListener(t, e => { e.preventDefault(); $("clDrop").classList.add("over"); }));
["dragleave", "drop"].forEach(t => $("clDrop").addEventListener(t, e => { e.preventDefault(); $("clDrop").classList.remove("over"); }));
$("clDrop").addEventListener("drop", e => e.dataTransfer && addLetterFiles(e.dataTransfer.files));
["clRole", "clCompany", "clRecipient", "clName", "clEmail", "clPhone", "clLocation"].forEach(id => $(id).addEventListener("input", () => { $(id).dataset.auto = "0"; }));
["clRole", "clCompany", "clRecipient", "clAddress", "clSource", "clWhy", "clAvail", "clName", "clEmail", "clPhone", "clLocation"].forEach(id => $(id).addEventListener("input", renderReady));
$("clRemember").addEventListener("change", async () => { if ($("clRemember").checked) await saveCoverStore(); renderLetterFiles(); });
$("clGenerate").addEventListener("click", generateCover);
document.querySelectorAll("#stepper button").forEach(b => b.addEventListener("click", () => goTo(b.dataset.go)));
$("editInputs").addEventListener("click", () => goTo("step-resume"));
$("rescan").addEventListener("click", () => runScan(true));
els.aiBtn.addEventListener("click", runAI);
els.aiStop.addEventListener("click", () => aiCtl && aiCtl.abort());

updateCounts();
updateFlow();

(async () => {
  let s = null;
  try { s = window.claude && window.claude.use ? await window.claude.use("sample") : null; } catch { s = null; }
  claudeSample = s;
  refreshSample();
  if (!sample) { els.aiStatus.textContent = "AI suggestions need an AI. Open Job Finder in Claude, or choose one in Connect your AI. The keyword scan above works without it."; els.aiBtn.disabled = true; return; }
  resetAI();
})();

