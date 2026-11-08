/* ===================== Resume structure ===================== */
const RANGE_TEST = new RegExp(RANGE_RE.source, "i");
const RANGE_ALL = new RegExp(RANGE_RE.source, "gi");
// "Overall Tenure: Mar 2019 – Present" sits under a company name when several roles at one employer are stacked (see 22). It is not a job itself.
const TENURE_RE = /^\s*overall tenure\b/i;
const BULLET_RE = /^\s*([-•*▪◦‣–·])\s+/;
const KNOWN_HEAD = /^[a-z &\-/]{0,40}\b(profile|summary|objective|about me|education|qualifications|experience|employment|work history|career history|skills|competencies|certifications?|licen[cs]es|volunteering|volunteer|community|projects|achievements|awards|interests|referees|references|languages|leadership|extracurricular|activities|training|publications|availability)\b[a-z &\-/]{0,30}$/i;

function isHeadingLine(line, idx) {
  const t = line.trim().replace(/:$/, "");
  if (!t || idx === 0 || t.length > 60) return false;
  if (BULLET_RE.test(line) || /[|@,]/.test(t) || /[.!?]$/.test(t) || RANGE_TEST.test(t)) return false;
  // "WORK EXPERIENCE: ENGINEERING & ANALYTICAL" is a heading; "Skills used: AutoCAD" is not
  if (t.includes(":")) return t === t.toUpperCase() && /[A-Z]{3}/.test(t) && KNOWN_HEAD.test(t.replace(/:/g, " "));
  return t.length <= 48 && KNOWN_HEAD.test(t);
}
function sectionType(title) {
  if (/skill|competenc|certif|tools|licen/i.test(title)) return "skills";
  if (/educat|qualif/i.test(title)) return "education";
  if (/experience|employment|history|volunteer|community|project|leadership|extracurricular|activities/i.test(title)) return "experience";
  if (/profile|summary|objective|about/i.test(title)) return "summary";
  if (/referee|reference/i.test(title)) return "referees";
  return "other";
}
const cleanHeader = l => l.replace(RANGE_ALL, " ").replace(/\((expected|current|ongoing)\)/ig, " ")
  .replace(BULLET_RE, "").replace(/\t+/g, " ").replace(/\s*\|\s*(\|\s*)*/g, " | ")
  .replace(/^[\s|–\-·,]+|[\s|–\-·,]+$/g, "").replace(/\s{2,}/g, " ").trim();
const zoneKey = label => norm(label).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 1).join(" ");
function similarity(a, b) {
  const A = new Set(a.split(" ").filter(Boolean)), B = new Set(b.split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

function parseResume(text) {
  const lines = text.split("\n");
  const sections = [];
  let cur = { title: "", type: "top", start: 0, headIdx: -1 };
  sections.push(cur);
  lines.forEach((l, i) => {
    if (isHeadingLine(l, i)) {
      cur.end = i - 1;
      cur = { title: l.trim().replace(/:$/, ""), type: sectionType(l), start: i + 1, headIdx: i };
      sections.push(cur);
    }
  });
  cur.end = lines.length - 1;
  const lastContent = (from, to) => { let k = to; while (k >= from && !lines[k].trim()) k--; return k; };
  const zones = [];
  for (const s of sections) {
    if (s.type !== "experience" && s.type !== "education") continue;
    const heads = [];
    for (let i = s.start; i <= s.end; i++) if (!BULLET_RE.test(lines[i]) && RANGE_TEST.test(lines[i])) heads.push(i);
    if (heads.length) {
      heads.forEach((h, k) => {
        if (TENURE_RE.test(lines[h])) return;   // the company's own line: its roles below are the jobs
        const end = k + 1 < heads.length ? heads[k + 1] - 1 : s.end;
        let start = h, label = cleanHeader(lines[h]);
        if (!label) {                                    // date on its own line: the title is the line above
          let p = h - 1; while (p >= s.start && !lines[p].trim()) p--;
          if (p >= s.start && !BULLET_RE.test(lines[p])) { label = cleanHeader(lines[p]); start = p; }
        }
        let last = lastContent(h, end);
        let j = h + 1; while (j <= last && !lines[j].trim()) j++;
        const sub = j <= last ? lines[j].trim() : "";
        let subIdx = -1;
        if (sub && !BULLET_RE.test(lines[j]) && !RANGE_TEST.test(sub) && !/[.:]$/.test(sub) && !/^[A-Za-z ]{2,30}:\s/.test(sub) && words(sub).length <= 9) { label += (label ? " · " : "") + sub; subIdx = j; }
        // a role's last line should not swallow the next role's title line when dates sit on their own line
        if (k + 1 < heads.length && (!cleanHeader(lines[heads[k + 1]]) || TENURE_RE.test(lines[heads[k + 1]]))) { let p = heads[k + 1] - 1; while (p > h && !lines[p].trim()) p--; last = lastContent(h, p - 1); }
        zones.push({ id: "z" + zones.length, kind: s.type === "education" ? "education" : "role", section: s.title, label: label || "Untitled", start, last, headIdx: h, subIdx });
      });
    } else {
      const last = lastContent(s.start, s.end);
      if (last >= s.start) zones.push({ id: "z" + zones.length, kind: "section", section: s.title, label: s.title.toLowerCase().replace(/(^|\s|&)\S/g, c => c.toUpperCase()), start: s.headIdx, last });
    }
  }
  for (const z of zones) {
    z.key = zoneKey(z.label);
    const body = lines.slice(z.start + 1, z.last + 1);
    const b = body.find(l => BULLET_RE.test(l));
    z.marker = b ? b.match(BULLET_RE)[1] + " " : "";
    z.blankStyle = body.some((l, i) => !l.trim() && i > 0 && i < body.length - 1);
    z.bullets = [];
    for (let i = z.start + 1; i <= z.last; i++) {
      if (i === z.subIdx || i === z.headIdx || !lines[i].trim()) continue;
      const m = lines[i].match(BULLET_RE);
      z.bullets.push({ idx: i, text: lines[i].replace(BULLET_RE, "").trim(), marker: m ? m[1] + " " : "" });
    }
    z.context = z.bullets.map(x => x.text).slice(0, 8);
  }
  return { lines, sections, zones, skillsSec: sections.find(s => s.type === "skills") || null, summarySec: sections.find(s => s.type === "summary") || null };
}

