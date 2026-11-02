// Writes to Supabase through its REST address, using the secret service key. No packages needed.
// The service key can change anything, so it is only ever read from the environment (GitHub secrets or a local .env file).
import { UA } from "./util.mjs";

export function connect({ url, key, fetchImpl = fetch }) {
  const base = String(url).replace(/\/+$/, "") + "/rest/v1";
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "User-Agent": UA };
  async function call(path, { method = "GET", body, prefer = "", raw = false } = {}) {
    const res = await fetchImpl(base + path, { method, headers: { ...headers, ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(prefer ? { Prefer: prefer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60000) });
    if (!res.ok) { let m = ""; try { m = (await res.json()).message || ""; } catch { /* no body */ } throw new Error(`Database ${method} ${path.split("?")[0]} failed: HTTP ${res.status} ${m}`.trim()); }
    if (raw) return res;
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  }
  const inList = vals => "(" + vals.map(v => '"' + String(v).replace(/(["\\])/g, "\\$1") + '"').join(",") + ")";
  const countOf = res => { const m = (res.headers.get("content-range") || "").match(/\/(\d+)$/); return m ? +m[1] : 0; };
  return {
    // every source_id we already hold for one source (optionally only those starting with a prefix), to tell new from updated
    async existingIds(source, prefix) {
      const out = [];
      for (let from = 0; ; from += 1000) {
        const rows = await call(`/jobs?select=source_id&source=eq.${encodeURIComponent(source)}${prefix ? `&source_id=like.${encodeURIComponent(prefix + "*")}` : ""}&order=id&limit=1000&offset=${from}`);
        out.push(...rows.map(r => r.source_id));
        if (rows.length < 1000) break;
      }
      return out;
    },
    // new rows are added; rows we already have get fresh fields and last_seen_at (first_seen_at is never sent, so it stays)
    async upsert(rows) {
      const now = new Date().toISOString();
      for (let i = 0; i < rows.length; i += 200) await call("/jobs?on_conflict=source,source_id", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: rows.slice(i, i + 200).map(r => ({ ...r, last_seen_at: now })) });
    },
    async deleteIds(source, ids) {
      let n = 0;
      for (let i = 0; i < ids.length; i += 40) { const r = await call(`/jobs?source=eq.${encodeURIComponent(source)}&source_id=in.${encodeURIComponent(inList(ids.slice(i, i + 40)))}`, { method: "DELETE", prefer: "count=exact,return=minimal", raw: true }); n += countOf(r); }
      return n;
    },
    async deleteOld(maxAgeDays) {
      const cut = new Date(Date.now() - maxAgeDays * 864e5).toISOString();
      const r = await call(`/jobs?or=${encodeURIComponent(`(posted_at.lt.${cut},and(posted_at.is.null,first_seen_at.lt.${cut}))`)}`, { method: "DELETE", prefer: "count=exact,return=minimal", raw: true });
      return countOf(r);
    },
    async deleteOldRuns(days = 90) {
      const cut = new Date(Date.now() - days * 864e5).toISOString();
      const r = await call(`/import_runs?started_at=lt.${encodeURIComponent(cut)}`, { method: "DELETE", prefer: "count=exact,return=minimal", raw: true });
      return countOf(r);
    },
    async logRun(run) { await call("/import_runs", { method: "POST", prefer: "return=minimal", body: run }); },
    async totals() {
      const bySource = {}, byState = {};
      for (let from = 0; ; from += 1000) {
        const rows = await call(`/jobs?select=source,state,dedupe_key&order=id&limit=1000&offset=${from}`);
        for (const r of rows) { bySource[r.source] = (bySource[r.source] || 0) + 1; byState[r.state || "unknown"] = (byState[r.state || "unknown"] || 0) + 1; }
        if (rows.length < 1000) break;
      }
      return { bySource, byState };
    },
    async distinctCount() { const r = await call("/jobs_public?select=id", { raw: true, prefer: "count=exact", method: "GET" }); return countOf(r); }
  };
}
