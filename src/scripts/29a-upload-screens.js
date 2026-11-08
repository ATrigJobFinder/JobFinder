/* ===================== Opening pages for the cover letter and LinkedIn, and the footer =====================
   Like the resume builder's opening page (20i): a friendly hero, then three ways to start.
   The page behind it appears once the person has chosen, or as soon as there is something to work on. */

/* --- Cover letter: upload a letter, use a saved one, or write it from the profile --- */
let ltWelcomeOn;   // undefined until the first visit decides: on when there is no letter yet
function applyLtWelcome() {
  const root = $("view-letter");
  if (!root) return;
  if (ltWelcomeOn === undefined) ltWelcomeOn = !blText().length;
  if (ltWelcomeOn && blText().length) ltWelcomeOn = false;   // a letter turned up (a sync, an upload): go to it
  const on = !!ltWelcomeOn;
  const w = $("ltWelcome"); if (w) w.hidden = !on;
  for (const sel of [".view-head .top-actions", ".b-steps", "#ltLayout", "#ltPick"]) { const el = root.querySelector(sel); if (el) { if (on) el.hidden = true; else if (sel !== "#ltPick") el.hidden = false; } }
  root.classList.toggle("is-welcome", on);
}
function ltLwPanel(which) {
  const map = { upload: "ltwUpload", saved: "ltwSaved" };
  for (const [k, id] of Object.entries(map)) { const box = $(id); if (box) box.hidden = k !== which; }
  document.querySelectorAll("#ltWelcome [data-lw][aria-controls]").forEach(b => b.setAttribute("aria-expanded", String(b.dataset.lw === which)));
}
onInit(() => {
  const w = $("ltWelcome");
  if (!w) return;
  const dropZone = (id, take) => {
    const d = $(id);
    ["dragenter", "dragover"].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.add("over"); }));
    ["dragleave", "drop"].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.remove("over"); }));
    d.addEventListener("drop", e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) take(f); });
  };
  w.addEventListener("click", async e => {
    const b = e.target.closest("[data-lw]");
    if (!b) return;
    const k = b.dataset.lw, note = $("ltwNote");
    note.textContent = "";
    if (k === "upload") { ltLwPanel("upload"); smoothTo($("ltwUpload"), 16); setTimeout(() => $("ltwPick").focus({ preventScroll: true }), 120); }
    else if (k === "saved") {
      ltLwPanel("saved");
      await savedLetters.ready;
      renderLetterPick($("ltwSaved"));
      smoothTo($("ltwSaved"), 16);
    }
    else if (k === "profile") {
      if (!hasProfile(P())) { note.innerHTML = `Your profile is empty, so there is nothing to write from yet. <button class="linkish" type="button" data-lw="resume">Build your resume first</button>, or start with a blank page.`; return; }
      ltWelcomeOn = false; applyLtWelcome(); renderLetterPage();
      window.scrollTo({ top: 0 });
      $("ltFromProfile").click();
    }
    else if (k === "resume") openView("builder");
    else if (k === "blank") { ltWelcomeOn = false; ltShowStep(0); applyLtWelcome(); window.scrollTo({ top: 0 }); }
  });
  $("ltwPick").addEventListener("click", () => $("ltwFile").click());
  $("ltwFile").addEventListener("change", async () => { const f = $("ltwFile").files[0]; $("ltwFile").value = ""; if (f) await ltImportFile(f); });
  dropZone("ltwDrop", f => ltImportFile(f));
  $("ltwPasteGo").addEventListener("click", () => {
    const t = $("ltwPaste").value;
    if (wordCount(t) < 30) { ltSay("Paste the whole letter first.", true); return; }
    if (ltImportText(t, "the text you pasted")) $("ltwPaste").value = "";
  });
  // using a saved letter from this page: its own handler (23a) loads it, then this page steps aside
  viewHooks.letter = (prev => (...a) => Promise.resolve(prev(...a)).then(applyLtWelcome))(viewHooks.letter);
});

/* --- LinkedIn: upload the PDF, paste the page, or create a new profile --- */
let liWelcomeOn;
const liHasInput = () => { const i = linStore.data.input || {}; return ["headline", "about", "experience", "skills", "education"].some(k => String(i[k] || "").trim()); };
function applyLiWelcome() {
  const root = $("view-linkedin");
  if (!root) return;
  if (liWelcomeOn === undefined) liWelcomeOn = !liHasInput() && !linStore.data.last;
  if (liWelcomeOn && (liHasInput() || linStore.data.last)) liWelcomeOn = false;
  const on = !!liWelcomeOn;
  const w = $("liWelcome"); if (w) w.hidden = !on;
  for (const id of ["liMode", "liForm", "liOut"]) { const el = $(id); if (el) el.hidden = on; }
  root.classList.toggle("is-welcome", on);
}
function liLwPanel(open, focusId) {
  const box = $("liwImport"); if (!box) return;
  box.hidden = !open;
  document.querySelectorAll("#liWelcome [data-lw][aria-controls]").forEach(b => b.setAttribute("aria-expanded", String(open && b.dataset.lw === open)));
  if (open) { smoothTo(box, 16); const f = $(focusId); if (f) setTimeout(() => f.focus({ preventScroll: true }), 120); }
}
// After bringing something in: stay here and say so if it didn't work, otherwise go on to the page with the filled-in boxes
function liwFinish() {
  const real = $("liFileStatus"), mine = $("liwStatus");
  const bad = real.classList.contains("err");
  if (bad) { mine.classList.add("err"); mine.textContent = real.textContent; return; }
  mine.classList.remove("err"); mine.textContent = "";
  liWelcomeOn = false;
  linStore.data.mode = "improve"; linStore.save();
  applyLiMode(); applyLiWelcome(); window.scrollTo({ top: 0 });
}
onInit(() => {
  const w = $("liWelcome");
  if (!w) return;
  w.addEventListener("click", e => {
    const b = e.target.closest("[data-lw]");
    if (!b) return;
    const k = b.dataset.lw;
    if (k === "pdf") liLwPanel("pdf", "liwPick");
    else if (k === "paste") { liLwPanel("paste", "liwPaste"); }
    else if (k === "create") { liWelcomeOn = false; linStore.data.mode = "create"; linStore.save(); applyLiMode(); applyLiWelcome(); window.scrollTo({ top: 0 }); }
    if ((k === "pdf" || k === "paste") && !$("liwUrl").value && P().contact.linkedin) $("liwUrl").value = P().contact.linkedin;
  });
  $("liwPick").addEventListener("click", () => $("liwFile").click());
  const take = async f => { $("liwStatus").classList.remove("err"); $("liwStatus").textContent = `Reading ${f.name}…`; await liImportFile(f); liwFinish(); };
  $("liwFile").addEventListener("change", async () => { const f = $("liwFile").files[0]; $("liwFile").value = ""; if (f) await take(f); });
  const d = $("liwDrop");
  ["dragenter", "dragover"].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.remove("over"); }));
  d.addEventListener("drop", e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) take(f); });
  $("liwUrl").addEventListener("change", () => { $("li-url").value = $("liwUrl").value; $("li-url").dispatchEvent(new Event("change")); $("liwUrl").value = $("li-url").value; });
  $("liwOpen").addEventListener("click", () => { const u = shortUrl($("liwUrl").value); if (u) window.open("https://www." + u.replace(/^www\./, ""), "_blank", "noopener"); else { $("liwStatus").classList.add("err"); $("liwStatus").textContent = "Type your profile link first."; } });
  $("liwPasteGo").addEventListener("click", () => {
    const t = $("liwPaste").value, st = $("liwStatus");
    if (wordCount(t) < 15) { st.classList.add("err"); st.textContent = "Paste the whole profile page first: press Ctrl+A then Ctrl+C on your LinkedIn profile."; return; }
    if ($("liwUrl").value) { $("li-url").value = $("liwUrl").value; $("li-url").dispatchEvent(new Event("change")); }
    liApply(liFromPage(t), "the page you pasted");
    liwFinish();
    if (liWelcomeOn === false) $("liwPaste").value = "";
  });
  viewHooks.linkedin = (prev => (o = {}) => { if (o.mode) liWelcomeOn = false; return Promise.resolve(prev(o)).then(applyLiWelcome); })(viewHooks.linkedin);
});

/* --- The footer, on every page except the globe on the home page --- */
function siteFootShow(name) { const f = $("siteFoot"); if (f) f.hidden = name === "home"; }
onInit(() => {
  const f = $("siteFoot");
  if (!f) return;
  siteFootShow(currentView);
  // the page you're already on: just go back to the top, like the menu does
  f.addEventListener("click", e => {
    const a = e.target.closest("a[data-view]");
    if (a && a.dataset.view === currentView) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" }); }
  });
});
