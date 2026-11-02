/* ===================== What the job needs: selection criteria, must-haves, values and expected skills ===================== */
// Many ads (graduate programs especially) never name a skill. They describe behaviours ("work autonomously and
// as part of a team"), leave the technical skills to the discipline, and put deal-breakers in passing
// ("open to Australian citizens and permanent residents"). This reads an ad in five passes:
//   1. the selection criteria: every line in the "to be successful you will…" list is essential
//   2. each line turned into skill names (the taxonomy knows behaviour phrasing, so one line can give several)
//   3. must-haves: work rights, licences and checks, relocation, study stage, disciplines, closing date
//   4. what the company says it values
//   5. what's usually expected for the discipline but not written down (shown, never scored)
// An AI double-check can add anything missed, but only with the ad's exact words as proof.

// What to ask when a criterion has no evidence in the resume yet
const GAP_Q = {
  Communication: "When did you explain something, write a report or present to a group?",
  Teamwork: "What did you achieve as part of a team, and what was your part?",
  "Working independently": "What task did you own from start to finish on your own?",
  Adaptability: "When did plans change, and how did you adjust?",
  "Willingness to learn": "What did you learn quickly for a job, course or project?",
  Initiative: "What did you start or improve without being asked?",
  "Attention to detail": "What work of yours was checked, signed off or relied on for accuracy?",
  "Interpersonal skills": "Who did you build a good working relationship with, and how?",
  "Stakeholder management": "When did you deal with a client, council, supplier or subcontractor?",
  Creativity: "What new idea or better way of doing something did you suggest?",
  "Problem solving": "What problem did you solve, and what was the result?",
  Leadership: "When did you lead, train or coordinate other people?",
  "Time management": "When did you juggle deadlines, shifts or study and still deliver?",
  "Safety mindset": "How did you work safely or help others to (inductions, toolbox talks, PPE)?",
  "Customer focus": "When did you go out of your way for a customer or client?",
  Resilience: "When did you keep going under pressure, and what came of it?"
};

// What a company says it stands for
const VALUE_WORDS = [["Safety", /\bsafe(ty)?\b/], ["Collaboration", /collaborat/], ["Innovation", /innovat/], ["Performance", /\bperformance\b/], ["Integrity", /\bintegrity\b|\bhonest/], ["Respect", /\brespect/], ["Excellence", /excellen/], ["Accountability", /accountab/], ["Sustainability", /sustainab/], ["Customer focus", /\bcustomers?\b|client[- ]first/], ["Quality", /\bquality\b/], ["Teamwork", /teamwork|one team/], ["Care", /\bcar(e|ing)\b(?! for)/], ["Courage", /courage/], ["Trust", /\btrust/], ["Ownership", /ownership/], ["Curiosity", /curio/], ["Inclusion", /inclusi/], ["Community", /\bcommunit(y|ies)\b/]];
const VALUE_LINE = /\b(our values?|values|commit(ment|ted) to|we (value|believe|live)|culture|proud(ly)?|through|guided by|principles|what we stand for|we stand for|driven by)\b/i;

// What's usually expected for a discipline, when the ad doesn't spell it out (names are in the skills taxonomy)
const ROLE_PROFILES = [
  { key: "qs", label: "quantity surveying and commercial", test: /quantity survey|\bcommercial (manager|analyst|graduate|coordinator)|cost (manager|planner|engineer)|estimator|estimating/i, skills: ["Cost estimation", "Quantity take-offs", "Cost planning", "Contract management", "Tendering", "Procurement", "Budgeting", "Microsoft Excel"] },
  { key: "cm", label: "construction and project management", test: /construction manag|site manag|project coordinat|contracts? administrat|project engineer/i, skills: ["Construction management", "Project planning", "Scheduling", "Microsoft Project", "Primavera P6", "Contract management", "Cost estimation", "Quality assurance", "WHS", "White Card", "Procurement"] },
  { key: "civil", label: "civil and structural engineering", test: /civil|structural|geotech|infrastructure|site engineer|roads?\b|bridges?|tunnel/i, skills: ["Engineering drawings", "AutoCAD", "Civil 3D", "12d Model", "Structural analysis", "Geotechnical engineering", "Site setout", "Inspection and test plans", "Quality assurance", "Temporary works", "Risk assessment", "WHS", "White Card", "Australian Standards", "Microsoft Excel"] },
  { key: "mech", label: "mechanical engineering", test: /mechanical|mechatronic|manufactur|reliability|maintenance engineer/i, skills: ["SolidWorks", "AutoCAD", "Engineering drawings", "GD&T", "FEA", "Mechanical design", "Engineering calculations", "Thermodynamics", "Fluid mechanics", "Maintenance planning", "Root cause analysis", "FMEA", "Risk assessment", "MATLAB", "Microsoft Excel"] },
  { key: "elec", label: "electrical engineering", test: /electrical|electronic|power systems?|instrumentation|control systems|substation|high voltage/i, skills: ["Electrical design", "Power systems", "AutoCAD", "PLC", "SCADA", "Control systems", "Instrumentation", "Circuit design", "Commissioning", "Australian Standards", "Risk assessment", "MATLAB"] },
  { key: "mining", label: "mining and resources", test: /mining|metallurg|minerals|mineral processing|process(ing)? plant|geolog/i, skills: ["Mining", "Process engineering", "Maintenance planning", "HAZOP", "Risk assessment", "WHS", "Data analysis", "Microsoft Excel", "AutoCAD"] },
  { key: "env", label: "environment and sustainability", test: /environment|sustainab|ecolog|\besg\b|climate/i, skills: ["Environmental management", "ISO 14001", "GIS", "Sustainability reporting", "Decarbonisation", "Data analysis", "Technical reports", "Risk assessment", "Microsoft Excel"] },
  { key: "safety", label: "health and safety", test: /\bsafety\b|\bwhs\b|\bohs\b|\bhse\b|hsqe/i, skills: ["WHS", "ISO 45001", "Risk assessment", "Incident investigation", "HAZOP", "First aid", "White Card", "Technical reports"] },
  { key: "software", label: "software development", test: /software|developer|programmer|full[- ]?stack|front[- ]?end|back[- ]?end|devops|web develop/i, skills: ["Python", "JavaScript", "TypeScript", "SQL", "Git", "APIs", "React.js", "Node.js", "AWS", "Docker", "Agile", "Linux"] },
  { key: "data", label: "data and analytics", test: /data (analyst|scientist|engineer|analytics)|analytics|business intelligence|\bbi (analyst|developer)/i, skills: ["SQL", "Python", "Microsoft Excel", "Power BI", "Tableau", "Data analysis", "Data visualisation", "Data cleaning", "Statistics", "pandas", "Machine learning"] },
  { key: "finance", label: "finance and accounting", test: /financ|accountan|accounting|audit|\btax\b|payroll|bookkeep/i, skills: ["Microsoft Excel", "Financial analysis", "Financial modelling", "Accounting", "Reconciliations", "Budgeting", "Forecasting", "Xero", "MYOB", "SAP", "Power BI"] },
  { key: "hr", label: "people and culture", test: /human resources|\bhr\b|people (and|&) culture|\bp&c\b|talent|recruit/i, skills: ["Recruitment", "Onboarding", "Employee relations", "HRIS", "Stakeholder management", "Microsoft Excel", "Microsoft Office", "Data analysis"] },
  { key: "marketing", label: "marketing and communications", test: /marketing|social media|communications|content (writer|producer|coordinator)|brand/i, skills: ["Digital marketing", "Social media", "SEO", "Market research", "Data analysis", "CRM", "Microsoft Excel"] },
  { key: "it", label: "IT support", test: /it support|help ?desk|service desk|desktop support|systems? administrat|network/i, skills: ["Microsoft Office", "Microsoft Azure", "Linux", "Documentation", "Jira", "Customer service"] },
  { key: "health", label: "health and care", test: /nurs|aged care|disability|support worker|carer|clinical|patient|allied health/i, skills: ["Patient care", "Medication administration", "First aid", "Police check", "NDIS Worker Screening", "Working with Children Check", "Documentation", "Risk assessment"] },
  { key: "teach", label: "education", test: /teach|educator|tutor|childcare|early childhood|school/i, skills: ["Lesson planning", "Classroom management", "Working with Children Check", "First aid", "Microsoft Office"] },
  { key: "hosp", label: "retail and hospitality", test: /retail|hospitality|barista|waiter|waitress|\bcafe|restaurant|\bbar\b|kitchen|store|shop|sales assistant/i, skills: ["Customer service", "Point of sale", "Cash handling", "Inventory management", "Food safety", "RSA", "Sales", "First aid"] },
  { key: "trades", label: "trades and warehousing", test: /electrician|carpent|plumb|apprentic|labourer|warehouse|forklift|storeperson|\bdriver\b|tradesperson|fitter|boilermaker/i, skills: ["White Card", "Forklift licence", "Working at heights", "Driver's licence", "WHS", "Inventory management", "First aid"] },
  { key: "admin", label: "administration", test: /admin|reception|office (manager|coordinator|assistant)|clerk|data entry|executive assistant/i, skills: ["Microsoft Office", "Microsoft Excel", "Data entry", "Scheduling", "Customer service", "Documentation", "CRM"] }
];
const skillByName = name => SKILLS.find(s => s.name === name) || null;
const STATES_FULL = { victoria: "VIC", "new south wales": "NSW", queensland: "QLD", "western australia": "WA", "south australia": "SA", tasmania: "TAS", "australian capital territory": "ACT", "northern territory": "NT" };

// Lines of the resume that can show a skill: sentences and bullet points, not just a list of skills
const resumeEvidenceLines = text => String(text || "").split("\n").map(l => l.replace(BULLET_RE, "").trim()).filter(Boolean);
function skillEvidence(name, rLines) {
  const sk = skillByName(name);
  if (!sk) return { status: "missing" };
  const hits = rLines.filter(l => { sk.re.lastIndex = 0; return sk.re.test(norm(l)); });
  const shown = hits.find(l => wordCount(l) >= 7) || (CERT_LIKE.has(name) && hits[0]);
  if (shown) return { status: "shown", line: shown };
  if (hits.length) return { status: "listed", line: hits[0] };
  const w = sk.kind === "soft" && SOFT_WEAVE[name];
  if (w && w.fit) { const l = rLines.find(x => wordCount(x) >= 7 && w.fit.test(x)); if (l) return { status: "implied", line: l }; }
  return { status: "missing" };
}
// Licences, tickets and checks only need listing: having one is the evidence
const CERT_LIKE = new Set(["Driver's licence", "White Card", "Working with Children Check", "Police check", "NDIS Worker Screening", "First aid", "RSA", "Forklift licence", "Working at heights", "Food safety", "Security clearance", "ISO 9001", "ISO 14001", "ISO 45001"]);
const EVIDENCE_WORDS = { shown: "Shown in your resume", listed: "Listed, not shown", implied: "Your resume hints at it", missing: "Not in your resume yet" };

// "2nd November 2026", "November 2, 2026", "2/11/2026" → a Date
function parseAdDate(t) {
  const s = String(t).replace(/(\d)(st|nd|rd|th)\b/gi, "$1").replace(/,/g, " ").replace(/\s+/g, " ").trim();
  let m = s.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/) || s.match(/^([A-Za-z]+) (\d{1,2}) (\d{4})$/);
  if (m) {
    const [d, mon] = /^\d/.test(m[1]) ? [+m[1], m[2]] : [+m[2], m[1]];
    const i = MON3.findIndex(x => x.toLowerCase() === mon.slice(0, 3).toLowerCase());
    if (i >= 0) return new Date(+m[3], i, d, 23, 59);
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) return new Date(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2] - 1, +m[1], 23, 59);
  return null;
}
const firstSentence = (text, re) => { const sents = String(text).split(/(?<=[.!?])\s+|\n+/); return (sents.find(x => re.test(x)) || "").trim(); };

// Who the candidate is, from the Resume creator if they've filled it in, otherwise from the resume text
function candidateFacts(resumeRaw) {
  const p = typeof P === "function" ? P() : null, has = p && hasProfile(p);
  let edu = has ? finished(p.education).find(e => e.degree || e.inst) : null;
  // no Resume creator profile: read the qualification and its dates from the resume itself
  if (!edu) {
    const L = resumeRaw.split("\n"), i = L.findIndex(l => /\b(bachelor|master|diploma|certificate|degree|b\.?eng|bsc|ba)\b/i.test(l));
    if (i >= 0) {
      const near = L.slice(i, i + 3).join(" ");
      const r = near.match(new RegExp(`(${MY}|${YR})\\s*(?:-|\u2013|\u2014|to)\\s*(${MY}|${YR}|present|current|now)`, "i"));
      const exp = near.match(new RegExp(`(?:expected|graduating|completion|complete|finish(?:ing)?)[^\\n]{0,20}?(${MY}|${YR})`, "i"));
      const end = r ? r[2] : exp ? exp[1] : "";
      if (end) edu = { degree: L[i].split("|")[0].replace(/,.*$/, "").trim(), inst: "", start: r ? fmtDate(r[1]) : "", end: /present|current|now/i.test(end) ? "" : fmtDate(end), current: /present|current|now|expected/i.test(near) };
    }
  }
  const stage = edu ? studyStage(edu) : null;
  const rN = norm(resumeRaw);
  const locText = (has && p.contact.location) || resumeRaw.slice(0, 400);
  const st = (locText.match(/\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\b/) || [])[1] || "";
  return {
    workRights: has ? p.contact.workRights : (/australian citizen/i.test(resumeRaw) ? "Australian citizen" : /permanent resident/i.test(resumeRaw) ? "Permanent resident" : ""),
    state: st, degree: edu ? `${edu.degree} ${edu.inst || ""}` : (resumeRaw.match(/(bachelor|master|diploma|certificate)[^\n]{0,80}/i) || [""])[0],
    target: has ? p.target.title : "", stage, edu,
    licence: has ? p.contact.licence : "",
    text: rN, has
  };
}

function jobNeeds(jdRaw, res, resumeRaw) {
  const lines = res.jdLines, rLines = resumeEvidenceLines(resumeRaw), me = candidateFacts(resumeRaw);
  const jN = norm(jdRaw);
  const rSkills = findSkills(norm(resumeRaw));
  const out = { criteria: [], nice: [], must: [], values: [], options: null, expected: null, ai: null, guide: activeGuideKey(jdRaw) };
  const stated = new Set([...res.hard, ...res.soft].map(x => x.name));

  // 1 and 2. The selection criteria, each turned into skills, with the evidence for each
  const isItem = L => !L.heading && L.text.trim() && wordCount(L.text) <= 45 && !LINE_BOILER.test(L.text) && !/^(please note|applications? (close|open)|click|to apply|note:)/i.test(L.text.trim());
  const crit = L => {
    const text = L.text.replace(BULLET_RE, "").trim();
    const skills = [...findSkills(norm(text)).keys()].map(name => ({ name, kind: skillByName(name).kind, ...skillEvidence(name, rLines) }));
    let status = skills.length ? (skills.every(s => s.status === "shown") ? "shown" : skills.some(s => s.status !== "missing") ? "partly" : "missing") : null, note = "";
    if (!status) {
      const cw = contentWords(text), rw = contentWords(resumeRaw); let n = 0; for (const w of cw) if (rw.has(w)) n++;
      status = cw.size && n / cw.size >= 0.5 ? "partly" : "missing";
      note = /relocat|travel|move|fly[- ]in|fifo|sites? as required/i.test(text) ? "Not a skill: say plainly that you're willing to, in your application." : /citizen|resident|visa|licen[cs]e|check|clearance/i.test(text) ? "A must-have, checked above." : /\b(bachelor|master|degree|diploma|certificate|qualification|graduat)/i.test(text) ? "A qualification, checked in Must-haves above. Make sure it's clear in your Education section." : "Show this with an example in your resume or cover letter.";
    }
    return { text, skills, status, note };
  };
  out.criteria = lines.filter(L => L.kind === "req" && isItem(L)).map(crit);
  out.nice = lines.filter(L => L.kind === "nice" && isItem(L)).map(crit);

  // 3. Must-haves
  const add = (key, label, quote, you, note) => out.must.push({ key, label, quote: String(quote || "").replace(BULLET_RE, "").trim(), you, note });
  const wr = firstSentence(jdRaw, /citizen|permanent resident|working rights|right to work|work rights|valid (work )?visa|visa sponsorship/i);
  if (wr) {
    const citizenOnly = /citizens? only|must be an? australian citizen|australian citizenship (is )?(required|essential)/i.test(wr);
    const okPR = /permanent resident/i.test(wr), okFull = /working rights|right to work|valid (work )?visa/i.test(wr);
    const w = me.workRights;
    const you = !w ? "check" : /citizen/i.test(w) ? "yes" : /permanent/i.test(w) ? (citizenOnly ? "no" : okPR || okFull ? "yes" : "check") : /full working|graduate visa/i.test(w) ? (okFull ? "yes" : "no") : "no";
    add("rights", "Work rights", wr, you, !w ? "Add your work rights in your profile so this can be checked." : you === "no" ? `You've said: ${w}. This one isn't open to you, so it's worth looking elsewhere.` : `You've said: ${w}.`);
  }
  const clr = firstSentence(jdRaw, /security clearance|baseline (security )?clearance|\bnv1\b|\bnv2\b|negative vetting|agsva/i);
  if (clr) add("clearance", "Security clearance", clr, /clearance/i.test(resumeRaw) ? "yes" : "check", "Most clearances need Australian citizenship, and the employer usually sponsors them.");
  const CHECK_SKILLS = ["Driver's licence", "White Card", "Working with Children Check", "Police check", "NDIS Worker Screening", "First aid", "RSA", "Forklift licence", "Working at heights", "Food safety"];
  for (const name of CHECK_SKILLS) {
    const x = findSkills(norm(jdRaw)).get(name);
    if (!x) continue;
    const L = lines.find(L => x.ranges.some(([s]) => s >= L.s && s <= L.e));
    if (L && ["boiler", "learn", "notreq"].includes(L.kind)) continue;
    const have = rSkills.has(name) || (name === "Driver's licence" && /licen[cs]e/i.test(me.licence || ""));
    add("check-" + name, name, (L ? L.text : name).replace(BULLET_RE, "").trim(), have ? "yes" : "check", have ? "It's on your resume." : "If you have it, list it under Licences and certifications.");
  }
  const rel = firstSentence(jdRaw, /relocat|travel (to|between|regularly|interstate|extensively)|fly[- ]in|\bfifo\b|\bdido\b|remote sites|various (sites|locations|projects)|willing(ness)? to (move|travel)/i);
  if (rel) add("relocate", "Moving or travelling for work", rel, "check", "Say plainly that you're willing to, in your application and cover letter.");
  // where the jobs are
  const stateHits = new Set();
  for (const L of lines) if (L.kind === "meta" || /\b(across|in|based in|located in)\b/i.test(L.text)) for (const m of L.text.matchAll(/\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT|NZ)\b/g)) stateHits.add(m[1]);
  for (const [full, ab] of Object.entries(STATES_FULL)) if (new RegExp(`\\b${full}\\b`).test(jN)) stateHits.add(ab);
  if (stateHits.size) add("where", "Where the jobs are", [...stateHits].join(", "), me.state ? (stateHits.has(me.state) ? "yes" : "check") : "check", me.state ? (stateHits.has(me.state) ? `You're in ${me.state}.` : `You're in ${me.state}. Check you can move, or apply for a location near you.`) : "Add your suburb in the resume builder so this can be checked.");
  // study stage and the program year
  const prog = jdRaw.match(/\b(graduate|vacation|summer|winter|intern(ship)?|cadet(ship)?|undergraduate) (program(me)?|intake)s? ?(20\d{2})\b|\b(20\d{2}) (graduate|vacation|summer|intern(ship)?|cadet(ship)?) (program|intake)/i);
  const stageQ = firstSentence(jdRaw, /\b(students?|recent(ly)? graduat\w*|final[- ]year|penultimate|graduated (in|within)|complet(e|ed|ing) (your|their|a) (degree|studies)|graduate program)\b/i);
  if (prog || stageQ) {
    const year = prog ? +(prog[6] || prog[7]) : 0, kindW = prog ? (prog[1] || prog[8] || "").toLowerCase() : "";
    const s = me.stage;
    let you = "check", note = "Add your qualification and dates in the resume builder so this can be checked.";
    if (s) {
      const end = me.edu && dateEnd(me.edu.end);
      if (/graduate/.test(kindW) && year && end) {
        // graduate programs start early in their year, so the degree has to be finished by then
        if (end.getFullYear() < year || (end.getFullYear() === year && end.getMonth() <= 1)) { you = "yes"; note = `You finish ${s.ends}, before the ${year} intake starts.`; }
        else { you = "no"; note = `This is the ${year} intake, which starts early in ${year}, but you finish ${s.ends}. Look for this employer's vacation or internship program, or their ${end.getFullYear() + (end.getMonth() >= 10 ? 1 : 0)} graduate intake.`; }
      } else if (/vacation|summer|winter|intern|undergraduate/.test(kindW)) { you = s.current ? "yes" : "check"; note = s.current ? `These are for current students, and you're ${s.label ? aOrAn(s.label) + " " + s.label + " student" : "still studying"}.` : "These are usually for current students."; }
      else if (/penultimate/i.test(stageQ)) { you = s.label === "penultimate-year" ? "yes" : "check"; note = `It asks for penultimate-year students. You're ${s.label ? aOrAn(s.label) + " " + s.label : "a"} student${s.current ? "" : " (graduated)"}.`; }
      else if (/final[- ]year/i.test(stageQ)) { you = s.label === "final-year" || (!s.current && s.label === "recent graduate") ? "yes" : "check"; note = `It asks for final-year students or recent graduates. You're ${s.current ? (s.label ? aOrAn(s.label) + " " + s.label + " student" : "a current student") : "a " + s.label}.`; }
      else { you = s.current || s.label === "recent graduate" ? "yes" : "check"; note = s.current ? `You're ${s.label ? aOrAn(s.label) + " " + s.label + " student" : "a current student"}.` : `You're a ${s.label}.`; }
    }
    add("stage", prog ? `${prog[0].replace(/\b\w/g, c => c.toUpperCase())}` : "Study stage", stageQ || prog[0], you, note);
  }
  // the disciplines they take: the candidate needs one of them
  const opts = lines.filter(L => L.kind === "options" && !L.heading).map(L => L.text.replace(BULLET_RE, "").trim()).filter(Boolean);
  if (opts.length) {
    const mine = contentWords(`${me.degree} ${me.target}`);
    const items = opts.map(o => { let n = 0; const cw = contentWords(o); for (const w of cw) if (mine.has(w)) n++; return { text: o, mine: cw.size > 0 && n > 0 && !/^(engineering|graduate)$/i.test(o) && n >= Math.min(1, cw.size) }; });
    // "Engineering - Civil": "engineering" alone isn't enough, the discipline must match too
    for (const it of items) if (it.mine) { const cw = [...contentWords(it.text)].filter(w => !/^(engineer|graduat|student)/.test(w)); it.mine = !cw.length || cw.some(w => mine.has(w)); }
    out.options = { items, yours: items.filter(i => i.mine).map(i => i.text) };
    add("discipline", "Your discipline", `One of: ${opts.join(", ")}`, out.options.yours.length ? "yes" : me.degree ? "check" : "check", out.options.yours.length ? `Yours: ${out.options.yours.join(", ")}.` : me.degree ? "Your qualification doesn't obviously match one of these. Check the employer's site for the full list." : "Add your qualification so this can be checked.");
  }
  // "completed within the last two years"
  const recent = jdRaw.match(/(completed|graduated|finished|conferred)[^.\n]{0,40}?within the (last|past|previous) (\w+) years?/i);
  if (recent) {
    const n = { one: 1, two: 2, three: 3, four: 4, five: 5 }[recent[3].toLowerCase()] || +recent[3] || 2, s2 = me.stage;
    const end = me.edu && dateEnd(me.edu.end), months = end ? (new Date() - end) / 2.63e9 : null;
    add("recent", "Recently qualified", firstSentence(jdRaw, /within the (last|past|previous) \w+ years?/i) || recent[0], !s2 ? "check" : s2.current ? "check" : months != null && months <= n * 12 ? "yes" : "no",
      !s2 ? "Add your qualification and dates so this can be checked." : s2.current ? `It asks for people who have finished. You finish ${s2.ends}, so check whether final-year students can apply.` : months != null && months <= n * 12 ? `You finished ${s2.ends}.` : `You finished ${s2.ends}, more than ${n} year${n === 1 ? "" : "s"} ago.`);
  }
  if (res.jdLevel) add("degree", "Qualification", firstSentence(jdRaw, new RegExp(DEGREE_LEVELS.find(([l]) => l === res.jdLevel)[1].source, "i")) || LEVEL_NAME[res.jdLevel], res.resLevel >= res.jdLevel ? "yes" : res.resLevel ? "check" : "check", res.resLevel >= res.jdLevel ? `Your resume shows ${LEVEL_NAME[res.resLevel]}.` : `The ad asks for ${LEVEL_NAME[res.jdLevel]}.`);
  const yrs = jdRaw.match(/(\d+)\s*\+?\s*(?:(?:-|–|to)\s*\d+\s*)?\+?\s*years?['’]?\s+(?:of\s+)?(?:[a-z]+\s+){0,3}experience/i);
  if (yrs) add("years", "Experience", firstSentence(jdRaw, /years?['’]?\s+(of\s+)?([a-z]+\s+){0,3}experience/i) || yrs[0], "check", "Make sure your dates show it. Count internships and relevant part-time work.");
  const closeM = jdRaw.match(/(?:applications?|this (?:ad|role|job))\s+(?:close|closes|closing)(?:\s+(?:on|date|at))?:?\s*(?:\w+day,?\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s+\d{4}|[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i)
    || jdRaw.match(/closing date:?\s*(?:\w+day,?\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s+\d{4}|[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (closeM) {
    const d = parseAdDate(closeM[1]), days = d ? Math.ceil((d - new Date()) / 864e5) : null;
    out.closes = { text: closeM[1], date: d, days };
    add("closes", "Applications close", closeM[0].trim(), days == null ? "check" : days < 0 ? "no" : days <= 7 ? "check" : "yes", days == null ? "" : days < 0 ? "This has already closed." : days === 0 ? "That's today." : `That's in ${days} day${days === 1 ? "" : "s"}${days <= 7 ? ". Leave time for online tests, which often follow straight after." : "."}`);
  }

  // 4. Values
  const seenV = new Set();
  for (const L of lines) {
    const t = L.text;
    if (!VALUE_LINE.test(t) || /equal (employment )?opportunit|apply now|privacy/i.test(t)) continue;
    const tn = norm(t);
    for (const [name, re] of VALUE_WORDS) if (re.test(tn) && !seenV.has(name)) { seenV.add(name); out.values.push({ name, line: t.trim() }); }
  }

  // 5. What's usually expected for this discipline (from the ad, or for a multi-discipline ad, from the candidate)
  const ctx = opts.length ? `${me.degree} ${me.target}` : `${detectTitle(jdRaw, "")} ${lines.filter(L => ["title", "req", "duty", "body"].includes(L.kind)).map(L => L.text).join(" ")}`;
  const prof = ROLE_PROFILES.find(r => r.test.test(ctx));
  if (prof) {
    const skills = prof.skills.filter(n => skillByName(n) && !stated.has(n)).map(name => ({ name, found: rSkills.has(name) }));
    if (skills.length) out.expected = { label: prof.label, skills, fromYou: !!opts.length };
  }
  return out;
}

/* --- The AI double-check: everything it adds must quote the ad word for word --- */
const NEEDS_NANO = `You read an Australian job ad and list everything a candidate needs to have or show.
Rules:
1. List each requirement once: technical skills, soft skills, qualifications, licences or checks, work rights and other must-haves.
2. "quote" is the exact words from the ad that ask for it, copied character for character.
3. Leave out the company description, benefits, and things they will teach on the job.
4. kind is one of: hard, soft, qualification, must.
5. need is a short name, under 6 words, like "Stakeholder management".
Reply with JSON only.`;
const NEEDS_EXAMPLES = [[
  `Graduate Analyst
About you:
- A degree in finance, economics or similar, completed by February
- Strong Excel skills and comfort with numbers
- Able to build trust with clients
Applications are open to Australian citizens and permanent residents.
We offer a fun culture and free breakfast.`,
  { needs: [{ need: "Finance or economics degree", kind: "qualification", quote: "A degree in finance, economics or similar, completed by February" }, { need: "Microsoft Excel", kind: "hard", quote: "Strong Excel skills" }, { need: "Numeracy", kind: "soft", quote: "comfort with numbers" }, { need: "Client relationships", kind: "soft", quote: "Able to build trust with clients" }, { need: "Citizen or permanent resident", kind: "must", quote: "Applications are open to Australian citizens and permanent residents" }] }
]];
const NEEDS_SCHEMA = { type: "object", properties: { needs: { type: "array", items: { type: "object", properties: { need: { type: "string" }, kind: { type: "string", enum: ["hard", "soft", "qualification", "must"] }, quote: { type: "string" } }, required: ["need", "kind", "quote"] } } }, required: ["needs"] };
const quoteKey = s => norm(String(s || "")).replace(/[“”"'’]/g, "").replace(/[^a-z0-9+#&]+/g, " ").trim();
async function aiJobNeeds(jdRaw, res, progress) {
  // the parts of the ad that matter, kept short for small models
  const body = res.jdLines.filter(L => !["boiler", "meta", "learn", "company"].includes(L.kind)).map(L => L.text).join("\n").replace(/\n{3,}/g, "\n\n").slice(0, 3500);
  const adKey = quoteKey(jdRaw);
  const r = await aiJSON({ nano: NEEDS_NANO, examples: NEEDS_EXAMPLES, prompt: body, schema: NEEDS_SCHEMA, label: "Reading the ad", progress,
    check: d => {
      const seen = new Set(), ok = [];
      for (const x of (Array.isArray(d.needs) ? d.needs : []).slice(0, 30)) {
        const need = stripMarkup(String(x && x.need || "")).trim(), q = String(x && x.quote || "").trim();
        if (!need || need.length > 60 || q.length < 3 || !adKey.includes(quoteKey(q)) || seen.has(norm(need))) continue;
        seen.add(norm(need));
        const known = [...findSkills(norm(need + " " + q)).keys()];
        ok.push({ need, kind: ["hard", "soft", "qualification", "must"].includes(x.kind) ? x.kind : "soft", quote: q, known });
      }
      return ok.length ? { ok: true, value: ok } : { ok: false, why: "every item needs a quote copied exactly from the ad" };
    } });
  return r.data ? { items: r.data, via: r.via } : null;
}

/* --- A draft answer to one selection criterion, using the STAR method, from the resume only --- */
const STAR_NANO = `You help an Australian job seeker answer one selection criterion with a short example.
Rules:
1. Use only facts from their resume lines. Never invent employers, numbers, tools or results.
2. First person ("I"), 100 to 170 words, plain and specific.
3. Follow STAR: the situation, the task, what they did (most of it), and the result.
4. If the resume doesn't give the result, end with what they achieved in general terms from the facts. Never use square brackets.
Reply with JSON only: {"answer": "..."}`;
async function draftCriterion(criterion, resumeRaw, progress) {
  const rLines = resumeEvidenceLines(resumeRaw).filter(l => wordCount(l) >= 5);
  const want = contentWords(criterion + " " + [...findSkills(norm(criterion)).keys()].join(" "));
  const scored = rLines.map(l => { let n = 0; for (const w of contentWords(l)) if (want.has(w)) n++; for (const k of findSkills(norm(criterion)).keys()) { const w2 = SOFT_WEAVE[k]; if (w2 && w2.fit && w2.fit.test(l)) n += 1; } return [n, l]; }).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, 5).map(x => x[1]);
  const facts = scored.length ? scored : rLines.slice(0, 5);
  const prompt = `Criterion: ${criterion}\nTheir resume lines:\n${facts.map(f => "- " + f).join("\n")}`;
  const r = await aiJSON({ nano: STAR_NANO, prompt, schema: { type: "object", properties: { answer: { type: "string" } }, required: ["answer"] }, label: "Drafting your example", progress,
    check: d => { const t = stripMarkup(String(d.answer || "")).replace(/\s+/g, " ").trim(); const why = factCheck(t, resumeRaw + "\n" + criterion, { years: true, min: 60, max: 230 }); return why ? { ok: false, why } : { ok: true, value: t }; } });
  if (r.data) return { text: r.data, via: r.via, facts };
  // without AI: a STAR frame around the best matching line, for them to finish
  const best = facts[0];
  return { text: best ? `Situation and task: [Where you were and what needed doing.]\nAction: In that role I ${lowerFirst(best.replace(/[.\s]+$/, ""))}. [Add the steps you took.]\nResult: [What came of it: a number, feedback or outcome.]` : "", via: null, facts };
}

/* --- The panel in the scanner results --- */
const YOU_WORDS = { yes: "You meet this", no: "Probably not", check: "Check this" };
const EV_SHORT = { shown: "shown", listed: "listed only", implied: "hinted at", missing: "missing" };
function needsHtml(n) {
  if (!n) return "";
  // selection criteria and nice-to-haves are laid out the same way as the must-haves to apply: a verdict, a label, the ad's own words
  const CRIT_YOU = { shown: "yes", partly: "check", missing: "no" }, CRIT_WORDS = { yes: "You meet this", check: "Partly shown", no: "Not shown yet" };
  const crit = (c, i, nice) => {
    const gap = c.skills.find(s => s.status === "missing" || s.status === "listed");
    const you = CRIT_YOU[c.status] || "check";
    const label = c.skills.length ? c.skills.slice(0, 3).map(s => s.name).join(", ") : nice ? "Nice to have" : "Selection criterion";
    return `<li class="you-${you}"><span class="needs-you">${CRIT_WORDS[you]}</span><div><b>${esc(label)}</b> <q>${esc(c.text)}</q>
      ${c.skills.length ? `<div class="needs-skills">${c.skills.map(s => `<span class="nchip ${s.status}" title="${esc(EVIDENCE_WORDS[s.status] + (s.line ? ": " + s.line : ""))}">${esc(s.name)}<i>${EV_SHORT[s.status]}</i></span>`).join("")}</div>` : (c.note ? `<p class="small">${esc(c.note)}</p>` : "")}
      ${gap ? `<p class="needs-q small"><b>To show it:</b> ${esc(GAP_Q[gap.name] || `Where have you used ${gap.name.toLowerCase()}? A bullet point that shows it beats listing the word.`)}${!gap.found && (lastResult && [...lastResult.hard, ...lastResult.soft].some(x => x.name === gap.name && !x.found)) ? ` <button class="linkish" type="button" data-needs-place="1">Place it below</button>` : ""}</p>` : ""}
      ${nice || !c.skills.length ? "" : `<p class="small"><button class="linkish" type="button" data-needs-draft="${i}">Draft an example answer (STAR)</button></p><div class="needs-draft" id="needsDraft${i}"></div>`}</div></li>`;
  };
  const shown = n.criteria.filter(c => c.status === "shown").length;
  return `<section class="panel needs" id="sec-needs" aria-labelledby="needsH">
    <div class="panel-head"><h2 id="needsH">What this job needs</h2><p>Read from the whole ad, including what it says without naming a skill. Each line is checked against your resume.</p></div>
    ${n.guide ? guideNeedsHtml(n.guide) : ""}
    ${n.must.length ? `<div class="needs-block"><h3>Must-haves to apply</h3><ul class="needs-must">${n.must.map(m => `<li class="you-${m.you}"><span class="needs-you">${YOU_WORDS[m.you]}</span><div><b>${esc(m.label)}</b> <q>${esc(m.quote)}</q>${m.note ? `<p class="small">${esc(m.note)}</p>` : ""}</div></li>`).join("")}</ul></div>` : ""}
    ${n.criteria.length ? `<div class="needs-block"><h3>Selection criteria <span class="muted small">${shown} of ${n.criteria.length} shown in your resume · every one is essential</span></h3><ul class="needs-must">${n.criteria.map((c, i) => crit(c, i)).join("")}</ul></div>` : `<div class="needs-block"><h3>Selection criteria</h3><p class="small muted">This ad doesn't have a list of criteria, so the skills tables below are the requirements.</p></div>`}
    ${n.nice.length ? `<div class="needs-block"><h3>Nice to have</h3><ul class="needs-must">${n.nice.map((c, i) => crit(c, i, true)).join("")}</ul></div>` : ""}
    ${n.values.length ? `<div class="needs-block"><h3>What they value</h3><div class="chips">${n.values.map(v => `<span class="chip" title="${esc(v.line)}">${esc(v.name)}</span>`).join("")}</div><p class="small muted">Use these words in your cover letter and interview answers, each with an example.</p></div>` : ""}
    ${n.expected ? `<div class="needs-block"><h3>Usually expected in ${esc(n.expected.label)} <span class="muted small">not in the ad, not scored</span></h3><div class="chips">${n.expected.skills.map(s => `<span class="chip ${s.found ? "found" : ""}" title="${s.found ? "On your resume" : "Not on your resume"}">${esc(s.name)}</span>`).join("")}</div><p class="small muted">${n.expected.fromYou ? "This ad takes several disciplines, so these are for yours. " : ""}Recruiters often assume these without writing them down. Only add the ones you really have.</p></div>` : ""}
    ${n.guide ? "" : guideNeedsHtml("")}
    <div class="needs-block needs-ai"><div class="b-actions"><button class="btn" type="button" id="needsAiBtn">Double-check with AI</button><span class="engine-note" id="needsAiNote" role="status">${n.ai ? "" : "Finds anything the rules missed. Everything it adds has to quote the ad."}</span></div><div id="needsAiOut">${n.ai ? needsAiHtml(n.ai) : ""}</div></div>
  </section>`;
}
function needsAiHtml(ai) {
  const n = lastResult && lastResult.needs;
  if (!ai.items.length) return `<p class="small">Nothing new: the rules already caught everything.</p>`;
  const have = new Set([...(lastResult ? [...lastResult.hard, ...lastResult.soft].map(x => x.name) : []), ...(n ? n.criteria.flatMap(c => c.skills.map(s => s.name)) : [])]);
  const fresh = ai.items.filter(x => !x.known.length || x.known.some(k => !have.has(k)));
  const KIND = { hard: "Technical", soft: "Soft skill", qualification: "Qualification", must: "Must-have" };
  return `<p class="small">${fresh.length ? `${fresh.length} more from ${esc(viaWords(ai.via))}, each with the ad's own words:` : `${esc(viaWords(ai.via))} found nothing the rules missed.`}</p>${fresh.length ? `<ul class="needs-ai-list">${fresh.map(x => `<li><span class="prio">${KIND[x.kind]}</span><b>${esc(x.need)}</b> <q>${esc(x.quote)}</q></li>`).join("")}</ul>` : ""}`;
}
async function needsClick(e) {
  const t = e.target;
  if (t.closest("[data-needs-place]")) { const s = $("sec-place"); if (s) s.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); return; }
  const d = t.closest("[data-needs-draft]");
  if (d && lastResult && lastResult.needs) {
    const i = +d.dataset.needsDraft, c = lastResult.needs.criteria[i], box = $("needsDraft" + i);
    d.disabled = true;
    box.innerHTML = `<p class="progress">Drafting…</p>`;
    try {
      const r = await draftCriterion(c.text, lastScan.resume, m => { box.innerHTML = `<p class="progress">${esc(m)}</p>`; });
      box.innerHTML = r.text ? `<div class="li-sug"><p>${esc(r.text).replace(/\n/g, "<br>")}</p><div class="li-sug-foot"><span class="small muted">${r.via ? `Drafted by ${esc(viaWords(r.via))} from your resume. Check every detail is true.` : "A frame to finish yourself (no AI connected): fill in the brackets."}</span><button class="btn" type="button" data-copy-draft="${i}">Copy</button></div></div>` : `<p class="small muted">Add more detail to your resume first, so there's something to draw on.</p>`;
      const cp = box.querySelector("[data-copy-draft]");
      if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(r.text); cp.textContent = "Copied"; } catch { cp.textContent = "Select and copy it"; } };
    } finally { d.disabled = false; }
    return;
  }
  if (t.closest("#needsAiBtn") && lastResult && lastResult.needs) {
    const btn = $("needsAiBtn"), note = $("needsAiNote");
    btn.disabled = true; note.classList.add("busy");
    try {
      const r = await aiJobNeeds(lastScan.jd, lastResult, m => { note.textContent = m; });
      if (!r) { note.textContent = sample || smallEngine() || (await chromeAIState()) === "available" ? "The AI's answer couldn't be checked against the ad, so nothing was added. Try again." : "No AI is connected. Choose one in Connect your AI."; return; }
      lastResult.needs.ai = r; note.textContent = "";
      $("needsAiOut").innerHTML = needsAiHtml(r);
    } finally { btn.disabled = false; note.classList.remove("busy"); }
  }
}
