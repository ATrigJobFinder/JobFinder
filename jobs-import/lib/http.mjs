// Polite web access for discovery: a limit on requests at once and a gap between them for each website, robots.txt, and timeouts.
import { sleep } from "./util.mjs";

export const BOT = "JobFinderBot/1.0 (+https://github.com/ATrigJobFinder/JobFinder; finds public job listings; to be left out, open an issue there)";

// At most `max` requests at once to one host, with `gap` ms between the starts of requests to it
export class Gate {
  constructor({ max = 5, gap = 200 } = {}) { this.max = max; this.gap = gap; this.hosts = new Map(); }
  async run(host, fn) {
    let h = this.hosts.get(host);
    if (!h) this.hosts.set(host, h = { active: 0, last: 0, waiters: [] });
    while (h.active >= this.max) await new Promise(r => h.waiters.push(r));
    h.active++;
    try {
      const wait = h.last + this.gap - Date.now();
      h.last = Math.max(Date.now(), h.last + this.gap);
      if (wait > 0) await sleep(wait);
      return await fn();
    } finally { h.active--; const w = h.waiters.shift(); if (w) w(); }
  }
}
// Run fn over items with at most `n` at a time
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { for (;;) { const i = next++; if (i >= items.length) return; out[i] = await fn(items[i], i); } }));
  return out;
}

/* --- robots.txt --- */
// Which paths the rules for this bot (or for everyone) disallow. Longest matching rule wins; Allow beats Disallow when equal.
export function parseRobots(text) {
  const groups = [];
  let cur = null, lastWasUA = false;
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) { continue; }
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") { if (!lastWasUA || !cur) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastWasUA = true; continue; }
    lastWasUA = false;
    if (cur && (k === "disallow" || k === "allow")) cur.rules.push({ allow: k === "allow", path: v });
  }
  return groups;
}
export function robotsAllows(groups, path, agent = "jobfinderbot") {
  const mine = groups.filter(g => g.agents.some(a => a !== "*" && agent.includes(a) || a === agent));
  const use = mine.length ? mine : groups.filter(g => g.agents.includes("*"));
  let best = null;
  for (const g of use) for (const r of g.rules) {
    if (!r.path) continue;
    const re = new RegExp("^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
    if (re.test(path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  }
  return !best || best.allow;
}

export function makeWeb({ gate = new Gate({ max: 2, gap: 1500 }), fetchImpl = fetch, timeout = 20000 } = {}) {
  const robots = new Map();
  async function raw(url, { accept = "text/html,application/xhtml+xml,*/*" } = {}) {
    const u = new URL(url);
    return gate.run(u.host, async () => {
      try {
        const res = await fetchImpl(url, { headers: { "User-Agent": BOT, Accept: accept }, redirect: "follow", signal: AbortSignal.timeout(timeout) });
        const type = res.headers && res.headers.get ? res.headers.get("content-type") || "" : "";
        const text = /text|json|xml|html/i.test(type) || !type ? (await res.text()).slice(0, 600000) : "";
        return { status: res.status, ok: res.ok, text, url: res.url || url };
      } catch (e) { return { status: 0, ok: false, text: "", url, error: e.name === "TimeoutError" ? "timed out" : e.message }; }
    });
  }
  async function allowed(url) {
    let u; try { u = new URL(url); } catch { return false; }
    if (!robots.has(u.host)) {
      const r = await raw(`${u.protocol}//${u.host}/robots.txt`, { accept: "text/plain,*/*" });
      robots.set(u.host, r.status >= 500 || r.status === 0 ? null : r.ok ? parseRobots(r.text) : []);   // no robots.txt (404) means allowed; a broken or unreachable one means stay away
    }
    const g = robots.get(u.host);
    return g === null ? false : robotsAllows(g, u.pathname + u.search);
  }
  // a page on an employer's own website: only if its robots.txt allows it
  async function page(url) { if (!(await allowed(url))) return { status: 0, ok: false, text: "", url, blocked: true }; return raw(url); }
  return { raw, page, allowed };
}
