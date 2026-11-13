// Tests for the resume builder feedback round: referees read as one each, an older availability line moved into its boxes,
// "Engineering (Mechanical)" split into subject and discipline, and a job split away from its employer's stack.
import test from "node:test";
import assert from "node:assert/strict";
import { loadPage, PAGE_FUNCTIONS } from "./page-harness.mjs";

const P = loadPage([...PAGE_FUNCTIONS, "parseReferees", "migrateAvailability", "availabilityText", "splitDiscipline", "stackRoles", "emptyExp", "vagueSubject", "mergeProfiles", "geminiWriterOk", "clJobWords", "coverQuality", "adviceJudged"]);
const plain = x => JSON.parse(JSON.stringify(x));
const refs = lines => plain(P.parseReferees(lines).map(r => [r.name, r.role, r.org, r.phone, r.email]));

/* ---------------- referees ---------------- */
test("one referee written one detail to a line is one referee, not four", () => {
  assert.deepEqual(refs(["Priya Shah", "Store Manager", "Brightwater Solar", "0400 111 222", "priya@email.com"]), [["Priya Shah", "Store Manager", "Brightwater Solar", "0400 111 222", "priya@email.com"]]);
});
test("a labelled referee (Name, Role, Phone, Email) is one referee", () => {
  assert.deepEqual(refs(["Name: Priya Shah", "Role: Store Manager", "Phone: 0400 111 222", "Email: priya@email.com"]), [["Priya Shah", "Store Manager", "", "0400 111 222", "priya@email.com"]]);
});
test("two labelled referees, with or without a blank line between them, are two", () => {
  const a = ["Name: Priya Shah", "Role: Store Manager", "Phone: 0400 111 222", "Email: priya@email.com", "Name: Tom Lee", "Role: Head Chef", "Phone: 0400 333 444", "Email: tom@email.com"];
  const b = [...a.slice(0, 4), "", ...a.slice(4)];
  for (const lines of [a, b]) assert.deepEqual(refs(lines), [["Priya Shah", "Store Manager", "", "0400 111 222", "priya@email.com"], ["Tom Lee", "Head Chef", "", "0400 333 444", "tom@email.com"]]);
});
test("two referees written one detail to a line, the second starting at a new name", () => {
  assert.deepEqual(refs(["Priya Shah", "Store Manager, Brightwater Solar", "0400 111 222", "priya@email.com", "Tom Lee", "Head Chef", "Corner Cafe", "0400 333 444"]),
    [["Priya Shah", "Store Manager", "Brightwater Solar", "0400 111 222", "priya@email.com"], ["Tom Lee", "Head Chef", "Corner Cafe", "0400 333 444", ""]]);
});
test("a referee on one line (with | between the details) still works, and so do two of them", () => {
  assert.deepEqual(refs(["Priya Shah | Store Manager | Brightwater Solar | 0400 111 222 | priya@email.com", "Tom Lee, Head Chef, Corner Cafe, tom@email.com"]),
    [["Priya Shah", "Store Manager", "Brightwater Solar", "0400 111 222", "priya@email.com"], ["Tom Lee", "Head Chef", "Corner Cafe", "", "tom@email.com"]]);
});
test("phone and email on one line, after the name and role, belong to the same referee", () => {
  assert.deepEqual(refs(["Priya Shah, Store Manager", "Phone: 0400 111 222 | Email: priya@email.com"]), [["Priya Shah", "Store Manager", "", "0400 111 222", "priya@email.com"]]);
});
test("a whole resume's Referees section is read into one referee", () => {
  const text = ["PRIYA TEST", "Perth, WA | priya@test.com", "", "EXPERIENCE", "Barista, Cafe One   Jan 2020 – Present", "• Made coffee", "", "REFEREES", "Name: Sam Jones", "Role: Cafe Manager", "Phone: 0400 555 666", "Email: sam@cafe.com"].join("\n");
  const p = P.profileFromText(text);
  assert.equal(p.referees.mode, "list");
  assert.deepEqual(plain(p.referees.list.map(r => [r.name, r.role, r.phone, r.email])), [["Sam Jones", "Cafe Manager", "0400 555 666", "sam@cafe.com"]]);
});

/* ---------------- availability ---------------- */
test("an older availability line fills the work type and the start list, and the sentence is said once", () => {
  const p = P.mergeProfile({ availability: "Looking for full-time work. Available to start with two weeks' notice.", extras: { availability: true } });
  assert.equal(p.startWhen, "2w");
  assert.deepEqual(plain(p.target.workTypes), ["full"]);
  assert.equal(p.availability, "");
  assert.equal(P.availabilityText(p), "Looking for full-time work. Available to start with two weeks' notice");
});
test("the same sentence in the old line and in the new boxes is not printed twice", () => {
  const p = P.mergeProfile({ startWhen: "2w", availability: "Available to start with two weeks' notice", target: { workTypes: ["full"] } });
  assert.equal(P.availabilityText(p), "Looking for full-time work. Available to start with two weeks' notice");
});
test("days and hours in an older line are kept in their own boxes", () => {
  const p = P.mergeProfile({ availability: "Part time, weekends and Thursday nights, 15 to 20 hours a week, can start immediately" });
  assert.equal(p.startWhen, "now");
  assert.deepEqual(plain(p.target.workTypes), ["part"]);
  assert.equal(p.availHours, "15 to 20");
  assert.match(p.availDays, /weekends and Thursday nights/i);
});
test("an availability line that says nothing we know is kept, in Days you can work", () => {
  const p = P.mergeProfile({ availability: "Flexible, including public holidays" });
  assert.match(p.availDays, /Flexible, including public holidays|Flexible including public holidays/);
});

/* ---------------- subject and discipline ---------------- */
test("Engineering (Mechanical) becomes the subject Engineering and the discipline Mechanical, and the name stays the same", () => {
  const e = { ...P.emptyProfile().education.concat([{}])[0] };
  const ed = P.mergeProfile({ education: [{ level: "bach", subject: "Engineering (Mechanical)", inst: "RMIT University" }] }).education[0];
  assert.equal(ed.subject, "Engineering");
  assert.equal(ed.detail, "Mechanical");
  assert.equal(ed.degree, "Bachelor of Engineering (Mechanical)");
});
test("a degree read from a resume is split the same way", () => {
  const ed = P.mergeProfile({ education: [{ degree: "Master of Professional Engineering (Mechanical)", inst: "RMIT University" }] }).education[0];
  assert.deepEqual([ed.level, ed.subject, ed.detail, ed.degree], ["master", "Professional Engineering", "Mechanical", "Master of Professional Engineering (Mechanical)"]);
});
test("a subject that is not broad, or whose bracket is Honours, is left alone", () => {
  const a = P.mergeProfile({ education: [{ level: "bach", subject: "Mechanical Engineering (Honours)", inst: "X" }] }).education[0];
  assert.equal(a.subject, "Mechanical Engineering (Honours)");
  assert.equal(a.detail, "");
  const b = P.mergeProfile({ education: [{ level: "bach", subject: "Engineering (Honours)", inst: "X" }] }).education[0];
  assert.equal(b.subject, "Engineering (Honours)");
  assert.equal(b.detail, "");
});

/* ---------------- splitting a job away from its employer's stack ---------------- */
test("a job that is split away is not stacked with the others at that employer", () => {
  const mk = (title, grp = "") => ({ ...P.emptyExp(), title, org: "Brightwater Solar", start: "Jan 2020", grp });
  const list = [mk("Senior Engineer"), mk("Engineer"), mk("Intern")];
  const stacked = plain(P.stackRoles(list, e => ({ title: e.title, org: e.org, bullets: [], dates: "" }), false));
  assert.equal(stacked.filter(x => x.stack === "company").length, 1);
  assert.equal(stacked.filter(x => x.stack === "role").length, 3);
  list[2].grp = "x1";   // the intern job is split away
  const after = plain(P.stackRoles(list, e => ({ title: e.title, org: e.org, bullets: [], dates: "" }), false));
  assert.equal(after.filter(x => x.stack === "company").length, 1);
  assert.equal(after.filter(x => x.stack === "role").length, 2);
  assert.deepEqual(after.filter(x => !x.stack).map(x => x.title), ["Intern"]);
});

test("an older line that says the same thing twice is still moved into the boxes cleanly", () => {
  const p = P.mergeProfile({ availability: "Looking for full-time work. Available to start with two weeks' notice. Available to start with two weeks' notice" });
  assert.equal(p.startWhen, "2w");
  assert.equal(p.availDays, "");
  assert.equal(P.availabilityText(p), "Looking for full-time work. Available to start with two weeks' notice");
});

test("an uploaded resume's availability line fills the work type and start list of the profile it is merged into", () => {
  const text = ["PRIYA TEST", "Perth, WA | priya@test.com", "", "EXPERIENCE", "Barista, Cafe One   Jan 2020 – Present", "• Made coffee", "", "AVAILABILITY", "Looking for full-time work. Available to start with two weeks' notice."].join("\n");
  const m = P.mergeProfiles(P.emptyProfile(), P.profileFromText(text));
  assert.equal(m.startWhen, "2w");
  assert.deepEqual(plain(m.target.workTypes), ["full"]);
  assert.equal(m.extras.availability, true);
  assert.equal(P.availabilityText(m), "Looking for full-time work. Available to start with two weeks' notice");
});

/* ---------------- Year 12 certificates written in full ---------------- */
test("Year 12 with the certificate WACE is written in full, and the other state certificates too", () => {
  const name = (level, subject) => P.mergeProfile({ education: [{ level, subject, inst: "X" }] }).education[0].degree;
  assert.equal(name("y12", "WACE"), "Year 12 Western Australian Certificate of Education (WACE)");
  assert.equal(name("y12", "wace"), "Year 12 Western Australian Certificate of Education (WACE)");
  assert.equal(name("y12", "VCE"), "Year 12 Victorian Certificate of Education (VCE)");
  assert.equal(name("y12", "International Baccalaureate (IB) Diploma"), "Year 12 (International Baccalaureate (IB) Diploma)");   // (as before: only the state certificates are written out)
  assert.equal(name("y12", "Something local"), "Year 12 (Something local)");
  assert.equal(name("y12", ""), "Year 12");
  assert.equal(name("y10", "WACE"), "Year 10 (WACE)");
});
test("a resume that says Year 12 (WACE), or the full name, is read as Year 12 with the certificate, and written in full", () => {
  for (const degree of ["Year 12 (WACE)", "Year 12 Western Australian Certificate of Education (WACE)"]) {
    const e = P.mergeProfile({ education: [{ degree, inst: "Perth College" }] }).education[0];
    assert.deepEqual([e.level, e.degree], ["y12", "Year 12 Western Australian Certificate of Education (WACE)"]);
  }
});

/* ---------------- which Gemini models may write a cover letter ---------------- */
test("only Gemini 3.8 Flash, 3.6 Flash and 3 Flash (and their preview copies) may write a cover letter", () => {
  for (const ok of ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3-flash", "gemini-3.8-flash-preview-05-20", "gemini-3-flash-latest"]) assert.equal(P.geminiWriterOk(ok), true, ok);
  for (const no of ["gemini-3.5-flash-lite", "gemini-3.8-flash-lite", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.8-pro", "gemma-3-27b", ""]) assert.equal(P.geminiWriterOk(no), false, no);
});

/* ---------------- what the cover letter is judged on ---------------- */
test("a word that belongs to the job (engineering, in an engineering job) may repeat; other repeated words are still marked", () => {
  const paras = ["My engineering degree taught me engineering design.", "At Brightwater I applied engineering standards to every solar array.", "Engineering teams rely on careful drawings and engineering reviews.", "I want to join an engineering team that builds things.", "Thank you for considering my application."];
  const titles = q => q.map(x => x.title);
  const words = P.clJobWords("Mechanical Engineer", "Engineering");
  assert.ok(words.includes("engineer"));
  assert.equal(titles(P.coverQuality(paras, "", { jobWords: words })).includes("Words used again and again"), false);
  const repeatsOther = paras.map(p => p.replace(/engineering/gi, "careful"));
  assert.ok(plain(P.coverQuality(repeatsOther, "", { jobWords: words })).some(x => /again and again|Repeated|repeat/i.test(x.title)), "an ordinary word used five times is marked");
});
test("the AI is told how the letter is judged, including that the job's own words may repeat", () => {
  const t = P.adviceJudged(["engineering"]);
  for (const bit of ["Same words in two paragraphs", "Habit words", "Repeated words", "engineering", "330 to 390"]) assert.ok(t.includes(bit), bit);
});
