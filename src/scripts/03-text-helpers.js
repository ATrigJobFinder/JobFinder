/* ===================== Text helpers ===================== */
// Lower-case and fold US spellings into Australian ones without changing string length,
// so match positions still line up with the original text for highlighting.
const US_STEMS = /(organ|anal|optim|visual|util|priorit|standard|minim|maxim|decarbon|custom|summar|recogn|special|final|character|digit|electrol|real|author|emphas|categor|mobil|stabil|normal|initial|central|local|commercial|industrial|capital|monet|harmon|memor|critic|apolog)(i|y)z/g;
function norm(t) {
  return String(t).toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(US_STEMS, "$1$2s")
    .replace(/\bcenter/g, "centre")
    .replace(/defense/g, "defence");
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// (a cover letter placeholder, [CAPS: guidance], counts as one word: its guidance text is not part of the letter)
const words = t => (String(t).replace(/\[[A-Z][A-Z0-9 &\/'-]{1,34}:[^\[\]\n]{3,80}\]/g, " gap ").match(/[A-Za-z0-9][A-Za-z0-9'+#.\-]*/g) || []);
const wordCount = t => words(t).length;

function aliasPattern(a) {
  let p = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "[\\s\\-/]+");
  p = p.replace(/modell(ing|ed)/g, "modell?$1").replace(/colour/g, "colou?r").replace(/behaviour/g, "behaviou?r");
  if (/[a-z]$/.test(a) && a.length > 3 && !/s$/.test(a)) p += "(?:e?s)?";
  return p;
}
function parseSkills(block, kind) {
  return block.trim().split("\n").map(line => {
    // "~" marks a generic term (Sales, Mining, Scheduling…) that only counts when the ad asks for it, not when it describes the company
    const weak = line.startsWith("~");
    const parts = line.replace(/^~/, "").split("|").map(s => s.trim()).filter(Boolean);
    const aliases = [...new Set(parts.map(norm))].sort((x, y) => y.length - x.length);
    return {
      name: parts[0], kind, weak,
      re: new RegExp("(?<![a-z0-9+#])(?:" + aliases.map(aliasPattern).join("|") + ")(?![a-z0-9+#])", "g")
    };
  });
}
const SKILLS = [...parseSkills(HARD_SKILLS, "hard"), ...parseSkills(SOFT_SKILLS, "soft")];

function findSkills(normText) {
  const out = new Map();
  for (const s of SKILLS) {
    s.re.lastIndex = 0;
    const ranges = [];
    let m;
    while ((m = s.re.exec(normText))) { ranges.push([m.index, m.index + m[0].length]); if (m[0].length === 0) s.re.lastIndex++; }
    if (ranges.length) out.set(s.name, { skill: s, count: ranges.length, ranges });
  }
  return out;
}

const stem = w => (w.length > 5 ? w.replace(/(ing|s)$/, "") : w);
function stemTokens(t) { return (norm(t).match(/[a-z0-9+#&]+/g) || []).map(stem); }
function containsSeq(hay, needle) {
  if (!needle.length) return false;
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

// Resume bullet points have no "I", "we" or "my": "I served customers" → "served customers", "my manager" → "the manager".
// (It does not change the case of the first letter or the tense: the caller does that.)
function dropFirstPerson(s) {
  let t = String(s || "").trim();
  t = t.replace(/^(?:(?:and|also|then)\s+)?(?:I|we)(?:['’](?:ve|m|d))?\s+(?:(?:have|am|had|also|then)\s+)*/i, "");
  t = t.replace(/\b(and|then|while|where|which|that|but|so)\s+(?:I|we)(?:['’]ve)?\s+(?:(?:have|had|also)\s+)?/gi, "$1 ");
  t = t.replace(/,\s*(?:I|we)(?:['’]ve)?\s+(?:(?:am|have|had|also)\s+)*(?=[a-z])/g, ", ");
  t = t.replace(/\bmy\b/g, "the").replace(/\bMy\b/g, "The");
  return t;
}
