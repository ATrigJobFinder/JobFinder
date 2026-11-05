/* ===================== Previews you can type in ===================== */
// The paper previews (Tailor to resume, the cover letters, Create or edit resume) are editable: select any text on the page and change it.
// Each piece of text on the page is a "block" (the nearest box that isn't running text). When a block's words change, the preview's owner
// is asked to write the new words back to where they came from (apply). The page isn't rebuilt while you type, so the cursor stays where it
// is; once you click away it is laid out again (commit), so page breaks, highlights and the design all catch up.
//
//   paperEditable(frame, { enabled?, locked?, apply(old, new, blockOrNode), after?(), commit(), noteId? })

const ED_GONE = ".page-gap";
// The box a piece of text sits in: the nearest ancestor that isn't an inline element (flex children count as boxes)
function edBlock(node, sheet) {
  for (let el = node.parentElement; el && el !== sheet; el = el.parentElement) {
    const d = getComputedStyle(el).display;
    if (d !== "inline" && d !== "contents") return el;
  }
  return null;
}
// Every text node on the page that counts (not the "Page 2" labels)
function edTextNodes(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), out = [];
  for (let n; (n = w.nextNode());) if (n.data.trim() && !(n.parentElement && n.parentElement.closest(ED_GONE))) out.push(n);
  return out;
}
// The page's blocks, in reading order
function edBlocks(sheet) {
  const seen = new Set(), out = [];
  for (const n of edTextNodes(sheet)) { const b = edBlock(n, sheet); if (b && !seen.has(b)) { seen.add(b); out.push(b); } }
  return out;
}
// What each block (and each piece of text in it) said when the page was laid out, so a change can be found later
function edSnapshot(sheet) {
  for (const n of edTextNodes(sheet)) n._src = n.data;
  for (const b of edBlocks(sheet)) { b._src = b.textContent; b.classList.add("ed-blk"); }
}
// Find some words in a longer text, ignoring spaces, line breaks and capitals. Returns [start, end) in the longer text, or null if the words
// aren't there or are there more than once (then it can't be known which place was meant).
const edFlat = s => String(s).replace(/\s+/g, "").toLowerCase();
function edLooseFind(src, needle) {
  const idx = []; let flat = "";
  for (let i = 0; i < src.length; i++) { const c = src[i]; if (/\s/.test(c)) continue; flat += c.toLowerCase().charAt(0); idx.push(i); }
  let n = ""; for (const c of String(needle)) if (!/\s/.test(c)) n += c.toLowerCase().charAt(0);
  if (!n) return null;
  const a = flat.indexOf(n);
  if (a < 0 || flat.indexOf(n, a + 1) >= 0) return null;
  return [idx[a], idx[a + n.length - 1] + 1];
}
// Put new words where the old ones were in a text; with nothing left, a bullet or line that held only those words goes too
function edReplace(src, old, nw) {
  const hit = edLooseFind(src, old);
  if (!hit) return null;
  const [s, e] = hit, put = String(nw).replace(/\s+/g, " ").trim();
  if (put) return src.slice(0, s) + put + src.slice(e);
  const ls = src.lastIndexOf("\n", s - 1) + 1, le0 = src.indexOf("\n", e), le = le0 < 0 ? src.length : le0;
  if (edFlat(src.slice(ls, le).replace(BULLET_RE, "")) === edFlat(old)) return src.slice(0, ls) + src.slice(le0 < 0 ? le : le + 1);
  return src.slice(0, s) + src.slice(e);
}

function edInput(frame) {
  const o = frame._ed, sheet = frame.querySelector(".paper-sheet");
  if (!o || !sheet) return;
  let bad = 0;
  for (const b of edBlocks(sheet)) {
    if (b._src === undefined || b.textContent === b._src) continue;
    const old = b._src, nw = b.textContent;
    let ok = false;
    try { ok = !!o.apply(old, nw, b); } catch (e) { console.error(e); }
    // the whole block isn't one thing the owner knows (a label and its list, say): try each piece of text in it
    if (!ok) {
      const parts = edTextNodes(b).filter(n => n._src !== undefined && n._src !== n.data);
      ok = parts.length > 0 && parts.every(n => { try { return !!o.apply(n._src, n.data, n); } catch { return false; } });
    }
    if (ok) { b._src = nw; for (const n of edTextNodes(b)) n._src = n.data; b.classList.remove("ed-bad"); }
    else { b.classList.add("ed-bad"); bad++; }
  }
  frame.dataset.dirty = "1";
  const note = o.noteId && $(o.noteId);
  if (note) { note.classList.toggle("warn", bad > 0); note.textContent = bad ? "The dotted text can't be saved from here, because it is built from other details. Change it where it comes from. It goes back to what it was when you click away." : (o.note || ""); }
  clearTimeout(frame._edT);
  frame._edT = setTimeout(() => { if (frame._fit) frame._fit(); if (o.after) o.after(); }, 350);
}
function edCommit(frame) {
  const o = frame._ed;
  if (!o || frame.dataset.dirty !== "1") return;
  clearTimeout(frame._edT);
  frame.dataset.dirty = "";
  if (o.after) o.after();
  o.commit();
}
function paperEditable(frame, o) {
  const sheet = frame && frame.querySelector(".paper-sheet");
  if (!sheet) return;
  frame._ed = o;
  frame.dataset.dirty = "";
  const on = !o.enabled || o.enabled();
  frame.classList.toggle("paper-edit", on);
  if (o.noteId && $(o.noteId)) { $(o.noteId).classList.remove("warn"); $(o.noteId).textContent = on ? (o.note || "") : (o.offNote || ""); }
  if (!on) { sheet.removeAttribute("contenteditable"); return; }
  sheet.contentEditable = "true"; sheet.spellcheck = true;
  sheet.setAttribute("role", "textbox"); sheet.setAttribute("aria-multiline", "true"); sheet.setAttribute("aria-label", o.label || "Preview. Select any text to change it.");
  sheet.querySelectorAll(ED_GONE + (o.locked ? "," + o.locked : "")).forEach(x => { x.contentEditable = "false"; });
  edSnapshot(sheet);
  sheet.querySelectorAll("[contenteditable='false'] .ed-blk, .ed-blk[contenteditable='false']").forEach(x => x.classList.remove("ed-blk"));
  if (frame._edWired) return;
  frame._edWired = true;
  // one paragraph at a time: no new lines, no formatting, no dragging text about; a paste is plain words
  frame.addEventListener("beforeinput", e => { const t = e.inputType || ""; if (t === "insertParagraph" || t === "insertLineBreak" || t.startsWith("format") || t === "insertFromDrop" || t === "deleteByDrag") e.preventDefault(); });
  frame.addEventListener("paste", e => {
    if (!frame._ed || !frame.classList.contains("paper-edit")) return;
    e.preventDefault();
    document.execCommand("insertText", false, ((e.clipboardData && e.clipboardData.getData("text/plain")) || "").replace(/\s+/g, " "));
  });
  frame.addEventListener("drop", e => { if (frame.classList.contains("paper-edit")) e.preventDefault(); });
  frame.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && /^[biu]$/i.test(e.key) && frame.classList.contains("paper-edit")) e.preventDefault(); });
  frame.addEventListener("input", () => edInput(frame));
  frame.addEventListener("focusout", e => { if (e.relatedTarget && frame.contains(e.relatedTarget)) return; setTimeout(() => { if (!frame.contains(document.activeElement)) edCommit(frame); }, 0); });
}

/* --- Wrapping words that are somewhere on the page (Tailor to resume marks what your answers changed) --- */
// Wrap `seg` inside `blk` in <ins class="chg" data-rv="k">. Returns false when the words aren't there.
function edWrapIn(blk, seg, k) {
  const map = []; let flat = "";
  for (const n of edTextNodes(blk)) for (let i = 0; i < n.data.length; i++) { const c = n.data[i]; if (/\s/.test(c)) continue; flat += c.toLowerCase().charAt(0); map.push([n, i]); }
  const needle = edFlat(seg), at = needle ? flat.indexOf(needle) : -1;
  if (at < 0) return false;
  const pieces = new Map();
  for (let j = at; j < at + needle.length; j++) { const [n, i] = map[j], p = pieces.get(n); if (!p) pieces.set(n, [i, i + 1]); else p[1] = i + 1; }
  for (const [n, [a, b]] of pieces) {
    const r = document.createRange(); r.setStart(n, a); r.setEnd(n, b);
    const ins = document.createElement("ins"); ins.className = "chg"; ins.dataset.rv = k;
    r.surroundContents(ins);
  }
  return true;
}
