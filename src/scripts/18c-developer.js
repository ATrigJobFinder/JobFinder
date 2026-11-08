/* ===================== Developer options: the screens for 07c ===================== */
// A small circle under the header, top right (only for you: Ctrl+D shows or hides it, see devAllowed). Pressing it opens the
// Job seeker / Employer switch and the Developer button. While you're seeing the site as a new visitor the circle is filled in.
function devDialog() {
  let d = $("devDlg");
  if (!d) { d = document.createElement("dialog"); d.id = "devDlg"; d.className = "jf-dialog"; d.setAttribute("aria-labelledby", "devH"); document.body.appendChild(d); }
  const fresh = devFresh();
  d.innerHTML = `<form method="dialog" class="jf-dialog-card"><h2 id="devH">Developer</h2>
    ${fresh
      ? `<p>You're seeing Job Finder as a <b>brand new visitor</b>: no profile, no saved resumes, no AI chosen, not signed in.</p><p class="small muted"><b>New session</b> starts again from nothing. <b>Restore data</b> brings back just the resume in your profile, so you can see the site as someone who has uploaded one. <b>Restore everything</b> clears this view and puts all of your own data back. Your own data is kept safely aside, not deleted, until you restore everything.</p>`
      : `<p>See Job Finder the way a brand new visitor sees it?</p><p class="small muted">Your profile, resumes, letters, applications, AI choice and sign-in are put safely aside (not deleted) and the page reloads empty. Press <b>Restore everything</b> any time to fill everything back in. Anything you add while looking as a new visitor is dropped when you restore.</p>`}
    <div class="b-actions"><button class="btn ghost" value="cancel" type="submit" formnovalidate>${fresh ? "Stay as I am" : "Cancel"}</button>${fresh
      ? `<button class="btn" value="new">New session</button><button class="btn primary" value="resume">Restore data (resume only)</button><button class="btn" value="go">Restore everything</button>`
      : `<button class="btn danger" value="go">New session</button>`}</div>
    <label class="q-check small"><input type="checkbox" id="devKeep"${devRead(DEV_FLAG) === "1" ? " checked" : ""}> <span>Always show the Developer button on this browser</span></label></form>`;
  d.addEventListener("close", () => {
    const keep = $("devKeep"); try { if (keep) { if (keep.checked) localStorage.setItem(DEV_FLAG, "1"); else localStorage.removeItem(DEV_FLAG); } } catch { /* blocked */ }
    if (fresh && d.returnValue === "new") { devResetFresh(false); return; }
    if (fresh && d.returnValue === "resume") { devResetFresh(true); return; }
    if (d.returnValue !== "go") { devRender(); return; }
    if (fresh) devLeaveFresh();
    else if (!devEnterFresh()) toast("This browser won't let the site store anything here, so it can't be put aside safely.", "warn");
  }, { once: true });
  d.returnValue = ""; d.showModal();
}
function devPop(open) {
  const dot = $("devDot"), pop = $("devPop");
  if (!dot || !pop) return;
  const on = open == null ? pop.hidden : open;
  pop.hidden = !on || dot.hidden;
  dot.setAttribute("aria-expanded", String(!pop.hidden));
}
function devRender() {
  const btn = $("devBtn");
  if (btn) {
    // while you are looking as a new visitor the Developer button turns into "Viewing as visitor": press it to go back to your own data
    const fresh = devFresh();
    btn.hidden = !devAllowed();
    btn.textContent = fresh ? "Viewing as visitor" : "New session";
    btn.title = fresh ? "You are seeing the site as a brand new visitor. Press for new session, restore data, or to go back to your own data." : "See the site as a brand new visitor";
    btn.classList.toggle("on", fresh);
  }
  // the Job seeker / Employer switch is a developer option too: it sits in the same pop-up as the Developer button
  const on = devAllowed(), sw = $("snMode"); if (sw) sw.hidden = !on;
  const dot = $("devDot");
  if (dot) { dot.hidden = !on; dot.classList.toggle("on", devFresh()); dot.title = devFresh() ? "Developer options: you are seeing the site as a new visitor" : "Developer options"; if (!on) devPop(false); }
  if (!on && typeof appMode !== "undefined" && appMode === "employer") setMode("seeker", true);
  const bar = $("devBar"); if (bar) bar.hidden = true;   // no bar along the bottom: the Developer button in the menu says "Viewing as visitor" instead
}
onInit(() => {
  // the circle, and the pop-up it opens (the Job seeker / Employer switch moves into it, and so does the Developer button)
  if (!$("devDot")) {
    const dot = document.createElement("button"); dot.type = "button"; dot.id = "devDot"; dot.className = "dev-dot"; dot.hidden = true;
    dot.setAttribute("aria-haspopup", "true"); dot.setAttribute("aria-expanded", "false"); dot.setAttribute("aria-controls", "devPop"); dot.setAttribute("aria-label", "Developer options"); dot.title = "Developer options";
    dot.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5"/></svg>';
    const pop = document.createElement("div"); pop.id = "devPop"; pop.className = "dev-pop"; pop.hidden = true; pop.setAttribute("role", "group"); pop.setAttribute("aria-label", "Developer options");
    pop.innerHTML = '<h2>Developer</h2><p class="small muted">Only you see this. Ctrl+D hides it.</p>';
    const sw = $("snMode"); if (sw) pop.appendChild(sw);
    const b = document.createElement("button"); b.type = "button"; b.id = "devBtn"; b.className = "sn-dev"; b.hidden = true; b.textContent = "Developer"; b.title = "See the site as a brand new visitor";
    pop.appendChild(b); b.addEventListener("click", () => { devPop(false); devDialog(); });
    appEl.append(dot, pop);
    dot.addEventListener("click", () => devPop());
    document.addEventListener("click", e => { if (!pop.hidden && !e.target.closest("#devPop, #devDot")) devPop(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !pop.hidden) { devPop(false); dot.focus(); } });
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-dev=restore]")) devLeaveFresh(); });
  // Ctrl+D shows or hides the developer circle on this browser (Ctrl+Shift+D does the same)
  document.addEventListener("keydown", e => {
    if (!(e.ctrlKey && !e.altKey && !e.metaKey && (e.key === "D" || e.key === "d"))) return;
    e.preventDefault();
    try { if (devRead(DEV_FLAG) === "1") localStorage.removeItem(DEV_FLAG); else localStorage.setItem(DEV_FLAG, "1"); } catch { /* blocked */ }
    devRender(); toast(devAllowed() ? "Developer options are on: the circle under the header, top right." : "Developer options are off.");
  });
  devRender();
});
