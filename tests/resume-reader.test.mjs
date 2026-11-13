// Tests for the resume reader (the "ATS" that turns an uploaded resume into the profile) and the "is there a resume in the profile" check.
// The page's own scripts are loaded by tests/page-harness.mjs. Run with:  npm test   (or: node --test)
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-harness.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = f => fs.readFileSync(path.join(here, "fixtures", f), "utf8");
const P = loadPage();
// (the page runs in its own realm: arrays it makes are copied into this one before they are compared)
const plain = x => JSON.parse(JSON.stringify(x));
const ed = p => plain(p.education.map(e => [e.degree, e.inst, e.location, e.start, e.end]));
const jobs = (p, f) => plain(p.experience.map(f));

/* ---------------- a two-column resume read from a PDF: the dates wrap in their narrow column ---------------- */
test("a wrapped date is put back together and the title and employer go below it", () => {
  const rows = ["Nov 2022 – May   Data Analyst - Vacation Student Program", "2023   Worley, Perth, WA", "• Collected data"];
  assert.deepEqual(plain(P.joinWrappedDates(rows)), ["Nov 2022 – May 2023", "Data Analyst - Vacation Student Program", "Worley, Perth, WA", "• Collected data"]);
  // dates that are already whole, or two different dates, are left alone
  assert.deepEqual(plain(P.joinWrappedDates(["Nov 2022 – May 2023   Data Analyst", "Perth, WA"])), ["Nov 2022 – May 2023   Data Analyst", "Perth, WA"]);
  assert.deepEqual(plain(P.joinWrappedDates(["Mar 2021 –   Barista", "Present   Cafe One"])), ["Mar 2021 – Present", "Barista", "Cafe One"]);
});
test("PDF rows with the date in a left column are read into the right fields (title, employer, place, dates)", () => {
  const it = (s, x, y, h = 10) => ({ str: s, transform: [h, 0, 0, h, x, y], width: s.length * 5, height: h });
  for (const drift of [0, 1.5, 4]) {   // the right column's second row sits a little lower than the date's: still the same line
    const items = [
      it("EXPERIENCE", 40, 760),
      it("Nov 2022 – May", 40, 700), it("Data Analyst - Vacation Student Program", 200, 700),
      it("2023", 40, 686), it("Worley, Perth, WA", 200, 686 - drift),
      it("•", 205, 672), it("Collected, cleaned, and organised complex datasets using Python and Microsoft Excel", 220, 672),
      it("EDUCATION", 40, 600),
      it("Feb 2024 – Nov", 40, 580), it("Master of Professional Engineering (Mechanical)", 200, 580),
      it("2025", 40, 566), it("RMIT University, Melbourne, VIC", 200, 566 - drift),
      it("•", 205, 552), it("WAM: 82", 220, 552)
    ];
    const text = "ANDREW SMITH\nPerth, WA | andrew@email.com\n\n" + P.pdfItemsToText(items);
    const p = P.profileFromText(text);
    const job = p.experience[0];
    assert.equal(p.experience.length, 1, "drift " + drift);
    assert.deepEqual([job.title, job.org, job.location, job.start, job.end, job.bullets.length], ["Data Analyst - Vacation Student Program", "Worley", "Perth, WA", "Nov 2022", "May 2023", 1], "drift " + drift);
    assert.deepEqual(ed(p), [["Master of Professional Engineering (Mechanical)", "RMIT University", "Melbourne, VIC", "Feb 2024", "Nov 2025"]], "drift " + drift);
    assert.equal(p.education[0].grade, "WAM: 82");
  }
});
test("Andrew's saved reader output (the screenshot layout) reads into a full profile", () => {
  const text = P.joinWrappedDates(fixture("andrew-bad-output.txt").split("\n")).join("\n");
  const p = P.profileFromText(text);
  assert.equal(p.contact.name, "Andrew Smith");
  assert.equal(p.target.title, "Mechanical Engineer", "the headline under the name, not the contact line");
  assert.deepEqual(jobs(p, e => [e.title, e.org, e.location, e.start, e.end, e.bullets.length]), [["Data Analyst - Vacation Student Program", "Worley", "Perth, WA", "Nov 2022", "May 2023", 3]]);
  assert.deepEqual(ed(p), [
    ["Master of Professional Engineering (Mechanical)", "RMIT University", "Melbourne, VIC", "Feb 2024", "Nov 2025"],
    ["Bachelor of Engineering (Honours) (Mechanical)", "Curtin University", "Perth, WA", "Feb 2020", "Nov 2023"]
  ]);
  assert.equal(p.education[0].project, "Thesis: Heat transfer in battery modules", "the last line of a qualification stays with it");
  assert.equal(p.education[0].grade, "WAM: 82");
  assert.ok(p.skills.software.includes("Power BI"));
});
test("a clean resume (date on its own line, nothing wrapped) reads the same way", () => {
  const p = P.profileFromText(fixture("andrew-resume.txt"));
  assert.deepEqual(jobs(p, e => [e.title, e.org, e.location, e.start, e.end]), [["Data Analyst - Vacation Student Program", "Worley", "Perth, WA", "Nov 2022", "May 2023"]]);
  assert.deepEqual(ed(p).map(r => r.slice(0, 3)), [["Master of Professional Engineering (Mechanical)", "RMIT University", "Melbourne, VIC"], ["Bachelor of Engineering (Honours) (Mechanical)", "Curtin University", "Perth, WA"]]);
});
test("the usual layout (title and date on one line, employer below) still reads", () => {
  const text = `JORDAN LEE
Brisbane QLD | 0400 111 222 | jordan@email.com

EXPERIENCE
Barista | Mar 2021 – Present
Cafe One, Brisbane QLD
• Served 150+ customers a shift

EDUCATION
Bachelor of Business (Marketing) | Feb 2018 – Nov 2021
Griffith University, Brisbane QLD
`;
  const p = P.profileFromText(text);
  assert.deepEqual(jobs(p, e => [e.title, e.org]), [["Barista", "Cafe One"]]);
  assert.deepEqual(ed(p).map(r => r.slice(0, 3)), [["Bachelor of Business (Marketing)", "Griffith University", "Brisbane QLD"]]);
});
test("with the date first, a sentence under the title is a bullet point, not the employer", () => {
  const text = `JORDAN LEE
Brisbane QLD | 0400 111 222 | jordan@email.com

EXPERIENCE
Mar 2021 – Present
Barista
Led a team of three on weekends
• Opened and closed the store

Jan 2019 – Feb 2021
Sales Assistant
Cafe One, Brisbane QLD
• Served customers
`;
  const p = P.profileFromText(text);
  assert.deepEqual(jobs(p, e => [e.title, e.org, e.bullets.length]), [["Barista", "", 2], ["Sales Assistant", "Cafe One", 1]]);
});

/* ---------------- the discipline goes in brackets in the education title ---------------- */
test("a broad subject plus a discipline is written with the discipline in brackets", () => {
  const e = { ...P.emptyProfile().education[0], level: "master", subject: "Professional Engineering", detail: "Mechanical" };
  P.syncQual(e);
  assert.equal(e.degree, "Master of Professional Engineering (Mechanical)");
  const b = { ...e, level: "bach", subject: "Engineering", detail: "(Civil)", degree: "" };
  P.syncQual(b);
  assert.equal(b.degree, "Bachelor of Engineering (Civil)", "brackets typed by the person aren't doubled");
  const n = { ...e, subject: "Mechanical Engineering", detail: "Mechanical", degree: "" };
  P.syncQual(n);
  assert.equal(n.degree, "Master of Mechanical Engineering", "a specific subject needs no follow-up");
});
test("LinkedIn education lines keep the discipline in brackets", () => {
  const rows = ["RMIT University", "Master of Professional Engineering, Mechanical · (Feb 2024 - Nov 2025)", "Curtin University", "Bachelor of Engineering (Honours), Mechanical Engineering · (2020 - 2023)"].join("\n");
  const out = P.liEducation(rows);
  assert.equal(out[0].degree, "Master of Professional Engineering (Mechanical)");
  assert.equal(out[1].degree, "Bachelor of Engineering (Honours) (Mechanical Engineering)");
});

/* ---------------- is there a resume in the profile? ---------------- */
test("a profile that only has a name is not a resume", () => {
  const p = P.emptyProfile();
  p.contact.name = "Andrew Smith";
  assert.equal(P.hasProfile(p), true, "there are details");
  assert.equal(P.hasResume(p), false, "but no resume to read from");
  p.skills.software.push("Excel");
  assert.equal(P.hasResume(p), true);
  const q = P.emptyProfile(); q.experience[0] = { ...q.experience[0], title: "Barista" };
  assert.equal(P.hasResume(q), true);
  assert.equal(P.hasResume(P.emptyProfile()), false);
});

/* ---------------- the example profiles, laid out the ways different designs lay out a resume, then read back ---------------- */
const head = p => [p.contact.name, p.target.title, [p.contact.location, p.contact.phone, p.contact.email].filter(Boolean).join(" | "), "", "EXPERIENCE"];
const place = (a, b) => [a, b].filter(Boolean).join(", ");
const LAYOUTS = {
  "builder's plain text": p => P.profileToText(p),
  "date on its own line first (two columns)": p => [...head(p), ...p.experience.flatMap(e => [P.rangeOf(e), e.title, place(e.org, e.location), ...e.bullets.map(b => "• " + b), ""]), "EDUCATION", ...p.education.flatMap(e => [P.rangeOf(e, true), e.degree, place(e.inst, e.location), ""])].join("\n"),
  "title, employer, then the date underneath": p => [...head(p), ...p.experience.flatMap(e => [e.title, place(e.org, e.location), P.rangeOf(e), ...e.bullets.map(b => "• " + b), ""]), "EDUCATION", ...p.education.flatMap(e => [e.degree, place(e.inst, e.location), P.rangeOf(e, true), ""])].join("\n"),
  "title and date on one line, employer below": p => [...head(p), ...p.experience.flatMap(e => [`${e.title}   ${P.rangeOf(e)}`, place(e.org, e.location), ...e.bullets.map(b => "• " + b), ""]), "EDUCATION", ...p.education.flatMap(e => [`${e.degree}   ${P.rangeOf(e, true)}`, place(e.inst, e.location), ""])].join("\n")
};
const fields = p => plain({
  exp: p.experience.map(e => [e.title, e.org, e.location, e.start, e.end, e.current, e.bullets.length]),
  edu: p.education.map(e => [e.degree, e.inst, e.location, e.start, e.end])
});
const andrew = (() => {   // Andrew's own resume, with the entries finished (an imported one is a draft until it is)
  const p = P.mergeProfile(P.profileFromText(fixture("andrew-resume.txt")));
  for (const l of ["experience", "education"]) p[l].forEach(e => { e.done = true; });
  return p;
})();
for (const [who, prof] of [["the Sam Taylor example", P.SAMPLE_PROFILE], ["the full example (every section)", P.EXAMPLE_PROFILE], ["Andrew", andrew]]) {
  for (const [layout, make] of Object.entries(LAYOUTS)) {
    test(`${who}, laid out as ${layout}, is read back with every job and qualification in the right fields`, () => {
      assert.deepEqual(fields(P.profileFromText(make(prof))), fields(prof));
    });
  }
}

/* ---------------- the layout preview: what's done shows as it is, the rest shows guidance, never made-up details ---------------- */
const tplOf = key => P.CV_TEMPLATES.find(t => t.key === key) || P.CV_TEMPLATES[0];
const textOf = html => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
test("with only a name given, the preview keeps the name and guides every other part (no example person, no Profile section)", () => {
  const p = P.emptyProfile(); p.contact.name = "Andrew Smith"; p.contact.first = "Andrew"; p.contact.last = "Smith";
  for (const t of P.CV_TEMPLATES.slice(0, 12)) {
    const m = P.cvModel(p, t, { guide: true });
    assert.deepEqual(plain(m.guided).sort(), ["contact", "education", "experience", "headline", "skills"], t.key);
    const html = P.cvHtml(m, t, {}), text = textOf(html);
    assert.ok(text.includes("Andrew Smith"), t.key);
    assert.ok(/class="cv-ghost"/.test(html) && !/[\uE000\uE001]/.test(html), "guidance is grey, and the marks are gone: " + t.key);
    assert.ok(!/Sam Taylor|Harbourside|Griffith|Marketing/.test(text), "no made-up person: " + t.key);
    assert.ok(!/cv-s-summary/.test(html), "no Profile section when none is written: " + t.key);
  }
});
test("a part that is finished shows the person's own words, and only the unfinished parts are guided", () => {
  const p = P.emptyProfile(); p.contact.name = "Andrew Smith"; p.summary = "Mechanical engineering graduate.";
  p.experience[0] = { ...p.experience[0], title: "Data Analyst", org: "Worley", start: "Nov 2022", end: "May 2023", done: true, bullets: ["Built Power BI dashboards"] };
  p.education[0] = { ...p.education[0], degree: "Master of Professional Engineering (Mechanical)", inst: "RMIT University", done: false };   // not finished yet
  const t = tplOf("professional"), m = P.cvModel(p, t, { guide: true }), text = textOf(P.cvHtml(m, t, {}));
  assert.deepEqual(plain(m.guided).sort(), ["contact", "education", "headline", "skills"]);
  assert.ok(text.includes("Data Analyst") && text.includes("Worley") && text.includes("Built Power BI dashboards") && text.includes("Mechanical engineering graduate."));
  assert.ok(!text.includes("Master of Professional Engineering"), "an unfinished qualification isn't on the resume yet");
  // downloads and the text version never carry guidance
  const real = textOf(P.cvHtml(P.cvModel(p, t), t, {}));
  assert.ok(!/Job title|Employer|Your qualification/.test(real) && !/[\uE000\uE001]/.test(P.cvHtml(P.cvModel(p, t), t, {})));
});
test("the resume strength check doesn't ask for a profile, because it is optional", () => {
  const p = P.emptyProfile(); p.contact.name = "Andrew Smith";
  assert.ok(!plain(P.resumeHealth(p).items).some(i => /short profile|profile/i.test(i.text)));
});

/* ---------------- scholarships and awards: "Show − 3 +" ---------------- */
test("awards show in full until a number is chosen, then only that many", () => {
  const e = { ...P.emptyProfile().education[0], awards: "Dean's List\nExcellence Scholarship\nVolunteer Award\nRobotics Prize\nChess Medal" };
  const p = P.emptyProfile();
  assert.deepEqual(plain(P.eduLines(e, p)), [e.awards.split("\n").join("; ")], "unset: all five, as before");
  e.awardsShown = 2;
  assert.deepEqual(plain(P.eduLines(e, p)), ["Dean's List; Excellence Scholarship"]);
  assert.deepEqual(plain(P.eduLines(e, p, "", true)), [e.awards.split("\n").join("; ")], "the AI is still given all of them");
  assert.equal(P.awardsN({ awardsShown: 0 }, 5), 5);
  assert.equal(P.awardsN({ awardsShown: 12 }, 5), 8, "never more than 8");
});
