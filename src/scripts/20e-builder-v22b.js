/* ===================== Version 22 (part 2): the preview follows what you're editing; spelling is one menu ===================== */

/* --- On the preview, mark the part of the resume you're working on --- */
const PAPER_SECTIONS = {
  contact: ["contact"], experience: ["experience"], education: ["education"], skills: ["skills", "certs", "languages"],
  summary: ["summary"], goal: ["summary"], extras: ["projects", "volunteering", "awards", "publications", "interests", "referees", "availability"]
};
const paperFocus = { list: "", i: -1 };
function paperHighlight() {
  const sheet = document.querySelector("#bPaper .paper-sheet");
  if (!sheet) return;
  sheet.querySelectorAll(".cv-hl, .cv-hl-entry").forEach(x => x.classList.remove("cv-hl", "cv-hl-entry"));
  const step = B_STEPS[builder.step] && B_STEPS[builder.step].key;
  const keys = paperFocus.list ? [paperFocus.list === "referees" ? "referees" : paperFocus.list] : (PAPER_SECTIONS[step] || []);
  let any = false;
  for (const k of keys) sheet.querySelectorAll(`.cv-s-${k}`).forEach(s => { s.classList.add("cv-hl"); any = true; });
  if (step === "contact" || step === "goal") { const h = sheet.querySelector(".cv-head"); if (h) { h.classList.add("cv-hl"); any = true; } }
  // inside a card: the one entry, found by its title
  if (paperFocus.list && paperFocus.i >= 0 && P()[paperFocus.list]) {
    const e = listArr(P(), paperFocus.list)[paperFocus.i];
    const names = e ? [e.title, e.org, e.name, e.degree, e.inst].map(x => String(x || "").trim().toLowerCase()).filter(Boolean) : [];
    const hit = [...sheet.querySelectorAll(".cv-entry")].find(en => names.some(n => (en.querySelector(".cv-et") || {}).textContent && en.querySelector(".cv-et").textContent.trim().toLowerCase() === n));
    if (hit) { hit.classList.add("cv-hl-entry"); const sec = hit.closest(".cv-sec"); if (sec) sec.classList.remove("cv-hl"); }
  }
  if (any) scrollPreviewToHighlight();
  return any;
}
// Keep the highlighted part of the preview in view (the preview scrolls inside its own column; the page itself doesn't jump)
function scrollPreviewToHighlight() {
  const sheet = document.querySelector("#bPaper .paper-sheet"), box = sheet && sheet.closest(".b-side");
  const el = sheet && (sheet.querySelector(".cv-hl-entry") || sheet.querySelector(".cv-hl"));
  if (!el || !box) return;
  const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
  if (r.top >= b.top + 24 && r.bottom <= b.bottom - 24) return;
  const to = box.scrollTop + (r.top - b.top) - 70;
  box.scrollTo({ top: Math.max(0, to), behavior: reduceMotion() ? "auto" : "smooth" });
}
onInit(() => {
  const f = $("bForm");
  if (!f) return;
  f.addEventListener("focusin", e => {
    const card = e.target.closest && e.target.closest("details.b-card[data-card]");
    const next = card ? { list: card.dataset.card, i: +card.dataset.i } : { list: "", i: -1 };
    if (next.list !== paperFocus.list || next.i !== paperFocus.i) { paperFocus.list = next.list; paperFocus.i = next.i; paperHighlight(); }
  });
  // choosing another step starts fresh
  const steps = $("bSteps");
  if (steps) steps.addEventListener("click", () => { paperFocus.list = ""; paperFocus.i = -1; setTimeout(paperHighlight, 0); });
  // spelling: one menu
  f.addEventListener("change", e => {
    const sel = e.target.closest && e.target.closest('select[data-v22="lang"]');
    if (!sel) return;
    const fake = document.createElement("button");
    fake.dataset.act = "pick-lang"; fake.dataset.val = sel.value;
    onBuilderClick({ target: fake, preventDefault() {} });
  });
});
