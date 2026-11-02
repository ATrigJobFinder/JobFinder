// Employer table, discovery and the extra hiring systems. Run with: node --test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nextHealth, runEmployerFeeds, nameKey } from "../jobs-import/lib/employers.mjs";
import { parseRobots, robotsAllows, Gate, pool } from "../jobs-import/lib/http.mjs";
import { detectInText, guessTokens, looksLikeCompany, careersLinks, domainRoot } from "../jobs-import/lib/detect.mjs";
import { mapEmployerJob, ATS } from "../jobs-import/lib/mappers.mjs";
import { blocks, tagText } from "../jobs-import/lib/xml.mjs";
import { isAustralian } from "../jobs-import/lib/au.mjs";
import { employerRow } from "../jobs-import/lib/discovery.mjs";

const fx = n => fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", n), "utf8");
const emp = (ats, token) => ({ id: 7, name: token, ats, token });

/* --- Health: broken after 3 failures, no_au_jobs after 8 weeks, back when Australian jobs return --- */
test("three failures in a row make an employer broken", () => {
  let e = { status: "active", consecutive_errors: 0 };
  for (let i = 1; i <= 3; i++) { const p = nextHealth(e, { ok: false, error: "HTTP 500" }); assert.equal(p.consecutive_errors, i); assert.equal(p.status, i === 3 ? "broken" : undefined); e = { ...e, ...p }; }
  assert.equal(nextHealth({ status: "active", consecutive_errors: 2 }, { ok: true, total: 5, au: 2 }).consecutive_errors, 0);
});
test("eight weeks with no Australian jobs make an employer no_au_jobs", () => {
  let e = { status: "active", zero_au_weeks: 0 };
  for (let w = 1; w <= 8; w++) { const p = nextHealth(e, { ok: true, total: 20, au: 0 }); e = { ...e, ...p }; assert.equal(p.status, w === 8 ? "no_au_jobs" : undefined); }
  assert.equal(nextHealth({ status: "no_au_jobs", zero_au_weeks: 9 }, { ok: true, total: 20, au: 3 }).status, "active");
  assert.equal(nextHealth({ status: "active", zero_au_weeks: 5 }, { ok: true, total: 20, au: 1 }).zero_au_weeks, 0);
});
test("a failed fetch changes no job data and records the error", async () => {
  const saved = [];
  const stats = await runEmployerFeeds({ employers: [emp("greenhouse", "a"), emp("lever", "b")], fetchImpl: async u => String(u).includes("greenhouse") ? { ok: false, status: 404 } : { ok: true, status: 200, json: async () => [{ id: "1", text: "Engineer", hostedUrl: "https://x/1", categories: { location: "Sydney" } }] }, onResult: async (e, out) => saved.push([e.token, out.ok, out.patch]) });
  assert.equal(stats.ok, 1); assert.equal(stats.failed, 1);
  const a = saved.find(s => s[0] === "a"), b = saved.find(s => s[0] === "b");
  assert.equal(a[1], false); assert.equal(a[2].consecutive_errors, 1); assert.match(a[2].last_error, /404/);
  assert.equal(b[1], true); assert.equal(b[2].last_au_jobs, 1);
});
test("an unsupported hiring system is a failure, not a crash", async () => {
  const stats = await runEmployerFeeds({ employers: [{ id: 1, name: "Big Co", ats: "workday", token: "bigco" }], fetchImpl: async () => { throw new Error("should not fetch"); } });
  assert.equal(stats.failed, 1);
});

/* --- Personio and Teamtailor --- */
test("XML reading", () => {
  assert.equal(blocks(fx("personio.xml"), "position").length, 2);
  assert.equal(tagText("<a><name><![CDATA[A & B]]></name></a>", "name"), "A & B");
  assert.equal(tagText("<a><name>A &amp; B</name></a>", "name"), "A & B");
});
test("Personio positions map to job rows", () => {
  const list = ATS.personio.list(fx("personio.xml"));
  const au = mapEmployerJob("personio", list[0], emp("personio", "example"));
  assert.equal(au.row.source, "employer:personio"); assert.equal(au.row.source_id, "example:1234567");
  assert.equal(au.row.title, "Mechanical Design Engineer"); assert.equal(au.row.state, "NSW");
  assert.equal(au.row.url, "https://example.jobs.personio.de/job/1234567");
  assert.match(au.row.description, /Design pumps/); assert.ok(!/script|bad\(\)/.test(au.row.description));
  assert.equal(au.row.job_type, "Full time"); assert.equal(au.row.employer_id, 7);
  const de = mapEmployerJob("personio", list[1], emp("personio", "example"));
  assert.equal(isAustralian({ location: de.row.location, country: de.country }), false);
});
test("Teamtailor items map to job rows", () => {
  const list = ATS.teamtailor.list(fx("teamtailor.rss"));
  assert.equal(list.length, 2);
  const a = mapEmployerJob("teamtailor", list[0], emp("teamtailor", "example"));
  assert.equal(a.row.title, "Civil Engineer"); assert.equal(a.row.state, "VIC"); assert.match(a.row.url, /teamtailor\.com\/jobs\/111/);
  assert.ok(!/iframe/.test(a.row.description)); assert.equal(a.row.is_remote, false);
  const s = mapEmployerJob("teamtailor", list[1], emp("teamtailor", "example"));
  assert.equal(s.row.is_remote, true); assert.equal(isAustralian({ location: s.row.location, isRemote: true, extra: s.row.title }), false);
});

/* --- Finding a company's hiring system --- */
test("hiring systems are found in careers page text", () => {
  const html = `<a href="https://boards.greenhouse.io/acme/jobs/1">Apply</a> <iframe src="https://job-boards.greenhouse.io/embed/job_board?for=acmeco"></iframe>
    <a href="https://jobs.lever.co/zeta">x</a> <a href="https://jobs.eu.lever.co/euco">y</a> <a href="https://apply.workable.com/j/ABC">job</a> <a href="https://apply.workable.com/wk-co/">z</a>
    <script src="https://acme.teamtailor.com/embed.js"></script> <a href="https://careers.smartrecruiters.com/Acme/">s</a> https://acme.recruitee.com https://www.recruitee.com
    <a href="https://boq.wd3.myworkdayjobs.com/en-US/BOQ">w</a> https://jobs.ashbyhq.com/ashco`;
  const f = detectInText(html), has = (ats, token) => f.some(x => x.ats === ats && x.token === token);
  assert.ok(has("greenhouse", "acme") && has("greenhouse", "acmeco") && has("lever", "zeta") && has("lever_eu", "euco") && has("workable", "wk-co") && has("teamtailor", "acme") && has("smartrecruiters", "Acme") && has("recruitee", "acme") && has("ashby", "ashco"));
  assert.ok(!has("workable", "j") && !has("recruitee", "www"));
  const wd = f.find(x => x.ats === "workday");
  assert.ok(wd && wd.token === "boq" && wd.supported === false);
  assert.ok(f.findIndex(x => x.supported) < f.findIndex(x => !x.supported), "supported systems come first");
});
test("careers links are picked from a page", () => {
  const links = careersLinks('<a href="/about">About</a><a href="/careers">Careers</a><a href="https://jobs.example.com/">Join us</a><a href="mailto:jobs@example.com">Jobs</a>', "https://example.com/");
  assert.deepEqual(links, ["https://example.com/careers", "https://jobs.example.com/"]);
});
test("name guesses are few, and a guessed board has to belong to the company", () => {
  const g = guessTokens("Acme Health Pty Ltd", "https://www.acmehealth.com.au");
  assert.ok(g.length <= 5 && g.includes("acmehealth") && g.includes("acme-health") && g.includes("acme"));
  assert.equal(domainRoot("https://www.acmehealth.com.au/careers"), "acmehealth");
  assert.equal(looksLikeCompany("We are Acme Health, hiring in Sydney. See acmehealth.com.au", "Acme Health Pty Ltd", "acmehealth.com.au"), true);
  assert.equal(looksLikeCompany("Join Imagine Corp in Texas", "Acme Health Pty Ltd", "acmehealth.com.au"), false);
});
test("company names match without Pty Ltd and the like", () => {
  assert.equal(nameKey("Coastline Energy Services Pty Ltd"), nameKey("Coastline Energy Services Australia"));
});

/* --- Politeness: robots.txt, and limits on requests at once --- */
test("robots.txt rules are obeyed", () => {
  const g = parseRobots("User-agent: *\nDisallow: /private/\nAllow: /private/jobs\nUser-agent: JobFinderBot\nDisallow: /careers/internal\n");
  assert.equal(robotsAllows(g, "/careers"), true);
  assert.equal(robotsAllows(g, "/careers/internal/x"), false);
  assert.equal(robotsAllows(g, "/private/x"), true);   // the group for our own bot replaces the general one
  const all = parseRobots("User-agent: *\nDisallow: /\n");
  assert.equal(robotsAllows(all, "/careers"), false);
  const some = parseRobots("User-agent: *\nDisallow: /private/\nAllow: /private/jobs\n");
  assert.equal(robotsAllows(some, "/private/x"), false); assert.equal(robotsAllows(some, "/private/jobs/1"), true);
  assert.equal(robotsAllows(parseRobots(""), "/anything"), true);
});
test("no more than 5 requests at once to one host", async () => {
  const gate = new Gate({ max: 5, gap: 0 });
  let active = 0, peak = 0;
  await pool(Array.from({ length: 30 }, (_, i) => i), 30, () => gate.run("h", async () => { active++; peak = Math.max(peak, active); await new Promise(r => setTimeout(r, 5)); active--; }));
  assert.ok(peak <= 5 && peak >= 2, "peak " + peak);
});

/* --- The row saved for a discovered employer --- */
test("a discovered employer's row", () => {
  const c = { name: "Acme Pty Ltd", website: "acme.com", industry: "tech", hq_state: "NSW", source: "list:x" };
  const active = employerRow(c, "greenhouse", "acme", "careers_page", { total: 10, au: 3 });
  assert.equal(active.status, "active"); assert.equal(active.discovered_via, "careers_page"); assert.equal(active.last_au_jobs, 3);
  assert.equal(employerRow(c, "lever", "acme", "slug_probe", { total: 10, au: 0 }).status, "no_au_jobs");
  const wd = employerRow(c, "workday", "acme", "careers_page", {});
  assert.equal(wd.status, "paused"); assert.match(wd.notes, /approval/);
});
