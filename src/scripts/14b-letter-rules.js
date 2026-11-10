/* ===================== Cover letter rules: one set of checks for every cover letter writer ===================== */
// Pure functions with no page, profile or AI in them, so they can be tested on their own (see tests/letter-rules.test.mjs).
// Both writers use them: Create or edit cover letter (23e) and Tailor to a job (15). The idea they carry:
//   The person supplies the facts and the reason. The AI supplies the wording. Code checks every number, every name and every banned phrase.
// Loaded after 14a (the craft rules) and before the writers.
const LR = (() => {
  /* --- One banned list, shared by the writers and the checker --- */
  const EXTRA_BANNED = ["i look forward to hearing from you", "excited", "eager to", "honed", "skill set", "skillset", "aligns with", "align with", "resonate", "testament", "invaluable",
    "furthermore", "moreover", "additionally", "esteemed", "renowned", "prestigious", "world-class", "industry leader", "don't hesitate", "do not hesitate", "i share your values", "always admired",
    "excellent communication skills", "strong communication skills", "unique opportunity", "in today's", "ever-evolving", "cutting-edge", "deeply", "truly",
    "passionate", "great fit", "my name is", "in short", "from day one", "from the first week", "from the first day", "rigorous"];
  const straight = s => String(s == null ? "" : s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // CLICHES (the resume scanner's list) and COVER_CLICHES (the old cover letter list) are used when the page has them
  const baseLists = () => [typeof CLICHES !== "undefined" ? CLICHES : [], typeof COVER_CLICHES !== "undefined" ? COVER_CLICHES : []];
  const bannedList = () => [...new Set([...baseLists().flat(), ...EXTRA_BANNED].map(s => straight(s).toLowerCase()).filter(s => s && s !== "responsible for" && s !== "duties included"))];
  const bannedRe = phrase => new RegExp("(?<![a-z])" + esc(phrase).replace(/\\-/g, "[- ]").replace(/ /g, "\\s+") + "(?![a-z])", "i");
  // → the banned phrases in the text (as written there)
  function bannedFound(text) {
    const t = straight(text), out = [];
    for (const p of bannedList()) { const m = t.match(bannedRe(p)); if (m) out.push(m[0].toLowerCase()); }
    return [...new Set(out)];
  }

  /* --- Words and sentences --- */
  // (a placeholder's guidance text is not counted: each [CAPS: guidance] is one word, standing for what will be written there)
  const words = t => (straight(t).replace(/\[[A-Z][A-Z0-9 &\/'-]{1,34}:[^\[\]\n]{3,80}\]/g, " gap ").match(/[A-Za-z0-9][A-Za-z0-9'’%$:.,-]*/g) || []).filter(w => /[A-Za-z0-9]/.test(w)).length;
  // a full stop after an abbreviation or inside a number or a [gap] doesn't end a sentence
  function sentences(text) {
    const masked = straight(text).replace(/\[[^\]]*\]|\{[^}]*\}/g, m => m.replace(/[.!?]/g, "\u0001")).replace(/(\d)\.(\d)/g, "$1\u0002$2")
      .replace(/\b(Mr|Mrs|Ms|Dr|Prof|St|Pty|Ltd|Inc|No|vs|e\.g|i\.e|approx)\./gi, m => m.replace(".", "\u0002"));
    return (masked.match(/[^.!?]+(?:[.!?]+["']?|$)/g) || []).map(s => s.replace(/\u0001/g, ".").replace(/\u0002/g, ".").trim()).filter(Boolean);
  }
  const startWords = (s, n = 2) => straight(s).toLowerCase().replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean).slice(0, n).join(" ");

  /* --- Numbers: every figure in a paragraph must be in the facts the writer was given --- */
  const ONES = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
  const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  function normNumbers(s) {
    let t = straight(s).toLowerCase().replace(/\bper\s*cent\b|\bpercent\b/g, "%").replace(/\s+%/g, "%").replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/\$\s*(?=\d)/g, "");
    const tensRe = Object.keys(TENS).join("|"), onesRe = Object.keys(ONES).join("|");
    t = t.replace(new RegExp(`\\b(${tensRe})[- ](one|two|three|four|five|six|seven|eight|nine)\\b`, "g"), (m, a, b) => String(TENS[a] + ONES[b]));
    t = t.replace(new RegExp(`\\b(${tensRe})\\b`, "g"), (m, a) => String(TENS[a]));
    t = t.replace(new RegExp(`\\b(${onesRe})\\b`, "g"), (m, a) => String(ONES[a]));
    t = t.replace(/\b(\d+)\s+hundred\b/g, (m, a) => String(+a * 100)).replace(/\b(?:a|one)\s+hundred\b|\bhundred\b/g, "100");
    t = t.replace(/\b(\d+)\s+thousand\b/g, (m, a) => String(+a * 1000)).replace(/\bthousand\b/g, "1000");
    return t;
  }
  // the figures in some text: 30%, 4.5, 3:30, 2026... ("one" and a lone 1 are ignored: "one of", "one team")
  function numTokens(s) {
    const t = normNumbers(s).replace(/\[[^\]]*\]/g, " "), out = [];
    for (const m of t.match(/\d{1,2}:\d{2}|\d+(?:\.\d+)?%?/g) || []) out.push(m);
    return out.filter(n => n !== "1");
  }
  // → the figures in text that none of the sources has
  function ungrounded(text, sources) {
    const have = new Set(numTokens((sources || []).join("\n")));
    return [...new Set(numTokens(text))].filter(n => !have.has(n));
  }

  /* --- Australian spelling, put right in code rather than trusting the model --- */
  const US_STEMS = "organi|prioriti|recogni|reali|speciali|analy|summari|utili|customi|maximi|minimi|standardi";
  const US_WORDS = [["colors?", "colour"], ["behaviors?", "behaviour"], ["centers?", "centre"], ["favorites?", "favourite"], ["honors?", "honour"], ["enroll", "enrol"], ["fulfill", "fulfil"], ["traveled", "travelled"], ["traveling", "travelling"],
    ["canceled", "cancelled"], ["modeling", "modelling"]];
  // (exact words only: a loose ".*size" pattern would wrongly keep "emphasized")
  const IZE_KEEP = /^((over|under|down|up|re|super|mid|full|life|bite|king|pint|plus|out)-?)?siz(e|es|ed|ing)$|^(seiz|priz|capsiz)(e|es|ed|ing)$|^(maize|baize)$/i;
  function auSpelling(text) {
    let t = String(text).replace(new RegExp("\\b(" + US_STEMS + ")(z)(e|ed|es|ing|ation|ations|er|ers)?\\b", "gi"), (m, stem, z, rest) => stem + (z === "Z" ? "S" : "s") + (rest || ""));
    for (const [us, au] of US_WORDS) t = t.replace(new RegExp("\\b(" + us + ")\\b", "gi"), m => {
      const base = au + (/^[a-z]+s$/i.test(m) && /\?$/.test(us) ? "s" : "");   // colors → colours
      return /^[A-Z]/.test(m) ? base[0].toUpperCase() + base.slice(1) : base;
    });
    t = t.replace(/\blabor\b/g, "labour");   // lowercase only: "Labor" can be a party
    // any other -ize / -yze word (optimizing, maximize…): one general rule, with the words that really end that way kept
    t = t.replace(/\b([A-Za-z]+?)([yi])z(e|es|ed|ing|ation|ations|er|ers)\b/g, (m, stem, v, suf) => IZE_KEEP.test(m) ? m : stem + v + "s" + suf);
    return t;
  }

  /* --- Names: a capitalised word that isn't in anything the writer was given is probably made up --- */
  const KNOWN_CAPS = new Set("i monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december nsw vic qld wa sa tas act nt australia australian english".split(" "));
  function nameAllowlist(sources) {
    const set = new Set();
    for (const w of straight((sources || []).join(" ")).match(/[A-Z][A-Za-z'-]*/g) || []) set.add(w.toLowerCase().replace(/'s$/, ""));
    return set;
  }
  function unknownNames(text, allow) {
    const t = straight(text).replace(/\[[^\]]*\]|\{[^}]*\}/g, " "), out = [];
    for (const raw of t.split(/(?<=[.!?])\s+/)) {
      (raw.match(/[A-Za-z][A-Za-z'-]*/g) || []).forEach((w, k) => {
        if (k === 0 || !/^[A-Z]/.test(w)) return;   // the first word of a sentence is always capitalised
        if (/^I['’](m|ve|d|ll)$/.test(w)) return;
        const base = w.toLowerCase().replace(/'s$/, "");
        if (KNOWN_CAPS.has(base) || /^[A-Z]{2,6}$/.test(w) || allow.has(base)) return;
        out.push(w.replace(/'s$/, ""));
      });
    }
    return [...new Set(out)];
  }

  /* --- Copying from the worked example --- */
  const wordList = t => straight(t).toLowerCase().replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean);
  function sharedSequence(a, b, n) {
    const A = wordList(a), B = wordList(b), seen = new Set();
    for (let i = 0; i + n <= B.length; i++) seen.add(B.slice(i, i + n).join(" "));
    for (let i = 0; i + n <= A.length; i++) { const g = A.slice(i, i + n).join(" "); if (seen.has(g)) return g; }
    return "";
  }

  /* --- One paragraph --- */
  // o: { min, max, sMin, sMax, sources[], employer, jobTitle, kind: "opening"|"evidence"|"why"|"close"|"any", example, names[], gaps (allow [brackets]), noNumbers }
  // → the problems, each as a short message the writer can act on
  const STOCK = ["thank you for considering", "the chance to discuss", "would welcome the chance", "my application"];
  function checkParagraph(text, o = {}) {
    const t = straight(text).trim(), errs = [], add = (code, msg) => errs.push({ code, msg });
    if (!t) return [{ code: "empty", msg: "The paragraph is empty." }];
    const n = words(t), ss = sentences(t);
    if (o.min != null && (n < o.min - 5 || n > o.max + 5)) add("words", `It has ${n} words. It must have ${o.min}–${o.max}.`);
    if (o.sMin != null && (ss.length < o.sMin || ss.length > o.sMax)) add("sentences", `It has ${ss.length} sentences. It must have ${o.sMin}–${o.sMax}.`);
    for (const s of ss) if (words(s) > 40) { add("long", `This sentence has ${words(s)} words; keep every sentence under 40: "${s.slice(0, 60)}…"`); break; }
    for (const p of bannedFound(t)) add("banned", `It uses "${p}", which is banned. Replace it with a specific fact or remove it.`);
    for (const ch of ["—", "!", "?", ...(o.gaps ? [] : ["[", "]", "{", "}"])]) if (t.includes(ch)) { add("punctuation", `It contains "${ch}". Remove it.`); break; }
    if (/\n/.test(text)) add("punctuation", 'It contains "a line break". Remove it.');
    if (!o.noNumbers && o.sources) for (const x of ungrounded(t, o.sources)) add("number", `It uses "${x}", which isn't in the facts. Remove it, or use a number that is in the facts.`);
    if (o.kind === "opening" && o.employer && o.jobTitle) {
      const first = ss.slice(0, 2).join(" ").toLowerCase();
      if (!first.includes(straight(o.employer).toLowerCase()) || !first.includes(straight(o.jobTitle).toLowerCase())) add("title", `The job title "${o.jobTitle}" and the employer "${o.employer}" must both appear, spelled exactly like that, in the first two sentences.`);
    }
    if (o.kind === "why" && o.employer && !t.toLowerCase().includes(straight(o.employer).toLowerCase())) add("employer", `It must name the employer, "${o.employer}".`);
    if (o.sources || o.names) {
      const allow = nameAllowlist([...(o.sources || []), ...(o.names || []), o.employer || "", o.jobTitle || ""]);
      for (const nm of unknownNames(t, allow).slice(0, 2)) add("name", `It mentions "${nm}", which isn't in the information given. Remove it.`);
    }
    if (o.example && o.kind !== "close") { const g = sharedSequence(t, o.example, 6); if (g) add("copy", `It copies words from the example: "${g}". Use your own words and the applicant's facts.`); }
    return errs;
  }

  /* --- Between paragraphs --- */
  // ps: the paragraphs in order. → [{ i, code, msg, phrase }] where i is the later paragraph to write again
  function crossChecks(ps, o = {}) {
    const out = [], skip = [o.employer, o.jobTitle, ...STOCK].filter(Boolean).map(s => straight(s).toLowerCase());
    const strip = t => { let x = straight(t).toLowerCase(); for (const s of skip) x = x.split(s).join(" "); return wordList(x); };
    const grams = ps.map(p => { const w = strip(p), g = new Set(); for (let i = 0; i + 4 <= w.length; i++) g.add(w.slice(i, i + 4).join(" ")); return g; });
    for (let j = 1; j < ps.length; j++) for (let i = 0; i < j; i++) {
      let hit = ""; for (const g of grams[j]) if (grams[i].has(g)) { hit = g; break; }
      if (hit) { out.push({ i: j, code: "repeat", phrase: hit, msg: `It repeats "${hit}" from another paragraph. Say it differently or leave it out.` }); break; }
    }
    const starts = ps.map(p => startWords(p));
    for (let j = 1; j < ps.length; j++) for (let i = 0; i < j; i++) if (starts[j] && starts[j] === starts[i]) { out.push({ i: j, code: "start", phrase: starts[j], msg: `It starts the same way as another paragraph ("${starts[j]}"). Start differently.` }); break; }
    return out;
  }
  // the share of sentences that begin with I or My (the checker's "focus" test: 50% or fewer)
  const iStartShare = ps => { const all = ps.flatMap(sentences); return all.length ? all.filter(s => /^(I|I'm|I've|I'd|I'll|My)\b/.test(straight(s))).length / all.length : 0; };

  /* --- Length: how long the whole letter should be --- */
  // The global rules: five body paragraphs, 330 to 390 words, one page. The five budgets add up to 330 at the least and 388 at the most.
  // "short" is still there for a letter the person chooses to keep short, or an ad that sets a word limit; it is never the default.
  const LENGTH = { standard: [330, 390], short: [150, 250] };
  // Words per paragraph (the paragraph specs): opening 55 to 70, work experience 95 to 110, education and skills 75 to 90, why this company 65 to 85, close 35 to 50.
  // "evidence" is the older shared budget for the two evidence paragraphs, kept for the Tailor to a job checks.
  const BUDGET = { standard: { opening: [55, 70], experience: [95, 110], education: [75, 90], evidence: [78, 90], why: [65, 85], close: [35, 50] }, short: { opening: [35, 55], experience: [48, 65], education: [40, 55], evidence: [40, 65], why: [20, 35], close: [15, 45] } };
  const lengthDefault = () => "standard";
  // a word or character limit from the ad scales every paragraph (never the opening below 30 words)
  function scaleBudget(range, limit, headerWords = 40) {
    if (!limit) return range;
    const k = Math.max(0.3, (limit - headerWords) / 330);
    return [Math.max(10, Math.round(range[0] * k)), Math.max(15, Math.round(range[1] * k))];
  }

  /* --- Dates and years of experience: done in code, never by the model --- */
  const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  function parseYM(s, end, now = new Date()) {
    const t = straight(s).toLowerCase().trim();
    if (!t) return null;
    if (/present|current|now|ongoing/.test(t)) return now.getFullYear() * 12 + now.getMonth();
    const m = t.match(/([a-z]{3})[a-z]*\.?\s*,?\s*(\d{4})/) || null, y = t.match(/\b(19|20)\d{2}\b/);
    if (m && MON.includes(m[1])) return +m[2] * 12 + MON.indexOf(m[1]);
    if (y) return +y[0] * 12 + (end ? 11 : 0);
    return null;
  }
  // roles: [{ start, end, current, field, paid }] → whole years in a field, overlapping roles counted once
  function monthsIn(roles, field, now = new Date()) {
    const iv = roles.filter(r => r.paid !== false && (!field || (r.field || "") === field)).map(r => [parseYM(r.start, false, now), r.current ? parseYM("present", true, now) : parseYM(r.end, true, now)]).filter(([a, b]) => a != null && b != null && b >= a).sort((x, y) => x[0] - y[0]);
    let total = 0, cur = null;
    for (const [a, b] of iv) { if (!cur || a > cur[1] + 1) { if (cur) total += cur[1] - cur[0] + 1; cur = [a, b]; } else cur[1] = Math.max(cur[1], b); }
    if (cur) total += cur[1] - cur[0] + 1;
    return total;
  }
  const yearsText = (months, field) => { const y = Math.round(months / 12); return months >= 12 ? `${y} year${y === 1 ? "" : "s"}${field ? " in " + field : ""}` : months >= 2 ? `${months} months${field ? " in " + field : ""}` : ""; };
  // → { situation, modifiers[], reason }. The person can always change it.
  function deriveSituation(i, now = new Date()) {
    const roles = i.roles || [], paid = roles.filter(r => r.paid !== false);
    if (i.expressionOfInterest) return { situation: "expression_of_interest", modifiers: [], reason: "No job is advertised." };
    if (i.internal) return { situation: "internal", modifiers: [], reason: "You work for this employer already." };
    const mods = [];
    if (i.personState && i.jobState && i.personState !== i.jobState) mods.push("relocating");
    // a degree that is nearly finished (or was finished within the year), for a graduate, intern or entry-level job, or with under two years of paid work in the field
    if (i.graduate) return { situation: "graduate", modifiers: mods, reason: "You are completing, or have just finished, a degree, and this is an entry-level job." };
    if (!paid.length) return { situation: "first_job", modifiers: mods, reason: "No paid jobs yet." };
    const ends = paid.map(r => r.current ? Infinity : parseYM(r.end, true, now)).filter(x => x != null);
    const lastEnd = Math.max(...ends), nowM = now.getFullYear() * 12 + now.getMonth();
    if (isFinite(lastEnd) && nowM - lastEnd > 12) return { situation: "returning", modifiers: mods, reason: "Your last job ended more than a year ago." };
    const latest = paid.slice().sort((a, b) => (parseYM(b.start, false, now) || 0) - (parseYM(a.start, false, now) || 0))[0];
    if (i.jobField && latest && latest.field && latest.field !== i.jobField && i.recentInJobField) return { situation: "career_change", modifiers: mods, reason: `Your last job was in ${latest.field}, this one is in ${i.jobField}, and you have recent ${i.jobField} training or experience.`, from_field: latest.field, to_field: i.jobField };
    return { situation: "standard", modifiers: mods, reason: "" };
  }
  const SITUATIONS = { standard: "Standard", graduate: "Student or recent graduate", career_change: "Career change", first_job: "First job", returning: "Returning to work", stepping_back: "Stepping back to a hands-on role", internal: "Applying inside my own employer", expression_of_interest: "Expression of interest (no job advertised)" };

  /* --- What the ad says it wants --- */
  function adInstructions(ad) {
    const t = straight(ad || ""), out = { coverLetter: "unstated", selectionCriteria: false, pitch: false, salaryRequested: false, wordLimit: null, employmentType: "unstated", checks: [] };
    if (!t.trim()) return out;
    if (/\b(do not|don'?t|please do not|no need to|not required to)\s+(send|submit|include|attach|provide|upload)\s+(a\s+|an\s+)?cover letter|cover letters? (are|is) not (required|needed|accepted|necessary|requested)|no cover letter\b/i.test(t)) out.coverLetter = "not_wanted";
    else if (/\b(must|please|should)\s+(include|submit|attach|provide|upload|send)\s+(a\s+|an\s+)?cover letter|cover letter (is )?(required|essential|mandatory)/i.test(t)) out.coverLetter = "required";
    else if (/cover letter (is )?(optional|not essential)|(optional|optionally).{0,20}cover letter/i.test(t)) out.coverLetter = "optional";
    out.selectionCriteria = /\bselection criteria\b|\bkey selection\b|address(ing)? the (key )?(selection )?criteria|statement of claims|statement addressing/i.test(t);
    out.pitch = /\b(?:one|two|1|2)[- ]page pitch\b|\byour pitch\b|\bsubmit a pitch\b|\bwritten pitch\b|\b\d{3,4}[- ]word pitch\b|\bpitch (?:outlining|explaining|describing|addressing)\b/i.test(t);
    out.salaryRequested = /\b(state|include|provide|indicate|outline|advise|nominate)\b[^.\n]{0,30}\b(salary|remuneration)\b|\bsalary (expectations?|requirements?)\b|\bexpected salary\b/i.test(t);
    const wl = t.match(/(?:no more than|maximum of|max(?:imum)?(?: of)?|up to|limit(?:ed)? to|within|under)\s+(\d{2,4})\s+words|\b(\d{2,4})[- ]word (?:limit|cover letter|pitch|statement|response)/i);
    if (wl) out.wordLimit = +(wl[1] || wl[2]);
    const emp = t.match(/\b(casual|part[- ]time|full[- ]time|contract|temporary|fixed[- ]term|permanent)\b/i);
    if (emp) out.employmentType = { casual: "casual", "part-time": "part_time", "part time": "part_time", "full-time": "full_time", "full time": "full_time", contract: "contract", temporary: "contract", "fixed-term": "contract", "fixed term": "contract", permanent: "full_time" }[emp[1].toLowerCase()] || "unstated";
    const CK = [[/working with children check|\bwwcc\b|blue card/i, "Working with Children Check"], [/ndis worker screening/i, "NDIS Worker Screening Check"], [/police check|national criminal history check/i, "police check"], [/first aid/i, "First Aid"], [/\bcpr\b/i, "CPR"],
      [/\brsa\b|responsible service of alcohol/i, "RSA"], [/white card|construction induction/i, "White Card"], [/driver'?s? licen[cs]e|drivers licen[cs]e/i, "driver's licence"], [/forklift/i, "forklift licence"], [/food (handling|safety)/i, "food safety certificate"]];
    out.checks = CK.filter(([re]) => re.test(t)).map(([, n]) => n);
    return out;
  }
  // "Customer Service Team Leader – Parramatta (Ref CS-2231)" → "Parramatta"
  function adLocation(ad, title = "") {
    const first = straight(ad || "").split(/\n/).map(s => s.trim()).filter(Boolean)[0] || "";
    const m = first.replace(/\(.*?\)/g, "").split(/\s+[–-]\s+|\s+\|\s+|,\s+/).map(s => s.trim()).filter(Boolean);
    const loc = m.slice(1).find(s => /^[A-Z][A-Za-z' ]{2,24}$/.test(s) && s.split(" ").length <= 3 && !/\b(casual|part|full|contract|team|manager|assistant|officer|support|worker|coordinator)\b/i.test(s));
    return loc && !straight(title).toLowerCase().includes(loc.toLowerCase()) ? loc : "";
  }

  /* --- The parts of the letter that are always made in code --- */
  function greeting(userField, contactName) {
    const u = String(userField || "").trim();
    if (u) return /^dear\b/i.test(u) ? (/[,]$/.test(u) ? u : u + ",") : `Dear ${u.replace(/[,\s]+$/, "")},`;
    const c = String(contactName || "").trim();
    return c ? `Dear ${c},` : "Dear Hiring Manager,";
  }
  function reLine(title, o = {}) {
    if (o.expressionOfInterest) return `Re: Expression of interest – ${o.targetRole || title || ""}`.trim();
    const loc = o.location && !straight(title).toLowerCase().includes(String(o.location).toLowerCase()) ? `, ${o.location}` : "";
    return `Re: ${title}${loc}${o.ref ? ` (Ref ${o.ref})` : ""}`;
  }
  const emailSubject = (title, name, ref) => `Application: ${title}${ref ? ` (Ref ${ref})` : ""} – ${name}`;
  const listAnd = a => a.length < 2 ? a.join("") : a.length === 2 ? a.join(" and ") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  // The close, if the writer can't make one that passes: availability, checks, salary, the trial shift, then the thanks
  function closeFallback(o = {}) {
    const sentence = s => /[.!?]$/.test(s) ? s : s + ".";
    const av = String(o.availability || "").trim().replace(/[.\s]+$/, "");
    return [av && sentence(/^I\b/.test(av) ? av : "I'm available " + av.replace(/^available\s+/i, "")),
      o.checks && o.checks.length && `I hold ${listAnd(o.checks)}.`,
      o.salary && sentence(`My salary expectation is ${String(o.salary).replace(/[.\s]+$/, "")}`),
      o.trialShift && "I'd be happy to do a paid trial shift whenever suits you.",
      "Thank you for considering my application. I'd welcome the chance to discuss the role."].filter(Boolean).join(" ");
  }

  /* --- The questions to ask before writing --- */
  const EXAMPLES = { why_them: "e.g. I use their app myself, or I like how their graduate program rotates teams", hook_number: "e.g. about 120 customers a day, or cut it from 4 hours to 2",
    availability: "e.g. weekends and after 4pm on weekdays, or two weeks' notice", salary: "e.g. $70,000 to $75,000 plus super" };
  // i: { whyGiven, hookText, gaps:[{id,text}], needAvailability, availabilityGiven, salaryRequested, salaryGiven, otherNames:[] }
  function questions(i) {
    const q = [];
    if (!i.whyGiven) q.push({ type: "why_them", target_id: "", question: "Why this employer? In your own words, one real reason.", example: EXAMPLES.why_them });
    if (i.hookText && !/\d/.test(i.hookText)) q.push({ type: "hook_number", target_id: "hook", question: `How many, how much or how often? "${String(i.hookText).slice(0, 70)}"`, example: EXAMPLES.hook_number });
    for (const g of (i.gaps || []).slice(0, 1)) q.push({ type: "gap", target_id: g.id, question: `The ad asks for "${String(g.text).slice(0, 70)}". Anything you've done that shows it?`, example: "A short example: what you did, and what came of it" });
    if (i.needAvailability && !i.availabilityGiven) q.push({ type: "availability", target_id: "", question: "When can you work?", example: EXAMPLES.availability });
    if (i.salaryRequested && !i.salaryGiven) q.push({ type: "salary", target_id: "", question: "The ad asks for a salary expectation. What range?", example: EXAMPLES.salary });
    for (const n of (i.otherNames || []).slice(0, 1)) q.push({ type: "check_name", target_id: n, question: `You mention "${n}", which isn't this employer. Is that right?`, example: "" });
    const why = q.find(x => x.type === "why_them"), rest = q.filter(x => x !== why).slice(0, why ? 2 : 3);
    return why ? [why, ...rest] : rest;
  }


  /* --- What small models let through: the checks from the fix brief (all pure, so they can be tested) --- */
  const BANNED_PATTERNS = [
    /\balign(s|ed|ing)?\s+(with|to)\b/, /\bdemonstrat(ed|es|ing)\s+(ability|capacity|skills?)\b/, /\b(developed|gained|built)\s+(a\s+)?(proficiency|skills?|abilit(y|ies))\b/, /\bproficien(t|cy)\b/,
    /\b(is|are|was|will be|would be)\s+(crucial|essential|vital|key|valuable|important|critical)\s+(for|to|in|when)\b/, /\b(successful|positive)\s+outcomes?\b/, /\beffective(ly)?\b/, /\bproblem[- ]solving\b/,
    /\binterpersonal\b/, /\banalytical skills\b/, /\bplease feel free\b/, /\bcommence\b/, /\b(i am|i'm) drawn to\b/, /\bthe (job|position) description (requests|states|asks)\b/, /\bmy (first|next|main) task was\b/, /\bi was working on\b/,
    // stacked adjectives ("rigorous, tool-based approach"): a concrete noun says it better
    /\b[a-z]+,\s+[a-z]+-(?:based|driven|focused|led|oriented|centred|centered)\b/
  ];
  const PLACEHOLDER = /\[[^\]]*\]|[{}]|\be\.g\./i;
  const BANNED_SENTENCE_START = /^(this|these|that|such)\s+(ability|abilities|experience|experiences|skill|skills|knowledge|expertise)\b/i;
  // → the banned wording found (as written). o.placeholders: also brackets and "e.g." (a finished letter has neither)
  function patternsFound(text, o = {}) {
    const t = straight(text), out = [];
    for (const re of BANNED_PATTERNS) { const m = t.match(new RegExp(re.source, "i")); if (m) out.push(m[0].toLowerCase()); }
    if (o.placeholders) { const m = t.match(PLACEHOLDER); if (m) out.push(m[0]); }
    return out;
  }
  const badSentenceStarts = text => sentences(text).filter(x => BANNED_SENTENCE_START.test(straight(x).trim())).map(x => x.trim());
  // one to nine as words, unless a unit, a time, a decimal, a range or a name follows or precedes ("Year 9", "Python 3", "3:30", "2-3", "5%")
  const NUM_WORD = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const NUM_LABELS = /^(year|level|phase|grade|step|stage|part|python|version|tier|class|unit|room|page|figure|table|module|chapter|gen|week|day|stream|group|team|form|q|windows|ios)$/i;
  function numberWords(text) {
    const s = String(text);
    return s.replace(/(?<![\w.$£€/:+-])([1-9])(?![\w%:/-]|[.,]\d)(?!\s*(?:%|am\b|pm\b|kwh?\b|mwh?\b|gw\b|km\b|mm\b|cm\b|kg\b|ml\b|[mgtlx]\b))/gi, (m, d, off) => {
      const before = s.slice(0, off), pm = before.match(/([A-Za-z][A-Za-z'-]*)\s*$/), prev = pm && pm[1];
      if (prev && /^[A-Z]/.test(prev)) {
        // a capitalised word is a label ("Year 9", "Python 3") unless it only starts the sentence ("Over 5 years")
        const sentenceStart = !/[A-Za-z0-9,;:)]\s*$/.test(before.slice(0, before.length - pm[0].length));
        if (!sentenceStart || NUM_LABELS.test(prev)) return m;
      }
      const w = NUM_WORD[+d];
      return /(^|[.!?]\s+)$/.test(before) ? w[0].toUpperCase() + w.slice(1) : w;
    });
  }
  // A sentence that names a degree still being studied but speaks of it as held
  const HELD = /\b(i hold|i have an?|i've completed|i have completed|i've finished|i have finished|i graduated|graduate of)\b/i;
  function tenseProblem(text, creds) {
    for (const x of sentences(text)) {
      const t = straight(x);
      if (!HELD.test(t)) continue;
      if (/\b(degree|master'?s|bachelor'?s|diploma|doctorate)\b/i.test(t) || (creds || []).some(c => c && t.toLowerCase().includes(String(c).toLowerCase()))) return x.trim();
    }
    return "";
  }
  // terms: [{ term, kind, limit }] → the ones used in more paragraphs than their limit: [{ term, kind, limit, where[] }]
  // (a credential name or a date: one paragraph; a tool, a project or a past employer: two)
  const termRe = term => new RegExp("(?<![A-Za-z0-9])" + esc(straight(term)).replace(/\s+/g, "\\s+") + "(?![A-Za-z0-9])", "i");
  function termUse(paragraphs, terms) {
    const out = [];
    for (const t of terms || []) {
      if (!t || !t.term) continue;
      const re = termRe(t.term), where = paragraphs.map((p, i) => re.test(straight(p)) ? i : -1).filter(i => i >= 0);
      if (where.length > (t.limit || 1)) out.push({ ...t, where });
    }
    return out;
  }
  const STEMS = ["analy(?!st)", "effective", "skill", "abilit", "proficien", "demonstrat", "experience"];
  function stemCounts(paragraphs) {
    const all = paragraphs.map(p => straight(p).toLowerCase()), out = {};
    for (const st of STEMS) { const n = all.map(p => (p.match(new RegExp("\\b" + st + "\\w*", "g")) || []).length); const total = n.reduce((a, b) => a + b, 0); if (total > 3) out[st.replace(/\(.*$/, "")] = { total, most: n.indexOf(Math.max(...n)) }; }
    return out;
  }
  const SENTENCE_CAP = { opening: 3, experience: 6, education: 5, evidence: 5, why: 4, close: 4 };
  const PART_KIND = { opening: "opening", experience: "experience", education: "education", motivation: "why", closing: "close" };
  // paras: [{ kind: "opening"|"experience"|"education"|"motivation"|"closing", text }]
  // ctx: { length, jobTitle, employer, creds[] (degrees still being studied), terms[] } → [{ i, type, detail }]
  function validateLetter(paras, ctx = {}) {
    const issues = [], add = (i, type, detail) => issues.push({ i, type, detail });
    const bud = BUDGET[ctx.length === "short" ? "short" : "standard"];
    paras.forEach((p, i) => {
      const text = p.text || "", k = PART_KIND[p.kind] || p.kind;
      const ph = text.match(PLACEHOLDER); if (ph) add(i, "placeholder", `“${ph[0]}” is a gap that was never filled in`);
      const n = words(text), b = bud[k];
      if (b && n > Math.round(b[1] * 1.2)) add(i, "too_long", `${n} words: this paragraph should be ${b[0]} to ${b[1]}`);
      const sn = sentences(text).length; if (SENTENCE_CAP[k] && sn > SENTENCE_CAP[k]) add(i, "too_many_sentences", `${sn} sentences: no more than ${SENTENCE_CAP[k]}`);
      for (const m of patternsFound(text)) add(i, "banned", `“${m}”`);
      for (const m of badSentenceStarts(text)) add(i, "filler", `“${m.slice(0, 60)}” explains why something matters instead of ending on a fact`);
      const tp = tenseProblem(text, ctx.creds); if (tp) add(i, "tense", `“${tp.slice(0, 70)}”: that degree is still being studied`);
      if (auSpelling(text) !== text) add(i, "spelling", "US spelling");
    });
    const open = paras.findIndex(p => p.kind === "opening");
    if (open >= 0) {
      const t = straight(paras[open].text).toLowerCase();
      if (ctx.jobTitle && !t.includes(straight(ctx.jobTitle).toLowerCase().replace(/[.\s]+$/, ""))) add(open, "opening_title", "the opening doesn't name the job");
      if (ctx.employer && !t.includes(straight(ctx.employer).toLowerCase().replace(/\b(pty|ltd|limited|inc)\b\.?/g, "").trim())) add(open, "opening_employer", "the opening doesn't name the employer");
    }
    // the whole letter: 330 to 390 words in five paragraphs (placeholder guidance not counted), unless the person chose a short letter or the ad sets a limit
    if (paras.length === 5 && ctx.length !== "short" && !ctx.wordLimit) {
      const total = paras.reduce((n, p) => n + words(p.text || ""), 0), [lo, hi] = LENGTH.standard;
      if (total < lo) add(paras.length - 1, "length", `the letter is ${total} words: it should be ${lo} to ${hi}, so add a fact or an example`);
      else if (total > hi) add(paras.length - 1, "length", `the letter is ${total} words: it should be ${lo} to ${hi}, so cut the least useful detail`);
    }
    for (const u of termUse(paras.map(p => p.text || ""), ctx.terms)) add(u.where[u.where.length - 1], "repeat_term", `“${u.term}” is in ${u.where.length} paragraphs (the limit is ${u.limit || 1})`);
    for (const [st, v] of Object.entries(stemCounts(paras.map(p => p.text || "")))) add(v.most, "repeat_stem", `“${st}…” is used ${v.total} times in the letter`);
    return issues;
  }

  return { BANNED_PATTERNS, patternsFound, badSentenceStarts, numberWords, tenseProblem, termUse, stemCounts, validateLetter, SENTENCE_CAP, PART_KIND, EXTRA_BANNED, straight, bannedList, bannedFound, words, sentences, startWords, normNumbers, numTokens, ungrounded, auSpelling, nameAllowlist, unknownNames, sharedSequence, checkParagraph, crossChecks, iStartShare,
    LENGTH, BUDGET, lengthDefault, scaleBudget, parseYM, monthsIn, yearsText, deriveSituation, SITUATIONS, adInstructions, adLocation, greeting, reLine, emailSubject, listAnd, closeFallback, questions };
})();
