/* ===================== One "Download as…" button: Word, PDF or plain text ===================== */
// A button with data-dlmenu opens a small menu. dlMenu(id, {docx, pdf, txt}) says what each choice does (a choice with no function isn't offered).
const dlMenus = {};
const DL_CHOICES = [["docx", "Word (.docx)"], ["pdf", "PDF (.pdf)"], ["txt", "Plain text (.txt)"]];
let dlOpenFor = null;
function dlMenu(id, handlers) { dlMenus[id] = handlers; }
function dlClose(focusBack) {
  const pop = document.getElementById("dlPop");
  if (pop) pop.remove();
  if (dlOpenFor) { dlOpenFor.setAttribute("aria-expanded", "false"); if (focusBack) dlOpenFor.focus(); }
  dlOpenFor = null;
}
function dlOpen(btn) {
  const h = dlMenus[btn.dataset.dlmenu || btn.id];
  if (!h) return;
  dlClose();
  const pop = document.createElement("div");
  pop.id = "dlPop"; pop.className = "dl-pop"; pop.setAttribute("role", "menu"); pop.setAttribute("aria-label", "Download as");
  pop.innerHTML = DL_CHOICES.filter(([k]) => h[k]).map(([k, label]) => `<button type="button" role="menuitem" data-dl="${k}">${label}</button>`).join("");
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect(), w = pop.offsetWidth, vw = document.documentElement.clientWidth;
  pop.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + "px";
  const below = r.bottom + 6 + pop.offsetHeight <= window.innerHeight - 8;
  pop.style.top = (below ? r.bottom + 6 : Math.max(8, r.top - 6 - pop.offsetHeight)) + "px";
  btn.setAttribute("aria-expanded", "true"); dlOpenFor = btn;
  pop.querySelector("button").focus();
  pop.addEventListener("click", e => {
    const c = e.target.closest("[data-dl]"); if (!c) return;
    const fn = h[c.dataset.dl];
    dlClose(true);
    if (fn) fn(btn);
  });
  pop.addEventListener("keydown", e => {
    const items = [...pop.querySelectorAll("button")], i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === "Tab") dlClose();
  });
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-dlmenu]");
  if (b) { e.preventDefault(); if (dlOpenFor === b) dlClose(); else if (!b.disabled) dlOpen(b); return; }
  if (!e.target.closest("#dlPop")) dlClose();
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && dlOpenFor) dlClose(true); });
window.addEventListener("resize", () => dlClose());

// A plain text file: the name is asked for like the other downloads
function downloadTextFile(name, text, statusEl, btn) {
  return downloadMade(name, async () => new Blob([text], { type: "text/plain;charset=utf-8" }), statusEl, btn);
}
