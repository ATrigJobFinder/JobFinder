/* ===================== Version 25: resume builder: AI that isn't connected, sorting, dragging, second colour ===================== */

/* --- Things that need an AI: greyed out and crossed through when none is connected, with a link to connect one --- */
// Is there any AI to ask? Yours (a key or a model), Claude on the site, or the browser's own.
async function aiAbsent() {
  if (typeof sample !== "undefined" && sample) return false;
  const st = await chromeAIRaw();
  return !(st === "available" || st === "downloadable" || st === "downloading");
}
// (Turn into bullet points, Write my summary and Add a bullet point still work without an AI: built-in rules fill them in)
const AI_ONLY = '[data-act="sum-reword"], [data-act="reword"], [data-act="redo-ask"], [data-act="x-reword"], [data-lt-rwmenu], [data-lt-expand], [data-lt-write]';
let aiGateOn = false, aiGateTimer = 0;
function aiGateMark(root = document) {
  // a section that is only for the AI: greyed, crossed through and blurred, with a prompt to choose an AI
  document.querySelectorAll(".b-aiin[data-ai-what]").forEach(box => {
    const had = box.querySelector(":scope > .ai-none-prompt");
    box.classList.toggle("ai-none", aiGateOn);
    if (aiGateOn && !had) { const a = document.createElement("button"); a.type = "button"; a.className = "ai-none-prompt"; a.textContent = "Choose your AI to automate: " + box.dataset.aiWhat; a.addEventListener("click", () => openView("connect")); box.prepend(a); }
    else if (!aiGateOn && had) had.remove();
  });
  root.querySelectorAll(AI_ONLY).forEach(b => {
    if (!b.dataset.aiLabel) b.dataset.aiLabel = b.title || "";
    b.classList.toggle("ai-off", aiGateOn);
    if (aiGateOn) { b.setAttribute("aria-disabled", "true"); b.title = "This needs an AI. Press to choose one."; }
    else { b.removeAttribute("aria-disabled"); b.title = b.dataset.aiLabel; }
  });
}
async function aiGateRefresh() {
  aiGateOn = await aiAbsent();
  aiGateMark();
}
onInit(() => {
  aiChangeListeners.add(() => aiGateRefresh());
  aiGateRefresh();
  // new buttons appear whenever a step is drawn: mark them as they arrive
  const host = $("main") || document.body;
  new MutationObserver(() => { clearTimeout(aiGateTimer); aiGateTimer = setTimeout(() => aiGateMark(), 40); }).observe(host, { childList: true, subtree: true });
  // a crossed-out button takes you to Choose your AI instead of doing its job
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest(".ai-off");
    if (!b) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    toast("Connect an AI to use this.", "warn");
    openView("connect");
  }, true);
});

/* --- "Fix" on "start with an action word" with no AI: open the list of action words for that job --- */
function showVerbList(i, j) {
  keepOpen();
  const det = document.querySelector(`#bForm details.verbs[data-verbs="${i}"]`);
  if (!det) return;
  det.open = true;
  const note = det.querySelector(".verbs-nai"); if (note) note.hidden = false;
  const ta = document.querySelector(`.bl-item[data-i="${i}"][data-j="${j}"] textarea`); if (ta) ta.focus({ preventScroll: true });
  det.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
}

/* --- Sort by: one drop-down; "Re-order by hand" shows how to drag --- */
onInit(() => {
  const f = $("bForm");
  f.addEventListener("change", e => {
    const sel = e.target.closest && e.target.closest("select[data-sortmenu]");
    if (!sel) return;
    const list = sel.dataset.sortmenu, v = sel.value;
    sel.value = "";
    if (v === "date") { builder.sortHelp = null; sortByDate(list); }
    else if (v === "level") { builder.sortHelp = null; sortByLevel(); }
    else if (v === "hand") { keepOpen(); builder.sortHelp = list; renderBuilder(false); const h = f.querySelector(".sort-help"); if (h) h.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" }); }
  });
  f.addEventListener("click", e => { const c = e.target.closest && e.target.closest("[data-sort-help-close]"); if (c) { builder.sortHelp = null; keepOpen(); renderBuilder(false); } });
});

/* --- How many subjects show on the resume --- */
onInit(() => {
  $("bForm").addEventListener("change", e => {
    const n = e.target.closest && e.target.closest("input[data-subj-n]");
    if (!n) return;
    const i = +n.dataset.subjN, ed = P().education[i];
    if (!ed) return;
    ed.subjectsShown = Math.max(1, Math.min(8, Math.round(+n.value) || 3));
    n.value = ed.subjectsShown;
    subjRefresh(i, false);
  });
});

/* --- Referees: the browser may not fill these in from its memory (they are somebody else's details) --- */
onInit(() => {
  $("bForm").addEventListener("focusin", e => { const t = e.target; if (t && t.dataset && t.dataset.nofill && t.readOnly) t.readOnly = false; });
});

/* --- Awards and publications: drag a line by its handle to put it in order --- */
let llDrag = null;
onInit(() => {
  const f = $("bForm");
  f.addEventListener("dragstart", e => {
    const g = e.target.closest && e.target.closest("[data-ll-drag]");
    if (!g) return;
    llDrag = { key: g.dataset.llDrag, i: +g.dataset.i };
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "line"); e.dataTransfer.setDragImage(g.closest(".ll-row"), 16, 16); } catch { /* ignore */ }
    g.closest(".ll-row").classList.add("dragging");
  });
  f.addEventListener("dragover", e => {
    if (!llDrag) return;
    f.querySelectorAll(".ll-row.drop-above, .ll-row.drop-below").forEach(x => x.classList.remove("drop-above", "drop-below"));
    const row = e.target.closest && e.target.closest(".ll-row");
    if (!row || row.closest(".ll-list").parentElement.dataset.ll !== llDrag.key) return;
    e.preventDefault();
    const r = row.getBoundingClientRect();
    row.classList.add(e.clientY < r.top + r.height / 2 ? "drop-above" : "drop-below");
  });
  f.addEventListener("drop", e => {
    if (!llDrag) return;
    const row = e.target.closest && e.target.closest(".ll-row");
    if (!row || row.closest(".ll-list").parentElement.dataset.ll !== llDrag.key) return;
    e.preventDefault();
    const rows = [...row.parentElement.children], to = rows.indexOf(row) + (row.classList.contains("drop-above") ? 0 : 1);
    const { key, i } = llDrag; llDrag = null;
    const vals = llRows(key), [moved] = vals.splice(i, 1);
    vals.splice(i < to ? to - 1 : to, 0, moved);
    llSave(key, vals); builder.extraAlts = {}; builder.animate = true; keepOpen(); renderBuilder(false);
  });
  f.addEventListener("dragend", () => { llDrag = null; f.querySelectorAll(".ll-row.dragging, .ll-row.drop-above, .ll-row.drop-below").forEach(x => x.classList.remove("dragging", "drop-above", "drop-below")); });
});

/* --- Choose what goes on this resume: drag a section, a job or qualification, or a bullet point by its handle --- */
let chDrag = null;
const chClear = f => f.querySelectorAll(".ch-drop-above, .ch-drop-below, .ch-dragging").forEach(x => x.classList.remove("ch-drop-above", "ch-drop-below", "ch-dragging"));
function chTarget(e) {
  if (!chDrag) return null;
  const sel = chDrag.type === "sec" ? "li.ch-sec" : chDrag.type === "entry" ? `li.ch-entry` : "li[data-ch-row]";
  const li = e.target.closest && e.target.closest(sel);
  if (!li) return null;
  if (chDrag.type === "entry" && li.dataset.chEntry.split(".")[0] !== chDrag.list) return null;
  if (chDrag.type === "row" && li.dataset.chRow !== `${chDrag.list}.${chDrag.i}`) return null;
  return li;
}
onInit(() => {
  const f = $("bForm");
  f.addEventListener("dragstart", e => {
    const g = e.target.closest && e.target.closest("[data-ch-drag]");
    if (!g) return;
    chDrag = { type: g.dataset.chDrag, key: g.dataset.key, list: g.dataset.list, i: g.dataset.i != null ? +g.dataset.i : -1, text: g.dataset.text };
    const li = g.closest("li");
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "part"); e.dataTransfer.setDragImage(li, 16, 16); } catch { /* ignore */ }
    li.classList.add("ch-dragging");
  });
  f.addEventListener("dragover", e => {
    if (!chDrag) return;
    f.querySelectorAll(".ch-drop-above, .ch-drop-below").forEach(x => x.classList.remove("ch-drop-above", "ch-drop-below"));
    const li = chTarget(e);
    if (!li) return;
    e.preventDefault();
    const head = chDrag.type === "sec" ? li.querySelector(":scope > .ch-sec-head") || li : li, r = li.getBoundingClientRect();
    li.classList.add(e.clientY < r.top + Math.min(r.height / 2, 60) ? "ch-drop-above" : "ch-drop-below");
  });
  f.addEventListener("drop", e => {
    if (!chDrag) return;
    const li = chTarget(e);
    if (!li) return;
    e.preventDefault();
    const above = li.classList.contains("ch-drop-above"), d = chDrag; chDrag = null;
    const p = P();
    const move = (arr, from, to) => { const [x] = arr.splice(from, 1); arr.splice(from < to ? to - 1 : to, 0, x); };
    if (d.type === "sec") {
      const keys = chooseSections(p).map(s => s.key), from = keys.indexOf(d.key);
      let to = keys.indexOf(li.dataset.sec) + (above ? 0 : 1);
      if (from < 0 || to < 0) return;
      move(keys, from, to); p.cv.order = keys;
    } else if (d.type === "entry") {
      const [list, ti] = li.dataset.chEntry.split("."), arr = p[list], from = d.i;
      let to = +ti + (above ? 0 : 1);
      move(arr, from, to);
      // the open/closed state and notes belong to the old positions
      builder.open[list] = new Set(); builder.sugg = {}; builder.alts = {};
    } else if (d.type === "row") {
      const arr = p[d.list][d.i].bullets;
      const from = arr.findIndex(b => val(b) === d.text), target = li.querySelector("[data-text]"), toText = target ? target.dataset.text : (li.querySelector(".ch-txt") || {}).textContent;
      let to = arr.findIndex(b => val(b) === toText || (toText && val(b).startsWith(String(toText).replace(/…$/, ""))));
      if (from < 0 || to < 0) return;
      to += above ? 0 : 1;
      move(arr, from, to); builder.alts = {};
    }
    builder.chNote = "";
    refreshChoose();
  });
  f.addEventListener("dragend", () => { chDrag = null; chClear(f); });
});

/* --- A second colour (the side column) --- */
onInit(() => {
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest('[data-v25="accent2"]');
    if (!b || !b.closest("#bForm")) return;
    const p = P();
    if (!p.cv.template) p.cv.template = builderTpl().key;
    p.cv.accent2 = b.dataset.val || "";
    touchProfile("builder"); renderBuilder(false);
  });
});

/* --- Design thumbnails: always scaled to the box they sit in, however and whenever it was laid out --- */
(() => {
  const scale = th => { const k = th.clientWidth / 794; if (k > 0 && th.firstElementChild) th.firstElementChild.style.transform = `scale(${k})`; };
  const ro = window.ResizeObserver ? new ResizeObserver(es => es.forEach(en => scale(en.target))) : null;
  const seen = new WeakSet();
  const scan = root => (root || document).querySelectorAll(".tpl-thumb").forEach(th => { scale(th); if (ro && !seen.has(th)) { seen.add(th); ro.observe(th); } });
  onInit(() => {
    let t = 0;
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => scan(), 30); }).observe($("main") || document.body, { childList: true, subtree: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => scan());
    scan();
  });
})();
