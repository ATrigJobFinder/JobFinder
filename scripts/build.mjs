#!/usr/bin/env node
// Builds Job Finder from src/ into one self-contained page.
//
//   node scripts/build.mjs          writes dist/job-finder.html and dist/index.html
//
// dist/job-finder.html  the page as published to Claude (Claude adds its own <head> around it)
// dist/index.html       the same page wrapped in a full HTML document, for running locally or hosting yourself
//
// All scripts are joined, in file-name order, inside one function, so they share variables
// exactly as they did when this was a single file. Keep the number prefixes when adding files.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");

// What Claude's artifact host puts around the page. The [hidden] rule matters: the page relies on it.
export const SKELETON_HEAD = `<!doctype html><html lang="en-AU"><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n`;

const readDir = dir => fs.readdirSync(path.join(src, dir)).filter(f => !f.startsWith(".")).sort().map(f => fs.readFileSync(path.join(src, dir, f), "utf8"));

export function build() {
  const template = fs.readFileSync(path.join(src, "index.html"), "utf8");
  const css = readDir("styles").join("");
  const js = readDir("scripts").join("");
  if (!template.includes("<!-- @styles -->") || !template.includes("<!-- @scripts -->")) throw new Error("src/index.html must contain <!-- @styles --> and <!-- @scripts -->");
  const page = template
    .replace("<!-- @styles -->", () => `<style>${css}</style>`)
    .replace("<!-- @scripts -->", () => `<script>\n(() => {\n"use strict";\n${js}})();\n</script>`);
  return { page, standalone: SKELETON_HEAD + page };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { page, standalone } = build();
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, "job-finder.html"), page);
  fs.writeFileSync(path.join(dist, "index.html"), standalone);
  console.log(`Built dist/job-finder.html (${(page.length / 1024).toFixed(0)} KB) and dist/index.html`);
}
