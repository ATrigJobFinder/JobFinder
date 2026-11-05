/* ===================== The tailored resume, laid out in a template ===================== */
// Tailor to resume shows the resume text in the person's own resume design (the one chosen in Create or edit resume), not as plain text.
// resumeTextModel() reads the resume's own headings and lines into the sections a design lays out; the order stays the resume's.
const RS_STATE = /\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\b/;
const RS_SIDE = new Set(["contact", "skills", "certs", "interests", "availability", "referees"]);
const rsTitleCase = t => t === t.toUpperCase() ? t.toLowerCase().replace(/(^|[\s&/-])\S/g, c => c.toUpperCase()) : t;
function rsKeyFor(sec) {
  const t = sec.title;
  return /project/i.test(t) ? "projects" : /volunteer|community/i.test(t) ? "volunteering" : /certif|licen[cs]/i.test(t) ? "certs"
    : /award|achiev|scholar/i.test(t) ? "awards" : /interest/i.test(t) ? "interests" : /referee|reference/i.test(t) ? "referees"
    : sec.type === "other" ? "other" : sec.type;
}
function resumeTextModel(text, tpl) {
  const parsed = parseResume(String(text || "")), lines = parsed.lines;
  const T = TITLE_SETS[tpl.titles] || TITLE_SETS.standard;
  // the top of the resume: the name, then the headline and contact details
  const top = parsed.sections[0], topLines = lines.slice(0, top.end + 1).map(l => l.trim()).filter(Boolean);
  const name = topLines[0] || "Your Name";
  const pieces = topLines.slice(1).flatMap(l => l.split(/\s*[|•·\t]\s*|\s{3,}/)).map(s => s.trim()).filter(Boolean);
  const isHeadline = p => !/[\d@]|https?:|www\.|linkedin|\.com/i.test(p) && !RS_STATE.test(p) && words(p).length <= 7;
  const hi = pieces.findIndex(isHeadline);
  const headline = hi === 0 ? pieces[0] : "";
  const contact = pieces.filter((p, i) => !(hi === 0 && i === 0));
  const used = new Set(), secs = [];
  for (const s of parsed.sections.slice(1)) {
    let key = rsKeyFor(s); const base = key;
    for (let n = 2; used.has(key); n++) key = base + n;
    used.add(key);
    const body = lines.slice(s.start, s.end + 1).filter(l => l.trim()), plain = l => l.replace(BULLET_RE, "").trim();
    const title = rsTitleCase(s.title) || T[base] || "";
    if (!body.length) continue;
    if (s.type === "summary") { secs.push({ key, title, kind: "text", text: body.map(plain).join(" ") }); continue; }
    if (s.type === "skills") {
      const groups = [], loose = [];
      for (const l of body) {
        const m = plain(l).match(/^([^:]{2,32}):\s*(.+)$/);
        if (m) groups.push({ label: m[1].trim(), items: m[2].split(/\s*[,;|•·]\s*/).filter(Boolean) });
        else loose.push(...plain(l).split(/\s*[,;|•·]\s*/).filter(Boolean));
      }
      if (loose.length) groups.push({ label: "Skills", items: loose });
      secs.push({ key, title, kind: "groups", groups }); continue;
    }
    if (s.type === "experience" || s.type === "education") {
      const zs = parsed.zones.filter(z => z.section === s.title && z.kind !== "section");
      if (zs.length) {
        const items = zs.map(z => {
          const parts = z.label.split(/\s+·\s+|\s+\|\s+/), head = lines[z.headIdx] || "";
          return { title: parts[0] || "", org: parts.slice(1).join(", "), loc: "", dates: (head.match(RANGE_TEST) || [""])[0].trim(), bullets: z.bullets.map(b => b.text) };
        });
        secs.push({ key, title, kind: "entries", items }); continue;
      }
    }
    const items = body.map(plain);
    secs.push(items.length === 1 && !BULLET_RE.test(body[0]) && words(items[0]).length > 6 ? { key, title, kind: "text", text: items[0] } : { key, title, kind: "list", items });
  }
  const model = { name, headline, contact, details: [], main: [], side: [], sectionKeys: secs.map(s => s.key) };
  if (tpl.layout === "sidebar") {
    model.side.push({ key: "contact", title: T.contact || "Contact", kind: "contact", items: contact });
    model.side.push(...secs.filter(s => RS_SIDE.has(s.key)));
    model.main = secs.filter(s => !RS_SIDE.has(s.key));
  } else model.main = secs;
  return model;
}
// The resume's design as the person set it in Create or edit resume
function resumeDesignNow() {
  const base = builderTpl();
  return { base, tpl: tplWithPrefs(base), accent: builderAccent(base) };
}
// Mark the ad's key skills inside a laid-out resume (each text piece on its own, so the design isn't disturbed)
function highlightPaper(root, names) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) {
    if (!n.data.trim() || n.parentNode.closest("mark")) continue;
    const html = skillHighlightHtml(n.data, names);
    if (!html.includes("<mark")) continue;
    const span = document.createElement("span");
    span.innerHTML = html;
    n.replaceWith(span);
  }
}
// A ring that is as full as the number inside it
function matchRing(v, size = 96) {
  const r = 40, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, v)) / 100);
  return `<svg class="match-ring" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Match ${v} out of 100">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--line)" stroke-width="9"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${bandColor(v)}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 50 50)"/>
    <text class="ring-num" x="50" y="53" text-anchor="middle">${v}</text><text class="ring-unit" x="50" y="68" text-anchor="middle">match</text></svg>`;
}
