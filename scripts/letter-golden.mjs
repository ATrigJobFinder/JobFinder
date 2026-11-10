#!/usr/bin/env node
// The "golden run": prints the three fixture letters from the cover letter spec (Alex: standard, Jordan: career change, Mia: first job)
// with what the code-side rules say about each paragraph, so a person can read them after any change to the rules.
// There is no AI in this script: the letters are the ones the cover letter guide shows. To see what the real writers make, use the
// Create or edit cover letter and Tailor to a job pages with the same details.
//
//   node scripts/letter-golden.mjs
import { LR, NOW, ALEX, JORDAN, MIA, sourcesOf } from "../tests/letter-fixtures.mjs";

const short = s => s.length > 150 ? s.slice(0, 147) + "…" : s;
for (const [name, f, length] of [["Alex (standard)", ALEX, "standard"], ["Jordan (career change)", JORDAN, "standard"], ["Mia (first job)", MIA, "short"]]) {
  const total = f.letter.reduce((n, p) => n + LR.words(p), 0);
  console.log(`\n=== ${name} · ${f.title} at ${f.employer} · ${total} words (the ${length} letter is ${LR.LENGTH[length].join("–")}, with the letter head and sign-off) ===`);
  f.letter.forEach((p, i) => {
    const errs = LR.checkParagraph(p, { sources: sourcesOf(f), employer: f.employer, jobTitle: f.title, kind: i === 0 ? "opening" : "any" });
    console.log(`\n${i + 1}. (${LR.words(p)} words, ${LR.sentences(p).length} sentences) ${errs.length ? "PROBLEMS: " + errs.map(e => e.msg).join(" | ") : "ok"}\n   ${p}`);
  });
  const cross = LR.crossChecks(f.letter, { employer: f.employer, jobTitle: f.title });
  console.log(`\nBetween paragraphs: ${cross.length ? cross.map(c => c.msg).join(" | ") : "ok"}.  Sentences starting with I or My: ${Math.round(LR.iStartShare(f.letter) * 100)}%.`);
  if (f.roles) console.log(`Derived by code: ${LR.yearsText(LR.monthsIn(f.roles, "hospitality", NOW), "hospitality")}.`);
}
console.log("");
