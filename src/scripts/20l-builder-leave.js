/* ===================== Leaving the Review page or the cover letter without saving ===================== */
// On the last page of the resume (Check and download), and on the cover letter page once a letter is written, going to another part of the site or
// closing the tab with something that hasn't been saved to the profile asks first: save it (making a free account if there isn't one), leave without
// saving, or stay. Moving between the builder's own steps is never asked.

// What the resume looked like when it was last saved (the "updated" time is left out: it changes on every autosave)
const resumeSig = () => { const { updated, ...rest } = P(); return JSON.stringify(rest); };
const resumeUnsaved = () => currentView === "builder" && !builder.welcome && B_STEPS[builder.step].key === "review" && hasResume(P()) && builder.savedSig !== resumeSig();
// The cover letter: what it looked like when it was last saved to the profile as a named letter
let ltSavedSig = "";
const letterSig = () => { try { return JSON.stringify(BL()); } catch { return ""; } };
const letterUnsaved = () => currentView === "letter" && !(typeof ltWelcomeOn !== "undefined" && ltWelcomeOn) && blText().length > 0 && ltSavedSig !== letterSig();
// Saving to the profile needs an account where accounts are switched on (inside Claude, or without accounts, it saves privately as before)
const saveNeedsAccount = () => typeof acctOn === "function" && acctOn() && !account.user && !(window.claude && window.claude.use);
// what is unsaved on the page being left: "resume", "letter" or ""
const unsavedKind = () => resumeUnsaved() ? "resume" : letterUnsaved() ? "letter" : "";

// "save", "leave" or "stay"
function askSaveBeforeLeave(kind) {
  return new Promise(resolve => {
    const needs = saveNeedsAccount(), what = kind === "letter" ? "cover letter" : "resume";
    let d = $("jfLeaveDlg");
    if (!d) { d = document.createElement("dialog"); d.id = "jfLeaveDlg"; d.className = "jf-dialog"; d.setAttribute("aria-labelledby", "jfLeaveH"); document.body.appendChild(d); }
    d.innerHTML = `<form method="dialog" class="jf-dialog-card"><h2 id="jfLeaveH">Save this ${what} to your profile?</h2>
      <p>${needs ? `This ${what} isn't saved yet. Saving to your profile needs a free account: sign up and your ${what} is kept, ready to open and use any time.` : `This ${what} isn't saved yet. Saving keeps it in your profile, so you can open it again later.`}</p>
      <div class="b-actions"><button class="btn ghost" value="stay" type="submit" formnovalidate>Stay on this page</button><button class="btn" value="leave" type="submit" formnovalidate>Leave without saving</button><button class="btn primary" value="save" type="submit" formnovalidate>${needs ? "Sign Up" : "Save to my profile"}</button></div></form>`;
    let done = false;
    const fin = v => { if (done) return; done = true; resolve(v === "save" || v === "leave" ? v : "stay"); };
    d.querySelector("form").addEventListener("submit", e => fin(e.submitter ? e.submitter.value : ""));
    d.addEventListener("close", () => fin(d.returnValue), { once: true });
    d.returnValue = ""; d.showModal();
  });
}
let leaveBusy = false;
async function leaveGuard(kind, name, opts, go) {
  if (leaveBusy) return;
  leaveBusy = true;
  try {
    const choice = await askSaveBeforeLeave(kind);
    if (choice === "stay") return;
    if (choice === "save") {
      if (kind === "letter") { await saveLetterTemplate(); if (ltSavedSig !== letterSig()) return; }   // (opens the sign-up box instead if there is no account; then it stays here)
      else { await saveResumeVersion($("bDlBtn")); if (builder.savedSig !== resumeSig()) return; }
    }
    history.replaceState(null, "", "#" + name);
    go(name, opts);
  } finally { leaveBusy = false; }
}
onInit(() => {
  const inner = showView;
  showView = function (name, opts) {
    const here = currentView, kind = name !== here ? unsavedKind() : "";
    if (kind) {
      history.replaceState(null, "", "#" + here);   // the address stays on this page while the question is open
      leaveGuard(kind, name, opts, inner);
      return;
    }
    return inner(name, opts);
  };
  window.addEventListener("beforeunload", e => { if (unsavedKind()) { e.preventDefault(); e.returnValue = ""; } });
});
