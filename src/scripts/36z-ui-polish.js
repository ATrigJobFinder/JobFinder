/* ===================== Small things that should feel the same everywhere ===================== */
// Double-clicking a button, a list option or a drop-down used to leave words selected (or the box lit up) once the list had closed.
// The first click does its job, so the second one must not start a text selection.
onInit(() => {
  const pressy = "[role=option], .cc-btn, .opt-chip, .opt-tile, .jb-pill, .jb-ro, .seg button, .btn, button";
  // second click of a double-click on a control: no word selection, no focus grab
  document.addEventListener("mousedown", e => {
    const t = e.target;
    if (!t.closest) return;
    if (e.detail > 1 && t.closest(pressy) && !t.closest("input, textarea, select, [contenteditable]")) e.preventDefault();
    // clicking an option in any pick list keeps the cursor in its box, so nothing is selected or blurred
    else if (t.closest(".pick-list li")) e.preventDefault();
  }, true);
  document.addEventListener("dblclick", e => {
    const t = e.target;
    if (!t.closest) return;
    if (t.closest(pressy) || t.closest(".pick-list")) { const s = getSelection(); if (s && !s.isCollapsed && !t.closest("input, textarea, [contenteditable]")) s.removeAllRanges(); }
    // a drop-down that was opened and closed again by the double-click shouldn't stay lit
    const sel = t.closest("select");
    if (sel) setTimeout(() => { if (document.activeElement === sel) sel.blur(); }, 0);
  });
});

/* --- Number boxes: a tidy − / + stepper instead of the browser's tiny arrows --- */
function numEnhance(root = document) {
  for (const n of root.querySelectorAll("input[type=number]:not([data-ns])")) {
    n.dataset.ns = "1";
    const w = document.createElement("span"); w.className = "num-step";
    const mk = (d, sym, label) => { const b = document.createElement("button"); b.type = "button"; b.className = "num-btn"; b.tabIndex = -1; b.dataset.d = d; b.setAttribute("aria-label", label); b.textContent = sym; return b; };
    n.before(w); w.append(mk(-1, "−", "One fewer"), n, mk(1, "+", "One more"));
    numState(w);
  }
}
function numState(w) {
  const n = w.querySelector("input"), v = n.value === "" ? null : +n.value;
  const [dn, up] = w.querySelectorAll(".num-btn");
  dn.disabled = n.disabled || (n.min !== "" && v !== null && v <= +n.min);
  up.disabled = n.disabled || (n.max !== "" && v !== null && v >= +n.max);
}
onInit(() => {
  numEnhance();
  let queued = false;
  new MutationObserver(recs => {
    if (queued || !recs.some(r => [...r.addedNodes].some(x => x.nodeType === 1 && (x.matches("input[type=number]") || x.querySelector("input[type=number]"))))) return;
    queued = true; queueMicrotask(() => { queued = false; numEnhance(); });
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest(".num-btn"); if (!b || b.disabled) return;
    const w = b.parentElement, n = w.querySelector("input");
    if (+b.dataset.d > 0) n.stepUp(); else n.stepDown();
    n.dispatchEvent(new Event("input", { bubbles: true })); n.dispatchEvent(new Event("change", { bubbles: true }));
    numState(w);
  });
  document.addEventListener("input", e => { const w = e.target.closest && e.target.closest(".num-step"); if (w) numState(w); });
  document.addEventListener("change", e => { const w = e.target.closest && e.target.closest(".num-step"); if (w) numState(w); });
});
