/* ===================== Interview feedback for small models: three short steps in one conversation ===================== */
// Scoring five criteria, coaching points, a rewritten answer and a follow-up is too much for one small-model answer.
// So the model is asked three short things in turn, in the same conversation, and each step sees what it said in the one before:
//   1. the scores  2. what worked and what to improve (from those scores)  3. a stronger answer and a follow-up (using the improvements).
// The worked example is split the same way, so the model sees what each step looks like.
const IV_STEP_ASK = [
  "Step 1 of 3. Score each criterion. Reply with JSON only: the overall score and one note per criterion.",
  "Step 2 of 3. From those scores, list what worked and what to improve. Reply with JSON only: strengths and improvements.",
  "Step 3 of 3. Using those improvements, write the stronger answer and one follow-up question. Reply with JSON only: stronger_answer and follow_up."
];
const ivStepSplit = a => [{ overall: a.overall, scores: a.scores }, { strengths: a.strengths, improvements: a.improvements }, { stronger_answer: a.stronger_answer, follow_up: a.follow_up }];
// The worked example as a three-step conversation: user, assistant, user, assistant, user, assistant
const IV_STEP_EXAMPLES = (() => {
  const [u, a] = IV_EXAMPLES[0], parts = ivStepSplit(a);
  return [[u + "\n" + IV_STEP_ASK[0], parts[0]], [IV_STEP_ASK[1], parts[1]], [IV_STEP_ASK[2], parts[2]]];
})();
const ivStepSchemas = T => {
  const p = ivSchema(T).properties;
  return [
    { type: "object", properties: { overall: p.overall, scores: p.scores }, required: ["overall", "scores"] },
    { type: "object", properties: { strengths: p.strengths, improvements: p.improvements }, required: ["strengths", "improvements"] },
    { type: "object", properties: { stronger_answer: p.stronger_answer, follow_up: p.follow_up }, required: ["stronger_answer", "follow_up"] }
  ];
};
// make(rules, examples) gives a session. Returns the same shape the one-shot answer has, ready for mergeAI.
async function ivRateInSteps(make, q, ans, T, progress = () => {}) {
  const s = await make(IV_NANO, IV_STEP_EXAMPLES), schemas = ivStepSchemas(T), out = {};
  try {
    for (let i = 0; i < 3; i++) {
      progress(`Rating with ${SMALL()}, step ${i + 1} of 3…`);
      const ask = i === 0 ? ivPrompt(q, ans).replace(/\nReply in this JSON shape:[\s\S]*$/, "") + "\n" + IV_STEP_ASK[0] : IV_STEP_ASK[i];
      Object.assign(out, await nanoJSON(s, ask, schemas[i]));
    }
  } finally { try { s.destroy(); } catch { /* gone */ } }
  return out;
}
