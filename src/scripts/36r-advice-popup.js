/* ===================== Create or edit resume: the part of the advice that helps, in a pop-up ===================== */
// Each step of the resume builder (and a few of its boxes) gets an "Advice" button. It opens a pop-up with the matching part of the
// Resume Advice page, copied from that page so the two never disagree. Nothing there can be typed into; the full page is one button away.
const ADV_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>';
// Each row: [section on the Resume Advice page, the one entry to show from it (blank for the whole section), the button's words]
const ADV_STEP = {
  layout: [["rg-format", "", "Format for people and software"]],
  contact: [["rg-basics", "", "What to include and leave off"]],
  experience: [["rg-achievements", "", "Write achievements, not duties"]],
  education: [["rg-sections", "Education and training", "Education advice"]],
  skills: [["rg-sections", "Key skills", "Key skills advice"], ["rg-tailor", "", "Tailor it to the job"]],
  extras: [["rg-sections", "Volunteering, projects or interests", "Projects and volunteering advice"], ["rg-sections", "Referees", "Referees advice"]],
  summary: [["rg-sections", "Summary", "Summary advice"]],
  review: [["rg-check", "", "Final check"], ["rg-safe", "", "Honesty and safety"]]
};
const advButton = (id, pick, label, cls = "") => `<button type="button" class="adv-btn${cls ? " " + cls : ""}" data-advice="${esc(id)}" data-advice-pick="${esc(pick)}" data-advice-title="${esc(label)}" aria-haspopup="dialog">${ADV_ICON}<span>${esc(label)}</span></button>`;

// The advice, copied out of the Resume Advice page and made read-only
function adviceContent(id, pick) {
  const src = document.getElementById(id);
  if (!src) return null;
  const sec = src.cloneNode(true);
  sec.querySelectorAll(".ig-phase, sup.ig-cite").forEach(n => n.remove());
  const title = sec.querySelector(":scope > h2"); if (title) title.remove();
  sec.querySelectorAll(".ig-tool").forEach(tool => {
    if (tool.querySelector("textarea, input[type=text]")) { tool.remove(); return; }   // a checker you type into belongs on its own page
    const head = tool.querySelector(".ig-tool__head"); if (head) head.remove();
    tool.querySelectorAll("input[type=checkbox]").forEach(c => { const s = document.createElement("span"); s.setAttribute("aria-hidden", "true"); s.textContent = "☐"; c.replaceWith(s); });
    tool.querySelectorAll("label").forEach(l => { const s = document.createElement("span"); s.innerHTML = l.innerHTML; l.replaceWith(s); });
  });
  sec.querySelectorAll(".ig-prose").forEach(p => { if (/^Tick each item/i.test(p.textContent.trim())) p.remove(); });
  sec.querySelectorAll('a[href^="#rg-"]').forEach(a => a.replaceWith(...a.childNodes));
  sec.removeAttribute("id"); sec.removeAttribute("aria-labelledby");
  sec.querySelectorAll("[id]").forEach(n => n.removeAttribute("id"));
  sec.querySelectorAll("[aria-labelledby]").forEach(n => n.removeAttribute("aria-labelledby"));
  if (!pick) return sec;
  const li = [...sec.querySelectorAll(".ig-anatomy > li")].find(x => ((x.querySelector("h3") || {}).textContent || "").trim().toLowerCase().startsWith(pick.toLowerCase()));
  if (!li) return sec;
  const one = document.createElement("section"); one.className = "ig-section";
  const ol = document.createElement("ol"); ol.className = "ig-anatomy is-single"; ol.append(li);
  one.append(ol);
  return one;
}

const advState = { dlg: null, target: "" };
function advDialog() {
  if (advState.dlg) return advState.dlg;
  const d = advState.dlg = document.createElement("dialog");
  d.id = "advPop"; d.className = "adv-pop"; d.setAttribute("aria-labelledby", "advPopTitle"); d.setAttribute("data-nohelp", "");
  d.innerHTML = `<div class="adv-pop-bar"><div><span class="adv-pop-kick">From the Resume Advice</span><h2 id="advPopTitle"></h2></div><button type="button" class="adv-pop-x" aria-label="Close the advice" data-adv-close>×</button></div>
    <div class="ig adv-pop-body" id="advPopBody"></div>
    <div class="adv-pop-foot"><span class="small muted">This is one part of the advice page.</span><a class="btn" href="#advice-resume" data-adv-full>Open the full Resume Advice</a></div>`;
  d.addEventListener("click", e => {
    if (e.target === d || e.target.closest("[data-adv-close]")) { d.close(); return; }
    const full = e.target.closest("[data-adv-full]");
    if (full) { const id = advState.target; d.close(); setTimeout(() => { const s = document.getElementById(id); if (s) s.scrollIntoView({ behavior: "auto", block: "start" }); }, 80); return; }
    if (e.target.closest("#advPopBody a[href^='#']")) d.close();   // a link to another page of Job Finder: go there, leaving the pop-up behind
  });
  document.body.appendChild(d);
  return d;
}
function openAdvice(id, pick, title) {
  const content = adviceContent(id, pick);
  if (!content) return;
  const d = advDialog();
  advState.target = id;
  d.querySelector("#advPopTitle").textContent = title || "Advice";
  const body = d.querySelector("#advPopBody");
  body.textContent = "";
  body.append(content);
  if (!d.open) d.showModal();
  // always start at the top of the advice, whatever was open before
  const top = () => { body.scrollTop = 0; d.scrollTop = 0; };
  top(); requestAnimationFrame(top); setTimeout(top, 60);
}

// Put the buttons where the advice applies: the top of each step, and beside a few boxes
function adviceEnhance() {
  const form = $("bForm");
  if (!form) return;
  const head = form.querySelector(".b-step-head");
  if (head && !head.querySelector(".adv-row")) {
    const rows = ADV_STEP[B_STEPS[builder.step].key];
    if (rows && rows.length) head.insertAdjacentHTML("beforeend", `<div class="adv-row">${rows.map(r => advButton(...r)).join("")}</div>`);
  }
  const add = (host, id, pick, label) => { if (host && !host.querySelector(".adv-btn")) host.insertAdjacentHTML("beforeend", advButton(id, pick, label, "inline")); };
  // "How to write bullet points" sits under the line that says how many to write
  form.querySelectorAll(".b-sub").forEach(s => {
    if (!/^Bullet points/.test(s.textContent.trim())) return;
    const hint = s.nextElementSibling;
    if (!hint || !hint.classList.contains("q-hint") || (hint.nextElementSibling && hint.nextElementSibling.classList.contains("adv-row"))) return;
    hint.insertAdjacentHTML("afterend", `<div class="adv-row">${advButton("rg-achievements", "", "How to write bullet points")}</div>`);
  });
  const labelOf = path => { const el = form.querySelector(`[data-path="${path}"]`); const q = el && el.closest(".q"); return q && q.querySelector(".q-label"); };
  add(labelOf("summary"), "rg-sections", "Summary", "Summary advice");
}

onInit(() => {
  const form = $("bForm");
  if (!form) return;
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-advice]");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    openAdvice(b.dataset.advice, b.dataset.advicePick || "", b.dataset.adviceTitle || b.textContent.trim());
  }, true);
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; adviceEnhance(); });
  }).observe(form, { childList: true, subtree: true });
  adviceEnhance();
});
