/* ===================== Analysis ===================== */
const MON = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const MY = `(?:${MON}\\s+(?:19|20)\\d{2}|\\d{1,2}\\s*/\\s*(?:19|20)\\d{2})`;
const YR = "(?:19|20)\\d{2}";
const RANGE_RE = new RegExp(`(${MY}|${YR})\\s*(?:-|\\u2013|\\u2014|to|until)\\s*(${MY}|${YR}|present|current|now|today|date)`, "gi");

const CLICHES = ["hard-working", "hard working", "hardworking", "team player", "go-getter", "think outside the box", "results-driven", "results driven", "synergy", "proven track record", "strong work ethic", "go-to person", "motivated individual", "rockstar", "ninja", "guru", "where i can grow", "challenging role", "responsible for", "duties included"];

const DEGREE_LEVELS = [
  [5, /\b(phd|ph\.d|doctorate|doctoral)\b/],
  [4, /\b(master'?s?|masters|postgraduate|mba|meng|m\.eng|graduate diploma)\b/],
  [3, /\b(bachelor'?s?|degree|undergraduate|b\.?eng|beng|bsc|b\.sc|tertiary qualification)\b/],
  [2, /\b(advanced diploma|diploma)\b/],
  [1, /\b(certificate (iii|iv|3|4)|cert (iii|iv|3|4)|trade qualification|apprenticeship)\b/]
];
const LEVEL_NAME = { 1: "a certificate", 2: "a diploma", 3: "a bachelor's degree", 4: "a master's degree", 5: "a PhD" };

function detectTitle(jd, typed) {
  if (typed && typed.trim()) return typed.trim();
  const first = jd.split("\n").map(s => s.trim()).find(Boolean) || "";
  const clean = first.replace(/^(job title|position|role)\s*[:\-–]\s*/i, "").replace(/\s+[–\-|]\s+.*$/, "").trim();
  if (clean && words(clean).length <= 8 && !/[.!?]$/.test(clean)) return clean;
  return "";
}
const SENIORITY = new Set(["graduate", "grad", "junior", "senior", "snr", "jnr", "lead", "principal", "intern", "internship", "trainee", "entry", "level", "i", "ii", "iii", "iv", "vacation", "student", "cadet", "cadetship", "associate", "assistant", "apprentice", "casual", "part", "time", "full", "contract", "temporary", "-", "–"]);

function statusScore(items) {
  const scored = items.filter(i => i.scored !== false && i.status !== "info");
  if (!scored.length) return null;
  const v = { pass: 1, warn: 0.5, fail: 0 };
  return Math.round(100 * scored.reduce((a, i) => a + v[i.status], 0) / scored.length);
}

/* Reading the job ad by section: what it requires matters, the company blurb and benefits don't. */
const JD_HEAD = {
  // Things the job will teach you ("You'll gain exposure to:", "What you'll learn") aren't requirements
  learn: /\b(you('ll| will) (gain|get|learn|develop|build|be exposed|receive|grow|have (the )?(opportunit\w*|chance))|what you('ll| will) (learn|gain|develop)|gain(ing)? (exposure|experience)|exposure( to| you('ll| will) (gain|get))?$|learning( (and|&) development)?|development opportunit\w*|training (provided|and development|program\w*)|we('ll| will) (teach|train|support you)|rotations?|growth opportunit\w*|on[- ]the[- ]job)\b/i,
  boiler: /\b(about us|about (the )?(company|organi[sz]ation|business|group|firm|employer)|who we are|our (story|company|culture|values|purpose|mission|commitment|people|team)|company overview|benefits|perks|what we offer|what('s| is) in it for (you|me)|why (join|work|choose)|how to apply|to apply|apply (now|today)|diversity|equal (employment )?opportunit|eeo|inclusion|life at|working (here|with us|at)|salary|remuneration|package|acknowledg|privacy|recruitment process|next steps|culture)\b/i,
  nice: /\b(desirable|nice[- ]to[- ]have|bonus( points)?|preferred|advantageous|highly (regarded|desirable)|would be (great|an advantage|a plus))\b/i,
  duty: /\b(what you('ll| will) (do|be doing)|responsibilities|duties|the role|role overview|about the (role|position|opportunity|job)|key (responsibilities|accountabilities)|day[- ]to[- ]day|your role|in this role|what('s| is) involved|the opportunity|position (summary|overview)|the job)\b/i,
  req: /\b(about you|requirements?|what you('ll| will)? (need|bring|have)|who you are|you (will )?have|skills( and| &)? (experience|qualifications)|qualifications|experience|essential|key (skills|criteria|requirements)|selection criteria|to be successful|ideal candidate|the (ideal )?(person|candidate)|what we('re| are) looking for|we('re| are) looking for|must[- ]haves?|mandatory|your (skills|experience|background|profile)|skills)\b/i
};
const LINE_BOILER = /(equal opportunit|aboriginal and torres strait|first nations|diverse|diversity|inclusive|encourage[sd]? (all )?(people|applications|applicants)|reasonable adjustment|flexible working|hybrid working|work from home|parental leave|wellbeing|well-being|employee assistance|salary packaging|novated|discounts?\b|bonus scheme|we offer|we provide|you('ll| will) (get|enjoy|receive)|perks|career progression|professional development opportunit|apply now|click apply|to apply|privacy)/i;
const LINE_LEARN = /(you('ll| will) (gain|get (exposure|experience|hands[- ]on)|learn|develop|build( up)?|pick up|be exposed|be trained|be taught|be mentored|receive (training|mentoring)|grow)|gain(ing)? (exposure|experience|insight|hands[- ]on experience|knowledge)|opportunit(y|ies) to (learn|develop|gain|grow|work (on|with|across)|be involved|rotate|build)|we('ll| will) (teach|train|upskill|support you to)|training (will be )?(provided|given)|(full|on[- ]the[- ]job) training|learn (about|how|from)|chance to (learn|work|gain)|rotat(e|ion|ions) (through|across|between)|develop (your|new) skills)/i;
const LINE_NOTREQ = /(no (prior |previous )?(experience|knowledge|background)\b[^.]{0,50}\b(required|necessary|needed|expected)|\b(not|isn't|is not) (required|necessary|essential|expected|a (requirement|must))|don't need|do not need|no need to)/i;
const LINE_NICE = /(desirable|preferred|advantageous|a bonus|bonus if|bonus points|nice to have|highly regarded|would be (an advantage|well regarded|great|beneficial)|is a plus|ideally)/i;
const LINE_REQ = /\b(must|essential|required|mandatory|minimum|you('ll| will) need|you (have|bring))\b/i;
const LINE_CUE = /(experience (with|in|using|of)|proficien|knowledge of|skills? (in|with)|familiar|working knowledge|hands-on|expertise|competen|ability to (use|apply)|qualified|certified|certification|degree in|understanding of|background in|track record|exposure to)/i;
const ORG_AFTER = /^[\s\-]*(team|teams|department|division|industry|industries|sector|company|companies|business|organi[sz]ation|group|manager|director|officer|leader|function|unit|office)\b/i;
// Lines a job board adds around the ad (pay, work type, when it was posted, ratings, the category): not headings, not the ad
const JOB_CATS = "accounting|administration & office support|advertising, arts & media|banking & financial services|call centre & customer service|ceo & general management|community services & development|construction|consulting & strategy|design & architecture|education & training|engineering|farming, animals & conservation|government & defence|healthcare & medical|hospitality & tourism|human resources & recruitment|information & communication technology|insurance & superannuation|legal|manufacturing, transport & logistics|marketing & communications|mining, resources & energy|real estate & property|retail & consumer products|sales|science & technology|self employment|sport & recreation|trades & services";
const META_LINE = new RegExp(`^(salary( undisclosed| not (specified|disclosed))?|(\\$|aud ?)\\s?\\d[\\d,.]*k?\\b.*|(full|part)[ -]?time|casual( ?\\/ ?vacation)?|contract( ?\\/ ?temp)?|temporary|permanent|fixed[ -]term|posted \\d+\\s*[a-z]* ago|posted (on|today|yesterday).*|listed .* ago|view all jobs|\\d(\\.\\d)?|\\d[\\d,]* (reviews?|ratings?)|apply now|quick apply|easy apply|save|share|report this job( ad)?|be careful|.+ \\((${JOB_CATS})\\))$`, "i");
const LOC_LINE = /^[A-Z][A-Za-z .'-]{1,40},?\s+(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)(\s+\d{4})?$/;
// "...in the following disciplines:" starts a list of options: the candidate needs one of them, not all
const OPTIONS_HEAD = /(following (disciplines?|degrees?|areas?( of study)?|fields?|streams?|majors?|study areas?|qualifications?|programs?)|one of the following|in (any of )?the following|disciplines?|degrees? in|streams?)\s*:$/i;
const KIND_W = { title: 1, req: 1, duty: 0.8, body: 0.8, other: 0.6, nice: 0.5, intro: 0.5, company: 0.3, boiler: 0, learn: 0, notreq: 0, meta: 0, options: 0 };
const KIND_RANK = { title: 5, req: 5, duty: 4, body: 4, nice: 3, other: 2, intro: 1, company: 0, learn: -1, notreq: -1, options: -1, boiler: -2, meta: -2 };
const PRIORITY = { title: "Required", req: "Required", duty: "In the duties", body: "In the ad", nice: "Nice to have", other: "Mentioned", intro: "Mentioned", company: "Mentioned", boiler: "Company info", learn: "You'll learn this on the job", notreq: "The ad says it's not required", meta: "Job details", options: "One of the disciplines they take" };
const NOT_SCORED = new Set(["boiler", "company", "learn", "notreq", "meta", "options"]);

function jdHeadingKind(L, seen) {
  const t = L.text.trim();
  if (!t || seen === 1 || BULLET_RE.test(L.text) || META_LINE.test(t) || LOC_LINE.test(t)) return null;
  const core = t.replace(/[:?]$/, "").trim();
  const nWords = words(core).length;
  // "…looking for students or recent graduates in the following disciplines:"
  if (/:$/.test(t) && OPTIONS_HEAD.test(t) && nWords <= 30) return "options";
  if (t.length > 70 && !/:$/.test(t)) return null;
  if (/[.!]$/.test(core)) return null;
  const hasSkill = findSkills(norm(core)).size > 0;
  const cls = ["learn", "boiler", "nice", "duty", "req"].find(k => JD_HEAD[k].test(core));
  // A long lead-in counts too: "To be successful in this program, you will have the capability to:"
  if ((/:$/.test(t) && (nWords <= 9 || (cls && cls !== "boiler" && nWords <= 20))) || (cls && nWords <= 6 && !hasSkill)) return cls || "other";
  if (nWords <= 6 && !hasSkill && core === core.toUpperCase() && /[A-Z]{3}/.test(core)) return "other";
  return null;
}
const UMBRELLA = {
  CAD: ["AutoCAD", "SolidWorks", "CATIA", "Creo", "Siemens NX", "Autodesk Inventor", "Fusion 360", "Revit", "Civil 3D", "MicroStation"],
  GIS: ["QGIS"],
  "Microsoft Office": ["Microsoft Excel", "Microsoft Word", "PowerPoint"]
};
function readJobAd(jdRaw) {
  const lines = [];
  let pos = 0;
  for (const text of jdRaw.split("\n")) { lines.push({ text, s: pos, e: pos + text.length }); pos += text.length + 1; }
  let seen = 0;
  for (const L of lines) if (L.text.trim()) L.head = jdHeadingKind(L, ++seen);
  // An ad with no section headings is read as one body of requirements and duties
  const hasHeadings = lines.some(L => L.head);
  let section = null;
  seen = 0;
  for (const L of lines) {
    const t = L.text.trim();
    if (!t) { L.kind = section || "intro"; continue; }
    seen++;
    const nWords = words(t).length;
    if (seen === 1) { L.kind = "title"; continue; }
    if (META_LINE.test(t) || LOC_LINE.test(t)) { L.kind = "meta"; continue; }
    if (L.head) { section = L.head; L.kind = L.head; L.heading = true; continue; }
    // a list of disciplines ends at the first full sentence
    if (section === "options") { if (nWords > 8 || /[.!?]$/.test(t)) section = null; else { L.kind = "options"; continue; } }
    let kind = section || (seen <= 3 && nWords <= 10 && !/[.!]$/.test(t) && !BULLET_RE.test(L.text) ? "company"
      : !hasHeadings ? "body" : BULLET_RE.test(L.text) ? "duty" : "intro");
    if (kind !== "boiler" && LINE_NOTREQ.test(t) && !LINE_NICE.test(t)) kind = "notreq";
    else if (kind !== "boiler" && LINE_LEARN.test(t)) kind = "learn";
    else if (kind !== "boiler" && LINE_BOILER.test(t)) kind = "boiler";
    else if (kind !== "boiler" && kind !== "learn" && LINE_NICE.test(t)) kind = "nice";
    else if (["duty", "intro", "other", "body"].includes(kind) && LINE_REQ.test(t)) kind = "req";
    L.kind = kind;
    L.cue = LINE_CUE.test(t);
  }
  return lines;
}

// opts.ignore: skills the person marked "not relevant", left out of the score (they can put them back)
function analyse(resumeRaw, jdRaw, typedTitle, fileInfo, opts = {}) {
  const ignore = opts.ignore || new Set();
  const rN = norm(resumeRaw), jN = norm(jdRaw);
  const rSkills = findSkills(rN), jSkills = findSkills(jN);
  const jdLines = readJobAd(jdRaw);
  const lineAt = i => jdLines.find(L => i >= L.s && i <= L.e) || jdLines[jdLines.length - 1];

  // Skills comparison: weight every mention by where it sits in the ad and how it's phrased
  const scored = [], ignored = [];
  for (const x of jSkills.values()) {
    let rel = 0, best = "boiler", bestLine = "", count = 0, anyKind = "boiler";
    for (const [s, e] of x.ranges) {
      const L = lineAt(s);
      if (KIND_RANK[L.kind] > KIND_RANK[anyKind]) anyKind = L.kind;   // where it appears at all, for the "not scored" label
      let w = KIND_W[L.kind] ?? 0.5;
      if (L.cue && w) w *= 1.25;
      if (ORG_AFTER.test(jN.slice(e, e + 30))) w *= 0.3;
      else if (/\bour $/.test(jN.slice(Math.max(0, s - 4), s))) w *= 0.6;
      if (w > 0) count++;
      rel += w;
      if (w > 0 && (KIND_RANK[L.kind] > KIND_RANK[best] || (KIND_RANK[L.kind] === KIND_RANK[best] && !bestLine))) { best = L.kind; bestLine = L.text.trim(); }
    }
    rel = Math.min(rel, 3);
    const min = best === "nice" ? 0.45 : 0.6;
    const asked = ["title", "req", "duty", "nice"].includes(best);
    // Generic terms only count when the ad asks for them (requirements, duties, nice-to-haves), never from the intro or company blurb
    const keep = x.skill.weak ? (asked && rel >= min) || rel >= 1.2 : rel >= min;
    const r = rSkills.get(x.skill.name);
    const row = { name: x.skill.name, kind: x.skill.kind, jd: count, resume: r ? r.count : 0, found: !!r, rel, priority: PRIORITY[count ? best : anyKind], rank: KIND_RANK[best], adLine: bestLine.replace(BULLET_RE, "") };
    if (keep && ignore.has(row.name)) { ignored.push({ ...row, priority: "You marked it not relevant", user: true }); continue; }
    (keep ? scored : ignored).push(row);
  }
  // Umbrella skills: a CAD package on your resume counts as CAD; "AutoCAD or similar CAD software" doesn't list CAD twice
  for (const [umb, kids] of Object.entries(UMBRELLA)) {
    const i = scored.findIndex(x => x.name === umb);
    if (i < 0) continue;
    const row = scored[i];
    if (!row.found && kids.some(k => rSkills.has(k))) { row.found = true; row.resume = kids.filter(k => rSkills.has(k)).length; }
    const lines = [...jSkills.get(umb).ranges].map(([s]) => lineAt(s));
    const kidRanges = kids.flatMap(k => jSkills.has(k) ? jSkills.get(k).ranges : []);
    if (!row.found && lines.every(L => kidRanges.some(([s]) => s >= L.s && s <= L.e))) { scored.splice(i, 1); ignored.push({ ...row, priority: "Covered by a specific tool in the same line" }); }
  }
  const order = (a, b) => (a.found - b.found) || (b.rank - a.rank) || (b.rel - a.rel) || a.name.localeCompare(b.name);
  const hard = scored.filter(x => x.kind === "hard").sort(order), soft = scored.filter(x => x.kind === "soft").sort(order);
  ignored.sort((a, b) => b.rel - a.rel || a.name.localeCompare(b.name));
  const weighted = list => {
    if (!list.length) return null;
    const tot = list.reduce((a, x) => a + x.rel, 0);
    return Math.round(100 * list.filter(x => x.found).reduce((a, x) => a + x.rel, 0) / tot);
  };

  // Other repeated terms in the job ad, ignoring the company blurb and benefits
  let jNm = jN;
  // with a requirements or duties section, the opening paragraphs are usually about the company: leave them out too
  const skipIntro = jdLines.some(L => L.kind === "req" || L.kind === "duty");
  for (const L of jdLines) if (NOT_SCORED.has(L.kind) || (skipIntro && L.kind === "intro")) jNm = jNm.slice(0, L.s) + " ".repeat(L.e - L.s) + jNm.slice(L.e);
  const covered = [];
  for (const x of jSkills.values()) for (const [s, e] of x.ranges) covered.push([s, e]);
  const isCovered = (s, e) => covered.some(([a, b]) => s < b && e > a);
  const toks = [];
  const tokRe = /[a-z][a-z0-9+#&'\-]*/g;
  let tm;
  while ((tm = tokRe.exec(jNm))) {
    const w = tm[0].replace(/['\-]+$/, "");
    toks.push({ w, s: tm.index, e: tm.index + w.length, stop: STOP.has(w) || w.length < 3 || isCovered(tm.index, tm.index + w.length) });
  }
  const counts = new Map();
  const bump = (k, kind) => { const c = counts.get(k) || { term: k, n: 0, kind }; c.n++; counts.set(k, c); };
  for (let i = 0; i < toks.length; i++) {
    const a = toks[i];
    if (a.stop) continue;
    bump(stem(a.w), "uni");
    const b = toks[i + 1];
    if (b && !b.stop && b.s - a.e <= 2 && /^[\s]+$/.test(jN.slice(a.e, b.s))) bump(a.w + " " + b.w, "bi");
  }
  const titleStems = new Set(stemTokens(detectTitle(jdRaw, typedTitle)));
  // the company's own name isn't a key term
  for (const L of jdLines) if (L.kind === "company") for (const w of stemTokens(L.text)) titleStems.add(w);
  const bigrams = [...counts.values()].filter(c => c.kind === "bi" && c.n >= 2 && !c.term.split(" ").every(w => titleStems.has(stem(w))));
  const inBigram = new Set(bigrams.flatMap(b => b.term.split(" ").map(stem)));
  const unigrams = [...counts.values()].filter(c => c.kind === "uni" && c.n >= 2 && c.term.length >= 4 && !inBigram.has(c.term) && !titleStems.has(c.term));
  const rStems = stemTokens(resumeRaw);
  const rStemSet = new Set(rStems);
  const terms = [...bigrams, ...unigrams].sort((a, b) => b.n - a.n || (b.kind === "bi") - (a.kind === "bi")).slice(0, 12).map(c => {
    const parts = c.term.split(" ").map(stem);
    const found = parts.length > 1 ? containsSeq(rStems, parts) : rStemSet.has(parts[0]);
    // show unigram in a readable form
    let label = c.term;
    if (c.kind === "uni") { const t = toks.find(t => !t.stop && stem(t.w) === c.term); if (t) label = t.w; }
    return { term: label, n: c.n, found };
  });
  const termsScore = terms.length >= 3 ? Math.round(100 * terms.filter(t => t.found).length / terms.length) : null;

  // Job title (a program like "CIMIC Group Graduate Program 2027" isn't a job title to match)
  const title = detectTitle(jdRaw, typedTitle);
  const ROLE_NOUN = /\b(engineer|analyst|assistant|manager|officer|developer|consultant|coordinator|specialist|technician|designer|advisor|adviser|accountant|surveyor|scientist|nurse|teacher|administrator|associate|lead|director|executive|representative|operator|worker|apprentice|intern|clerk|planner|estimator|architect|lawyer|solicitor|paralegal|chef|cook|barista|attendant|driver|electrician|carpenter|plumber|labourer|supervisor|receptionist|tutor|educator|graduate (engineer|analyst|accountant|surveyor|consultant))\b/i;
  const programTitle = title && /\bprogram(me)?s?\b|\bintake\b|\bopportunities\b/i.test(title) && !ROLE_NOUN.test(title);
  let titleRes = null;
  if (title && !programTitle) {
    const tStems = stemTokens(title);
    const core = tStems.filter(w => !SENIORITY.has(w));
    let score = 0, how = "";
    if (containsSeq(rStems, tStems)) { score = 100; how = "exact"; }
    else if (core.length && containsSeq(rStems, core)) { score = 85; how = "core"; }
    else if (core.length && core.filter(w => rStemSet.has(w)).length / core.length >= 0.6) { score = 50; how = "partial"; }
    titleRes = { title, score, how, core: title.split(/\s+/).filter(w => !SENIORITY.has(stem(norm(w)))).join(" ") };
  }

  // Education
  const levelOf = (t, pick) => {
    const found = DEGREE_LEVELS.filter(([, re]) => re.test(t)).map(([l]) => l);
    return found.length ? (pick === "min" ? Math.min(...found) : Math.max(...found)) : 0;
  };
  const jdLevel = levelOf(jN, "min"), resLevel = levelOf(rN, "max");
  const eduScore = jdLevel ? (resLevel >= jdLevel ? 100 : resLevel === jdLevel - 1 ? 50 : 0) : null;

  // ATS checks
  const header = resumeRaw.slice(0, 700);
  const ats = [];
  const email = resumeRaw.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
  ats.push(email ? { status: "pass", title: "Email address", detail: `Found ${email[0]}.` }
    : { status: "fail", title: "Email address", detail: "No email address found. Add one at the top so recruiters can contact you." });
  const phone = (resumeRaw.match(/(?:\+|\()?\d[\d\s().\-]{7,}\d/g) || []).find(p => { const d = p.replace(/\D/g, ""); return d.length >= 9 && d.length <= 13 && !/^(19|20)\d{2}(19|20)\d{2}$/.test(d); });
  ats.push(phone ? { status: "pass", title: "Phone number", detail: `Found ${phone.trim()}.` }
    : { status: "fail", title: "Phone number", detail: "No phone number found. Add a mobile number near your name." });
  const LOC = /\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT|Victoria|New South Wales|Queensland|Western Australia|South Australia|Tasmania|Australia|Melbourne|Sydney|Brisbane|Perth|Adelaide|Hobart|Canberra|Darwin|Gold Coast|Newcastle|Geelong|Wollongong|Townsville|Cairns|Auckland|Wellington|Remote)\b/;
  ats.push(LOC.test(header) ? { status: "pass", title: "Location", detail: "Your city or state is near the top. Many employers filter candidates by location." }
    : { status: "warn", title: "Location", detail: "Add your suburb or city and state near your name. Many employers filter candidates by location." });
  ats.push(/linkedin\.com\/in\//i.test(resumeRaw) ? { status: "pass", title: "LinkedIn profile", detail: "Your LinkedIn URL is included." }
    : { status: "warn", title: "LinkedIn profile", detail: "Add your LinkedIn URL. Recruiters often check it against your resume." });

  const lines = resumeRaw.split(/\n/).map(l => l.trim()).filter(Boolean);
  const short = lines.filter(l => l.length <= 48).map(l => l.replace(/[:\s]+$/, ""));
  const has = re => short.some(l => re.test(l));
  const heads = {
    Experience: has(/^[a-z &,\-/]{0,40}\b(experience|employment|work history|career history)$/i),
    Education: has(/^(education|qualifications|education (and|&) [a-z ]+|academic (background|qualifications))$/i),
    Skills: has(/^[a-z &,\-/]{0,30}\b(skills|competencies|expertise|capabilities)\b[a-z &,\-/]{0,30}$/i)
  };
  const missingHeads = Object.keys(heads).filter(k => !heads[k]);
  ats.push(!missingHeads.length ? { status: "pass", title: "Standard section headings", detail: "Experience, Education and Skills headings were found, so an ATS can sort your content." }
    : { status: missingHeads.length === 1 ? "warn" : "fail", title: "Standard section headings", detail: `Couldn't find a heading for ${missingHeads.join(" or ")}. Use plain headings such as "Experience", "Education" and "Skills" on their own line.` });

  const ranges = [];
  let rm;
  RANGE_RE.lastIndex = 0;
  while ((rm = RANGE_RE.exec(resumeRaw))) {
    const startM = new RegExp("^" + MY + "$", "i").test(rm[1].trim());
    const endM = new RegExp("^" + MY + "$", "i").test(rm[2].trim()) || /^(present|current|now|today|date)$/i.test(rm[2].trim());
    ranges.push({ text: rm[0], full: startM && endM });
  }
  const yearOnly = ranges.filter(r => !r.full);
  if (!ranges.length) ats.push({ status: "warn", title: "Dates with months", detail: "No date ranges found. List dates for each role, for example \"Mar 2023 – Feb 2025\"." });
  else if (!yearOnly.length) ats.push({ status: "pass", title: "Dates with months", detail: `All ${ranges.length} date ranges include months, so your time in each role is clear.` });
  else ats.push({ status: "warn", title: "Dates with months", detail: `${yearOnly.length} of ${ranges.length} date ranges show only the year (${yearOnly.slice(0, 3).map(r => `"${r.text.trim()}"`).join(", ")}). An ATS can't tell if "2023 – 2024" means two months or two years. Add months.` });

  if (fileInfo) {
    const ext = fileInfo.ext;
    if (ext === "pdf" && fileInfo.words < 60) ats.push({ status: "fail", title: "Readable file", detail: "Almost no text could be read from this PDF. If it's a scanned image, an ATS can't read it either. Export it as a text-based PDF from Word." });
    else if (ext === "txt") ats.push({ status: "warn", title: "File type", detail: "Text files work here, but apply with a PDF or Word (.docx) file." });
    else ats.push({ status: "pass", title: "Readable file", detail: `Read ${fileInfo.words} words from your ${ext === "pdf" ? "PDF" : "Word"} file.` });
    if (fileInfo.spaced && fileInfo.spaced.length) ats.push({ status: "warn", title: "Letter-spaced headings", detail: `${fileInfo.spaced.length} heading${fileInfo.spaced.length === 1 ? " was" : "s were"} read as "${fileInfo.spaced[0].slice(0, 30)}" because of extra letter spacing. Some ATS software reads them the same way and won't recognise the section. Remove the character spacing from your headings.` });
    const nameLine = lines[0] || "";
    const nameParts = words(nameLine).filter(w => w.length > 1 && /^[A-Za-z'\-]+$/.test(w)).map(w => w.toLowerCase());
    const fn = fileInfo.name.toLowerCase();
    if (nameParts.length && nameParts.length <= 4 && nameParts.some(p => fn.includes(p))) ats.push({ status: "pass", title: "File name", detail: `"${fileInfo.name}" includes your name.` });
    else ats.push({ status: "warn", title: "File name", detail: `Name the file after yourself, for example "${nameParts.length && nameParts.length <= 4 ? nameParts.map(p => p[0].toUpperCase() + p.slice(1)).join("-") : "Firstname-Lastname"}-Resume.${ext === "txt" ? "pdf" : ext}". It looks more professional when recruiters download it.` });
  }

  // Recruiter tips
  const tips = [];
  const metricLines = lines.filter(l => {
    if (l.length < 20) return false;
    let s = l.replace(RANGE_RE, " ").replace(new RegExp(MY, "gi"), " ").replace(/\b(19|20)\d{2}\b/g, " ")
      .replace(/(?:\+|\()?\d[\d\s().\-]{7,}\d/g, " ").replace(/\S+@\S+/g, " ").replace(/https?:\/\/\S+|linkedin\.com\S*/gi, " ")
      .replace(/\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s*\d{4}\b/g, " ").replace(/\(ASX:?\s*[A-Z0-9]+\)/g, " ");
    return /\d/.test(s);
  });
  const mN = metricLines.length;
  tips.push(mN >= 5 ? { status: "pass", title: "Measurable results", detail: `${mN} lines include numbers. Results like percentages, team sizes and volumes make achievements concrete.` }
    : { status: mN >= 2 ? "warn" : "fail", title: "Measurable results", detail: `Only ${mN} line${mN === 1 ? "" : "s"} include${mN === 1 ? "s" : ""} a number. Aim for at least 5: percentages, dollar values, team sizes, volumes or time saved.` });

  const wc = wordCount(resumeRaw);
  tips.push(wc < 250 ? { status: "warn", title: "Length", detail: `${wc} words is short. Most strong resumes have 400–900 words.` }
    : wc > 1100 ? { status: "warn", title: "Length", detail: `${wc} words is long. Recruiters skim, so cut older or less relevant detail and aim for one to two pages.` }
    : { status: "pass", title: "Length", detail: `${wc} words, a good length for a one- to two-page resume.` });

  if (programTitle) tips.push({ status: "info", title: "Job title", detail: `"${title}" is a program, not one job title. Put your discipline in your headline instead, for example "Graduate Civil Engineer".`, scored: false });
  if (titleRes) {
    tips.push(titleRes.score >= 85 ? { status: "pass", title: "Job title match", detail: `Your resume includes "${titleRes.how === "exact" ? titleRes.title : titleRes.core}". Recruiters often search by job title.`, scored: false }
      : { status: titleRes.score ? "warn" : "fail", title: "Job title match", detail: `The ad's title is "${titleRes.title}". If it fits, use it in your headline or profile, because recruiters often search by job title.`, scored: false });
  }
  if (jdLevel) {
    tips.push(eduScore === 100 ? { status: "pass", title: "Education requirement", detail: `The ad asks for ${LEVEL_NAME[jdLevel]} and your resume shows one.`, scored: false }
      : { status: eduScore ? "warn" : "fail", title: "Education requirement", detail: `The ad asks for ${LEVEL_NAME[jdLevel]}. ${resLevel ? `Your resume shows ${LEVEL_NAME[resLevel]}.` : "No qualification was found in your resume."} Make sure your qualification is listed clearly.`, scored: false });
  }
  const yrs = jdRaw.match(/(\d+)\s*\+?\s*(?:(?:-|–|to)\s*\d+\s*)?\+?\s*years?['’]?\s+(?:of\s+)?(?:[a-z]+\s+){0,3}experience/i);
  if (yrs) tips.push({ status: "info", title: "Experience asked for", detail: `The ad mentions "${yrs[0]}". Make sure your dates and titles show it.` });

  const cl = CLICHES.filter(c => rN.includes(c));
  tips.push(!cl.length ? { status: "pass", title: "Clichés and duty phrasing", detail: "No overused phrases found." }
    : { status: "warn", title: "Clichés and duty phrasing", detail: `Found ${cl.map(c => `"${c}"`).join(", ")}. Replace them with what you actually did and achieved.` });

  const pron = (resumeRaw.match(/(?:^|[^A-Za-z'])(I|me|my|My|myself)(?![A-Za-z'])/g) || []).length;
  tips.push(!pron ? { status: "pass", title: "No first person", detail: "Resumes normally leave out \"I\", \"me\" and \"my\", and yours does." }
    : { status: "warn", title: "No first person", detail: `Found ${pron} use${pron === 1 ? "" : "s"} of "I", "me" or "my". Resumes normally leave these out: "Designed…" rather than "I designed…".` });

  const longLines = lines.filter(l => wordCount(l) > 40).length;
  tips.push(!longLines ? { status: "pass", title: "Short, scannable bullets", detail: "No bullet or paragraph is over 40 words." }
    : { status: "warn", title: "Short, scannable bullets", detail: `${longLines} line${longLines === 1 ? " is" : "s are"} over 40 words. Split or tighten them so they read at a glance.` });

  const US_RE = /\b(?:organi|analy|optimi|visuali|utili|prioriti|standardi|minimi|maximi|summari|recogni|speciali|finali|customi|decarboni)z(?:e|es|ed|ing|ation|ations|er|ers)?\b|\bmodel(?:ed|ing)\b|\b(?:colo|behavio|favo)r(?:s|ed|ing)?\b|\bcenters?\b/gi;
  const AU_RE = /\b(?:organi|analy|optimi|visuali|utili|prioriti|standardi|minimi|maximi|summari|recogni|speciali|finali|customi|decarboni)s(?:e|es|ed|ing|ation|ations|er|ers)\b|\bmodel(?:led|ling)\b|\b(?:colo|behavio|favo)ur(?:s|ed|ing)?\b|\bcentres?\b/gi;
  const usR = resumeRaw.match(US_RE) || [], auR = resumeRaw.match(AU_RE) || [];
  const auJ = (jdRaw.match(AU_RE) || []).length, usJ = (jdRaw.match(US_RE) || []).length;
  if (usR.length && auR.length) tips.push({ status: "warn", title: "Consistent spelling", detail: `Mixed Australian and US spelling ("${auR[0]}" and "${usR[0]}"). Pick one. Australian employers expect Australian spelling.` });
  else if (usR.length && auJ > usJ) tips.push({ status: "warn", title: "Consistent spelling", detail: `Your resume uses US spelling ("${usR[0]}") but the ad uses Australian spelling. Matching it reads better locally.` });
  else tips.push({ status: "pass", title: "Consistent spelling", detail: auR.length || usR.length ? `Spelling is consistent (${auR.length ? "Australian" : "US"}).` : "No spelling variants to check." });

  // Category scores and overall
  const atsScore = statusScore(ats), tipsScore = statusScore(tips);
  // An ad that asks for no technical skills (many graduate programs) is judged on its soft skills instead
  const hardV = weighted(hard);
  const cats = [
    { key: "hard", label: "Hard skills", weight: 40, value: hardV, anchor: "sec-hard" },
    { key: "soft", label: "Soft skills", weight: hardV === null ? 40 : 10, value: weighted(soft), anchor: "sec-soft" },
    { key: "title", label: "Job title", weight: 10, value: titleRes ? titleRes.score : null, anchor: "sec-tips" },
    { key: "terms", label: "Other key terms", weight: 10, value: termsScore, anchor: "sec-terms" },
    { key: "edu", label: "Education", weight: 5, value: eduScore, anchor: "sec-tips" },
    { key: "ats", label: "ATS readability", weight: 15, value: atsScore, anchor: "sec-ats" },
    { key: "tips", label: "Recruiter tips", weight: 10, value: tipsScore, anchor: "sec-tips" }
  ];
  const used = cats.filter(c => c.value !== null);
  const totalW = used.reduce((a, c) => a + c.weight, 0);
  const overall = totalW ? Math.round(used.reduce((a, c) => a + c.value * c.weight, 0) / totalW) : 0;

  // Fix these first
  const fixes = [];
  const missHard = hard.filter(x => !x.found);
  const missReq = missHard.filter(x => x.priority === "Required");
  const missShow = missReq.length ? missReq : missHard;
  if (missShow.length) fixes.push(`Add these ${missReq.length ? "required " : ""}skills if you genuinely have them: <b>${missShow.slice(0, 4).map(x => esc(x.name)).join(", ")}</b>${missShow.length > 4 ? ` and ${missShow.length - 4} more` : ""}.`);
  if (titleRes && titleRes.score < 85) fixes.push(`Use the job title <b>"${esc(titleRes.title)}"</b> in your headline or profile, if it fits.`);
  for (const a of ats.filter(a => a.status === "fail")) fixes.push(`${esc(a.title)}: ${esc(a.detail)}`);
  if (yearOnly.length) fixes.push(`Add months to ${yearOnly.length} date range${yearOnly.length === 1 ? "" : "s"}, for example "Mar 2023 – Feb 2025".`);
  const metric = tips.find(t => t.title === "Measurable results");
  if (metric && metric.status !== "pass") fixes.push("Add numbers to more bullets: percentages, team sizes, volumes or time saved.");
  const missSoft = soft.filter(x => !x.found);
  if (missSoft.length) fixes.push(`Show evidence of <b>${missSoft.slice(0, 3).map(x => esc(x.name.toLowerCase())).join(", ")}</b> in your bullets.`);
  if (eduScore === 0) fixes.push("List your qualification clearly under an Education heading.");
  if (cl.length) fixes.push(`Replace ${cl.slice(0, 2).map(c => `"${esc(c)}"`).join(" and ")} with specific achievements.`);
  if (pron) fixes.push(`Remove "I", "me" and "my" (${pron} found).`);

  // Job ad highlight ranges
  const marks = [];
  const scoredNames = new Set(scored.map(x => x.name));
  for (const x of jSkills.values()) {
    if (!scoredNames.has(x.skill.name)) continue;
    const found = scored.find(r => r.name === x.skill.name).found;
    for (const [s, e] of x.ranges) if (!NOT_SCORED.has(lineAt(s).kind)) marks.push({ s, e, found, name: x.skill.name });
  }
  marks.sort((a, b) => a.s - b.s || (b.e - b.s) - (a.e - a.s));
  const clean = [];
  for (const m of marks) if (!clean.length || m.s >= clean[clean.length - 1].e) clean.push(m);

  return { overall, cats, hard, soft, ignored, jdLines, terms, titleRes, ats, tips, fixes: fixes.slice(0, 5), marks: clean, jdLevel, resLevel };
}

