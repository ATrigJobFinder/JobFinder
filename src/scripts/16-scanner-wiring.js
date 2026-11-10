/* ===================== Wiring ===================== */
els.scan.addEventListener("click", () => runScan(true));
$("loadExample").addEventListener("click", loadExample);
// Start over throws away the resume, the ad and the results, so it asks first (press it again within 4 seconds)
$("clearAll").addEventListener("click", () => {
  const b = $("clearAll"), has = !isExample && (els.resume.value.trim() || els.jd.value.trim() || els.title.value.trim() || lastResult);
  if (has && b.dataset.sure !== "1") {
    b.dataset.was = b.textContent; b.dataset.sure = "1"; b.textContent = "Clear it all? Press again";
    clearTimeout(b._t); b._t = setTimeout(() => { if (b.dataset.sure === "1") { b.dataset.sure = ""; b.textContent = b.dataset.was; } }, 4000);
    return;
  }
  clearTimeout(b._t); if (b.dataset.sure === "1") { b.dataset.sure = ""; b.textContent = b.dataset.was; }
  clearAll();
});
els.pick.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", () => handleFile(els.fileInput.files[0]));
["dragenter", "dragover"].forEach(t => $("tlResCol").addEventListener(t, e => { e.preventDefault(); els.drop.classList.add("over"); }));
["dragleave", "drop"].forEach(t => $("tlResCol").addEventListener(t, e => { e.preventDefault(); if (t === "drop" || !$("tlResCol").contains(e.relatedTarget)) els.drop.classList.remove("over"); }));
$("tlResCol").addEventListener("drop", e => { if (e.dataTransfer && e.dataTransfer.files.length > 1) { els.fileStatus.classList.add("err"); els.fileStatus.textContent = "Add one resume at a time."; return; } handleFile(e.dataTransfer && e.dataTransfer.files[0]); });
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
$("toCover").addEventListener("click", () => { prefillCover(); renderFit(); goTo("sec-fit"); });
$("rsBack").addEventListener("click", () => setTailorStage("scan"));
$("ltBack").addEventListener("click", () => setTailorStage(tailorMode === "letter" ? "scan" : "resume"));
$("clPick").addEventListener("click", () => $("clFile").click());
$("clFile").addEventListener("change", async () => { await addLetterFiles($("clFile").files); $("clFile").value = ""; });
// like the resume above: drop the files anywhere on the cover letter part
["dragenter", "dragover"].forEach(t => $("clPrev").addEventListener(t, e => { e.preventDefault(); $("clDrop").classList.add("over"); }));
["dragleave", "drop"].forEach(t => $("clPrev").addEventListener(t, e => { e.preventDefault(); if (t === "drop" || !$("clPrev").contains(e.relatedTarget)) $("clDrop").classList.remove("over"); }));
$("clPrev").addEventListener("drop", e => e.dataTransfer && addLetterFiles(e.dataTransfer.files));
["clRole", "clCompany", "clRecipient", "clName", "clEmail", "clPhone", "clLocation"].forEach(id => $(id).addEventListener("input", () => { $(id).dataset.auto = "0"; }));
["clRole", "clCompany", "clRecipient", "clAddress", "clSource", "clWhy", "clAvail", "clName", "clEmail", "clPhone", "clLocation"].forEach(id => $(id).addEventListener("input", renderReady));
$("clGenerate").addEventListener("click", generateCover);
document.querySelectorAll("#stepper button").forEach(b => b.addEventListener("click", () => goTo(b.dataset.go)));
$("editInputs").addEventListener("click", () => goTo("step-resume"));
$("rescan").addEventListener("click", () => runScan(true));

updateCounts();
updateFlow();

refreshSample();

