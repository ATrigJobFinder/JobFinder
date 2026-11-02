#!/usr/bin/env node
// Add, pause, resume or remove an employer.
//
//   node jobs-import/add-employer.mjs <careers page URL or company website>             look, show what was found, change nothing
//   node jobs-import/add-employer.mjs <URL> --name "Example Pty Ltd" --save             and save it to the employers table
//   node jobs-import/add-employer.mjs --pause "Example Pty Ltd"                         stop fetching it (also --resume, --remove)
//
// It works out the hiring system and board token for you, and shows how many Australian jobs the board has before anything is saved.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDotEnv, env } from "./lib/util.mjs";
import { Gate, makeWeb } from "./lib/http.mjs";
import { connect } from "./lib/db.mjs";
import { detectInText, domainRoot } from "./lib/detect.mjs";
import { checkBoard, employerRow, evaluateCandidate } from "./lib/discovery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotEnv(path.join(root, ".env"));
const args = process.argv.slice(2), flag = n => args.includes("--" + n), opt = n => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : ""; };
const db = env("SUPABASE_URL") && env("SUPABASE_SERVICE_KEY") ? connect({ url: env("SUPABASE_URL"), key: env("SUPABASE_SERVICE_KEY") }) : null;
const need = () => { if (!db) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY to change the employers table."); process.exit(2); } };

/* ---- pause, resume, remove ---- */
for (const [f, status, word] of [["pause", "paused", "Paused"], ["resume", "active", "Resumed"], ["remove", "rejected", "Removed"]]) {
  if (!flag(f)) continue;
  need();
  const who = opt(f), found = await db.findEmployer(who);
  if (!found.length) { console.error(`No employer called “${who}”. Use its exact name or its number.`); process.exit(1); }
  if (found.length > 1) { console.error("More than one match:\n" + found.map(e => `  ${e.id}: ${e.name} (${e.ats}/${e.token})`).join("\n") + "\nUse the number."); process.exit(1); }
  const e = found[0];
  await db.patchEmployer(e.id, { status, ...(status === "active" ? { consecutive_errors: 0, zero_au_weeks: 0, last_error: null } : {}) });
  console.log(`${word}: ${e.name} (${e.ats}/${e.token}). ${status === "rejected" ? "Its jobs go within 30 days (they are no longer refreshed)." : status === "paused" ? "It won't be fetched until it is resumed." : "It will be fetched in the next weekly import."}`);
  process.exit(0);
}

/* ---- add ---- */
const input = args.find(a => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--name");
if (!input) { console.error("Give a careers page address or a company website, for example:\n  node jobs-import/add-employer.mjs https://example.com/careers"); process.exit(2); }
const url = /^https?:/.test(input) ? input : "https://" + input;
const web = makeWeb({ gate: new Gate({ max: 2, gap: 1500 }) }), gate = new Gate({ max: 5, gap: 250 });
const host = new URL(url).hostname.replace(/^www\./, "");
const name = opt("name") || (domainRoot(url) || host).replace(/(^|[-_])(\w)/g, (m, a, c) => (a ? " " : "") + c.toUpperCase());
const isAddress = detectInText(url).length > 0;
const c = { name, website: isAddress ? "" : host, careers_url: url, industry: "", hq_state: "", source: "a manual add", via: "manual" };
console.log(`Looking at ${url} …`);
let result;
if (isAddress) {
  // the address itself is a board address (for example jobs.lever.co/acme)
  const b = detectInText(url)[0];
  if (!b.supported) result = { found: [b], row: employerRow(c, b.ats, b.token, "manual", {}), reason: "needs approval" };
  else { const res = await checkBoard(c, b.ats, b.token, { gate, trust: true }); result = { found: [b], res, row: res.ok ? employerRow(c, b.ats, b.token, "manual", res) : null, reason: res.reason }; }
} else result = await evaluateCandidate(c, { web, gate });
const row = result.row;
if (!row) { console.log(`Couldn't find a job board for ${name}: ${result.reason}.\nIf you know the board address, give that instead, for example https://jobs.lever.co/NAME or https://boards.greenhouse.io/NAME.`); process.exit(1); }
if (row.status === "paused" && result.reason === "needs approval") console.log(`${name} uses ${row.ats}, which has no official public job feed. It can be saved as paused, but its jobs can't be read without approval.`);
else console.log(`Found: ${row.ats} board “${row.token}”. ${result.res.total} jobs in total, ${result.res.au} in Australia.${result.res.titles.length ? "\n" + result.res.titles.map(t => "  - " + t).join("\n") : ""}${row.status === "no_au_jobs" ? "\nIt has no Australian jobs right now, so it would be saved as no_au_jobs and checked again each month." : ""}`);
if (!flag("save")) { console.log("\nNothing was saved. Run it again with --save (or tick “Save it” in the GitHub form) to add it."); process.exit(0); }
need();
const added = await db.addEmployers([{ ...row, discovered_via: "manual", notes: row.notes && /approval/.test(row.notes) ? row.notes : "Added by hand." }]);
console.log(added.length ? `Saved ${name} (${row.status}).` : `${name} (${row.ats}/${row.token}) is already in the employers table.`);
