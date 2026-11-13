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
      // Dates first: the section opens on a date line of its own (nothing above it), so every entry is date, title, employer, bullet points.
      // (Otherwise a date on its own line has its title on the line above it.)
      const firstHead = heads.find(h => !TENURE_RE.test(lines[h]));
      const dateFirst = firstHead != null && !cleanHeader(lines[firstHead]) && !lines.slice(s.start, firstHead).some(l => l.trim());
      const subOk = (t, ln) => !!t && !BULLET_RE.test(lines[ln]) && !RANGE_TEST.test(t) && !/[.:]$/.test(t) && !/^[A-Za-z ]{2,30}:\s/.test(t) && words(t).length <= 9;
      // A date on a line of its own has its title above it: one line ("Title / date"), or two ("Title / Employer / date") when the line above that
      // is also a short line that isn't a bullet point. Returns the lines (top first) and the line the entry starts on.
      const aboveDate = hh => {
        let p = hh - 1; while (p >= s.start && !lines[p].trim()) p--;
        if (p < s.start || BULLET_RE.test(lines[p])) return { idx: [], top: hh };
        const q = p - 1;
        if (q >= s.start && subOk(lines[q].trim(), q) && !isHeadingLine(lines[q], q)) return { idx: [q, p], top: q };
        return { idx: [p], top: p };
      };
      heads.forEach((h, k) => {
        if (TENURE_RE.test(lines[h])) return;   // the company's own line: its roles below are the jobs
        const end = k + 1 < heads.length ? heads[k + 1] - 1 : s.end;
        let start = h, label = cleanHeader(lines[h]), titleAbove = 0;
        if (!label && !dateFirst) {                      // date on its own line: the title is above it
          const up = aboveDate(h);
          if (up.idx.length) { label = up.idx.map(i => cleanHeader(lines[i])).filter(Boolean).join(" · "); start = up.top; titleAbove = up.idx.length; }
        }
        let last = lastContent(h, end);
        let j = h + 1; while (j <= last && !lines[j].trim()) j++;
        const sub = j <= last ? lines[j].trim() : "";
        let subIdx = -1;
        const subIdxs = [];
        // (title and employer both above the date: whatever follows the date is not another header line)
        if (titleAbove < 2 && subOk(sub, j)) { label += (label ? " · " : "") + sub; subIdx = j; subIdxs.push(j); }
        // The date on a line of its own with the title and then the employer (or school) below it, as in a two-column layout:
        //   Nov 2022 – May 2023 / Data Analyst - Vacation Student Program / Worley, Perth, WA
        // The second line is the employer, not a bullet point. A line that starts like a sentence ("Led a team…") is left as a bullet point.
        if (subIdxs.length && !cleanHeader(lines[h]) && start === h) {
          let n = j + 1; while (n <= last && !lines[n].trim()) n++;
          const t2 = n <= last ? lines[n].trim() : "";
          const sentence = /^[a-z]/.test(t2) || (typeof ACTION_START !== "undefined" && ACTION_START.test(t2.toLowerCase())) || /\b(?:and|with|for|to|the)\s*$/i.test(t2);
          if (subOk(t2, n) && !sentence) { label += " · " + t2; subIdxs.push(n); }
        }
        // a role's last line should not swallow the next role's title line when dates sit on their own line
        if (k + 1 < heads.length && !cleanHeader(lines[heads[k + 1]]) && !dateFirst && !TENURE_RE.test(lines[heads[k + 1]])) last = lastContent(h, aboveDate(heads[k + 1]).top - 1);
        else if (k + 1 < heads.length && TENURE_RE.test(lines[heads[k + 1]])) { let p = heads[k + 1] - 1; while (p > h && !lines[p].trim()) p--; last = lastContent(h, p - 1); }
        zones.push({ id: "z" + zones.length, kind: s.type === "education" ? "education" : "role", section: s.title, label: label || "Untitled", start, last, headIdx: h, subIdx, subIdxs });
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
      if (i === z.subIdx || (z.subIdxs && z.subIdxs.includes(i)) || i === z.headIdx || (z.headIdx !== undefined && i < z.headIdx) || !lines[i].trim()) continue;
      const m = lines[i].match(BULLET_RE);
      z.bullets.push({ idx: i, text: lines[i].replace(BULLET_RE, "").trim(), marker: m ? m[1] + " " : "" });
    }
    z.context = z.bullets.map(x => x.text).slice(0, 8);
  }
  return { lines, sections, zones, skillsSec: sections.find(s => s.type === "skills") || null, summarySec: sections.find(s => s.type === "summary") || null };
}

