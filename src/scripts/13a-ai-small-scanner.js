/* ===================== Resume scan suggestions for small models: four short jobs, each using what the one before found ===================== */
// A small model can't hold a whole resume, a whole ad and a five-part answer at once. So the same suggestions come in steps:
//   1. the fit (two sentences)  2. which missing skills are really in the resume in other words  3. up to three bullets, one prompt each,
//   4. the profile, which is given the fit, the skills found in step 2 and the bullets' skills.
// aiChain (in 17-ai-prompts.js) runs the steps and passes each step what the earlier ones wrote.
const SCAN_FIT_NANO = `You compare a resume with a job ad, as an Australian recruiter.
Rules: 1. Two sentences. 2. Say how well the resume fits the role, then the biggest gap. 3. Use only what is given.
Reply with JSON only: {"fit": "..."}`;
const SCAN_GAPS_NANO = `You check which job ad skills a resume really lacks.
Rules:
1. For each skill, look in the resume. If it shows the skill in other words, put the skill under hidden_matches with a short exact quote from the resume.
2. If there is no evidence, put the skill under true_gaps.
3. Use only the skills listed. Quotes must be copied exactly from the resume.
Reply with JSON only: {"hidden_matches": [{"job_term": "...", "resume_evidence": "..."}], "true_gaps": ["..."]}`;
const SCAN_BULLET_NANO = `You reword one resume bullet point so it uses the job ad's wording.
Rules:
1. Keep every fact and number exactly. Never add a tool, number or result.
2. Start with a strong past-tense verb. Under 30 words. No "I", no full stop.
3. Use the ad's word only if the bullet already shows that skill.
Reply with JSON only: {"improved": "...", "why": "one short reason"}`;
const SCAN_PROFILE_NANO = `You write a 3 sentence profile for the top of a resume, tailored to one job.
Rules:
1. Use only the facts given. Never invent skills, tools or numbers.
2. No "I" or "my". 40 to 75 words.
3. Use the job's wording for skills the resume already shows.
Reply with JSON only: {"profile": "..."}`;
const clipTo = (t, n) => { t = String(t || ""); return t.length > n ? t.slice(0, n) + "…" : t; };
// The resume's bullet points (or its longest lines), for rewording one at a time
function resumeBullets(text, n = 3) {
  const lines = String(text || "").split(/\r?\n/).map(l => l.replace(/^\s*[-•*▪●·–]\s*/, "").trim());
  const bullets = lines.filter(l => wordCount(l) >= 8 && wordCount(l) <= 45 && /[a-z]/.test(l) && !/^[A-Z][A-Za-z&.,'\- ]+\s[|·–-]\s/.test(l));
  return bullets.sort((a, b) => wordCount(b) - wordCount(a)).slice(0, n);
}
const scanNorm = t => String(t || "").toLowerCase().replace(/\s+/g, " ").trim();
async function aiSmallSuggestions(signal, progress) {
  const resume = els.resume.value.trim(), jd = els.jd.value.trim();
  const all = lastResult ? [...lastResult.hard, ...lastResult.soft] : [];
  const missing = all.filter(x => !x.found).map(x => x.name), found = all.filter(x => x.found).map(x => x.name);
  const bullets = resumeBullets(resume, 3);
  const strArr = { type: "array", items: { type: "string" } };
  const steps = [
    { key: "fit", label: "Judging the fit", nano: SCAN_FIT_NANO, schema: { type: "object", properties: { fit: { type: "string" } }, required: ["fit"] },
      prompt: () => `Job ad (start):\n${clipTo(jd, 900)}\nSkills the ad wants that the resume shows: ${found.slice(0, 12).join(", ") || "none"}\nSkills missing by keyword scan: ${missing.slice(0, 12).join(", ") || "none"}\nResume (start):\n${clipTo(resume, 1200)}`,
      check: d => d && typeof d.fit === "string" && wordCount(d.fit) >= 8 && wordCount(d.fit) <= 70 ? { ok: true, value: d } : { ok: false, why: "the fit must be two short sentences" } },
    { key: "gaps", label: "Checking the missing skills", nano: SCAN_GAPS_NANO, skip: () => !missing.length,
      schema: { type: "object", properties: { hidden_matches: { type: "array", items: { type: "object", properties: { job_term: { type: "string" }, resume_evidence: { type: "string" } }, required: ["job_term", "resume_evidence"] } }, true_gaps: strArr }, required: ["hidden_matches", "true_gaps"] },
      prompt: () => `Skills to check: ${missing.slice(0, 8).join(", ")}\nResume:\n${clipTo(resume, 2800)}`,
      // keep only skills from the list, and only quotes that really are in the resume
      check: d => {
        const rn = scanNorm(resume), ok = new Set(missing.map(scanNorm));
        const hidden = (d.hidden_matches || []).filter(x => x && ok.has(scanNorm(x.job_term)) && x.resume_evidence && rn.includes(scanNorm(x.resume_evidence)));
        const hid = new Set(hidden.map(x => scanNorm(x.job_term)));
        const gaps = (d.true_gaps || []).filter(g => ok.has(scanNorm(g)) && !hid.has(scanNorm(g)));
        return { ok: true, value: { hidden_matches: hidden.slice(0, 5), true_gaps: gaps.slice(0, 8) } };
      } },
    ...bullets.map((b, i) => ({
      key: "b" + i, label: `Rewording bullet ${i + 1}`, nano: SCAN_BULLET_NANO, schema: { type: "object", properties: { improved: { type: "string" }, why: { type: "string" } }, required: ["improved"] },
      // the bullet is paired with a skill step 2 found hidden in the resume, so the ad's wording goes where it is already true
      prompt: done => {
        const hms = (done.gaps || {}).hidden_matches || [];
        const hm = hms.find(x => scanNorm(b).includes(scanNorm(x.resume_evidence).slice(0, 25))) || hms[i];
        return `Bullet: ${b}\n${hm ? `The ad calls this skill: "${hm.job_term}". Use that wording if the bullet shows it.` : "No skill to add: just make it stronger."}\nThe ad asks for: ${clipTo(found.concat(missing).slice(0, 8).join(", "), 120)}`;
      },
      check: d => {
        const t = stripMarkup(String(d.improved || "")).replace(/\.$/, "").trim();
        const why = !t ? "it was empty" : scanNorm(t) === scanNorm(b) ? "it is the same as the original" : factCheck(t, b, { max: 32, noFirstPerson: true });
        return why ? { ok: false, why } : { ok: true, value: { original: b, improved: t, why: String(d.why || "").slice(0, 140) } };
      }
    })),
    { key: "profile", label: "Writing the profile", nano: SCAN_PROFILE_NANO, schema: { type: "object", properties: { profile: { type: "string" } }, required: ["profile"] },
      prompt: done => `Job: ${clipTo(els.title.value || jd, 300)}\nSkills to show (the resume already evidences them): ${[...((done.gaps || {}).hidden_matches || []).map(x => x.job_term), ...found.slice(0, 6)].slice(0, 8).join(", ") || "none"}\nIts fit, found earlier: ${(done.fit || {}).fit || ""}\nResume:\n${clipTo(resume, 1800)}`,
      check: d => { const t = stripMarkup(String(d.profile || "")).trim(); const why = factCheck(t, resume + "\n" + jd, { noFirstPerson: true, min: 25, max: 85 }); return why ? { ok: false, why } : { ok: true, value: { profile: t } }; } }
  ];
  const { done, missed } = await aiChain(steps, { progress, signal });
  return {
    missed,
    data: { fit: (done.fit || {}).fit, hidden_matches: (done.gaps || {}).hidden_matches, true_gaps: (done.gaps || {}).true_gaps, bullet_rewrites: bullets.map((_, i) => done["b" + i]).filter(Boolean), profile: (done.profile || {}).profile }
  };
}
