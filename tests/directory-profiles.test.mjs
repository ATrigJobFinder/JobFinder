// Every employer in the Unlisted jobs directory has a profile in the same format as the full guides:
// a summary of at least two paragraphs, and a careers link on the employer's own site (not a job board).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDirectory, directoryRows, empSlug } from "../scripts/directory-data.mjs";

// The directory is in data/directory/. It is sent to Supabase by scripts/seed-directory.mjs and is not part of the page.
const DATA = loadDirectory();
const { directory: DIRECTORY, profiles: PROFILES, industries, advice: ADVICE, own: OWN } = DATA;

const none = (list, what) => assert.equal(list.length, 0, `${what}: ${[...list].join("; ")}`);
const JOB_BOARDS = /(seek\.com|indeed\.com|jora\.com|gradconnection|prosple|linkedin\.com\/jobs|glassdoor|careerone|ethicaljobs|workforcegov)/i;

test("every directory employer has a profile, and every profile belongs to an employer", () => {
  const names = new Set(DIRECTORY.map(d => d.n));
  none(DIRECTORY.filter(d => !PROFILES[d.n]).map(d => d.n), "employers without a profile");
  none(Object.keys(PROFILES).filter(k => !names.has(k)), "profiles with no employer");
});

test("directory names are unique", () => {
  const seen = new Set(), dup = [];
  for (const d of DIRECTORY) { const k = d.n.toLowerCase(); if (seen.has(k)) dup.push(d.n); seen.add(k); }
  none(dup, "duplicate names");
});

test("each profile has two paragraphs of real text, specialties and no empty fields", () => {
  const bad = [];
  for (const [name, p] of Object.entries(PROFILES)) {
    const paras = Array.isArray(p.about) ? p.about : [];
    if (paras.length < 2 || paras.some(t => typeof t !== "string" || t.trim().length < 100)) bad.push(name + " (summary)");
    if (!Array.isArray(p.spec) || p.spec.length < 3) bad.push(name + " (specialties)");
    if (p.staff !== undefined && !/employees/i.test(p.staff)) bad.push(name + " (staff)");
    if (p.roles !== undefined && (!Array.isArray(p.roles) || p.roles.some(r => !r))) bad.push(name + " (roles)");
    if (/\b(19|20)\d\d\b/.test(paras.join(" "))) bad.push(name + " (a year that may go out of date)");
  }
  none(bad, "problems");
});

test("every employer has a careers link on its own website, in a known industry and size", () => {
  const sizes = new Set(["small", "medium", "large", "global"]);
  const bad = [];
  for (const d of DIRECTORY) {
    if (!/^https:\/\/[^\s"'<>]+$/.test(d.u || "") || JOB_BOARDS.test(d.u)) bad.push(d.n + " (careers link)");
    if (d.g && (!/^https:\/\//.test(d.g) || JOB_BOARDS.test(d.g))) bad.push(d.n + " (graduate link)");
    if (!industries[d.i]) bad.push(d.n + " (industry " + d.i + ")");
    if (!sizes.has(d.s)) bad.push(d.n + " (size " + d.s + ")");
    if (!d.st) bad.push(d.n + " (states)");
  }
  none(bad, "problems");
});

test("every kind of employer has advice with all four sections and at least two tips in each", () => {
  const bad = [];
  for (const [kind, a] of Object.entries(ADVICE)) for (const k of ["look", "resume", "cover", "interview"]) if (!Array.isArray(a[k]) || a[k].length < 2 || a[k].some(t => String(t).length < 25)) bad.push(kind + "." + k);
  none(bad, "advice blocks");
  const used = new Set(DIRECTORY.map(d => d.i));
  none([...used].filter(i => !ADVICE[i] && !ADVICE.default), "industries with no advice");
});

test("social links, where present, are https pages on the five known networks", () => {
  const bad = [];
  for (const [name, p] of Object.entries(PROFILES)) for (const [k, u] of Object.entries(p.social || {})) {
    if (!["linkedin", "facebook", "instagram", "x", "youtube"].includes(k) || !new RegExp("^https://(www\.)?(" + { linkedin: "([a-z]{2,3}\.)?linkedin\.com", facebook: "facebook\.com", instagram: "instagram\.com", x: "x\.com", youtube: "youtube\.com" }[k] + ")/").test(u)) bad.push(name + " " + k);
  }
  none(bad, "social links");
});

test("company advice comes from the employer's own site and belongs to a listed employer", () => {
  const names = new Set(DIRECTORY.map(d => d.n)), bad = [];
  for (const [name, a] of Object.entries(OWN)) {
    if (!names.has(name)) bad.push(name + " (not in the directory)");
    if (!a.src.startsWith("https://") || JOB_BOARDS.test(a.src)) bad.push(name + " (source)");
    const d = DIRECTORY.find(x => x.n === name);
    if (d && new URL(a.src).hostname.split(".").slice(-2).join(".") !== new URL(d.u).hostname.split(".").slice(-2).join(".")) bad.push(name + " (source is on a different site from its careers page)");
    if (a.steps.length + a.tips.length < 4 || [...a.steps, ...a.tips, ...(a.checks || [])].some(t => String(t).length < 25)) bad.push(name + " (too thin)");
  }
  none(bad, "company advice");
});

test("the rows sent to Supabase: one per employer without a full guide, each with its own slug and every field the page reads", () => {
  const rows = directoryRows(DATA);
  const guideSlugs = new Set(DATA.guides.flatMap(g => [empSlug(g.name), empSlug(g.name.split(" (")[0])]));
  assert.equal(rows.length, DIRECTORY.filter(d => !guideSlugs.has(empSlug(d.n))).length);
  none(rows.map(r => r.slug).filter((s, i, all) => all.indexOf(s) !== i), "slugs used twice");
  const bad = [];
  for (const r of rows) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)) bad.push(r.name + " (slug)");
    if (r.sort_key !== r.name.toLowerCase()) bad.push(r.name + " (sort key)");
    if (![0, 1, 2, 3].includes(r.size_rank)) bad.push(r.name + " (size)");
    if (!r.states.length || r.states.some(s => !["National", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].includes(s))) bad.push(r.name + " (states)");
    if (!Array.isArray(r.profile.about) || r.profile.about.length < 2) bad.push(r.name + " (profile)");
    if (r.search !== r.search.toLowerCase() || !r.search.includes(r.name.toLowerCase())) bad.push(r.name + " (search text)");
  }
  none(bad, "rows");
});

test("the page doesn't carry the directory: nothing in src/scripts holds the employers or their profiles", () => {
  const scripts = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "scripts");
  const js = fs.readdirSync(scripts).map(f => fs.readFileSync(path.join(scripts, f), "utf8")).join("\n");
  assert.ok(!/\bCOMPANY_DIRECTORY\b|\bDIR_PROFILES\b/.test(js), "src/scripts mentions COMPANY_DIRECTORY or DIR_PROFILES");
  assert.ok(js.length < 4.5e6, "src/scripts is over 4.5 MB: has directory data been added back to the page?");
});
