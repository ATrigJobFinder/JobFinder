/* ===================== Cover letter: ONE prompt, built from the Cover Letter Advice page and the resume ===================== */
// This is the only prompt that writes a cover letter. It replaces the per-sentence prompts, the fix-up turns and the reviewer.
//  1. LETTER_ADVICE is a short summary of the Cover Letter Advice page (index.html, #advice-letter-body).
//  2. The prompt carries that summary, the resume, the job ad and a few details. The AI writes the whole letter body in one go.
//  3. The answer is split into paragraphs (adviceSplit) and each goes in its own input box (advicePlace → COVER_PARTS order).
// If the advice page changes, change the summary here.

const LETTER_ADVICE = `Cover letter advice (a summary of our Cover Letter Advice page):
- A good cover letter is short, specific and impossible to send to any other employer. Five short paragraphs, under one page. Australian English and spelling.
- Paragraph 1, the opening (two or three sentences): name the job and the employer, then give your single strongest, most relevant achievement from the resume, with its number if it has one. This is the part most likely to be read.
- Paragraph 2, evidence: answer the employer's top requirement from the ad with one real example from the resume: what you did, the result, why it matters to them. Do not repeat a resume bullet; add the story or context behind it.
- Paragraph 3, education and skills: open with the applicant's highest qualification (the <study> list is in that order), naming its institution, then answer their next requirement with the study, major project or tools that matter most for this job, each tied to something you used it for. A major project, award or scholarship belongs to the one qualification and institution it is listed under: never move it to another institution or degree. Say "major project", never "thesis" or "dissertation". Keep this paragraph to study, projects and tools that connect to the job: do not add a driver's licence, first aid, a hobby or any other unrelated item.
- Paragraph 4, why them: two or three sentences on one specific reason for this employer, using only the applicant's own reason or something the ad says. Never invent anything about the employer.
- Paragraph 5, the close: availability if it is given, thanks, and a confident, not pushy, invitation to an interview.
- Show, don't tell. Cut adjectives and keep facts: what you did and what came of it. Never write "hard-working", "passionate", "team player", "perfect fit", "proven track record", "fast-paced environment", "leverage", "delve", "seamlessly", "thrilled", "I am writing to apply" or "My name is".
- Plain, warm, confident first person. Short paragraphs of two to four sentences. No em dashes, no exclamation marks, no more than two sentences in a row starting with "I". Do not mention age, pay, health or family.
- Use only facts from the resume and the details. Never invent employers, numbers, tools, dates or results, and copy every number exactly. Credit each piece of work to the employer it is listed under.
- If a detail is not given, leave it out. Do not write square brackets or placeholders, except the ones the details tell you to write for a template.`;

const LETTER_SYSTEM = `You are an expert career coach and professional copywriter. Your task is to write a compelling, high-impact, tailored cover letter AS the applicant, in Australian English.
Rules:
- Ground all claims strictly in the resume. Never invent experience, projects, tools or metrics.
- Keep each fact with the place it belongs to. Do not mix details from different employers, universities or degrees, and do not connect topics that have nothing to do with each other.
- Match the applicant's specific skills, tools and projects from the resume directly to what the job ad asks for, and say what each would mean for the employer's day-to-day work.
- Keep a confident, professional, results-oriented tone.

${LETTER_ADVICE}

Output format (this is required, and every field must be filled):
The letter has exactly five input boxes, one for each paragraph. Reply with a single JSON object that has exactly these five keys, each holding one paragraph of plain text:
- "opening": paragraph 1, the opening
- "experience": paragraph 2, the evidence from the resume
- "education": paragraph 3, education and skills
- "motivation": paragraph 4, why this employer
- "closing": paragraph 5, the close
Rules for the JSON:
- Always return all five keys, in that order. Never leave one out, never leave one empty, and never merge two paragraphs into one key. If the resume has little for a paragraph, write a shorter one from what it does have (for "education", the closest study, project or tools; for "motivation", the applicant's own reason or something the ad says). Never invent facts to fill a gap.
- Each value is one paragraph of plain text: no greeting, no sign-off, no name, no headings, no bullet points, no markdown, and no line breaks inside it.
- Reply with the JSON object only. No text before or after it, and no code fences.
Example of the shape (the text here is only a placeholder):
{"opening": "...", "experience": "...", "education": "...", "motivation": "...", "closing": "..."}`;

// The five keys the AI must return, in the order of the input boxes (COVER_PARTS in 15-cover-letter.js)
const ADVICE_KEYS = ["opening", "experience", "education", "motivation", "closing"];
const ADVICE_SCHEMA = { type: "object", properties: Object.fromEntries(ADVICE_KEYS.map(k => [k, { type: "string" }])), required: ADVICE_KEYS };

// o: { resume, ad, role, company, why, avail, source, needs, extra[], others[], words[lo, hi], template }
function advicePrompt(o) {
  const [lo, hi] = o.words || [330, 390], clip = (t, n) => String(t || "").trim().slice(0, n);
  const lines = [
    `Role: ${o.template ? "[ROLE TITLE]  (write it exactly like this, with the brackets)" : o.role || "(not given)"}`,
    `Company: ${o.template ? "[COMPANY]  (write it exactly like this, with the brackets)" : o.company || "(not given)"}`,
    o.template ? `This letter is a reusable template for any job. Wherever the letter would name the skills, tools, requirements or duties that belong to one particular job (the things a job ad lists), write the placeholder [Specific Job skills] exactly like that, with the brackets and the same capital letters, so the applicant can swap in each job's skills when they fill the template. Use it two to four times in the whole letter, inside a normal sentence (for example: "I would bring this experience to [Specific Job skills]."), in the evidence, education and skills, and why-this-employer paragraphs. Keep the applicant's own real skills, tools and results from the resume exactly as they are: only the job's side of the match becomes the placeholder. Never write any other bracketed placeholder except [ROLE TITLE] and [COMPANY].` : "",
    o.source ? `Where the ad was seen: ${o.source}` : "",
    o.study ? `Study, highest qualification first (each line is one qualification, and its project, award and results belong to that qualification and institution only):\n${clip(o.study, 1200)}` : "",
    o.why ? `Why this company, in the applicant's own words: ${clip(o.why, 400)}` : "",
    o.avail ? `Availability: ${clip(o.avail, 160)}` : "",
    o.needs ? `What the employer is looking for (typed by the applicant):\n${clip(o.needs, 600)}` : "",
    ...(o.extra || []).filter(Boolean),
    `Length: ${lo} to ${hi} words in the five paragraphs together.`,
    `Reply with the JSON object holding all five keys: opening, experience, education, motivation, closing. None may be empty.`
  ].filter(Boolean);
  return `${o.ad && !o.template ? `<job_ad>\n${clip(o.ad, 3000)}\n</job_ad>\n\n` : ""}<resume>\n${clip(o.resume, 5000)}\n</resume>\n\n<details>\n${lines.join("\n")}\n</details>${(o.others || []).length ? `\n\n<already_written>\nThese paragraphs are already in the letter. Do not repeat their points.\n${o.others.map(t => `- ${clip(t, 500)}`).join("\n")}\n</already_written>` : ""}\n\nWrite a tailored, highly professional cover letter for this specific position. Connect the applicant's specific past projects and work in the resume directly to the employer's operational needs in the ad.`;
}

// The answer, split into paragraphs: the greeting and sign-off the AI added anyway are dropped, a letter written on single lines is split on those,
// and one unbroken block is cut into five groups of sentences
const ADVICE_FRAME = /^(dear\b|to whom|re:|subject:|kind regards|best regards|warm regards|regards|yours\b|sincerely|thank you,?$|cheers)/i;
function adviceSplit(text) {
  const clean = String(text || "").replace(/\r/g, "").replace(/\*\*|__|^#+\s*/gm, "").trim();
  const strip = block => block.split("\n").map(l => l.trim()).filter(l => l && !ADVICE_FRAME.test(l) && !(wordCount(l) <= 4 && !/[.!?]["”']?$/.test(l))).join(" ").replace(/\s+/g, " ").trim();
  let out = clean.split(/\n\s*\n/).map(strip).filter(Boolean);
  if (out.length < 3 && /\n/.test(clean)) out = clean.split(/\n/).map(strip).filter(Boolean);
  if (out.length < 3) {
    const ss = out.join(" ").split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (ss.length >= 8) out = [0, 1, 2, 3, 4].map(k => ss.slice(Math.round(k * ss.length / 5), Math.round((k + 1) * ss.length / 5)).join(" ")).filter(Boolean);
  }
  return out;
}
// Into the input boxes, in COVER_PARTS order (opening, experience, education, motivation, closing). The last paragraph is the close; any extra
// paragraphs are added to "Why this company". A letter of four paragraphs leaves Education and skills empty; three also leaves out Why this company.
function advicePlace(paras) {
  const n = paras.length, out = ["", "", "", "", ""];
  if (!n) return out;
  const close = n > 1 ? paras[n - 1] : "", mid = paras.slice(1, n - 1);
  out[0] = paras[0]; out[4] = close;
  if (mid.length >= 3) { out[1] = mid[0]; out[2] = mid[1]; out[3] = mid.slice(2).join(" "); }
  else if (mid.length === 2) { out[1] = mid[0]; out[3] = mid[1]; }
  else if (mid.length === 1) out[1] = mid[0];
  return out;
}
// The five paragraphs from the answer: the named keys first (a model may nest them under "letter"), else the old single "letter" string split into
// paragraphs (a model that ignored the keys, or wrote plain text). Always five slots; an empty one means the AI left that paragraph out.
function adviceParas(d) {
  const src = d && typeof d === "object" ? (d.opening || d.closing ? d : d.letter && typeof d.letter === "object" ? d.letter : d) : {};
  const named = ADVICE_KEYS.map(k => typeof src[k] === "string" ? adviceSplit(src[k]).join(" ") : "");
  if (named.some(Boolean)) return named;
  const text = d && Array.isArray(d.letter) ? d.letter.join("\n\n") : d && d.letter;
  const ps = adviceSplit(text);
  return ps.length >= 3 ? advicePlace(ps) : ADVICE_KEYS.map(() => "");
}
// → { paragraphs: [5 strings] | null, res }  (res says what the AI did, for the messages: see aiMissWords in 17-ai-prompts.js)
async function adviceWrite(o, progress = () => {}) {
  const [lo, hi] = o.words || [330, 390];
  const res = await aiJSON({
    nano: LETTER_SYSTEM, full: LETTER_SYSTEM, prompt: advicePrompt(o), label: "Writing your cover letter", progress,
    schema: ADVICE_SCHEMA, expect: Math.round(hi * 7) + 120, writing: true, plainKey: "letter",
    check: d => {
      const ps = adviceParas(d), n = wordCount(ps.join(" "));
      const missing = ADVICE_KEYS.filter((k, i) => !ps[i]);
      if (missing.length) return { ok: false, why: `these paragraphs are missing or empty: ${missing.map(k => `"${k}"`).join(", ")}. Return all five keys (opening, experience, education, motivation, closing), each with one paragraph of text` };
      if (n < Math.round(lo * 0.6)) return { ok: false, why: `it has ${n} words and needs about ${lo} to ${hi}` };
      if (n > Math.round(hi * 1.4)) return { ok: false, why: `it has ${n} words: cut it to about ${hi}` };
      return { ok: true, value: ps.map(t => LR.auSpelling(stripMarkup(t))) };
    }
  });
  return { paragraphs: res.data || null, res };
}
