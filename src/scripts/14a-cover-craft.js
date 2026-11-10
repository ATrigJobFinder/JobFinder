/* ===================== Cover letter craft: what recruiters read for, from the cover letter specification ===================== */
// The rules every cover letter paragraph follows (tailored beats generic; the opening matters most; motivation can't be faked),
// the phrases that make a letter read as AI-written or clichéd, guides for each paragraph, and checks done in code.
// Loaded before the cover letter code (15) and the AI prompts (17), which use CL_CRAFT.

// Career level for the rules: students are "entry"; the letter page uses the same stages as the resume
const CL_LEVEL = { student: "entry", early: "early", returning: "early", change: "mid", experienced: "senior" };

/* --- Phrases to avoid: matched in code, never left to the AI to police --- */
// Hard: always replace. Written as regex source, case-insensitive.
const CL_HARD = [
  "i am writing to (express|apply|inquire|enquire|submit)", "i'?m writing to (express|apply)", "to whom it may concern", "dear sirs?\\b", "my name is", "please accept (this|my) (letter|application)", "i hope this (letter|message|email) finds you",
  "i am (excited|thrilled|delighted) to (apply|submit)", "i was (thrilled|excited) to (see|discover|come across)",
  "(perfect|ideal|great|excellent|strong) (fit|candidate|match)\\b", "i believe i (would be|am) (a|an|the)", "(would|will) be an? (asset|valuable addition)", "best candidate", "dream (job|role|company)",
  "results[- ]driven", "results[- ]oriented", "detail[- ]oriented", "team player", "hard[- ]?working", "go[- ]getter", "self[- ]starter", "think(ing)? outside (of )?the box", "proven track record", "track record of success", "fast[- ]paced (environment|setting)",
  "dynamic (team|environment|professional|individual|organi[sz]ation)", "highly motivated", "motivated individual", "seasoned professional", "wear many hats", "hit the ground running", "strong work ethic", "excellent (communication|interpersonal) skills",
  "go(ing)? above and beyond", "synerg(y|ies)", "move the needle", "leverag(e|ing) my (skills|experience|expertise|background)", "passionate about", "passion for", "add(ing)? value", "value[- ]add", "game[- ]?changer", "cutting[- ]edge", "world[- ]class", "industry[- ]leading", "thought leader", "esteemed", "prestigious", "renowned",
  "delve", "testament to", "tapestry", "beacon of", "in the realm of", "navigat(e|ing) the complexit(y|ies)", "ever[- ](evolving|changing)", "in today'?s (fast[- ]paced|competitive|digital|ever)", "unwavering", "embark(ed|ing)? on", "my (professional |career )?journey",
  "resonat(e|es|ed) (deeply|with me|strongly)", "align(s|ed)? perfectly", "seamless(ly)?", "multifaceted", "(it'?s|it is) not (just|only|merely) about", "in conclusion", "in summary", "to sum up",
  "i('ll| will) (call|contact|follow up|be in touch|reach out)", "(please )?(do not|don'?t) hesitate", "thank(s| you) in advance", "at your earliest convenience", "i would be (so |very |extremely )?grateful for (any|the) opportunity",
  "i (would|will|'?d) (like to )?(begin|start) by", "(begin|start)(ing)? by learning", "learning (about|how) (the|your) (company|team|business|organi[sz]ation)", "smaller tasks?\b", "(your|the company'?s|its) current (projects|work)", "contribut\w* (to )?[a-z ]{0,25}immediately", "from the first project",
  "i know i (don'?t|do not|may not|might not)", "(although|while|even though) i (don'?t|do not|lack) (have )?(much|any|direct)",
  "passionate\\b", "in short\\b", "from (day|the (first|very first)) (one|day|week|month)\\b", "rigorous"
].map(s => new RegExp("\\b" + s, "i"));
// Soft: fine once, a habit when repeated
const CL_SOFT = [
  "i look forward to hearing from you", "thank you for your time and consideration", "i am confident", "eager to", "excited", "thrilled", "unique opportunity", "opportunity to contribute", "spearhead(ed)?", "hon(e|ed|ing)", "foster(ed|ing)?", "showcas(e|ed|ing)", "pivotal", "invaluable", "meticulous", "holistic", "robust", "elevate",
  "furthermore", "moreover", "additionally", "in addition", "not only .{1,60} but also", "unfortunately", "utili[sz](e|ed|ing)", "in order to", "\\bvery\\b", "\\breally\\b"
].map(s => new RegExp("\\b" + s, "i"));
// The plain-words version for prompts (models follow these better than regex)
const CL_BANNED_PLAIN = "I am writing to express | To whom it may concern | My name is | I am excited to apply | passionate | great fit | in short | from day one | from the first week | perfect fit | ideal candidate | I believe I would be | would be an asset | dream job | results-driven | detail-oriented | team player | hard-working | self-starter | think outside the box | proven track record | fast-paced environment | dynamic | highly motivated | strong work ethic | excellent communication skills | go above and beyond | synergy | leverage my skills | passionate about | passion for | add value | cutting-edge | world-class | industry-leading | esteemed | prestigious | renowned | delve | testament to | tapestry | beacon | realm | ever-evolving | in today's | unwavering | embark | journey | resonate | seamless | multifaceted | it's not just about | in conclusion | I will call you | do not hesitate | thanks in advance | at your earliest convenience | grateful for any opportunity | furthermore | moreover | spearheaded | honed | pivotal | invaluable | meticulous | robust";
// A placeholder is written [CAPS: short guidance]: the label in capitals, then what to put there (something found in five minutes of research).
// Well-formed ones are the only brackets a writer may leave in a letter, and their guidance text is not counted as words.
const CL_PH_RE = /\[[A-Z][A-Z0-9 &\/'-]{1,34}:[^\[\]\n]{3,80}\]/g;
const clPlaceholders = t => String(t || "").match(CL_PH_RE) || [];
const clMaxPlaceholders = part => part === "motivation" ? 3 : 2;   // paragraph 4 (why this employer) may have three, every other paragraph two
// The global rules for every cover letter (the whole letter is exactly five body paragraphs, 330 to 390 words, one page)
const CL_GLOBAL = `Global rules:
- The letter has exactly 5 body paragraphs and 330 to 390 words in the body, one page. Australian English.
- Confident, warm, plain: a capable person talking, not a list. Read each sentence aloud and rewrite it if it is awkward. Use natural transitions between ideas ("Outside engineering,", "Alongside this,", "That is why"), and use "by contrast" only for a real contrast. Vary how sentences begin. No more than two sentences in a row may begin with "I".
- Banned: "I am writing to", "My name is", "passionate", "team player", "great fit", "In short", "from day one", "from the first week", and sentence fragments.
- Write from the reader's side: each paragraph answers "what does this person do for us?"
- Truth: claim only what the resume states, or what the applicant could plainly defend in an interview. No inflated or speculative outcomes.
- Polish: embellish the wording slightly so each paragraph reads better than the plain facts. Choose the stronger, more exact verb that is still true at the same level of responsibility (helped with becomes contributed to; used becomes applied). Give each sentence a clear subject and a purposeful ending. You may add a short phrase of context that the facts plainly imply (why the work mattered, who it served). Never raise seniority (do not turn "helped" into "led"), and never add a number, name, tool, date, employer or outcome that the facts do not give. If you could not defend a phrase in an interview, leave it out.
- Do not restate resume bullets. Select one, say what it shows, and connect it to the job.
- Prefer concrete nouns over stacked adjectives (no "rigorous, tool-based" phrases).
- A detail you do not have is a placeholder written [CAPS: short guidance], at most 2 in a paragraph (3 in paragraph 4, why this employer). Each must be something the applicant finds in under five minutes. The letter must read sensibly for any industry once the placeholders are filled. The guidance inside a placeholder is not counted as words.
- Final self-edit before you reply: check every sentence for (a) grammar, especially subject and verb agreement across clauses; (b) a claim the resume does not support; (c) a slogan that could appear in anyone's letter. Fix all three.`;
const CL_CRAFT = `Craft rules (what recruiters read cover letters for):
- Truth over polish. Every claim about the candidate comes from the details given; every claim about the employer comes from the ad or the company details given. If a helpful detail is missing, write a placeholder such as [EMPLOYER PROJECT: a named project from their website] and never guess.
- One specific example with its scope and result beats a list of qualities. Show what the candidate did instead of calling them a strong communicator.
- About them, proven by you: each paragraph says what the candidate would do for this employer's stated need.
- Add what the resume can't: motivation, context, how the candidate works. Don't copy resume bullets.
- Swap test: if another applicant could send a sentence unchanged, make it specific or cut it.
- Plain, warm, confident voice, like a capable person writing to a respected colleague they haven't met. Short to medium sentences with varied openings; no more than two sentences in a row start with "I". No flattery, hype or apology.
- No em dashes, exclamation marks or questions. Never salary, age, health or family details.
- Never use these phrases or close variants: ${CL_BANNED_PLAIN}.
${CL_GLOBAL}`;
const CL_CRAFT_SHORT = `Plain, warm, confident, like a person talking. One specific example with a result; never restate a resume bullet. Full sentences only, no fragments. No em dashes or exclamation marks. No more than two sentences in a row begin with "I". Write for the reader: what this person does for them. Embellish the wording slightly (exact, stronger verbs and a clear purpose in each sentence) without raising seniority or adding any fact. Prefer concrete nouns to stacked adjectives. A missing detail is a placeholder [CAPS: short guidance] (at most 2 in a paragraph, 3 in the why-this-employer paragraph). Before replying, check grammar, any claim the resume does not support, and any slogan anyone could write. Avoid: ${CL_BANNED_PLAIN.split(" | ").slice(0, 36).join(" | ")}.`;

/* --- Rules for the small model's cover letter writing, and the checks that back them up in code --- */
// Tuned by running Chrome's on-device AI over eight different resumes and scoring the letters (tighter rules took the share of clean
// paragraphs from about 83% to 98%). The failures they target: sentences all starting with "I", clichés such as "eager" and
// "I am writing to", contractions, invented claims about the company, numbers changed or dropped, and names copied from the worked example.
// company: "none" when the AI knows only the company's name, "given" when the prompt carries real company details.
const clWriteRules = (company = "none") => `1. Use only the facts given. Never invent employers, numbers, tools, dates or results. Copy every number exactly as it appears in the facts.
2. Write in the first person, in plain warm Australian English, like a capable person talking. Sentences of 12 to 30 words, each a full sentence with a subject and a verb: no fragments. Read each sentence aloud: if it is awkward, rewrite it.
3. Vary how sentences begin, and join ideas with natural transitions ("Outside engineering,", "Alongside this,", "That is why"). No more than two sentences in a row may begin with "I". Use "by contrast" only for a real contrast.
4. Never write "I am writing to", "My name is", eager, keen, passionate, excited, thrilled, team player, results-driven, great fit, perfect fit, "in short", "from day one", "from the first week" or dynamic. No dashes, no exclamation marks, and no contractions: write "I am", never "I'm".
5. Never name a company, school, product or person that is not in the facts.
6. ${company === "given" ? "Say about the company only what the company details given say. Never add its reputation, values, culture, products or work from your own knowledge." : "You know nothing about the company except its name. Never say anything about its reputation, values, culture, products or work."}
7. No phone number, email address or link. No greeting and no sign-off.
8. Stay inside the facts for this paragraph. Do not bring in jobs, results or skills that belong to other paragraphs.
9. Write from the reader's side: the paragraph makes clear what you do for this employer.
10. Do not restate a resume line. Choose the one that matters, say what it shows, and connect it to the job.
11. Claim only what the facts state, or what you could plainly defend in an interview. No inflated or speculative outcomes. Within that limit, embellish the wording slightly: use the stronger, more exact verb that is still true at the same level of responsibility, and a short phrase of context the facts plainly imply. Never raise your seniority and never add a number, name, tool, date or result the facts do not give.
12. Prefer concrete nouns to stacked adjectives: never "rigorous, tool-based" style phrases.
13. A detail the facts do not give is a placeholder written [CAPS: short guidance], for example [EMPLOYER PROJECT: a named project from their website]. Use one only for something the applicant finds in under five minutes. It is the only thing you may put in square brackets. Never guess instead.
14. After writing, check each sentence for grammar (subject and verb agree across clauses), for a claim the facts do not support, and for a slogan that could appear in anyone's letter. Fix all three.`;
// The model writes "I'm" and "don't" even when told not to: put the full words back (a possessive like "Fernleaf's" is left alone)
const CL_CONTRACTION_RE = /\b(i['’]m|i['’]ve|i['’]d|i['’]ll|it['’]s|that['’]s|there['’]s|we['’]re|you['’]re|they['’]re|can['’]t|won['’]t|(?:do|does|did|is|are|was|were|has|have|had|would|could|should)n['’]t)\b/gi;
const CL_CONTRACTION = { "i'm": "I am", "i've": "I have", "i'd": "I would", "i'll": "I will", "it's": "it is", "that's": "that is", "there's": "there is", "we're": "we are", "you're": "you are", "they're": "they are", "can't": "cannot", "won't": "will not" };
const clNoContractions = t => String(t).replace(CL_CONTRACTION_RE, m => {
  const k = m.toLowerCase().replace(/’/g, "'"), full = CL_CONTRACTION[k] || k.replace(/n't$/, " not");
  return /^[A-Z]/.test(m) ? full[0].toUpperCase() + full.slice(1) : full;
});
// Praise or facts about the company that the AI made up. Anything inside a [gap] is ignored. company: its name, to catch "Acme's reputation".
// → the words that gave it away, or "".
function clCompanyClaim(text, company = "") {
  const t = String(text || "").replace(/\[[^\]]*\]|\{[^}]*\}/g, " ");
  const own = company && company.trim().length > 1 ? `${company.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['’]s\\s+(?:commitment|reputation|focus|culture|values|mission|innovation|products|approach|dedication|work|success|growth|expertise)|` : "";
  const m = t.match(new RegExp(own + "\\b(?:has|have|with) (?:a |an )?(?:strong |good |great |excellent |solid )?(?:reputation|record) (?:for|as|of)\\b|\\breputation for\\b|well[- ]respected|highly regarded|\\b(?:is|are) (?:known|renowned|recognised|recognized) (?:for|as)\\b|\\b(?:leader|leading provider) in\\b|\\b(?:your|their|the company'?s) (?:commitment|reputation|innovative|innovation|culture|values|mission|dedication|excellence)\\b|\\bstands? out (?:for|as)\\b|state-of-the-art|industry-leading", "i"));
  return m ? m[0] : "";
}

/* --- What each paragraph is for, how to write it at each career level, and what to avoid --- */
const CL_GUIDE = {
  opening: {
    why: "The opening is the part most hiring managers say matters most, and it may be the only part a busy reader sees.",
    good: "The exact role and company, then your single strongest relevant evidence with its number, then a plain link to what the employer needs.",
    avoid: "\"I am writing to express my interest\", restating the job title with nothing else, a question or gimmick, or leading with years of experience alone.",
    level: {
      entry: "Mention your qualification and when you finish it. The hook can be a project, placement, casual job or volunteer result; label university work as university work. Don't claim professional expertise.",
      early: "Name your current role and one concrete result that matches the top requirement.",
      mid: "Lead with a specific result and its scope (people, volume, budget, team). Years of experience only if they add meaning.",
      senior: "Lead with scope (team size, budget) and a business outcome, framed as the problem you solve, which the employer has."
    },
    example: "I'm applying for the Backend Developer role at Tallowood. In two years at Parcelpoint I've owned the returns API, and last year I rewrote its slowest endpoint in Go, cutting average response time from 1.8 seconds to 240 milliseconds across about 9,000 daily requests. Your listing puts API performance at the top of the role, and it is the part of my work I enjoy most."
  },
  experience: {
    why: "Tailored letters get far more callbacks than generic ones. This is where you prove the job's top requirement with one story.",
    good: "Context in a sentence, what you personally did, the result with its number, then why it matters for this employer's specific need. Use one or two of the ad's own keywords naturally.",
    avoid: "Listing duties, three mini-stories crammed together, results without your role in them, or a bridge that only says \"I would bring this to your team\".",
    level: {
      entry: "Evidence can be coursework, a capstone, an internship, a casual job, volunteering or a club. Be honest about scale, and show a transferable behaviour (accuracy, reliability, customer care) with a concrete moment.",
      early: "Your personal contribution with a measurable result; name the tool or method.",
      mid: "An outcome you owned, with its scope, and why you chose that approach.",
      senior: "An outcome delivered through others: what you decided, how you led, whom you influenced, with numbers for scale and result."
    },
    example: "When I joined Northgate's sales operations team, quarterly forecasts were assembled by hand from twelve regional spreadsheets and regularly missed by more than 20%. I moved the process into Salesforce, set up a weekly pipeline review with each regional lead, and built a simple win-probability model from two years of deal history. Within three quarters, forecasts were landing within 6% of actual revenue and finance stopped running its own separate numbers."
  },
  education: {
    why: "A second, different kind of proof makes you look rounded, not one-dimensional: the study, tools or way of working behind your experience.",
    good: "A different requirement from the experience paragraph, proved with different facts: a tool you use, a project, or how you work, each with a mini-example.",
    avoid: "Repeating the experience paragraph, listing every subject, or claiming more than you've done.",
    level: {
      entry: "How you work (reliability, teamwork, learning speed) with a mini-example from a casual job, club or group project, or a must-have tool evidenced through coursework.",
      early: "A second requirement or must-have skill, with proof.",
      mid: "A second requirement, often collaboration or stakeholder work, with a result.",
      senior: "Leadership: hiring, developing and keeping people, or influencing across teams, with numbers where you have them."
    },
    example: "Alongside my degree I've worked 15 hours a week at a busy cafe for three years. I trained six new staff, was trusted to close and cash up on my own, and kept the till balanced through the Saturday rush. Staying accurate when things get hectic is something I expect to need during year-end audits."
  },
  motivation: {
    why: "Recruiters say motivation is what they read letters for, and it is the one thing AI can't make up for you. Genuine, specific reasons are what still stands out.",
    good: "Your own reason, plus one or two specific things about the organisation (a product, customers, a project, a program feature) from the ad or your research, each tied to something true about you. End on what you want to do in the role.",
    avoid: "Flattery (\"industry leader\", \"innovative\"), values copied from the careers page with no link to you, invented company news, or \"a great opportunity for me\".",
    level: {
      entry: "What you want to learn or start your career on, and why this employer is the right place for it (a program feature, rotation, sector, team).",
      early: "What work in this role you want, and why now (forward-looking).",
      mid: "What you want next, and what you would bring to the organisation's current direction.",
      senior: "Your read of the challenge facing this team and why it is the work you want next."
    },
    example: "I've used Fernleaf's booking app for my own GP appointments, and the new reminder flow saved me two phone calls to the clinic last month. Your published accessibility roadmap aims to meet WCAG 2.2 AA on every patient screen by next year. That is the kind of measurable target I like working towards, and it's where I'd want to focus first."
  },
  closing: {
    why: "End with one line of specific value, a polite invitation to talk and thanks. Short is stronger.",
    good: "One sentence on the contribution you'd make, an invitation to discuss it, your availability if it helps, and thanks.",
    avoid: "\"I will call you next week\", \"please do not hesitate to contact me\", a summary of the whole letter, salary, or begging for any opportunity.",
    level: {
      entry: "Express interest in the program or role, mention availability, thank them.",
      early: "Restate the specific contribution in one line, invite a conversation, thank them.",
      mid: "Restate the specific contribution in one line, invite a conversation, thank them.",
      senior: "Frame it around the challenge you described, invite a conversation, thank them."
    },
    example: "I'd welcome the chance to talk about the graduate program and what I could contribute to your audit team. I'm available to start from February 2027. Thank you for considering my application."
  }
};
const clLevelOf = stage => CL_LEVEL[stage] || "entry";
const clRule = (part, stage) => { const g = CL_GUIDE[part]; return g ? g.level[clLevelOf(stage)] || g.level.early : ""; };

// Text for the page with every [gap] and [XXX] highlighted in yellow
// (one [bracket] pair at a time, empty or long, so a pasted [] is highlighted and what you type between the brackets stays highlighted)
const GAP_SRC = "\\[[^\\[\\]\\n]{0,120}\\]|\\{[^{}\\n]{0,120}\\}";
const gapHtml = t => esc(String(t)).replace(new RegExp(GAP_SRC, "g"), m => `<mark class="gap-mark">${m}</mark>`);
// A phone number, email address or link in the text: the letter head already has your contact details, so the paragraphs shouldn't repeat them.
// (the word LinkedIn on its own is only a problem in the closing; elsewhere it can be where you saw the ad)
function contactIn(text, part) {
  const t = String(text || "");
  const em = t.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/); if (em) return em[0];
  const link = t.match(/https?:\/\/\S+|www\.\S+|linkedin\.com\S*/i); if (link) return link[0];
  for (const m of t.match(/\+?\d[\d\s().-]{6,}\d/g) || []) if (m.replace(/\D/g, "").length >= 8) return m.trim();
  if (part === "closing") { const li = t.match(/\blinked-?in\b/i); if (li) return li[0]; }
  return "";
}
const contactWhy = (found, part) => `it includes "${found}": your contact details are already in the letter head, so leave them out${part === "closing" ? " of the closing" : ""}`;

/* --- Checks done in code on the whole letter --- */
// paras: the paragraphs as text. source: the candidate's details, to check figures against (optional).
// Returns [{ level: "warn", title, detail }]
function coverQuality(paras, source, opts = {}) {
  const out = [];
  const texts = paras.map(p => String(p || ""));
  const all = texts.join("\n");
  if (!all.trim()) return out;
  // where = the paragraphs (0-based) an issue is in; fix = what its Fix button does ("dash", "exclaim", "reword", or "go" to just jump there)
  const hit = test => texts.map((t, i) => test(t) ? i : -1).filter(i => i >= 0);
  // 1. phrases that read as clichéd or AI-written
  const hard = [...new Set(CL_HARD.map(re => (all.match(re) || [])[0]).filter(Boolean).map(s => s.toLowerCase()))];
  if (hard.length) out.push({ where: hit(t => CL_HARD.some(re => re.test(t))), test: x => CL_HARD.some(re => re.test(x)), ask: `Replace ${hard.filter(h => !hard.some(o => o !== h && o.includes(h))).slice(0, 4).map(h => `“${h}”`).join(", ")} with something specific only I could say.`, fix: "reword", level: "warn", title: "Phrases recruiters skip past", detail: `Replace ${hard.slice(0, 6).map(s => `“${s}”`).join(", ")} with something specific only you could say.` });
  // the other phrases the writers refuse (one list for both: see 14b), and the same words in two paragraphs, and US spelling
  if (typeof LR !== "undefined") {
    const extra = LR.bannedFound(all).filter(p => !hard.some(h => h.includes(p) || p.includes(h)) && !CL_SOFT.some(re => re.test(p)));
    if (extra.length) out.push({ where: hit(t => LR.bannedFound(t).some(p => extra.includes(p))), test: x => LR.bannedFound(x).some(p => extra.includes(p)), ask: `Replace ${extra.slice(0, 4).map(h => `“${h}”`).join(", ")} with a specific fact.`, fix: "reword", level: "warn", title: "Words that read as AI-written", detail: `${extra.slice(0, 6).map(s => `“${s}”`).join(", ")}: replace each with a specific fact.` });
    const rep = LR.crossChecks(texts, {});
    if (rep.length) out.push({ where: [...new Set(rep.map(r => r.i))], fixes: rep.map(r => ({ i: r.i, test: x => x.toLowerCase().includes(String(r.phrase || "").toLowerCase()), marks: [String(r.phrase || "")], markFirst: r.code !== "repeat", ask: r.code === "repeat" ? `Say “${r.phrase}” differently here: it is already in another paragraph.` : `Start this one differently from the other paragraph (it starts “${r.phrase}”).` })), fix: "reword", level: "warn", title: "The same words in two paragraphs", detail: rep[0].code === "repeat" ? `“${rep[0].phrase}” is in more than one paragraph. Say it once, or say it differently.` : `Two paragraphs start the same way (“${rep[0].phrase}”). Start one of them differently.` });
    const us = hit(t => LR.auSpelling(t) !== t);
    if (us.length) out.push({ where: us, test: x => LR.auSpelling(x) !== x, ask: "Use Australian spelling (organise, behaviour, centre, colour).", fix: "reword", level: "warn", title: "US spelling", detail: "Australian letters use organise, behaviour, centre and colour." });
  }
  const soft = [...new Set(CL_SOFT.map(re => (all.match(re) || [])[0]).filter(Boolean).map(s => s.toLowerCase()))];
  if (soft.length > 1) out.push({ where: hit(t => CL_SOFT.some(re => re.test(t))), test: x => CL_SOFT.some(re => re.test(x)), ask: `Take out a habit word (${soft.slice(0, 4).map(h => `“${h}”`).join(", ")}): keep at most one in the whole letter.`, fix: "reword", level: "warn", title: "Habit words", detail: `${soft.slice(0, 6).map(s => `“${s}”`).join(", ")}: fine once, but together they read as a template. Keep at most one.` });
  // 2. punctuation that signals machine-written text
  if (/—|\s–\s|\s--\s/.test(all)) out.push({ where: hit(t => /—|\s–\s|\s--\s/.test(t)), test: x => /—|\s–\s|\s--\s/.test(x), ask: "Use a comma or a full stop instead of the long dash.", fix: "reword", level: "warn", title: "Dashes", detail: "Long dashes read as AI-written. Use a comma or a full stop instead." });
  if (/!/.test(all)) out.push({ where: hit(t => /!/.test(t)), test: x => /!/.test(x), ask: "Take out the exclamation mark and keep a calm, confident tone.", fix: "reword", level: "warn", title: "Exclamation marks", detail: "Take them out. Calm confidence reads better in a formal letter." });
  if (/\?/.test(all)) out.push({ where: hit(t => /\?/.test(t)), test: x => /\?/.test(x), ask: "Write the question as a statement.", fix: "reword", level: "warn", title: "Questions", detail: "Rewrite any question as a statement." });
  // 3. too many sentences starting with "I"
  const sentences = t => t.split(/(?<!\b[A-Z]\.)(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const startsI = s => /^(I|I'm|I’m|I've|I’ve|I'd|I’d|I'll|I’ll|My)\b/.test(s);
  // (the rule is no more than two sentences in a row: the longest run in a paragraph)
  const iRun = t => { let run = 0, best = 0; for (const s of sentences(t)) { run = startsI(s) ? run + 1 : 0; best = Math.max(best, run); } return best; };
  const heavy = texts.map((t, i) => [i, iRun(t)]).filter(([, n]) => n > 2).map(([i]) => i + 1);
  const total = texts.flatMap(sentences);
  if (heavy.length || (total.length >= 8 && total.filter(startsI).length / total.length > 0.4)) out.push({ where: heavy.length ? heavy.map(n => n - 1) : [], pick: ss => { let run = 0; for (let k = 0; k < ss.length; k++) { run = startsI(ss[k].trim()) ? run + 1 : 0; if (run > 2) return k; } const at = ss.map((x, k) => startsI(x.trim()) ? k : -1).filter(k => k >= 0); return at.length ? at[at.length - 1] : -1; }, ask: "Start with the work, the result or the employer instead of “I”.", fix: "reword", level: "warn", title: "Too many sentences start with “I”", detail: `${heavy.length ? `Paragraph${heavy.length === 1 ? "" : "s"} ${heavy.join(", ")}: ` : ""}no more than two in a row. Lead with the work, the result or the employer instead.` });
  // 4. long sentences
  const long = total.filter(s => wordCount(s) > 35);
  if (long.length) out.push({ where: hit(t => sentences(t).some(x => wordCount(x) > 35)), test: x => wordCount(x) > 35, ask: "Make it shorter: under 30 words, and keep every fact.", fix: "reword", level: "warn", title: "A very long sentence", detail: `“${long[0].split(/\s+/).slice(0, 8).join(" ")}…” runs past 35 words. Split it in two.` });
  // 5. words used again and again
  const STOPISH = new Set("which their there where would could should about these those being because while through during after before between under again other every first second three four having within without against around still often since until which"
    .split(" "));
  const counts = new Map();
  for (const w of (all.toLowerCase().match(/[a-z][a-z'-]{4,}/g) || [])) if (!STOPISH.has(w)) counts.set(w, (counts.get(w) || 0) + 1);
  const rep = [...counts].filter(([, n]) => n > 3).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
  if (rep.length) out.push({ where: hit(t => rep.some(w => t.toLowerCase().includes(w))), test: x => rep.some(w => x.toLowerCase().includes(w)), marks: rep, ask: `Use a different word for ${rep.map(w => `“${w}”`).join(", ")}: they appear more than three times in the letter.`, fix: "reword", level: "warn", title: "Repeated words", detail: `“${rep.join("”, “")}” appear more than three times. Vary the wording.` });
  // 6. things that should never be in a cover letter
  const personal = all.match(/\b(date of birth|DOB|marital status|married|years old|aged? \d{2}|my religion|salary (expectation|of|is)|\$\s?\d{2,3}(,\d{3}|k)\b)/i);
  // (a salary the person chose to give, because the ad asked for it, is theirs to include)
  if (personal && !(opts.allowSalary && /salary|\$/i.test(personal[0]))) out.push({ where: hit(t => personal && t.includes(personal[0])), test: x => personal && x.includes(personal[0]), ask: `Take out “${personal[0]}”: it doesn't belong in a cover letter.`, fix: "reword", level: "warn", title: "Leave this out", detail: `“${personal[0]}” shouldn't be in a cover letter (age, family, health, religion and pay aren't asked for).` });
  // 7. figures that aren't in the candidate's own details
  if (source) {
    const ok = new Set([...numsOf(source), ...(String(source).match(/\b(19|20)\d{2}\b/g) || [])]);
    const stray = [...new Set(numsOf(all.replace(/\[[^\]]*\]/g, " ")))].filter(n => !ok.has(n) && !/^\d{1,2}$/.test(n));
    if (stray.length) out.push({ where: hit(t => stray.some(n => t.includes(n))), test: x => stray.some(n => x.includes(n)), ask: `Check ${stray.slice(0, 4).join(", ")}: not in my resume. Use only figures from my resume.`, fix: "reword", level: "warn", title: "Check these figures", detail: `${stray.slice(0, 4).join(", ")} ${stray.length === 1 ? "isn't" : "aren't"} in your resume or details. Make sure ${stray.length === 1 ? "it's" : "they're"} true.` });
  }
  return out;
}
// A short, plain description of what a "Why this paragraph" panel shows
function clGuideHtml(part, stage) {
  const g = CL_GUIDE[part];
  if (!g) return "";
  return `<details class="lt-guide"><summary>Why this paragraph, and how to write it</summary>
    <p>${esc(g.why)}</p>
    <p><b>Good looks like:</b> ${esc(g.good)}</p>
    <p><b>At your stage:</b> ${esc(clRule(part, stage))}</p>
    <p><b>Avoid:</b> ${esc(g.avoid)}</p>
    <p class="lt-eg"><b>An example</b> (for someone else, so copy how it's built, not the words):<br>${esc(g.example)}</p></details>`;
}

/* --- Small, one-paragraph fixes the warnings can apply --- */
const fixDashes = t => String(t).replace(/\s*—\s*|\s+–\s+|\s+--\s+/g, ", ").replace(/,\s*,/g, ",").replace(/,\s*([.!?])/g, "$1");
const fixExclaims = t => String(t).replace(/!+/g, ".").replace(/\.{2,}/g, ".");
