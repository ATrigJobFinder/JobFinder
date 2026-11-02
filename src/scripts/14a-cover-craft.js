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
  "i know i (don'?t|do not|may not|might not)", "(although|while|even though) i (don'?t|do not|lack) (have )?(much|any|direct)"
].map(s => new RegExp("\\b" + s, "i"));
// Soft: fine once, a habit when repeated
const CL_SOFT = [
  "i look forward to hearing from you", "thank you for your time and consideration", "i am confident", "eager to", "excited", "thrilled", "unique opportunity", "opportunity to contribute", "spearhead(ed)?", "hon(e|ed|ing)", "foster(ed|ing)?", "showcas(e|ed|ing)", "pivotal", "invaluable", "meticulous", "holistic", "robust", "elevate",
  "furthermore", "moreover", "additionally", "in addition", "not only .{1,60} but also", "unfortunately", "utili[sz](e|ed|ing)", "in order to", "\\bvery\\b", "\\breally\\b"
].map(s => new RegExp("\\b" + s, "i"));
// The plain-words version for prompts (models follow these better than regex)
const CL_BANNED_PLAIN = "I am writing to express | To whom it may concern | My name is | I am excited to apply | perfect fit | ideal candidate | I believe I would be | would be an asset | dream job | results-driven | detail-oriented | team player | hard-working | self-starter | think outside the box | proven track record | fast-paced environment | dynamic | highly motivated | strong work ethic | excellent communication skills | go above and beyond | synergy | leverage my skills | passionate about | passion for | add value | cutting-edge | world-class | industry-leading | esteemed | prestigious | renowned | delve | testament to | tapestry | beacon | realm | ever-evolving | in today's | unwavering | embark | journey | resonate | seamless | multifaceted | it's not just about | in conclusion | I will call you | do not hesitate | thanks in advance | at your earliest convenience | grateful for any opportunity | furthermore | moreover | spearheaded | honed | pivotal | invaluable | meticulous | robust";
const CL_CRAFT = `Craft rules (what recruiters read cover letters for):
- Truth over polish. Every claim about the candidate comes from the details given; every claim about the employer comes from the ad or the company details given. If a helpful detail is missing, write a short gap in square brackets such as [one specific reason] and never guess.
- One specific example with its scope and result beats a list of qualities. Show what the candidate did instead of calling them a strong communicator.
- About them, proven by you: end each paragraph on why it matters to this employer's stated need.
- Add what the resume can't: motivation, context, how the candidate works. Don't copy resume bullets.
- Swap test: if another applicant could send a sentence unchanged, make it specific or cut it.
- Plain, warm, confident voice, like a capable person writing to a respected colleague they haven't met. Short to medium sentences with varied openings; at most two sentences in a paragraph start with "I". No flattery, hype or apology.
- No em dashes, exclamation marks or questions. Never salary, age, health or family details.
- Never use these phrases or close variants: ${CL_BANNED_PLAIN}.`;
const CL_CRAFT_SHORT = `Plain, warm, confident. One specific example with a result. No em dashes or exclamation marks. At most two sentences begin with "I". Avoid: ${CL_BANNED_PLAIN.split(" | ").slice(0, 36).join(" | ")}.`;

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
const gapHtml = t => esc(String(t)).replace(/\[[^\]\n]{2,40}\]|\{[^}\n]{2,40}\}/g, m => `<mark class="gap-mark">${m}</mark>`);

/* --- Checks done in code on the whole letter --- */
// paras: the paragraphs as text. source: the candidate's details, to check figures against (optional).
// Returns [{ level: "warn", title, detail }]
function coverQuality(paras, source) {
  const out = [];
  const texts = paras.map(p => String(p || ""));
  const all = texts.join("\n");
  if (!all.trim()) return out;
  // where = the paragraphs (0-based) an issue is in; fix = what its Fix button does ("dash", "exclaim", "reword", or "go" to just jump there)
  const hit = test => texts.map((t, i) => test(t) ? i : -1).filter(i => i >= 0);
  // 1. phrases that read as clichéd or AI-written
  const hard = [...new Set(CL_HARD.map(re => (all.match(re) || [])[0]).filter(Boolean).map(s => s.toLowerCase()))];
  if (hard.length) out.push({ where: hit(t => CL_HARD.some(re => re.test(t))), fix: "reword", level: "warn", title: "Phrases recruiters skip past", detail: `Replace ${hard.slice(0, 6).map(s => `“${s}”`).join(", ")} with something specific only you could say.` });
  const soft = [...new Set(CL_SOFT.map(re => (all.match(re) || [])[0]).filter(Boolean).map(s => s.toLowerCase()))];
  if (soft.length > 1) out.push({ where: hit(t => CL_SOFT.some(re => re.test(t))), fix: "reword", level: "warn", title: "Habit words", detail: `${soft.slice(0, 6).map(s => `“${s}”`).join(", ")}: fine once, but together they read as a template. Keep at most one.` });
  // 2. punctuation that signals machine-written text
  if (/—|\s–\s|\s--\s/.test(all)) out.push({ where: hit(t => /—|\s–\s|\s--\s/.test(t)), fix: "dash", level: "warn", title: "Dashes", detail: "Long dashes read as AI-written. Use a comma or a full stop instead." });
  if (/!/.test(all)) out.push({ where: hit(t => /!/.test(t)), fix: "exclaim", level: "warn", title: "Exclamation marks", detail: "Take them out. Calm confidence reads better in a formal letter." });
  if (/\?/.test(all)) out.push({ where: hit(t => /\?/.test(t)), fix: "reword", level: "warn", title: "Questions", detail: "Rewrite any question as a statement." });
  // 3. too many sentences starting with "I"
  const sentences = t => t.split(/(?<!\b[A-Z]\.)(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const startsI = s => /^(I|I'm|I’m|I've|I’ve|I'd|I’d|I'll|I’ll|My)\b/.test(s);
  const heavy = texts.map((t, i) => [i, sentences(t).filter(startsI).length]).filter(([, n]) => n > 2).map(([i]) => i + 1);
  const total = texts.flatMap(sentences);
  if (heavy.length || (total.length >= 8 && total.filter(startsI).length / total.length > 0.4)) out.push({ where: heavy.length ? heavy.map(n => n - 1) : [], fix: "reword", level: "warn", title: "Too many sentences start with “I”", detail: `${heavy.length ? `Paragraph${heavy.length === 1 ? "" : "s"} ${heavy.join(", ")}: ` : ""}no more than two per paragraph. Lead with the work, the result or the employer instead.` });
  // 4. long sentences
  const long = total.filter(s => wordCount(s) > 35);
  if (long.length) out.push({ where: hit(t => sentences(t).some(x => wordCount(x) > 35)), fix: "reword", level: "warn", title: "A very long sentence", detail: `“${long[0].split(/\s+/).slice(0, 8).join(" ")}…” runs past 35 words. Split it in two.` });
  // 5. words used again and again
  const STOPISH = new Set("which their there where would could should about these those being because while through during after before between under again other every first second three four having within without against around still often since until which"
    .split(" "));
  const counts = new Map();
  for (const w of (all.toLowerCase().match(/[a-z][a-z'-]{4,}/g) || [])) if (!STOPISH.has(w)) counts.set(w, (counts.get(w) || 0) + 1);
  const rep = [...counts].filter(([, n]) => n > 3).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
  if (rep.length) out.push({ where: hit(t => rep.some(w => t.toLowerCase().includes(w))), fix: "go", level: "warn", title: "Repeated words", detail: `“${rep.join("”, “")}” appear more than three times. Vary the wording.` });
  // 6. things that should never be in a cover letter
  const personal = all.match(/\b(date of birth|DOB|marital status|married|years old|aged? \d{2}|my religion|salary (expectation|of|is)|\$\s?\d{2,3}(,\d{3}|k)\b)/i);
  if (personal) out.push({ where: hit(t => personal && t.includes(personal[0])), fix: "go", level: "warn", title: "Leave this out", detail: `“${personal[0]}” shouldn't be in a cover letter (age, family, health, religion and pay aren't asked for).` });
  // 7. figures that aren't in the candidate's own details
  if (source) {
    const ok = new Set([...numsOf(source), ...(String(source).match(/\b(19|20)\d{2}\b/g) || [])]);
    const stray = [...new Set(numsOf(all.replace(/\[[^\]]*\]/g, " ")))].filter(n => !ok.has(n) && !/^\d{1,2}$/.test(n));
    if (stray.length) out.push({ where: hit(t => stray.some(n => t.includes(n))), fix: "go", level: "warn", title: "Check these figures", detail: `${stray.slice(0, 4).join(", ")} ${stray.length === 1 ? "isn't" : "aren't"} in your resume or details. Make sure ${stray.length === 1 ? "it's" : "they're"} true.` });
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
