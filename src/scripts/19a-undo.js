/* ===================== Undo and redo (Ctrl+Z, Ctrl+Y) for everything saved in your profile ===================== */
// Every change to the profile (typing, deleting a bullet point, using an AI wording, sorting, importing) goes through touchProfile,
// which calls undoRecord. A snapshot is kept after each change; typing in quick bursts is one step. Undo puts the earlier snapshot back.
// A text box still undoes its own typing first: the browser's own Ctrl+Z works until the box has nothing left to undo.
const undoState = { list: [], at: -1, lastTyping: false, t: 0, busy: false, typingAt: 0 };
const undoNow = () => JSON.stringify(profile.data);
function undoSeed() { undoState.list = [undoNow()]; undoState.at = 0; undoUi(); }
function undoRecord(source) {
  if (undoState.busy) return;
  if (undoState.at < 0) { undoSeed(); return; }
  const s = undoNow();
  if (s === undoState.list[undoState.at]) return;
  const now = Date.now(), typing = now - undoState.typingAt < 400;
  if (typing && undoState.lastTyping && now - undoState.t < 1500 && undoState.at > 0) undoState.list[undoState.at] = s;   // a burst of typing is one step
  else { undoState.list = undoState.list.slice(0, undoState.at + 1); undoState.list.push(s); if (undoState.list.length > 80) undoState.list.shift(); undoState.at = undoState.list.length - 1; }
  undoState.lastTyping = typing; undoState.t = now;
  undoUi();
}
function undoStep(dir) {
  const to = undoState.at + dir;
  if (to < 0 || to >= undoState.list.length) return false;
  undoState.busy = true;
  try {
    undoState.at = to; undoState.lastTyping = false;
    profile.data = mergeProfile(JSON.parse(undoState.list[to]));
    syncProfile(profile.data); profileChanged("undo"); saveProfileSoon();
    if (typeof builder !== "undefined") { builder.alts = {}; builder.sumAlts = null; builder.extraAlts = {}; builder.sugg = {}; }
  } finally { undoState.busy = false; }
  undoUi();
  const m = dir < 0 ? "Undone" : "Redone";
  if (typeof toast === "function") toast(m);
  return true;
}
function undoUi() {
  const u = document.getElementById("abUndo"), r = document.getElementById("abRedo");
  if (u) u.disabled = undoState.at <= 0;
  if (r) r.disabled = undoState.at >= undoState.list.length - 1;
}
// Is the person typing in a box that still has its own undo history? Then let the browser undo that first.
const undoInBox = e => { const t = e.target; return t && (t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && /^(text|search|url|tel|email)$/.test(t.type || "text"))); };
onInit(() => {
  document.addEventListener("input", () => { undoState.typingAt = Date.now(); }, true);
  document.addEventListener("keydown", e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    const isUndo = k === "z" && !e.shiftKey, isRedo = k === "y" || (k === "z" && e.shiftKey);
    if (!isUndo && !isRedo) return;
    if (!["builder", "profile", "letter", "cv", "linkedin"].includes(currentView)) return;
    // if the box has typing of its own that the browser can undo, let it; once the box is untouched, undo the whole profile
    if (undoInBox(e) && Date.now() - undoState.typingAt < 8000) return;
    if (undoStep(isUndo ? -1 : 1)) e.preventDefault();
  });
  const u = document.getElementById("abUndo"), r = document.getElementById("abRedo");
  if (u) u.addEventListener("click", () => undoStep(-1));
  if (r) r.addEventListener("click", () => undoStep(1));
  onProfile(src => { if (src === "load" || src === "account") undoSeed(); });
  undoUi();
});
