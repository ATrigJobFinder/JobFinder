/* ===================== Version 22: resume builder changes ===================== */

/* --- A fixed (i) in the page, for headings (the boxes' own (i) are added by 36c) --- */
const hinfoHtml = (what, why) => `<button type="button" class="hinfo" data-what="${esc(what)}" data-why="${esc(why)}" aria-label="What to add: ${esc(what.slice(0, 60))}" aria-expanded="false">i</button>`;

/* --- Sort buttons at the top of the step --- */
function sortBar(list) {
  const n = P()[list].length;
  if (n < 2) return "";
  // one drop-down for every way to sort; "Re-order by hand" explains dragging
  const opts = [["date", "Date, newest first"], ...(list === "education" ? [["level", "Level, highest first"]] : []), ["hand", "Re-order by hand"]];
  const noun = list === "education" ? "qualification" : "job";
  const help = builder.sortHelp === list ? `<div class="sort-help" role="note"><b>Re-order by hand</b>
    <ol><li>Find the dotted handle <span class="sort-grip">${GRIP_SVG}</span> at the left of each ${noun}'s title.</li><li>Press and hold it, then drag the ${noun} above or below another. A line shows where it will land.</li><li>Let go to drop it. The preview updates straight away.</li></ol>
    <div class="sort-demo" aria-hidden="true"><i></i><i class="mv"></i><i></i></div><button class="linkish" type="button" data-sort-help-close="${list}">Got it</button></div>` : "";
  return `<div class="b-sortwrap"><div class="b-actions b-sortbar"><label class="sort-pick"><span class="visually-hidden">Sort your ${list}</span><select data-sortmenu="${list}" aria-label="Sort by"><option value="">Sort by…</option>${opts.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></label></div>${help}<p class="small muted sort-note" id="bSort-${list}" role="status">${sortNoteHtml(list)}</p></div>`;
}
// Year 10 is lowest and a doctorate highest, with Honours above a plain bachelor; short courses and "other" go last
const LEVEL_ORDER = ["y10", "y12", "c1", "c2", "c3", "c4", "dip", "adip", "assoc", "bach", "hons", "gcert", "gdip", "master", "phd"];
function sortByLevel() {
  const arr = P().education, rank = e => LEVEL_ORDER.indexOf(e.level || splitQual(e.degree)[0]);
  const sorted = arr.map((e, k) => ({ e, k })).sort((a, b) => rank(b.e) - rank(a.e) || a.k - b.k).map(x => x.e);
  if (sorted.every((e, k) => e === arr[k])) { builder.sortNote = { list: "education", text: "Already in order of level." }; renderBuilder(false); return; }
  keepOpen();
  const before = arr.slice(), openNow = new Set([...builder.open.education].map(i => arr[i]));
  arr.splice(0, arr.length, ...sorted);
  builder.open.education = new Set(sorted.map((e, k) => openNow.has(e) ? k : -1).filter(k => k >= 0));
  builder.sugg = {}; builder.alts = {};
  builder.sortNote = { list: "education", text: "Now in order of level, highest first.", before };
  builder.animate = true;
  touchProfile("builder"); renderBuilder(false);
}

/* --- Drag a card above or below another --- */
const GRIP_SVG = '<svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" focusable="false"><g fill="currentColor"><circle cx="2.5" cy="3" r="1.3"/><circle cx="7.5" cy="3" r="1.3"/><circle cx="2.5" cy="8" r="1.3"/><circle cx="7.5" cy="8" r="1.3"/><circle cx="2.5" cy="13" r="1.3"/><circle cx="7.5" cy="13" r="1.3"/></g></svg>';
const dragH = (list, i) => `<span class="drag-h" draggable="true" data-drag="${list}" data-i="${i}" title="Drag to move this up or down" aria-label="Drag to move">${GRIP_SVG}</span>`;
let dragFrom = null;
function dragSetup() {
  const f = $("bForm");
  if (!f) return;
  f.addEventListener("click", e => { if (e.target.closest(".drag-h")) e.preventDefault(); });   // the handle sits in a summary: don't open the card
  f.addEventListener("dragstart", e => {
    const h = e.target.closest && e.target.closest(".drag-h");
    if (!h || h.dataset.bdrag) return;
    dragFrom = { list: h.dataset.drag, i: +h.dataset.i };
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "card"); } catch { /* ignore */ }
    const card = h.closest("details"); if (card) { card.classList.add("dragging"); try { e.dataTransfer.setDragImage(card.querySelector("summary"), 20, 16); } catch { /* ignore */ } }
  });
  f.addEventListener("dragover", e => {
    if (!dragFrom) return;
    const card = e.target.closest && e.target.closest(`details[data-card="${dragFrom.list}"]`);
    f.querySelectorAll(".drop-above,.drop-below").forEach(x => x.classList.remove("drop-above", "drop-below"));
    if (!card) return;
    e.preventDefault();
    const r = card.getBoundingClientRect();
    card.classList.add(e.clientY < r.top + r.height / 2 ? "drop-above" : "drop-below");
  });
  f.addEventListener("drop", e => {
    if (!dragFrom) return;
    const card = e.target.closest && e.target.closest(`details[data-card="${dragFrom.list}"]`);
    if (!card) return;
    e.preventDefault();
    const above = card.classList.contains("drop-above"), to = +card.dataset.i, arr = listArr(P(), dragFrom.list);
    let dest = above ? to : to + 1;
    const [item] = arr.splice(dragFrom.i, 1);
    if (dragFrom.i < dest) dest--;
    arr.splice(dest, 0, item);
    const list = dragFrom.list;
    dragFrom = null;
    keepOpen(); builder.open[list] = new Set(); builder.sugg = {}; builder.alts = {}; builder.genned = new Set(); builder.extraAlts = {};
    builder.animate = true;
    touchProfile("builder"); renderBuilder(false);
  });
  f.addEventListener("dragend", () => { dragFrom = null; f.querySelectorAll(".dragging,.drop-above,.drop-below").forEach(x => x.classList.remove("dragging", "drop-above", "drop-below")); });
}

/* --- Driver's licence: pick every kind of vehicle you can drive --- */
const LICENCE_CLASSES = [["C", "Car (C)"], ["R", "Motorcycle (R)"], ["LR", "Light rigid truck (LR)"], ["MR", "Medium rigid truck or bus (MR)"], ["HR", "Heavy rigid truck (HR)"], ["HC", "Heavy combination truck (HC)"], ["MC", "Multi-combination truck (MC)"]];
function licenceSet() {
  const t = String(P().contact.licence || ""), s = new Set();
  const inside = (t.match(/\(([^)]*)\)/) || [])[1];
  if (inside) inside.split(/[,\s]+/).forEach(k => { if (LICENCE_CLASSES.some(c => c[0] === k.toUpperCase())) s.add(k.toUpperCase()); });
  else { if (/\bC class\b|\bcar\b/i.test(t)) s.add("C"); for (const [k] of LICENCE_CLASSES) if (k.length === 2 && new RegExp("\\b" + k + "\\b").test(t)) s.add(k); }
  return s;
}
const licenceText = set => set.size ? `Driver's licence (${LICENCE_CLASSES.map(c => c[0]).filter(k => set.has(k)).join(", ")})` : "";
function licenceQ() {
  const cur = licenceSet(), legacy = val(P().contact.licence) && !cur.size;
  return `<div class="q wide" data-lic="1"><div class="q-label" id="licL">Driver's licence <span class="opt">(optional)</span></div>
    <div class="opt-chips" role="group" aria-labelledby="licL">${LICENCE_CLASSES.map(([k, l]) => `<button type="button" class="opt-chip" data-v22="lic" data-k="${k}" aria-pressed="${cur.has(k)}">${l}</button>`).join("")}</div>
    <p class="q-hint">Tick every kind of vehicle you're licensed to drive.${legacy ? ` It says “${esc(P().contact.licence)}” now: pick above to replace it.` : ""}</p></div>`;
}
// The driver's licence is also a licence: it's added to Licences and certificates, and kept in step
function licenceToCerts() {
  const p = P(), t = licenceText(licenceSet());
  p.skills.certs = p.skills.certs.filter(c => !/^driver'?s licen[cs]e/i.test(c));
  if (t) p.skills.certs.unshift(t);
}

/* --- Thesis or major project: a button, then the kind and the title --- */
const PROJECT_KINDS = ["Thesis", "Major project", "Capstone project", "Research project"];
// An extra thesis or project is kept as one line, "Kind: Title"; this splits it for the boxes
function projRow(line) {
  const m = String(line || "").match(/^\s*(Thesis|Major project|Capstone project|Research project)\s*:\s*(.*)$/i);
  return m ? { kind: PROJECT_KINDS.find(k => k.toLowerCase() === m[1].toLowerCase()) || "Thesis", title: m[2].trim() } : { kind: "Thesis", title: String(line || "").trim() };
}
const projLineOf = (kind, title) => `${kind}: ${title}`;
function projectQ(e, base) {
  const i = base.split(".")[1], has = e.projectOpen || val(e.projectTitle) || val(e.project);
  const x = j => `<button type="button" class="chip-x proj-x" data-v22="proj-del" data-i="${i}" data-j="${j}" aria-label="Remove this thesis or project" title="Remove this thesis or project">×</button>`;
  const rows = [];
  if (has) rows.push(`<div class="proj-row">${q(base + ".projectKind", "Thesis or major project", { select: PROJECT_KINDS.map(k => [k, k]), opt: true })}${q(base + ".projectTitle", "Title of the thesis or project", { opt: true, ph: "e.g. Passive cooling for rooftop solar panels", prose: true })}${x(0)}</div>`);
  (e.projectsMore || []).forEach((line, k) => {
    const r = projRow(line), id = `pm_${i}_${k}`;
    rows.push(`<div class="proj-row proj-more" data-nohelp="1"><div class="q"><div class="q-body"><select id="${id}k" data-pm-kind="${i}.${k}" aria-label="Kind of thesis or project ${k + 2}">${PROJECT_KINDS.map(o => `<option${o === r.kind ? " selected" : ""}>${o}</option>`).join("")}</select></div></div><div class="q"><div class="q-body"><input type="text" id="${id}t" data-pm-title="${i}.${k}" data-prose="1" spellcheck="true" value="${esc(r.title)}" placeholder="Title of the thesis or project" aria-label="Title of thesis or project ${k + 2}" autocomplete="off"></div></div>${x(k + 1)}</div>`);
  });
  // always there, so more than one thesis or project can be added
  return `${rows.length ? `<div class="proj-wrap">${rows.join("")}</div>` : ""}<div class="b-actions"><button class="btn" type="button" data-v22="proj-add" data-i="${i}">Add Thesis or Project</button></div>`;
}

/* --- One line per box, with an Add button (awards, publications) --- */
function lineListQ(key, label, ph, addLabel, after = "") {
  const lines = String(P()[key] || "").split("\n").map(l => l.replace(BULLET_RE, "")).filter((l, k, a) => l.trim() || k < a.length);
  const filled = lines.filter(l => l.trim()), rows = filled.length && !(builder.llBlank && builder.llBlank[key]) ? filled : [...filled, ""];
  return `<div class="q wide ll-q" data-ll="${key}"><div class="q-label" id="ll_${key}">${label}</div><div class="ll-list" role="group" aria-labelledby="ll_${key}">${rows.map((l, i) => `<div class="ll-row"><span class="drag-h ll-grip" draggable="true" data-ll-drag="${key}" data-i="${i}" title="Drag to move this line" aria-label="Drag to move ${esc(label)} ${i + 1}">${GRIP_SVG}</span><input type="text" class="ll-in" data-v22="ll" data-ll="${key}" data-i="${i}" value="${esc(l)}" placeholder="${esc(ph)}" aria-label="${esc(label)} ${i + 1}" data-prose="1" spellcheck="true"><button type="button" class="chip-x" data-v22="ll-del" data-ll="${key}" data-i="${i}" aria-label="Remove ${esc(label)} ${i + 1}">×</button></div>`).join("")}</div>
    <div class="b-actions"><button class="btn" type="button" data-v22="ll-add" data-ll="${key}">${addLabel}</button></div>${after}</div>`;
}
const llRows = key => [...document.querySelectorAll(`#bForm input.ll-in[data-ll="${key}"]`)].map(i => i.value);
function llSave(key, rows) { P()[key] = rows.map(r => r.trim()).filter(Boolean).join("\n"); if (key === "awards" || key === "publications") P().extrasDone[key] = false; touchProfile("builder"); }

/* --- Dates: finishing before you started --- */
function monthIndex(s) {
  const f = fmtDate(s), m = f.match(/^([A-Z][a-z]{2}) ((?:19|20)\d{2})$/);
  if (m) return +m[2] * 12 + MON3.indexOf(m[1]);
  const y = f.match(/^((?:19|20)\d{2})$/);
  return y ? +y[1] * 12 : null;
}
// "" when the order is fine, otherwise the message
function endBeforeStart(entry) {
  if (!entry || entry.current) return "";
  const a = monthIndex(entry.start), b = monthIndex(entry.end);
  return a != null && b != null && b < a ? "This finishes before it starts. Check both dates." : "";
}

/* --- One place for the clicks the new controls make --- */
onInit(() => {
  dragSetup();
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-v22]");
    if (!b || !b.closest("#bForm")) return;
    const p = P(), a = b.dataset.v22;
    if (a === "lic") {
      const s = licenceSet(); s.has(b.dataset.k) ? s.delete(b.dataset.k) : s.add(b.dataset.k);
      p.contact.licence = licenceText(s); licenceToCerts(); keepOpen(); touchProfile("builder"); renderBuilder(false);
    } else if (a === "proj-add") {
      const x = p.education[+b.dataset.i];
      if (!(x.projectOpen || val(x.projectTitle) || val(x.project))) { x.projectOpen = true; if (!x.projectKind) x.projectKind = "Thesis"; }
      else (x.projectsMore = x.projectsMore || []).push(projLineOf("Thesis", ""));
      keepOpen(); touchProfile("builder"); renderBuilder(false);
      const rows = document.querySelectorAll(`#bForm details[data-card="education"][data-i="${b.dataset.i}"] .proj-row input[type=text]`); if (rows.length) rows[rows.length - 1].focus();
    }
    else if (a === "proj-del") {
      const x = p.education[+b.dataset.i], j = +b.dataset.j || 0, more = x.projectsMore || (x.projectsMore = []);
      if (j > 0) more.splice(j - 1, 1);
      else if (more.length) { const r = projRow(more.shift()); x.projectKind = r.kind; x.projectTitle = r.title; x.project = r.title ? projLineOf(r.kind, r.title) : ""; x.projectOpen = true; }
      else { x.projectOpen = false; x.projectKind = ""; x.projectTitle = ""; x.project = ""; }
      keepOpen(); touchProfile("builder"); renderBuilder(false);
    }
    else if (a === "ll-add") { const k = b.dataset.ll; const empty = [...document.querySelectorAll(`#bForm input.ll-in[data-ll="${k}"]`)].find(i => !i.value.trim()); if (empty) { empty.focus(); return; } builder.llBlank = { ...(builder.llBlank || {}), [k]: 1 }; keepOpen(); renderBuilder(false); const all = document.querySelectorAll(`#bForm input.ll-in[data-ll="${k}"]`); if (all.length) all[all.length - 1].focus(); }
    else if (a === "ll-del") { const k = b.dataset.ll, rows = llRows(k); rows.splice(+b.dataset.i, 1); builder.llBlank = { ...(builder.llBlank || {}), [k]: 0 }; llSave(k, rows); builder.extraAlts = {}; keepOpen(); renderBuilder(false); }
  });
  const pmSave = t => {
    const key = t.dataset.pmKind || t.dataset.pmTitle;
    const [i, k] = key.split(".").map(Number), x = P().education[i]; if (!x || !x.projectsMore) return;
    const row = t.closest(".proj-row");
    x.projectsMore[k] = projLineOf(row.querySelector("select").value, row.querySelector("input").value); touchProfile("builder");
  };
  document.addEventListener("change", e => { const t = e.target; if (t && t.matches && t.matches("[data-pm-kind]") && t.closest("#bForm")) pmSave(t); });
  document.addEventListener("input", e => {
    const t = e.target;
    if (t && t.matches && t.matches("[data-pm-title]") && t.closest("#bForm")) { pmSave(t); return; }
    if (t && t.classList && t.classList.contains("ll-in") && t.closest("#bForm")) { const k = t.dataset.ll; P()[k] = llRows(k).map(r => r.trim()).filter(Boolean).join("\n"); if (t.value.trim()) builder.llBlank = { ...(builder.llBlank || {}), [k]: 0 }; touchProfile("builder"); }
  });
});
