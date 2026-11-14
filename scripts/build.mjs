#!/usr/bin/env node
// Builds Job Finder from src/ into dist/.
//
//   node scripts/build.mjs          writes dist/job-finder.html, dist/index.html and dist/assets/
//
// dist/job-finder.html  everything in one file: the page as published to Claude (Claude adds its own <head> around it),
//                       and the one to use if you open the page straight from your disk
// dist/index.html       the website: the page's markup only. Its styles, its script and the picture of the Earth are
// dist/assets/          separate files here, so the browser downloads them once and keeps them, and the picture
//                       is only fetched when the Home globe is first shown. Host the whole dist folder.
//
// The employers on the Unlisted jobs page are in neither: they are in Supabase and arrive 50 at a time
// (data/directory/ and scripts/seed-directory.mjs).
//
// All scripts are joined, in file-name order, inside one function, so they share variables
// exactly as they did when this was a single file. Keep the number prefixes when adding files.
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");

// What Claude's artifact host puts around the page. The [hidden] rule matters: the page relies on it.
export const SKELETON_HEAD = `<!doctype html><html lang="en-AU"><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n`;

const readDir = dir => fs.readdirSync(path.join(src, dir)).filter(f => !f.startsWith(".")).sort().map(f => fs.readFileSync(path.join(src, dir, f), "utf8"));
// a file name that changes whenever the file does, so browsers can keep each one for good
const stamped = (name, ext, body) => `assets/${name}.${crypto.createHash("sha256").update(body).digest("hex").slice(0, 10)}.${ext}`;
const wrap = js => `(() => {\n"use strict";\n${js}})();\n`;

export function build() {
  const template = fs.readFileSync(path.join(src, "index.html"), "utf8");
  const css = readDir("styles").join("");
  const js = readDir("scripts").join("");
  if (!template.includes("<!-- @styles -->") || !template.includes("<!-- @scripts -->")) throw new Error("src/index.html must contain <!-- @styles --> and <!-- @scripts -->");
  const page = template
    .replace("<!-- @styles -->", () => `<style>${css}</style>`)
    .replace("<!-- @scripts -->", () => `<script>\n${wrap(js)}</script>`);

  // The website: the same styles and script as separate files, and the Earth picture as a real image rather than text inside the script
  const files = {};
  let siteJs = js;
  const picture = js.match(/const GLOBE_TEXTURE = "data:image\/jpeg;base64,([A-Za-z0-9+/=]+)";/);
  if (picture) {
    const jpg = Buffer.from(picture[1], "base64"), name = stamped("globe", "jpg", jpg);
    files[name] = jpg;
    siteJs = js.replace(picture[0], () => `const GLOBE_TEXTURE = "${name}";`);
  }
  const jsBody = wrap(siteJs), cssName = stamped("app", "css", css), jsName = stamped("app", "js", jsBody);
  files[cssName] = Buffer.from(css);
  files[jsName] = Buffer.from(jsBody);
  const standalone = SKELETON_HEAD + template
    .replace("<!-- @styles -->", () => `<link rel="stylesheet" href="${cssName}">`)
    .replace("<!-- @scripts -->", () => `<script src="${jsName}"></script>`);
  return { page, standalone, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { page, standalone, files } = build();
  fs.rmSync(path.join(dist, "assets"), { recursive: true, force: true });   // the last build's stamped files
  fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
  fs.writeFileSync(path.join(dist, "job-finder.html"), page);
  fs.writeFileSync(path.join(dist, "index.html"), standalone);
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dist, name), body);
  const kb = n => (n / 1024).toFixed(0) + " KB";
  console.log(`Built dist/job-finder.html (${kb(Buffer.byteLength(page))}, everything in one file)`);
  console.log(`Built dist/index.html (${kb(Buffer.byteLength(standalone))}) with ${Object.entries(files).map(([n, b]) => `${n} (${kb(b.length)})`).join(", ")}`);
}
