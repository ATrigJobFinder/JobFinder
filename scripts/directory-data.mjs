// Reads the Unlisted jobs directory from data/directory/ and turns it into rows for the directory_employers table.
// Used by scripts/seed-directory.mjs and by tests/directory-profiles.test.mjs.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data", "directory");
const scriptsDir = path.join(root, "src", "scripts");

// the same slug the page makes from a name (empSlug in 35a-company-guides.js)
export const empSlug = s => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SIZE_RANK = { small: 0, medium: 1, large: 2, global: 3 };

// The directory files expect the guide industries and guides to exist first (04b to 04l), as they did on the page.
export function loadDirectory() {
  const files = [
    ...fs.readdirSync(scriptsDir).filter(f => /^04[b-l]-/.test(f)).sort().map(f => path.join(scriptsDir, f)),
    ...fs.readdirSync(dataDir).filter(f => f.endsWith(".js")).sort().map(f => path.join(dataDir, f)),
    path.join(scriptsDir, "04o-directory-advice.js")
  ];
  const ctx = vm.createContext({ console });
  vm.runInContext(files.map(f => fs.readFileSync(f, "utf8")).join("\n")
    + "\n;this.__r = { directory: COMPANY_DIRECTORY, profiles: DIR_PROFILES, industries: GUIDE_INDUSTRIES, guides: COMPANY_GUIDES, advice: DIR_ADVICE, own: DIR_COMPANY_ADVICE };", ctx);
  return ctx.__r;
}

// One row per employer. Employers that already have a full guide are left out, because the page shows the guide instead.
export function directoryRows(data = loadDirectory()) {
  const { directory, profiles, industries, guides } = data;
  const taken = new Set(guides.flatMap(g => [empSlug(g.name), empSlug(g.name.split(" (")[0])]));
  // Two employers can share a short name ("Central Coast Council" in NSW and in Tasmania). The one with words in brackets
  // then keeps them in its slug ("central-coast-council-tasmania"), so every row has its own.
  const shared = new Set(directory.map(d => empSlug(d.n)).filter((x, i, all) => all.indexOf(x) !== i));
  const rows = [];
  for (const d of directory) {
    const short = empSlug(d.n);
    if (!short || taken.has(short)) continue;
    const slug = shared.has(short) && /\(/.test(d.n) ? empSlug(d.n.replace(/[()]/g, " ")) : short;
    const p = profiles[d.n] || {};
    const about = Array.isArray(p.about) ? p.about : p.about ? [p.about] : [];
    rows.push({
      slug, name: d.n, sort_key: d.n.toLowerCase(), industry: d.i, size: d.s, size_rank: SIZE_RANK[d.s],
      states: d.st.split(",").map(x => x.trim()).filter(Boolean),
      careers_url: d.u, grad_url: d.g || null, asx: d.a || null,
      profile: JSON.parse(JSON.stringify(p)),
      search: [d.n, (industries[d.i] || [d.i])[0], d.a || "", ...about, ...(p.spec || []), p.hq || ""].join(" ").toLowerCase()
    });
  }
  return rows;
}
