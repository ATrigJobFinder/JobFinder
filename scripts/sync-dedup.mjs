#!/usr/bin/env node
// Copies the site's duplicate matcher (src/scripts/33-dedup.js) to the collector,
// so both sides decide "same job" the same way. Run it after changing the matching rules.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "src", "scripts", "33-dedup.js");
const to = path.join(root, "collector", "dedup.cjs");
const header = "/* Copy of src/scripts/33-dedup.js, so the collector and the site match jobs the same way.\n * Copy it again if you change the matching rules: npm run sync-dedup */\n";
fs.writeFileSync(to, header + fs.readFileSync(from, "utf8"));
console.log("Copied src/scripts/33-dedup.js to collector/dedup.cjs");
