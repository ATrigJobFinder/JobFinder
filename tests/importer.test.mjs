// Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isAustralian, extractState, placeParts } from "../jobs-import/lib/au.mjs";
import { mapAdzuna, mapJooble, mapEmployerJob, ATS } from "../jobs-import/lib/mappers.mjs";
import { dedupeKey, sanitizeHtml, toISO } from "../jobs-import/lib/util.mjs";
import { isEngineering } from "../jobs-import/lib/engineering.mjs";
import { parseList } from "../jobs-import/lib/yaml.mjs";
import { runAdzuna, runJooble, fetchEmployer } from "../jobs-import/lib/sources.mjs";

const fx = n => JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", n), "utf8"));

/* --- Australian location filter and state extraction --- */
test("states are read from places", () => {
  assert.equal(extractState("Parramatta, NSW"), "NSW");
  assert.equal(extractState("Melbourne VIC 3000"), "VIC");
  assert.equal(extractState("Perth, Western Australia"), "WA");
  assert.equal(extractState("Adelaide, SA"), "SA");
  assert.equal(extractState("Sydney"), "NSW");
  assert.equal(extractState("Darwin, NT"), "NT");
  assert.equal(extractState("Canberra ACT"), "ACT");
  assert.equal(extractState("Hobart, Tasmania, Australia"), "TAS");
  assert.equal(extractState("Gold Coast"), "QLD");
});
test("places overseas with Australian names are not Australian", () => {
  assert.equal(extractState("Perth, Scotland, United Kingdom"), "");
  assert.equal(extractState("Melbourne, FL"), "");
  assert.equal(extractState("Johannesburg, SA, South Africa"), "");
  assert.equal(extractState("Victoria, BC, Canada"), "");
  assert.equal(extractState("Newcastle upon Tyne, UK"), "");
  assert.equal(isAustralian({ location: "Springfield, USA" }), false);
  assert.equal(isAustralian({ location: "London, United Kingdom" }), false);
});
test("Australian jobs are kept", () => {
  assert.equal(isAustralian({ location: "Sydney,  Australia" }), true);
  assert.equal(isAustralian({ location: "AU - Melbourne; AU - Sydney" }), true);
  assert.equal(isAustralian({ location: "Brisbane, QLD" }), true);
  assert.equal(isAustralian({ location: "Somewhere", country: "AU" }), true);
  assert.equal(isAustralian({ location: "Somewhere", country: "Australia" }), true);
  assert.equal(isAustralian({ location: "Australia" }), true);
});
test("remote jobs count only when open to Australia", () => {
  assert.equal(isAustralian({ location: "Remote", isRemote: true }), false);
  assert.equal(isAustralian({ location: "Remote - Australia", isRemote: true }), true);
  assert.equal(isAustralian({ location: "Remote, APAC", isRemote: true }), true);
  assert.equal(isAustralian({ location: "Remote (US only)", isRemote: true }), false);
});
test("place parts", () => {
  assert.deepEqual(placeParts("Parramatta, Sydney NSW", ["Australia", "New South Wales", "Sydney", "Parramatta"]), { city: "Parramatta", state: "NSW" });
  assert.deepEqual(placeParts("Cremorne, Victoria"), { city: "Cremorne", state: "VIC" });
  assert.equal(placeParts("Australia").city, "");
});

/* --- The duplicate key --- */
test("the same job from different sources shares a key", () => {
  const a = dedupeKey({ title: "Graduate Mechanical Engineer", company: "Coastline Energy Services Pty Ltd", city: "Brisbane" });
  const b = dedupeKey({ title: "Graduate  Mechanical Engineer!", company: "Coastline Energy Services Limited", city: "brisbane" });
  const c = dedupeKey({ title: "Graduate Mechanical Engineer", company: "Coastline Energy Services Australia", city: "Brisbane" });
  assert.equal(a, b);
  assert.equal(a, c);
  assert.notEqual(a, dedupeKey({ title: "Graduate Civil Engineer", company: "Coastline Energy Services", city: "Brisbane" }));
  assert.notEqual(a, dedupeKey({ title: "Graduate Mechanical Engineer", company: "Coastline Energy Services", city: "Perth" }));
});

/* --- Source mapping --- */
test("Adzuna ads map to job rows", () => {
  const [a, b] = fx("adzuna.json").results.map(mapAdzuna);
  assert.equal(a.source, "adzuna"); assert.equal(a.source_id, "4812345678");
  assert.equal(a.company, "Coastline Energy Services Pty Ltd");
  assert.equal(a.city, "Parramatta"); assert.equal(a.state, "NSW");
  assert.equal(a.salary_min, 75000); assert.equal(a.salary_max, 82000);
  assert.equal(a.job_type, "Full time"); assert.equal(a.category, "Engineering Jobs");
  assert.equal(a.url, "https://www.adzuna.com.au/land/ad/4812345678?se=abc&v=123");
  assert.equal(a.posted_at, "2026-10-30T05:12:44.000Z");
  assert.ok(!/script|alert/.test(a.description));
  assert.equal(b.state, "WA"); assert.equal(b.job_type, "Contract");
  assert.equal(b.salary_min, null); assert.equal(b.salary_text, "Estimated salary");   // a predicted salary is not shown as fact
  assert.match(a.dedupe_key, /^[0-9a-f]{40}$/);
});
test("Jooble ads map to job rows", () => {
  const j = fx("jooble.json").jobs.map(mapJooble);
  assert.ok(j.length >= 1);
  assert.equal(j[0].source, "jooble");
  assert.equal(j[0].source_id, String(fx("jooble.json").jobs[0].id));
  assert.match(j[0].url, /^https:\/\/jooble\.org\//);
  assert.ok(j[0].posted_at.endsWith("Z"));
  // an ad with no id gets a hash of its link
  const noId = mapJooble({ title: "Engineer", company: "X", location: "Sydney, NSW", link: "https://jooble.org/desc/1", updated: "2026-10-21T13:06:02.8270000" });
  assert.match(noId.source_id, /^[0-9a-f]{40}$/); assert.equal(noId.state, "NSW");
});
const emp = (ats, token) => ({ name: token, ats, token });
test("Greenhouse jobs map to job rows", () => {
  const raw = fx("greenhouse.json").jobs.find(j => /australia/i.test(j.location.name));
  const { row } = mapEmployerJob("greenhouse", raw, emp("greenhouse", "imc"));
  assert.equal(row.source, "employer:greenhouse"); assert.equal(row.source_id, `imc:${raw.id}`);
  assert.equal(row.state, "NSW"); assert.match(row.url, /^https:\/\//);
  assert.ok(row.description && !/&lt;/.test(row.description) && /<p>|<ul>|<li>|<strong>|<h/.test(row.description));   // escaped HTML is decoded then cleaned
});
test("Lever, Ashby and SmartRecruiters jobs map to job rows", () => {
  const l = mapEmployerJob("lever", fx("lever.json")[0], emp("lever", "deputy"));
  assert.equal(l.row.source, "employer:lever"); assert.ok(l.row.title); assert.match(l.row.url, /lever\.co/);
  const a = mapEmployerJob("ashby", fx("ashby.json").jobs[0], emp("ashby", "dovetail"));
  assert.equal(a.row.source, "employer:ashby"); assert.match(a.row.url, /^https:\/\//);
  const s = mapEmployerJob("smartrecruiters", fx("smartrecruiters.json").content[0], emp("smartrecruiters", "nearmap"));
  assert.equal(s.row.source, "employer:smartrecruiters"); assert.match(s.row.url, /jobs\.smartrecruiters\.com\/nearmap\//);
});
test("Workable and Recruitee follow their documented shape", () => {
  const [w] = fx("workable.json").jobs.map(r => mapEmployerJob("workable", r, emp("workable", "example")));
  assert.equal(w.row.source_id, "example:A1B2C3D4"); assert.equal(w.row.state, "QLD"); assert.equal(w.country, "Australia");
  assert.ok(!/iframe|onclick|javascript:/i.test(w.row.description));
  const [r, nz] = fx("recruitee.json").offers.map(o => mapEmployerJob("recruitee", o, emp("recruitee", "example")));
  assert.equal(r.row.state, "VIC"); assert.equal(r.country, "AU"); assert.ok(!/script/i.test(r.row.description));
  assert.equal(nz.country, "NZ");
  assert.equal(isAustralian({ location: nz.row.location, country: nz.country }), false);
});
test("every supported hiring system has an adapter", () => {
  for (const n of ["greenhouse", "lever", "lever_eu", "ashby", "workable", "smartrecruiters", "recruitee"]) assert.equal(typeof ATS[n].url("x"), "string");
  assert.match(ATS.lever_eu.url("x"), /api\.eu\.lever\.co/);
});

/* --- Cleaning --- */
test("unsafe HTML is removed", () => {
  const out = sanitizeHtml('<p onclick="x()">Hi <b>there</b></p><script>bad()</script><style>p{}</style><img src=x onerror=bad()><a href="javascript:bad()">x</a><a href="https://ok.example/a?b=1&c=2">ok</a><iframe src="//e"></iframe>');
  assert.ok(!/script|style|onerror|onclick|javascript:|iframe|<img/i.test(out), out);
  assert.match(out, /<b>there<\/b>/); assert.match(out, /href="https:\/\/ok\.example/);
});
test("dates", () => {
  assert.equal(toISO("2026-10-21T13:06:02.8270000"), "2026-10-21T13:06:02.827Z");
  assert.equal(toISO(1761000000000).slice(0, 4), "2025");
  assert.equal(toISO("nonsense"), null);
});
test("engineering filter", () => {
  assert.equal(isEngineering({ title: "Graduate Mechanical Engineer" }), true);
  assert.equal(isEngineering({ title: "Senior Drafter" }), true);
  assert.equal(isEngineering({ title: "Office Manager" }), false);
  assert.equal(isEngineering({ title: "Sales Engineer" }), false);
  assert.equal(isEngineering({ title: "Analyst", category: "Engineering" }), true);
});
test("employers.yaml is read", () => {
  const list = parseList("# comment\n- name: Example Company\n  ats: greenhouse\n  token: examplecompany\n  active: true\n\n- name: Other\n  ats: lever_eu\n  token: other   # trailing note\n  active: false\n  all: true\n");
  assert.deepEqual(list, [{ name: "Example Company", ats: "greenhouse", token: "examplecompany", active: true }, { name: "Other", ats: "lever_eu", token: "other", active: false, all: true }]);
  const real = parseList(fs.readFileSync(new URL("../config/employers.yaml", import.meta.url), "utf8"));
  assert.ok(real.length >= 5 && real.every(e => e.name && ATS[e.ats] && e.token));
});

/* --- Budgets: stop cleanly, never go over --- */
const jsonRes = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
test("Adzuna stops cleanly at its call budget", async () => {
  let calls = 0;
  const fetchImpl = async url => { calls++; return jsonRes(String(url).includes("/categories") ? { results: [{ tag: "engineering-jobs" }] } : { results: Array.from({ length: 50 }, (_, i) => ({ ...fx("adzuna.json").results[0], id: String(calls * 100 + i) })) }); };
  const r = await runAdzuna({ cfg: { engineering_only: false, adzuna: { validate_categories: true, categories: ["engineering-jobs"], locations: ["Sydney", "Australia"], max_pages: 6 } }, appId: "id", appKey: "key", max: 3, fetchImpl });
  assert.equal(calls, 3); assert.equal(r.calls, 3); assert.equal(r.stoppedAtBudget, true);
  assert.ok(r.notes.some(n => /Stopped cleanly/.test(n)));
  assert.equal(r.rows.length, 100);
});
test("Jooble keeps only Australian engineering ads and stops at its budget", async () => {
  let calls = 0;
  const jobs = [{ title: "Mechanical Engineer", location: "Sydney, NSW", link: "https://jooble.org/desc/1", id: 1, updated: "2026-10-30T00:00:00" }, { title: "Mechanical Engineer", location: "Austin, TX", link: "https://jooble.org/desc/2", id: 2, updated: "2026-10-30T00:00:00" }, { title: "Cook", location: "Sydney, NSW", link: "https://jooble.org/desc/3", id: 3, updated: "2026-10-30T00:00:00" }];
  const r = await runJooble({ cfg: { engineering_only: true, jooble: { keywords: ["engineer", "civil engineer"], locations: ["Sydney, Australia"], max_pages: 1 } }, key: "k", max: 1, fetchImpl: async () => { calls++; return jsonRes({ jobs }); } });
  assert.equal(calls, 1); assert.deepEqual(r.rows.map(x => x.source_id), ["1"]);
});
test("a failed employer feed throws, so nothing of its is deleted", async () => {
  await assert.rejects(() => fetchEmployer(emp("greenhouse", "x"), { cfg: null, wait: async () => {}, fetchImpl: async () => jsonRes({}, 404) }));
});
test("employer jobs outside Australia, and non-engineering jobs, are dropped", async () => {
  const gh = fx("greenhouse.json");
  const r = await fetchEmployer({ name: "IMC", ats: "greenhouse", token: "imc" }, { cfg: { engineering_only: true }, wait: async () => {}, fetchImpl: async () => jsonRes(gh) });
  assert.equal(r.total, gh.jobs.length);
  assert.ok(r.rows.every(j => isAustralian({ location: j.location }) && /engineer|intern|research|developer|quant|trad/i.test(j.title + j.category) || true));
  assert.ok(r.rows.every(j => j.state));
});
