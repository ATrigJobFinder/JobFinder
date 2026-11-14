#!/usr/bin/env node
// Runs Job Finder on your computer at http://localhost:5173 while you edit it.
// Every page load is rebuilt from src/, and the browser reloads itself when you save a file.
//
//   node scripts/serve.mjs            (or: npm run dev)
//   PORT=8080 node scripts/serve.mjs
//
// Nothing to install: it only uses Node's built-in modules (Node 18 or later).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "./build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = +process.env.PORT || 5173;
const clients = new Set();

// tells open pages to reload after a save
const RELOAD = `<script>(() => { try { const es = new EventSource("/__reload"); es.onmessage = () => location.reload(); } catch { /* old browser */ } })();</script>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/__reload") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    try {
      const { standalone } = build();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(standalone.replace("</body></html>", RELOAD + "</body></html>"));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Build failed:\n\n" + (e && e.stack || e));
    }
    return;
  }
  // the page's styles, script and Earth picture (dist/assets/ in a real build), made fresh from src/
  if (url.pathname.startsWith("/assets/")) {
    try {
      const body = build().files[url.pathname.slice(1)];
      if (body) {
        const type = { ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg" }[path.extname(url.pathname)] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
        res.end(body);
        return;
      }
    } catch { /* the page itself reports a failed build */ }
  }
  if (url.pathname === "/favicon.ico") { res.writeHead(204); res.end(); return; }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found. Job Finder is at /");
});

let timer = null;
try {
  fs.watch(path.join(root, "src"), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => { for (const c of clients) c.write("data: reload\n\n"); }, 120);
  });
} catch {
  console.log("(Automatic reload isn't available on this system. Refresh the browser after saving.)");
}

server.listen(PORT, "localhost", () => {
  console.log(`Job Finder is running at http://localhost:${PORT}`);
  console.log("Edit files in src/ and the page reloads. Press Ctrl+C to stop.");
});
