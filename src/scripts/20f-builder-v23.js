/* ===================== Version 23: resume builder: animated reordering, bullet and subject dragging ===================== */

/* --- Things that move slide to their new place instead of jumping (FLIP: remember, redraw, then slide) --- */
const flipUids = new WeakMap();
let flipCount = 0;
function flipId(e) {
  if (!e || typeof e !== "object") return "x";
  let id = flipUids.get(e);
  if (!id) { id = "c" + (++flipCount); flipUids.set(e, id); }
  return id;
}
function flipText(i, t) { let h = 0; for (const c of String(t || "")) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); }
function flipCapture() {
  const m = new Map();
  document.querySelectorAll("#bForm [data-flip]").forEach(n => { const r = n.getBoundingClientRect(); m.set(n.dataset.flip, { x: r.left, y: r.top }); });
  return m;
}
function flipPlay(from) {
  if (reduceMotion()) return;
  document.querySelectorAll("#bForm [data-flip]").forEach(n => {
    const o = from.get(n.dataset.flip);
    if (!o) return;
    const r = n.getBoundingClientRect(), dx = o.x - r.left, dy = o.y - r.top;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    n.style.transition = "none"; n.style.transform = `translate(${dx}px, ${dy}px)`; n.style.position = n.style.position || "relative"; n.style.zIndex = "2";
    void n.offsetWidth;
    n.style.transition = "transform 0.32s cubic-bezier(0.2, 0.7, 0.2, 1)"; n.style.transform = "";
    const done = () => { n.style.transition = ""; n.style.zIndex = ""; n.style.position = ""; n.removeEventListener("transitionend", done); };
    n.addEventListener("transitionend", done); setTimeout(done, 500);
  });
}

/* --- Specific relevant subjects: type one, press Enter, and it becomes a bubble. Click a bubble to edit it (× removes it); drag to reorder; the first 3 show --- */
const subjList = e => listOf(val(e.coursework)).filter(x => !isBlank(x));
function subjChips(e, i) {
  const all = subjList(e);
  return all.map((s, k) => `<span class="echip subj-chip${k < subjN(e) ? "" : " off"}${k === subjN(e) - 1 && all.length > subjN(e) ? " cut" : ""}" role="button" tabindex="0" draggable="true" data-subj-chip="1" data-i="${i}" data-k="${k}" data-flip="s${i}:${flipText(i, s)}" title="Click to edit. Drag to move." aria-label="${esc(s)}${k < subjN(e) ? ", shown on your resume" : ", not shown"}. Press Enter to edit, Delete to remove."><span class="subj-text">${esc(s)}</span><span class="chip-x" role="button" data-subj-x="1" title="Remove" aria-label="Remove ${esc(s)}">×</span></span>`).join("");
}
function subjNote(e) {
  const n = subjList(e).length;
  return n > subjN(e) ? `Only the first ${subjN(e)} show on your resume (${n - subjN(e)} more kept here, shaded). Drag a bubble to change which.` : n ? `All ${n} show on your resume. The first ${subjN(e)} are used if you add more.` : `The first ${subjN(e)} you add show on your resume. Pick the ones closest to the job you're going for.`;
}
function subjectsQ(e, i) {
  return `<div class="q wide subj-q" data-subj="${i}"><label class="q-label" for="subjIn${i}">Specific relevant subjects <span class="opt">(optional)</span></label>
    <div class="q-body"><div class="pick sugg subj-box"><div class="chip-edit subj-edit"><span class="subj-chips" data-subj-list="${i}">${subjChips(e, i)}</span><input type="text" id="subjIn${i}" class="chip-in" data-subj-in="${i}" data-suggest="subject" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="subjIn${i}-sl" placeholder="Type a subject and press Enter" autocomplete="off"></div><ul class="pick-list" id="subjIn${i}-sl" role="listbox" aria-label="Subject suggestions" hidden></ul></div>
    <p class="q-hint subj-note" id="subjNote${i}">${esc(subjNote(e))}</p>
    <label class="subj-n">Show <input type="number" min="1" max="8" step="1" value="${subjN(e)}" data-subj-n="${i}" aria-label="How many subjects to show on your resume"> on my resume</label></div></div>`;
}
function subjRefresh(i, keepFocus) {
  const e = P().education[i], host = document.querySelector(`#bForm [data-subj-list="${i}"]`);
  if (!e || !host) return;
  host.innerHTML = subjChips(e, i);
  const n = $("subjNote" + i); if (n) n.textContent = subjNote(e);
  if (keepFocus) { const inp = $("subjIn" + i); if (inp) inp.focus(); }
  touchProfile("builder"); previewSoon();
}
function subjSet(i, list, animate) {
  const e = P().education[i];
  if (!e) return;
  const from = animate ? flipCapture() : null;
  e.coursework = list.join(", ");
  subjRefresh(i, false);
  if (from) flipPlay(from);
}
function subjAdd(i, raw, focus) {
  const e = P().education[i];
  if (!e) return;
  const cur = subjList(e), have = new Set(cur.map(s => s.toLowerCase()));
  const add = listOf(raw).map(s => s.replace(/\s+/g, " ").trim().slice(0, 70)).filter(s => s && !isBlank(s) && !have.has(s.toLowerCase()));
  if (!add.length) return;
  e.coursework = [...cur, ...add.map(s => s[0].toUpperCase() + s.slice(1))].join(", ");
  subjRefresh(i, focus);
}
function subjRemove(i, k) {
  const e = P().education[i];
  if (!e) return;
  const cur = subjList(e), [gone] = cur.splice(k, 1);
  if (gone === undefined) return;
  const was = e.coursework;
  subjSet(i, cur, true);
  actToast(`Removed “${gone}”.`, () => { P().education[i].coursework = was; subjRefresh(i, false); });
}
// Edit a subject where it sits: the bubble turns into a small box
function subjEdit(chip) {
  if (chip.querySelector("[data-subj-edit]")) return;
  const i = +chip.dataset.i, k = +chip.dataset.k, text = subjList(P().education[i] || {})[k];
  if (text === undefined) return;
  chip.draggable = false; chip.classList.add("editing");
  chip.innerHTML = `<input type="text" class="subj-edit-in" data-subj-edit="1" data-i="${i}" data-k="${k}" value="${esc(text)}" maxlength="70" aria-label="Edit subject: ${esc(text)}" autocomplete="off" size="${Math.max(8, text.length + 1)}">`;
  const inp = chip.querySelector("input"); inp.focus(); inp.select();
}
function subjCommit(inp) {
  const i = +inp.dataset.i, k = +inp.dataset.k, e = P().education[i];
  if (!e) return;
  const cur = subjList(e), v = inp.value.replace(/\s+/g, " ").trim().slice(0, 70);
  if (!v || isBlank(v)) { subjRemove(i, k); return; }
  const next = v[0].toUpperCase() + v.slice(1);
  if (next === cur[k]) { subjRefresh(i, false); return; }
  if (cur.some((s, n) => n !== k && s.toLowerCase() === next.toLowerCase())) { subjRemove(i, k); return; }
  cur[k] = next;
  subjSet(i, cur, false);
}
let subjDrag = null;
onInit(() => {
  const f = $("bForm");
  f.addEventListener("keydown", e => {
    const t = e.target;
    if (t.dataset && t.dataset.subjIn != null) {
      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); const v = t.value; t.value = ""; subjAdd(+t.dataset.subjIn, v, true); }
      else if (e.key === "Backspace" && !t.value) { const i = +t.dataset.subjIn, n = subjList(P().education[i] || {}).length; if (n) subjRemove(i, n - 1); }
    } else if (t.dataset && t.dataset.subjChip && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); subjRemove(+t.dataset.i, +t.dataset.k); }
    else if (t.dataset && t.dataset.subjChip && e.key === "Enter") { e.preventDefault(); subjEdit(t); }
    else if (t.dataset && t.dataset.subjEdit != null) {
      if (e.key === "Enter") { e.preventDefault(); t.dataset.done = "1"; subjCommit(t); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); t.dataset.done = "1"; subjRefresh(+t.dataset.i, false); }
    }
  });
  f.addEventListener("focusout", e => { const t = e.target; if (t.isConnected && t.dataset && t.dataset.subjIn != null && t.value.trim()) { const v = t.value, i = +t.dataset.subjIn; t.value = ""; setTimeout(() => subjAdd(i, v, false), 0); } });
  f.addEventListener("click", e => {
    const c = e.target.closest && e.target.closest("[data-subj-chip]");
    if (!c || e.target.closest("[data-subj-edit]")) return;
    if (e.target.closest("[data-subj-x]")) subjRemove(+c.dataset.i, +c.dataset.k); else subjEdit(c);
  });
  f.addEventListener("focusout", e => { const t = e.target; if (t.isConnected && t.dataset && t.dataset.subjEdit != null && !t.dataset.done) { t.dataset.done = "1"; subjCommit(t); } });
  f.addEventListener("dragstart", e => {
    const c = e.target.closest && e.target.closest("[data-subj-chip]");
    if (!c) return;
    subjDrag = { i: +c.dataset.i, k: +c.dataset.k };
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", c.textContent); } catch { /* ignore */ }
    c.classList.add("dragging");
  });
  f.addEventListener("dragover", e => {
    if (!subjDrag) return;
    const host = e.target.closest && e.target.closest(`[data-subj-list="${subjDrag.i}"]`);
    f.querySelectorAll(".subj-chip.before, .subj-chip.after").forEach(x => x.classList.remove("before", "after"));
    if (!host) return;
    e.preventDefault();
    const chip = e.target.closest("[data-subj-chip]") || [...host.querySelectorAll("[data-subj-chip]")].pop();
    if (!chip) return;
    const r = chip.getBoundingClientRect();
    chip.classList.add(e.target.closest("[data-subj-chip]") && e.clientX < r.left + r.width / 2 ? "before" : "after");
  });
  f.addEventListener("drop", e => {
    if (!subjDrag) return;
    const host = e.target.closest && e.target.closest(`[data-subj-list="${subjDrag.i}"]`);
    if (!host) return;
    e.preventDefault();
    const onChip = e.target.closest("[data-subj-chip]"), cur = subjList(P().education[subjDrag.i] || {});
    let to = onChip ? +onChip.dataset.k : cur.length - 1;
    if (onChip) { const r = onChip.getBoundingClientRect(); if (e.clientX >= r.left + r.width / 2) to++; } else to = cur.length;
    const [item] = cur.splice(subjDrag.k, 1);
    if (subjDrag.k < to) to--;
    cur.splice(Math.max(0, to), 0, item);
    const i = subjDrag.i; subjDrag = null;
    subjSet(i, cur, true);
  });
  f.addEventListener("dragend", () => { subjDrag = null; f.querySelectorAll(".subj-chip.before, .subj-chip.after, .subj-chip.dragging").forEach(x => x.classList.remove("before", "after", "dragging")); });
});

/* --- Bullet points: drag by the grip to move one up or down the list --- */
let bulletDrag = null;
onInit(() => {
  const f = $("bForm");
  f.addEventListener("dragstart", e => {
    const g = e.target.closest && e.target.closest(".bl-grip");
    if (!g) return;
    bulletDrag = { i: +g.dataset.i, j: +g.dataset.j };
    const item = g.closest(".bl-item");
    e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "bullet"); e.dataTransfer.setDragImage(item, 16, 16); } catch { /* ignore */ }
    item.classList.add("dragging");
  });
  f.addEventListener("dragover", e => {
    if (!bulletDrag) return;
    f.querySelectorAll(".bl-item.drop-above, .bl-item.drop-below").forEach(x => x.classList.remove("drop-above", "drop-below"));
    const item = e.target.closest && e.target.closest(".bl-item");
    if (!item || +item.dataset.i !== bulletDrag.i) return;
    e.preventDefault();
    const r = item.getBoundingClientRect();
    item.classList.add(e.clientY < r.top + r.height / 2 ? "drop-above" : "drop-below");
  });
  f.addEventListener("drop", e => {
    if (!bulletDrag) return;
    const item = e.target.closest && e.target.closest(".bl-item");
    if (!item || +item.dataset.i !== bulletDrag.i) return;
    e.preventDefault();
    const above = item.classList.contains("drop-above"), { i, j } = bulletDrag, arr = P().experience[i].bullets;
    let to = +item.dataset.j + (above ? 0 : 1);
    bulletDrag = null;
    const [moved] = arr.splice(j, 1);
    if (j < to) to--;
    arr.splice(to, 0, moved);
    keepOpen(); builder.alts = {}; builder.fixAsk = null; builder.animate = true;
    touchProfile("builder"); renderBuilder(false);
  });
  f.addEventListener("dragend", () => { bulletDrag = null; f.querySelectorAll(".bl-item.dragging, .bl-item.drop-above, .bl-item.drop-below").forEach(x => x.classList.remove("dragging", "drop-above", "drop-below")); });
});

/* --- Action words: drag one onto a bullet point to swap its first word --- */
function applyVerb(ta, verb) {
  const v = ta.dataset.current === "1" ? toPresentStart(verb) : verb, t = ta.value.trim();
  const weak = t.match(WEAK_START), m = t.match(/^[A-Za-z'’-]+/);
  if (!t) ta.value = v + " ";
  else if (weak) ta.value = v + " " + lowerFirst(t.slice(weak[0].length).replace(/^\s*(the|a|an)\s+/i, "").trim());
  else if (m) ta.value = v + t.slice(m[0].length);
  else ta.value = v + " " + t;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  autoGrow(ta); ta.focus();
  ta.classList.remove("flash"); void ta.offsetWidth; ta.classList.add("flash");
}
let verbDrag = null;
onInit(() => {
  const f = $("bForm");
  f.addEventListener("dragstart", e => {
    const v = e.target.closest && e.target.closest("[data-verb-drag]");
    if (!v) return;
    verbDrag = v.dataset.verbDrag;
    e.dataTransfer.effectAllowed = "copy"; try { e.dataTransfer.setData("text/plain", verbDrag); } catch { /* ignore */ }
  });
  f.addEventListener("dragover", e => {
    if (!verbDrag) return;
    const ta = e.target.closest && e.target.closest("textarea[data-bullet]");
    f.querySelectorAll("textarea.verb-over").forEach(x => { if (x !== ta) x.classList.remove("verb-over"); });
    if (!ta) return;
    e.preventDefault(); ta.classList.add("verb-over");
  });
  f.addEventListener("drop", e => {
    if (!verbDrag) return;
    const ta = e.target.closest && e.target.closest("textarea[data-bullet]");
    if (!ta) return;
    e.preventDefault();   // the browser would otherwise type the word in where it landed
    ta.classList.remove("verb-over");
    const v = verbDrag; verbDrag = null;
    applyVerb(ta, v);
  });
  f.addEventListener("dragend", () => { verbDrag = null; f.querySelectorAll("textarea.verb-over").forEach(x => x.classList.remove("verb-over")); });
});
