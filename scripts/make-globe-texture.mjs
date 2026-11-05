#!/usr/bin/env node
// Rebuilds src/scripts/36g-globe-texture.js: the satellite picture of the Earth on the Home globe.
//
//   npm install --no-save sharp        (once; it is only needed for this script)
//   node scripts/make-globe-texture.mjs
//
// Source: NASA Blue Marble, 2004 "Next Generation" with sea-floor shading (public domain, NASA Earth Observatory),
// from the three-globe npm package. It is cut to 4096 x 2048 and saved as a JPEG inside a text file,
// so the page needs nothing from the internet. Raise or lower QUALITY to trade sharpness for page size.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "https://cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-blue-marble.jpg";
const QUALITY = 72;

const { default: sharp } = await import("sharp");
const src = Buffer.from(await (await fetch(SOURCE)).arrayBuffer());
const jpg = await sharp(src).resize(4096, 2048).jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
const out = `/* ===================== Globe picture (made by scripts/make-globe-texture.mjs, don't edit by hand) ===================== */
// NASA Blue Marble (public domain), 4096 x 2048, as a data address. Used by the Home globe in 36h.
const GLOBE_TEXTURE = "data:image/jpeg;base64,${jpg.toString("base64")}";
`;
fs.writeFileSync(path.join(root, "src", "scripts", "36g-globe-texture.js"), out);
console.log(`Wrote src/scripts/36g-globe-texture.js: JPEG ${(jpg.length / 1024).toFixed(0)} KB, file ${(out.length / 1024).toFixed(0)} KB`);
