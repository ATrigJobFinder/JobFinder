/* ===================== Opening pages for the cover letter and LinkedIn, and the footer =====================
   Like the resume builder's opening page (20i): a friendly hero, then three ways to start.
   The page behind it appears once the person has chosen, or as soon as there is something to work on. */

/* --- Cover letter: read from the profile first; or bring in a resume or LinkedIn (one, not both), use a saved letter, or write by hand --- */
let ltWelcomeOn;   // undefined until the first visit decides: on when there is no letter yet
let ltWelcomeHold = false;   // the person chose step 0 themselves, so a saved letter doesn't take them away from it
function applyLtWelcome() {
  const root = $("view-letter");
  if (!root) return;
  if (ltWelcomeOn === undefined) ltWelcomeOn = !blText().length;
  if (ltWelcomeOn && blText().length && !ltWelcomeHold) ltWelcomeOn = false;   // a letter turned up (a sync, an upload): go to it
  if (!ltWelcomeOn) ltWelcomeHold = false;
  const on = !!ltWelcomeOn;
  const w = $("ltWelcome"); if (w) w.hidden = !on;
  for (const sel of [".view-head .top-actions", ".b-steps", "#ltLayout", "#ltPick"]) { const el = root.querySelector(sel); if (el) { if (on) el.hidden = true; else if (sel !== "#ltPick") el.hidden = false; } }
  root.classList.toggle("is-welcome", on);
  // With a resume or LinkedIn in the profile, "Read from my profile" is the blue way in. Without one it is greyed out and uploading is blue.
  const has = hasProfile(P()), pr = $("ltwProfile"), up = $("ltwUploadCard");
  if (pr) {
    pr.disabled = !has; pr.classList.toggle("bw-card--go", has); pr.classList.toggle("bw-card--off", !has);
    const t = $("ltwProfileText"); if (t) t.textContent = has ? "Job Finder uses the details already in your profile. You pick a layout first, and the letter is only written when you ask for it." : "There's nothing in your profile yet. Upload your resume or LinkedIn first, and this is ready to use.";
  }
  if (up) up.classList.toggle("bw-card--go", !has);
}
// Step 0: back to the opening page
function ltGoStart() { ltWelcomeOn = true; ltWelcomeHold = true; applyLtWelcome(); window.scrollTo({ top: 0 }); }
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
    d.addEventListener("drop", e => { if (e.dataTransfer && e.dataTransfer.files.length) take(e.dataTransfer.files); });
  };
  w.addEventListener("click", async e => {
    const b = e.target.closest("[data-lw]");
    if (!b) return;
    const k = b.dataset.lw, note = $("ltwNote");
    note.textContent = "";
    if (k === "upload") { ltLwPanel("upload"); smoothTo($("ltwUpload"), 16); setTimeout(() => $("ltwResPick").focus({ preventScroll: true }), 120); }
    else if (k === "saved") {
      ltLwPanel("saved");
      await savedLetters.ready;
      renderLetterPick($("ltwSaved"));
      smoothTo($("ltwSaved"), 16);
    }
    else if (k === "profile") {
      if (!hasProfile(P())) { note.innerHTML = `Your profile is empty, so there is nothing to read yet. <button class="linkish" type="button" data-lw="upload">Upload your resume or LinkedIn</button> first, or start writing manually.`; return; }
      // on to the layout. The letter is not written here: it is written when "Write all" or "Start from my profile" is pressed
      ltWelcomeOn = false; ltShowStep(0); applyLtWelcome(); renderLetterPage();
      window.scrollTo({ top: 0 });
    }
    else if (k === "resume") openView("builder");
    else if (k === "blank") { ltWelcomeOn = false; ltShowStep(0); applyLtWelcome(); window.scrollTo({ top: 0 }); }
  });
  // One file goes into your profile: a resume, or your LinkedIn as a PDF (or pasted). It is shown as a card, and Next goes on to Layout.
  // Nothing is written for you here.
  const note = () => $("ltwNote");
  const takeFile = async f => {
    if (!f) return;
    const st = $("ltwStatus");
    await builderImportFile(f, st);
    if (st.classList.contains("err")) return;
    ltWelcomeHold = true;
    note().innerHTML = `Your details are in your profile. Press <b>Next: Layout</b> to choose a design. The letter is only written when you ask for it.`;
  };
  const takeFiles = files => { const f = bOneFile(files, $("ltwStatus")); if (f) takeFile(f); };
  $("ltwResPick").addEventListener("click", () => $("ltwResFile").click());
  $("ltwResFile").addEventListener("change", async () => { const f = bOneFile($("ltwResFile").files, $("ltwStatus")); $("ltwResFile").value = ""; await takeFile(f); });
  dropZone("ltwResDrop", takeFiles);
  $("ltwPasteGo").addEventListener("click", async () => {
    const st = $("ltwStatus");
    await importPastedLinkedIn("ltwPaste", st);
    if (!st.classList.contains("err")) { ltWelcomeHold = true; note().innerHTML = `Your details are in your profile. Press <b>Next: Layout</b> to choose a design. The letter is only written when you ask for it.`; }
  });
  // an old cover letter is optional: it is sorted into the five paragraphs and shown as a card too. The page stays here until Next is pressed.
  const takeLetter = async f => {
    if (!f) return;
    ltWelcomeHold = true;
    if (await ltImportFile(f)) bShowFileCard(f, FILE_SETS.letterOld);
  };
  $("ltwPick").addEventListener("click", () => $("ltwFile").click());
  $("ltwFile").addEventListener("change", async () => { const f = bOneFile($("ltwFile").files, $("ltwLetterStatus")); $("ltwFile").value = ""; await takeLetter(f); });
  dropZone("ltwDrop", files => { const f = bOneFile(files, $("ltwLetterStatus")); if (f) takeLetter(f); });
  // Next always goes to Layout. If no AI is connected, ask first (connect one, or carry on without)
  $("ltwNext").addEventListener("click", async () => {
    if (!(await aiIsConnected())) {
      const choice = await askConnectAi("your cover letter");
      if (choice === "connect") { openView("connect"); return; }
      if (choice !== "skip") return;   // (closed with Esc: stay here)
    }
    ltWelcomeOn = false; ltShowStep(0); applyLtWelcome(); window.scrollTo({ top: 0 });
  });
  onProfile(() => applyLtWelcome());
  // using a saved letter from this page: its own handler (23a) loads it, then this page steps aside
  viewHooks.letter = (prev => (...a) => Promise.resolve(prev(...a)).then(applyLtWelcome))(viewHooks.letter);
});

/* --- LinkedIn: the same three ways in as the cover letter. Read from my profile (blue when there is a resume in the profile), upload a resume or LinkedIn (one file), or start writing manually --- */
let liWelcomeOn;   // undefined until the first visit decides: on when there is nothing on the page yet
let liWelcomeHold = false;   // the person chose the opening page themselves (Back to start), so what is saved doesn't take them away from it
const liHasInput = () => { const i = linStore.data.input || {}; return ["headline", "about", "experience", "skills", "education"].some(k => String(i[k] || "").trim()); };
function applyLiWelcome() {
  const root = $("view-linkedin");
  if (!root) return;
  if (liWelcomeOn === undefined) liWelcomeOn = !liHasInput() && !linStore.data.last;
  if (liWelcomeOn && (liHasInput() || linStore.data.last) && !liWelcomeHold) liWelcomeOn = false;   // something turned up (a sync, an upload): go to it
  if (!liWelcomeOn) liWelcomeHold = false;
  const on = !!liWelcomeOn;
  const w = $("liWelcome"); if (w) w.hidden = !on;
  for (const sel of [".view-head .top-actions", "#liForm", "#liOut"]) { const el = root.querySelector(sel); if (el) el.hidden = on; }
  root.classList.toggle("is-welcome", on);
  // With a resume in the profile, "Read from my profile" is the blue way in. Without one it is greyed out and uploading is blue.
  const has = hasProfile(P()), pr = $("liwProfile"), up = $("liwUploadCard");
  if (pr) {
    pr.disabled = !has; pr.classList.toggle("bw-card--go", has); pr.classList.toggle("bw-card--off", !has);
    const t = $("liwProfileText"); if (t) t.textContent = has ? "Job Finder uses the resume already in your profile to write your headline, About and skills. Nothing is written until you ask for it." : "There's nothing in your profile yet. Upload your resume or LinkedIn first, and this is ready to use.";
  }
  if (up) up.classList.toggle("bw-card--go", !has);
}
// Back to the opening page
function liGoStart() { liWelcomeOn = true; liWelcomeHold = true; applyLiWelcome(); window.scrollTo({ top: 0 }); }
function liLwPanel(open, focusId) {
  const box = $("liwImport"); if (!box) return;
  box.hidden = !open;
  document.querySelectorAll("#liWelcome [data-lw][aria-controls]").forEach(b => b.setAttribute("aria-expanded", String(!!open && b.dataset.lw === open)));
  if (open) { smoothTo(box, 16); const f = $(focusId); if (f) setTimeout(() => f.focus({ preventScroll: true }), 120); }
}
// On to the boxes. fill: the empty boxes are filled from the resume in the profile (nothing already there is replaced).
// A LinkedIn that came in (a headline or About) is improved; otherwise a new one is built from the profile.
function liOpenBoxes(fill) {
  const inp = linStore.data.input;
  if (fill && hasProfile(P())) liFillGaps(P(), inp);
  linStore.data.mode = inp.headline || inp.about ? "improve" : "create";
  linStore.save(true);
  liWelcomeOn = false; liWelcomeHold = false;
  liToForm(); applyLiMode(); applyLiWelcome(); window.scrollTo({ top: 0 });
}
onInit(() => {
  const w = $("liWelcome");
  if (!w) return;
  const note = () => $("liwNote");
  w.addEventListener("click", e => {
    const b = e.target.closest("[data-lw]");
    if (!b) return;
    const k = b.dataset.lw;
    note().textContent = "";
    if (k === "upload") liLwPanel("upload", "liwResPick");
    else if (k === "profile") {
      if (!hasProfile(P())) { note().innerHTML = `Your profile is empty, so there is nothing to read yet. <button class="linkish" type="button" data-lw="upload">Upload your resume or LinkedIn</button> first, or start writing manually.`; return; }
      // the boxes are filled from the profile's resume. Nothing is written by AI here: the headline and About are written when you ask for them.
      liOpenBoxes(true);
    }
    else if (k === "blank") {
      liWelcomeOn = false; liWelcomeHold = false; linStore.data.mode = "create"; linStore.save(true);
      applyLiMode(); applyLiWelcome(); window.scrollTo({ top: 0 });
    }
  });
  // One file goes into your profile: a resume, or your LinkedIn as a PDF (or pasted). It is shown as a card, and Next goes on to the boxes.
  const dropZone = (id, take) => {
    const d = $(id);
    ["dragenter", "dragover"].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.add("over"); }));
    ["dragleave", "drop"].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.remove("over"); }));
    d.addEventListener("drop", e => { if (e.dataTransfer && e.dataTransfer.files.length) take(e.dataTransfer.files); });
  };
  const doneNote = `Your details are in your profile. Press <b>Next</b> to open your boxes.`;
  const takeFile = async f => {
    if (!f) return;
    const st = $("liwStatus");
    await builderImportFile(f, st);
    if (st.classList.contains("err")) return;
    liWelcomeHold = true;
    note().innerHTML = doneNote;
  };
  $("liwResPick").addEventListener("click", () => $("liwResFile").click());
  $("liwResFile").addEventListener("change", async () => { const f = bOneFile($("liwResFile").files, $("liwStatus")); $("liwResFile").value = ""; await takeFile(f); });
  dropZone("liwResDrop", files => { const f = bOneFile(files, $("liwStatus")); if (f) takeFile(f); });
  $("liwPasteGo").addEventListener("click", async () => {
    const st = $("liwStatus");
    await importPastedLinkedIn("liwPaste", st);
    if (!st.classList.contains("err")) { liWelcomeHold = true; note().innerHTML = doneNote; }
  });
  // Next always opens the boxes. If no AI is connected, ask first (connect one, or carry on without)
  $("liwNext").addEventListener("click", async () => {
    if (!(await aiIsConnected())) {
      const choice = await askConnectAi("your LinkedIn");
      if (choice === "connect") { openView("connect"); return; }
      if (choice !== "skip") return;   // (closed with Esc: stay here)
    }
    liOpenBoxes(true);
  });
  $("liBackStart").addEventListener("click", liGoStart);
  onProfile(() => applyLiWelcome());
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
