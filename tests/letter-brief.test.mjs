// Regression tests from the fix brief: a real letter the writer produced that could not be sent.
// Run with:  npm test   (or: node --test)
import test from "node:test";
import assert from "node:assert/strict";

import { LR, BAD_LETTER } from "./letter-fixtures.mjs";

const bad = BAD_LETTER;
// the five body paragraphs, in order (opening, experience, education, why this company, close)
const body = bad.split(/\n\s*\n/).filter(p => /^(I am|I worked|I can)/.test(p.trim())).map(p => p.trim());
const KINDS = ["opening", "experience", "education", "motivation", "closing"];
const paras = body.map((text, i) => ({ kind: KINDS[i], text }));
const ctx = {
  length: "standard", jobTitle: "Graduate Engineer (Renewables)", employer: "Kestrel Renewables", creds: ["Master of Engineering (Mechanical)"],
  terms: [{ term: "Master of Engineering", kind: "credential", limit: 1 }, { term: "Microsoft Excel", kind: "tool", limit: 2 }, { term: "Excel", kind: "tool", limit: 2 }, { term: "November 2027", kind: "date", limit: 1 }]
};
const issues = LR.validateLetter(paras, ctx);
const has = (type, re) => issues.some(x => x.type === type && (!re || re.test(x.detail)));

test("the bad letter splits into five paragraphs", () => assert.equal(paras.length, 5));
test("placeholder brackets and e.g. are caught", () => { assert.ok(LR.patternsFound(bad, { placeholders: true }).length); assert.ok(has("placeholder")); assert.ok(/e\.g\./.test(bad) && LR.patternsFound("Sam Lee, e.g. Sydney", { placeholders: true }).includes("e.g.")); });
// (an evidence paragraph now has 78 to 90 words, so the 100 here is inside the limit of 108; its seven sentences are still over the cap of five)
test("the experience paragraph is over its sentence budget", () => { assert.ok(issues.some(x => x.i === 1 && x.type === "too_many_sentences")); assert.ok(!issues.some(x => x.i === 1 && x.type === "too_long")); });
test("the stiff wording is found", () => {
  const found = LR.patternsFound(bad);
  for (const w of ["aligning with", "please feel free", "commence", "proficiency", "demonstrated ability", "is crucial for", "successful outcomes", "effectively", "problem solving", "interpersonal", "analytical skills", "i am drawn to", "my first task was", "i was working on"]) assert.ok(found.includes(w), w);
});
test("US spelling is put right by one general rule, and real -ize words are kept", () => {
  assert.equal(LR.auSpelling("optimizing energy generation"), "optimising energy generation");
  assert.equal(LR.auSpelling("maximize, analyzed, organization, emphasized"), "maximise, analysed, organisation, emphasised");
  assert.equal(LR.auSpelling("the size of the prize"), "the size of the prize");
  assert.equal(LR.auSpelling("seized and resized"), "seized and resized");
  assert.ok(has("spelling"));
});
test("a degree still being studied can't be said to be held", () => {
  assert.ok(has("tense", /Master of Engineering/));
  assert.equal(LR.tenseProblem("I'm completing a Master of Engineering and finish in November 2027.", ctx.creds), "");
  assert.ok(LR.tenseProblem("I have a degree in engineering.", []));
});
test("the opening has to name the job and the employer", () => { assert.ok(has("opening_title")); assert.ok(has("opening_employer")); });
test("a tool or a credential used in too many paragraphs is flagged", () => {
  const used = LR.termUse(paras.map(p => p.text), ctx.terms);
  const excel = used.find(u => u.term === "Excel"), cred = used.find(u => u.term === "Master of Engineering");
  assert.equal(excel.where.length, 3);
  assert.equal(cred.where.length, 2);
  assert.ok(has("repeat_term"));
});
test("a sentence that explains why a skill matters is flagged", () => { assert.deepEqual(LR.badSentenceStarts("This ability to analyse complex data is valuable. I led it."), ["This ability to analyse complex data is valuable."]); assert.ok(has("filler")); });
test("a stem used too often in one letter is flagged", () => { assert.ok(has("repeat_stem", /analy|skill|effective/)); });

test("one to nine are written as words, with the exceptions", () => {
  assert.equal(LR.numberWords("a team of 2 and 5 new staff"), "a team of two and five new staff");
  assert.equal(LR.numberWords("5% growth, 3:30 pm, 2-3 days, 1.5 hours, 12 months, 40+ events, $180,000"), "5% growth, 3:30 pm, 2-3 days, 1.5 hours, 12 months, 40+ events, $180,000");
  assert.equal(LR.numberWords("In Year 9 I learned Python 3 and ran 4 kW of panels"), "In Year 9 I learned Python 3 and ran 4 kW of panels");
  assert.equal(LR.numberWords("3 engineers helped."), "Three engineers helped.");
  assert.equal(LR.numberWords("Over 5 years I led 7 people."), "Over five years I led seven people.");
});

test("a student near the end of a degree, applying for a graduate job, is a graduate", () => {
  const roles = [{ title: "Consulting Analyst", org: "Worley", start: "Nov 2025", end: "Feb 2026", paid: true, field: "engineering" }];
  const d = LR.deriveSituation({ roles, jobField: "engineering", graduate: true }, new Date(2026, 10, 9));
  assert.equal(d.situation, "graduate");
  assert.equal(LR.deriveSituation({ roles, jobField: "engineering" }, new Date(2026, 10, 9)).situation, "standard");
});

test("a good letter passes every check", () => {
  const good = [
    ["opening", "I am applying for the Graduate Engineer (Renewables) role at Kestrel Renewables. As a Consulting Analyst at Worley, I helped with the site analysis that informed the solar layout and generation modelling for the Tiwi H2 Project's pre-feasibility study. I'm completing a Master of Engineering (Mechanical) at RMIT University and finish in November 2027."],
    ["experience", "Your ad asks for data analysis in Python or Excel. On that project, two other engineers and I used Python and Excel to evaluate solar intensity across the site of a new production facility. We also created the site survey maps in QGIS and Google Earth Pro."],
    ["education", "You are also looking for an interest in renewable energy and sustainable design. My master's has focused on sustainable engineering practices and the modelling and simulation of engineering systems. For my major project, I used Python to process the data for a modal and frequency analysis of the Tesla Cybertruck."],
    ["motivation", "Kestrel builds its own solar projects in regional Victoria, and I would like to follow one from site assessment through to delivery."],
    ["closing", "I can start the program in February 2028. Thank you for considering my application. I would welcome the chance to discuss the role."]
  ].map(([kind, text]) => ({ kind, text }));
  // (the wording passes every check; this sample is shorter than the 330 to 390 words a full letter has, which is the one thing flagged)
  assert.deepEqual(LR.validateLetter(good, ctx).filter(x => x.type !== "length"), []);
  assert.deepEqual(LR.validateLetter(good, ctx).map(x => x.type), ["length"]);
  assert.deepEqual(LR.validateLetter(good, { ...ctx, length: "short" }), [], "a short letter the person chose is not flagged");
  assert.deepEqual(LR.validateLetter(good, { ...ctx, wordLimit: 250 }), [], "an ad's word limit overrides the length");
});
test("placeholders [CAPS: guidance] count as one word, and an unfilled one is flagged", () => {
  const t = "I want to work at Kestrel because of [EMPLOYER PROJECT: a named project from their website] and its work in [REGION: where they build].";
  assert.equal(LR.words(t), LR.words("I want to work at Kestrel because of gap and its work in gap."));
  assert.ok(LR.validateLetter([{ kind: "motivation", text: t }], ctx).some(x => x.type === "placeholder"));
});
