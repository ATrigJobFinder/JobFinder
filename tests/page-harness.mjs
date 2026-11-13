// Loads the page's own scripts (src/scripts/*.js) into a bare Node context with a stub document, so the resume reader
// (the "ATS": parseResume, profileFromText, liEducation) can be run on example resumes without a browser.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "src", "scripts");

// a stand-in that accepts any property read, call or assignment, so top-level code that touches the page doesn't throw
function stub() {
  const f = function () { return stub(); };
  return new Proxy(f, {
    get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "then" ? undefined : k === "length" ? 0 : k === Symbol.iterator ? function* () {} : stub(),
    set: () => true, apply: () => stub(), construct: () => stub(), has: () => true
  });
}

export const PAGE_FUNCTIONS = ["parseResume", "profileFromText", "liEducation", "profileFromLinkedIn", "emptyProfile", "hasProfile", "hasResume", "syncQual", "mergeProfile", "profileToText", "splitEntryLabel", "liFromPage", "pdfItemsToText", "joinWrappedDates", "fixSpacedLine", "candidateFrom", "SAMPLE_PROFILE", "EXAMPLE_PROFILE", "rangeOf", "cvModel", "CV_TEMPLATES", "eduLines", "awardsN", "resumeHealth", "cvHtml"];

export function loadPage(names = PAGE_FUNCTIONS) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort();
  const js = files.map(f => `/* ${f} */\n` + fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  // everything lives in one function scope on the page; expose the named functions at the end
  const exposeList = names.map(n => `try { __out.${n} = typeof ${n} === "undefined" ? undefined : ${n}; } catch (e) {}`).join("\n");
  const code = `(function(){ "use strict"; const __out = {};\n${js}\n${exposeList}\nreturn __out; })()`;
  const base = {
    console: { log() {}, info() {}, debug() {}, warn() {}, error() {} },
    window: stub(), document: stub(), navigator: { userAgent: "node", language: "en-AU", languages: ["en-AU"] },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { hash: "", search: "", href: "" }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, fetch: () => Promise.reject(new Error("no network")), matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener() {}, innerWidth: 1200, innerHeight: 800, indexedDB: undefined
  };
  // any name the page asks for that Node doesn't have (ResizeObserver, Image, …) becomes a harmless stand-in
  const sandbox = new Proxy(base, {
    has: () => true,
    get: (t, k) => k in t ? t[k] : k in globalThis ? globalThis[k] : k === Symbol.unscopables ? undefined : stub(),
    set: (t, k, v) => { t[k] = v; return true; }
  });
  return vm.runInContext(code, vm.createContext(sandbox), { filename: "job-finder-scripts.js" });
}
