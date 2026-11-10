/* ===================== Resume summary: ONE prompt, built from the Resume Advice page and the resume ===================== */
// The same idea as the cover letter (14c-letter-advice.js):
//  1. SUMMARY_ADVICE is a short summary of the Resume Advice page (index.html, #advice-resume-body, "Summary").
//  2. The prompt carries that summary, the whole resume, the job ad (if the person pasted one) and the answers to "Tell us about you".
//     The AI writes the summary in one go.
//  3. The answer is checked in code (writeSummary in 20-resume-creator.js): no made-up numbers or skills, no "I" or "my", no clichés, the length,
//     the result they are proud of, and never "graduate" for someone still studying. With no AI, or an unusable answer, templateSummary is used.
// If the Resume Advice page changes, change the summary here.

const SUMMARY_ADVICE = `Resume summary advice (a summary of our Resume Advice page):
- The summary is the short paragraph at the top of the resume: two or three sentences, 40 to 75 words. Recruiters often decide from it alone whether to keep reading, so it must be specific to this job and impossible to copy onto any other resume.
- Sentence 1, who you are: your professional title or, for a student, your year of study and course, then the kind and amount of experience (for example "Support worker with four years in community and residential care").
- Sentence 2, proof: your two or three strongest skills for THIS job, each backed by one real piece of evidence from the resume, with its number if it has one. If a job ad is given, use the ad's exact wording for the skills the applicant truly has, and lead with what the employer cares about most.
- Sentence 3, what's next: the kind of role you are after, in a few words. Say what you offer, never what you want from the employer, and skip the old "career objective".
- Show, don't tell. Cut adjectives and keep facts: what you did and what came of it. Never write "hard-working", "passionate", "team player", "results-driven", "go-getter", "detail-oriented", "proven track record", "dynamic", "leverage", "utilise", "seamlessly" or "motivated individual".
- Write it like a resume, not a letter: never use "I", "me" or "my". Start with the title or a strength, for example "Final-year mechanical engineering student with solar internship experience." Australian English and spelling. No em dashes, no exclamation marks, no markdown.
- Use only facts from the resume and the details. Never invent employers, numbers, tools, qualifications or results, and copy every number exactly. If a detail is not given, leave it out. Do not write square brackets or placeholders.
- A student who is still studying is described by their year of study ("penultimate-year", "final-year") and is never a graduate or recent graduate.`;

const SUMMARY_SYSTEM = `You are an expert career coach and professional resume writer. Your task is to write the summary at the top of the applicant's resume, in Australian English.
Rules:
- Ground all claims strictly in the resume. Never invent experience, projects, tools or metrics.
- Pick the strongest evidence in the resume for the job the applicant is going for, and match it to what the job ad asks for if one is given.
- Keep a confident, professional, results-oriented tone.

${SUMMARY_ADVICE}

Output format (this is required):
Reply with a single JSON object with exactly one key, "summary", holding the summary as plain text: two or three sentences, 40 to 75 words, no heading, no bullet points, no markdown and no line breaks. No text before or after the JSON, and no code fences.
Example of the shape (the text here is only a placeholder):
{"summary": "..."}`;

// The resume as the AI reads it, without the summary that is about to be replaced
function summaryResumeText(p) {
  const copy = JSON.parse(JSON.stringify(p));
  copy.summary = "";
  return profileToText(copy, { jobText: p.target.specific ? p.target.ad : "" });
}
function summaryAdvicePrompt(p) {
  const clip = (t, n) => String(t || "").trim().slice(0, n);
  const qz = p.summaryQ || {};
  const jt = p.target.jobType ? (JOB_TYPES.find(j => j.key === p.target.jobType) || {}).label : "";
  const ad = p.target.specific && val(p.target.ad) ? clip(typeof adEssentials === "function" ? adEssentials(p.target.ad) || p.target.ad : p.target.ad, 3000) : "";
  const lines = [
    `Job the applicant is going for: ${p.target.title || "(not given)"}${jt ? ` (${jt})` : ""}${p.target.company ? ` at ${p.target.company}` : ""}`,
    `Career stage: ${careerStageWords(p)}`,
    studyLine(p) ? `Study: ${studyLine(p)}` : "",
    val(qz.who) ? `How they describe themselves, in their own words: ${clip(qz.who, 300)}` : "",
    val(qz.strengths) ? `Their strongest skills for this kind of job, in their own words: ${clip(qz.strengths, 300)}` : "",
    val(qz.proof) ? `A result they are proud of (it must be in the summary, with its numbers kept exactly): ${clip(qz.proof, 300)}` : "",
    val(qz.next) ? `What they are looking for next, in their own words: ${clip(qz.next, 300)}` : "",
    `Length: 40 to 75 words, two or three sentences.`,
    `Reply with the JSON object {"summary": "..."}.`
  ].filter(Boolean);
  return `${ad ? `<job_ad>\n${ad}\n</job_ad>\n\n` : ""}<resume>\n${clip(summaryResumeText(p), 5000)}\n</resume>\n\n<details>\n${lines.join("\n")}\n</details>\n\nWrite the summary for the top of this resume. Connect the applicant's real experience, study and skills in the resume to the job they are going for.`;
}
