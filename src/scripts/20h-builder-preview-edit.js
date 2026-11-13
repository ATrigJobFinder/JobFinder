/* ===================== Create or edit resume: the preview can be typed in ===================== */
// Words typed on the preview go back to the answer they came from. The answer is found by its words, and only when exactly one answer says
// them. Anything the page builds from several answers (dates, section titles, the grades line) is left as it is: it goes back to what it
// was when you click away, with a note saying so. (The page itself is laid out by 18d-editable-previews.js.)
const BP_SKIP = new Set(["cv", "prefs", "answers", "summaryQ", "extras", "extrasDone", "id", "mode"]);
const BP_GROUPS = { "Technical": "hard", "Software & tools": "software", "Languages": "languages", "Strengths": "soft" };
const bpSame = (a, b) => String(a).replace(/\s+/g, " ").trim() === String(b).replace(/\s+/g, " ").trim();
// Every piece of text in the profile: { path, text } (a text of several lines gives each line: { path, text, line })
function bpFields(p) {
  const out = [];
  const walk = (o, path) => {
    if (typeof o === "string") {
      if (o.includes("\n")) o.split("\n").forEach((ln, line) => { if (ln.trim()) out.push({ path, text: ln.replace(BULLET_RE, ""), line }); });
      else if (o.trim()) out.push({ path, text: o });
    } else if (Array.isArray(o)) o.forEach((x, i) => walk(x, path.concat(i)));
    else if (o && typeof o === "object") for (const k of Object.keys(o)) if (!BP_SKIP.has(k)) walk(o[k], path.concat(k));
  };
  walk(p, []);
  return out;
}
function bpApply(old, nw, el) {
  if (!(el instanceof Element) && !(el instanceof Text)) return false;
  const p = P(), text = String(nw).replace(/\s+/g, " ").trim();
  // a line of skills: "Technical: a, b, c" (the label stays; the items go back into that group)
  if (el instanceof Element && el.classList.contains("cv-g")) {
    const m = old.match(/^\s*([^:]+):\s*([\s\S]*)$/), key = m && BP_GROUPS[m[1].trim()];
    if (!key || !Array.isArray(p.skills[key])) return false;
    const oldItems = m[2].split(/\s*,\s*/).map(x => x.trim()).filter(Boolean), arr = p.skills[key];
    const first = arr.findIndex(x => oldItems.includes(val(x)));
    if (first < 0) return false;
    const mm = text.match(/^\s*[^:]+:\s*([\s\S]*)$/), items = (mm ? mm[1] : text).split(/\s*,\s*/).map(x => x.trim()).filter(Boolean);
    const rest = arr.filter(x => !oldItems.includes(val(x)));
    rest.splice(Math.min(first, rest.length), 0, ...items);
    p.skills[key] = rest;
    return true;
  }
  const hits = bpFields(p).filter(f => bpSame(f.text, old));
  if (hits.length !== 1) return false;
  const h = hits[0], holder = h.path.slice(0, -1).reduce((a, k) => a[k], p), last = h.path[h.path.length - 1];
  if (h.line == null) holder[last] = text;
  else {
    const lines = holder[last].split("\n"), marker = (lines[h.line].match(BULLET_RE) || [""])[0];
    if (text) lines[h.line] = marker + text; else lines.splice(h.line, 1);
    holder[last] = lines.join("\n");
  }
  return true;
}
// After typing on the preview, the boxes on the left show what the preview now says (not the one you're in)
function bpSyncFields() {
  for (const t of document.querySelectorAll("#bForm [data-path]")) {
    if (t === document.activeElement || (t.type && /^(checkbox|radio)$/.test(t.type))) continue;
    let v = getPath(P(), t.dataset.path);
    if (Array.isArray(v)) v = v.join("\n");
    if (typeof v === "string" && t.value !== v) { t.value = v; if (t.tagName === "TEXTAREA") autoGrow(t); }
  }
}
const bpEditor = {
  example: false,
  note: "Select any text in the preview to change it. The boxes on the left follow.",
  offNote: "This is an example. Your own words appear here as you finish each part, and then you can type on them.",
  noteId: "bEditNote", locked: ".cv-h, .cv-ed, .cv-ghost", label: "Your resume. Select any text to change it.",
  enabled() { return !this.example; },
  apply: bpApply,
  after() { touchProfile("builder"); updateChecks(); renderPreview(true); renderSteps(); },
  commit() { bpSyncFields(); renderPreview(); }
};
