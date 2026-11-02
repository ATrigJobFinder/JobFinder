// Rebuilds src/scripts/20a-places-and-phone-codes.js: every Australian suburb and town
// (with its state, postcode and rough position) and every country's calling code.
//
// The data comes from two npm packages that aren't part of the app:
//   npm install --no-save aus-postcode-suburbs countries-list
//   node scripts/make-places.mjs
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
let rows, countries;
try {
  rows = require("aus-postcode-suburbs/lib/resources/aus_postcodes.json");
  countries = require("countries-list").countries;
} catch {
  console.error("Install the data first:  npm install --no-save aus-postcode-suburbs countries-list");
  process.exit(1);
}

// "MOUNT WAVERLEY" → "Mount Waverley", "MCKINNON" → "McKinnon", "O'CONNOR" → "O'Connor"
const SMALL = new Set(["of", "the", "and", "on", "by", "upon"]);
function placeCase(s) {
  return s.toLowerCase().split(" ").map((w, i) => {
    if (i > 0 && SMALL.has(w)) return w;
    return w.split(/([-'(])/).map(p => /^[-'(]$/.test(p) || !p ? p : p[0].toUpperCase() + p.slice(1)).join("")
      .replace(/^Mc([a-z])/, (m, c) => "Mc" + c.toUpperCase());
  }).join(" ");
}

// Suburbs and towns: real delivery areas only (no PO boxes, mail centres or large-volume receivers)
// (Postcodes starting with 0 are the NT and remote communities, which the data leaves untyped.)
const NOT_A_PLACE = / (MC|DC|BC|LPO|PO|MAIL CENTRE|DELIVERY CENTRE)$|WESTFIELD|^HMAS |\b(GPO|RAAF)\b|^PARLIAMENT HOUSE$|ADELAIDE STREET/;
const byState = {};
for (const r of rows) {
  const isPlace = r.type === "Delivery Area" || (r.type === "" && r.postcode[0] === "0");
  if (!isPlace || NOT_A_PLACE.test(r.locality) || !r.lat || !r.long) continue;
  const st = byState[r.state] || (byState[r.state] = {});
  const pc = st[r.postcode] || (st[r.postcode] = { names: new Set(), lat: [], lng: [] });
  pc.names.add(placeCase(r.locality));
  pc.lat.push(r.lat); pc.lng.push(r.long);
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const states = Object.keys(byState).sort();
let n = 0;
const lines = states.map(s => {
  const pcs = Object.keys(byState[s]).sort();
  const body = pcs.map(pc => {
    const e = byState[s][pc];
    n += e.names.size;
    return `${pc}${Math.round(avg(e.lat) * 100)},${Math.round(avg(e.lng) * 100)}:${[...e.names].sort().join(",")}`;
  }).join("|");
  return `  ${s}: "${body}"`;
});

// Calling codes: one per country, the main one where there are several
const FIX = { VA: "39", XK: "383", DO: "1809", PR: "1787" };
const SKIP = new Set(["AQ", "BV", "HM", "UM"]);
const cc = Object.entries(countries).filter(([k]) => !SKIP.has(k))
  .map(([k, v]) => [k, v.name, FIX[k] || String(v.phone[0])])
  .sort((a, b) => a[1].localeCompare(b[1]));

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "src", "scripts", "20a-places-and-phone-codes.js");
writeFileSync(out, `/* ===================== Places and phone codes (made by scripts/make-places.mjs, don't edit by hand) ===================== */
// Australian suburbs and towns: state → "postcode" + "lat,lng" (×100) + ":" + names, separated by |.
// Source: the aus-postcode-suburbs npm package (ISC licence), from Australia Post locality data.
const AU_PLACE_DATA = {
${lines.join(",\n")}
};
// [ISO code, country, calling code]. Source: the countries-list npm package (MIT licence).
const COUNTRY_CODES = ${JSON.stringify(cc)};
`);
console.log(`Wrote ${n} places in ${states.length} states and ${cc.length} countries to ${path.relative(process.cwd(), out)}`);
