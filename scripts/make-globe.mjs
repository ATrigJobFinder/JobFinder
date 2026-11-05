#!/usr/bin/env node
// Rebuilds src/scripts/36e-globe-data.js: a 1-degree land/ocean map of the Earth for the home page globe.
//
//   node scripts/make-globe.mjs
//
// Source: Natural Earth 1:110m land (public domain), through the world-atlas npm package (ISC licence).
// It is fetched once here, so the page itself loads nothing from the internet.
// The map is 360 x 180 cells (longitude -180..180, latitude 90..-90), saved as alternating
// run lengths of ocean and land in base 36, which is about 6 KB.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL_ = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json";

const topo = await (await fetch(URL_)).json();
const { scale, translate } = topo.transform;
// arcs are stored as integer deltas
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; }); });
const ring = idx => idx.flatMap(i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse());

const polys = []; // each polygon: array of rings
for (const g of topo.objects.land.geometries) {
  const list = g.type === "Polygon" ? [g.arcs] : g.arcs;
  for (const p of list) polys.push(p.map(ring));
}

// even-odd test across a polygon's rings (outer ring plus holes)
function inside(poly, x, y) {
  let c = false;
  for (const r of poly) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// the data is cut at the antimeridian, which leaves a thin sliver of "land" a degree tall running right round the world
// for Fiji and Wrangel Island. They have no area, and would fill a whole row, so they are left out.
for (let k = polys.length - 1; k >= 0; k--) { const xs = polys[k][0].map(q => q[0]), ys = polys[k][0].map(q => q[1]); if (Math.max(...xs) - Math.min(...xs) > 300 && Math.max(...ys) - Math.min(...ys) < 5) polys.splice(k, 1); }
const bbox = polys.map(p => { const o = p[0]; return [Math.min(...o.map(q => q[0])), Math.max(...o.map(q => q[0])), Math.min(...o.map(q => q[1])), Math.max(...o.map(q => q[1]))]; });

const W = 360, H = 180, bits = new Uint8Array(W * H);
for (let row = 0; row < H; row++) for (let col = 0; col < W; col++) {
  const x = col - 180 + 0.5, y = 90 - row - 0.5;
  for (let k = 0; k < polys.length; k++) {
    const b = bbox[k];
    if (x < b[0] || x > b[1] || y < b[2] || y > b[3]) continue;
    if (inside(polys[k], x, y)) { bits[row * W + col] = 1; break; }
  }
}

// run lengths, starting with ocean
const runs = []; let cur = 0, n = 0;
for (const v of bits) { if (v === cur) n++; else { runs.push(n); cur = v; n = 1; } }
runs.push(n);
const land = bits.reduce((a, b) => a + b, 0);

const out = `/* ===================== Globe land map (made by scripts/make-globe.mjs, don't edit by hand) ===================== */
// Earth as 360 x 180 one-degree cells, row by row from the north pole, longitude -180 to 180.
// Alternating run lengths in base 36, starting with ocean. Natural Earth 1:110m land (public domain).
const GLOBE_LAND = "${runs.map(r => r.toString(36)).join(",")}";
`;
fs.writeFileSync(path.join(root, "src", "scripts", "36e-globe-data.js"), out);
console.log(`Wrote src/scripts/36e-globe-data.js: ${runs.length} runs, ${land} land cells of ${W * H} (${(out.length / 1024).toFixed(1)} KB)`);
