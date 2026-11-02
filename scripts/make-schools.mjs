// Rebuilds src/scripts/21b-schools-data.js: every Australian school, for the "School" box in the resume builder.
//
// The list comes from ACARA's School Profile (or School Location) file, which is free to download but sits behind
// a short form, so it can't be fetched by a script:
//   1. Go to https://www.acara.edu.au/contact-us/acara-data-access and download "School Profile" (an .xlsx file).
//   2. Either save it as CSV from Excel, or install the reader:  npm install --no-save xlsx
//   3. node scripts/make-schools.mjs "path/to/School Profile 2025.xlsx"     (or the .csv)
//
// By default it keeps secondary, combined (K–12) and special schools, which is what people put on a resume.
// Add --all to keep primary schools too (it roughly triples the size of the page).
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
const all = args.includes("--all");
if (!file) {
  console.error('Usage: node scripts/make-schools.mjs "School Profile 2025.xlsx" [--all]\n(see the top of this file for where to get it)');
  process.exit(1);
}

// ---- Read the rows, from CSV or a spreadsheet ----
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
let rows;
if (/\.xlsx?$/i.test(file)) {
  let XLSX;
  try { XLSX = createRequire(import.meta.url)("xlsx"); }
  catch { console.error("To read a spreadsheet, install the reader first:  npm install --no-save xlsx\n(or save the file as CSV in Excel and use that)"); process.exit(1); }
  const wb = XLSX.readFile(file);
  // The data sheet is the one with a "School Name" heading (the file also has notes sheets)
  for (const name of wb.SheetNames) {
    const r = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "" });
    if (r.slice(0, 30).some(x => x.some(c => /^school name$/i.test(String(c).trim())))) { rows = r; break; }
  }
  if (!rows) { console.error('No sheet in that file has a "School Name" column.'); process.exit(1); }
} else {
  rows = parseCsv(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

// ---- Find the columns by their headings (ACARA has moved them between years) ----
const headAt = rows.slice(0, 30).findIndex(r => r.some(c => /^school name$/i.test(String(c).trim())));
if (headAt < 0) { console.error('That file has no "School Name" column. Is it ACARA\'s School Profile or School Location file?'); process.exit(1); }
const head = rows[headAt].map(c => String(c).trim().toLowerCase());
const col = (...names) => { for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i; } return -1; };
const C = {
  name: col("school name"),
  suburb: col("suburb", "town", "locality"),
  state: col("state", "state/territory"),
  type: col("school type", "type"),
  year: col("calendar year"),
};
if (C.suburb < 0 || C.state < 0) { console.error('Missing a "Suburb" or "State" column.'); process.exit(1); }

const KEEP = all ? /./ : /secondary|combined|special/i;
const STATES = { "new south wales": "NSW", victoria: "VIC", queensland: "QLD", "south australia": "SA", "western australia": "WA", tasmania: "TAS", "northern territory": "NT", "australian capital territory": "ACT" };
// "MOUNT GAMBIER" → "Mount Gambier" (ACARA mostly uses proper case already; this only fixes all-caps suburbs)
const SMALL = new Set(["of", "the", "and", "on", "by", "upon"]);
const placeCase = s => s === s.toUpperCase()
  ? s.toLowerCase().split(" ").map((w, i) => i > 0 && SMALL.has(w) ? w : w.split(/([-'(])/).map(p => /^[-'(]$/.test(p) || !p ? p : p[0].toUpperCase() + p.slice(1)).join("").replace(/^Mc([a-z])/, (m, c) => "Mc" + c.toUpperCase())).join(" ")
  : s;
const clean = s => String(s || "").replace(/\s+/g, " ").replace(/[;"\\]/g, "").trim();

// The file can hold several years; keep the latest row for each school
const latest = C.year >= 0 ? Math.max(...rows.slice(headAt + 1).map(r => +r[C.year] || 0)) : 0;
const places = new Map();   // name → Set of "Suburb, STATE"
let kept = 0, skipped = 0;
for (const r of rows.slice(headAt + 1)) {
  const name = clean(r[C.name]);
  if (!name) continue;
  if (latest && (+r[C.year] || 0) !== latest) continue;
  if (C.type >= 0 && !KEEP.test(r[C.type] || "")) { skipped++; continue; }
  const st = clean(r[C.state]);
  const state = STATES[st.toLowerCase()] || st.toUpperCase();
  const where = [placeCase(clean(r[C.suburb])), state].filter(Boolean).join(", ");
  if (!places.has(name)) places.set(name, new Set());
  places.get(name).add(where);
  kept++;
}
if (!kept) { console.error("No schools found. Check the file, or try --all."); process.exit(1); }

// A name used by schools in more than one place (there are many St Mary's) is listed once, without a place,
// so the builder doesn't guess the wrong town; people fill in the location themselves.
const names = [...places.keys()].sort((a, b) => a.localeCompare(b));
const where = {};
let shared = 0;
for (const n of names) {
  const s = places.get(n);
  if (s.size === 1) where[n] = [...s][0]; else shared++;
}

const out = `/* ===================== Australian schools, for the place-of-study list ===================== */
// Generated by scripts/make-schools.mjs from ACARA's School Profile list${latest ? ` (${latest})` : ""}. Don't edit by hand; run the script again.
// ${names.length} ${all ? "schools" : "secondary, combined and special schools"}. Names used by schools in more than one place have no entry in AU_SCHOOL_PLACES.
// AU_SCHOOLS: "Name;Name;…"   AU_SCHOOL_PLACES: { "Name": "Suburb, STATE" }
const AU_SCHOOLS = ${JSON.stringify(names.join(";"))};
const AU_SCHOOL_PLACES = ${JSON.stringify(where)};
`;
const dest = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "scripts", "21b-schools-data.js");
writeFileSync(dest, out);
console.log(`Wrote ${path.relative(process.cwd(), dest)}: ${names.length} schools (${shared} ${shared === 1 ? "name is" : "names are"} shared by more than one school; ${skipped} ${all ? "" : "primary or other "}${skipped === 1 ? "row" : "rows"} left out), ${Math.round(out.length / 1024)} KB.`);
