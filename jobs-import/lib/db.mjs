// Writes to Supabase through its REST address, using the secret service key. No packages needed.
// The service key can change anything, so it is only ever read from the environment (GitHub secrets or a local .env file).
import { UA } from "./util.mjs";

export function connect({ url, key, fetchImpl = fetch }) {
  const base = String(url).replace(/\/+$/, "") + "/rest/v1";
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "User-Agent": UA };
  async function call(path, { method = "GET", body, prefer = "", raw = false, headers: extra = {} } = {}) {
    const res = await fetchImpl(base + path, { method, headers: { ...headers, ...extra, ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(prefer ? { Prefer: prefer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60000) });
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
      let plain = false;   // true if 002_employers.sql hasn't been run yet: the new columns are left out so the import still works
      for (let i = 0; i < rows.length; i += 200) {
        const body = rows.slice(i, i + 200).map(r => { const x = { ...r, last_seen_at: now }; if (plain) { delete x.employer_id; delete x.company_key; } return x; });
        try { await call("/jobs?on_conflict=source,source_id", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body }); }
        catch (e) {
          if (plain || !/company_key|employer_id|PGRST204|HTTP 400/.test(e.message)) throw e;
          plain = true; i -= 200;
        }
      }
    },
    async deleteIds(source, ids) {
      let n = 0;
      for (let i = 0; i < ids.length; i += 40) { const r = await call(`/jobs?source=eq.${encodeURIComponent(source)}&source_id=in.${encodeURIComponent(inList(ids.slice(i, i + 40)))}`, { method: "DELETE", prefer: "count=exact,return=minimal", raw: true }); n += countOf(r); }
      return n;
    },
    // Listings older than the limit go. For an employer's own feed, "older" means not seen in the feed for that long:
    // a job still open on the employer's page is still current, however long ago it was first posted.
    async deleteOld(maxAgeDays) {
      const cut = new Date(Date.now() - maxAgeDays * 864e5).toISOString();
      const f = `(and(source.not.like.employer:*,posted_at.lt.${cut}),and(source.not.like.employer:*,posted_at.is.null,first_seen_at.lt.${cut}),and(source.like.employer:*,last_seen_at.lt.${cut}))`;
      const r = await call(`/jobs?or=${encodeURIComponent(f)}`, { method: "DELETE", prefer: "count=exact,return=minimal", raw: true });
      return countOf(r);
    },
    async deleteOldRuns(days = 90) {
      const cut = new Date(Date.now() - days * 864e5).toISOString();
      const r = await call(`/import_runs?started_at=lt.${encodeURIComponent(cut)}`, { method: "DELETE", prefer: "count=exact,return=minimal", raw: true });
      return countOf(r);
    },
    async logRun(run) { await call("/import_runs", { method: "POST", prefer: "return=minimal", body: run }); },
    /* --- employers --- */
    async listEmployers(statuses) {
      const out = [];
      for (let from = 0; ; from += 1000) {
        const rows = await call(`/employers?select=*&order=id&limit=1000&offset=${from}${statuses ? `&status=in.(${statuses.join(",")})` : ""}`);
        out.push(...rows);
        if (rows.length < 1000) break;
      }
      return out;
    },
    // adds employers we don't have yet (same hiring system and token = same employer); returns the ones that were new
    async addEmployers(rows) {
      const added = [];
      for (let i = 0; i < rows.length; i += 100) added.push(...(await call("/employers?on_conflict=ats,token", { method: "POST", prefer: "resolution=ignore-duplicates,return=representation", body: rows.slice(i, i + 100) }) || []));
      return added;
    },
    async patchEmployer(id, patch) { await call(`/employers?id=eq.${id}`, { method: "PATCH", prefer: "return=minimal", body: patch }); },
    async findEmployer(nameOrId) {
      const q = /^\d+$/.test(String(nameOrId)) ? `id=eq.${nameOrId}` : `name=ilike.${encodeURIComponent(String(nameOrId))}`;
      return (await call(`/employers?select=*&${q}&limit=5`)) || [];
    },
    // company names that show up most in Adzuna and Jooble results, so discovery can look for their own job boards
    async topAggregatorCompanies(limit = 300) {
      const counts = new Map();
      for (let from = 0; from < 20000; from += 1000) {
        const rows = await call(`/jobs?select=company,company_key&source=in.(adzuna,jooble)&company_key=not.is.null&order=id&limit=1000&offset=${from}`);
        for (const r of rows) { const k = r.company_key; if (!k) continue; const c = counts.get(k) || { name: r.company, n: 0 }; c.n++; counts.set(k, c); }
        if (rows.length < 1000) break;
      }
      return [...counts].map(([key, v]) => ({ key, name: v.name, n: v.n })).sort((a, b) => b.n - a.n).slice(0, limit);
    },
    // the share of jobs on the site that come straight from employers
    async employerShare() {
      const n = async f => countOf(await call(`/jobs_public?select=id${f}`, { raw: true, prefer: "count=exact", headers: { Range: "0-0" } }));
      const total = await n(""), direct = await n("&source=like.employer:*");
      return { total, direct, percent: total ? Math.round(direct / total * 1000) / 10 : 0 };
    },
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
