/* Copy of src/scripts/33-dedup.js, so the collector and the site match jobs the same way.
 * Copy it again if you change the matching rules: npm run sync-dedup */
/* ===================== One list of jobs, no duplicates ===================== */
// The same job is often on the company's site, an aggregator and a job board, with slightly different wording.
// Jobs match when they're at the same company and place with nearly the same title, or share an ad
// reference or link, or have near-identical descriptions. Shared with the collector script.
const DEDUP = (() => {
  const LEGAL = /\b(pty|ltd|limited|inc|incorporated|llc|plc|group|holdings|australia|aust|aus|co|company|corporation|corp|the)\b/g;
  const ABBR = { sr: "senior", snr: "senior", jr: "junior", jnr: "junior", eng: "engineer", engr: "engineer", mgr: "manager", mngr: "manager", asst: "assistant", assoc: "associate", coord: "coordinator", admin: "administrator", dev: "developer", ops: "operations", hr: "human resources", it: "it", grad: "graduate", tech: "technician", rep: "representative", exec: "executive", acct: "accountant", ft: "full time", pt: "part time" };
  const NOISE = /\b(job|jobs|role|position|opportunity|vacancy|immediate start|urgent|urgently|wanted|required|needed|apply now|hiring|new|exciting|multiple|various|x\d+)\b/g;
  const STATES = { "new south wales": "nsw", victoria: "vic", queensland: "qld", "western australia": "wa", "south australia": "sa", tasmania: "tas", "australian capital territory": "act", "northern territory": "nt" };
  const clean = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9+#]+/g, " ").trim();
  const company = s => clean(s).replace(LEGAL, " ").replace(/\s+/g, " ").trim();
  const titleTokens = s => {
    const words = clean(String(s || "").replace(/\(([^)]*)\)/g, " $1 ")).split(" ").map(w => ABBR[w] || w).join(" ").replace(NOISE, " ").split(/\s+/).filter(w => w && w.length > 1 && !/^\d+$/.test(w));
    return new Set(words);
  };
  const place = s => {
    let t = clean(s);
    for (const [k, v] of Object.entries(STATES)) t = t.replace(new RegExp("\\b" + k + "\\b", "g"), v);
    if (/\b(remote|work from home|wfh|anywhere)\b/.test(t)) return "remote";
    const city = t.replace(/\b\d{4}\b/g, " ").replace(/\b(nsw|vic|qld|wa|sa|tas|act|nt|australia|cbd|region|metro|greater|area)\b/g, " ").trim().split(/\s+/)[0] || "";
    return city;
  };
  const shingles = (s, k = 4) => { const w = clean(s).split(" ").filter(Boolean); const out = new Set(); for (let i = 0; i + k <= w.length; i++) out.add(w.slice(i, i + k).join(" ")); return out; };
  const jac = (a, b) => { if (!a.size || !b.size) return 0; let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n); };
  const refOf = s => { const m = String(s || "").match(/\b(?:job\s*(?:ref(?:erence)?|id|no\.?|number)|ref(?:erence)?(?:\s*no\.?)?|requisition(?:\s*id)?|req\s*id)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-_/]{3,})/i); return m ? m[1].toUpperCase() : ""; };
  const urlKey = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/+$/, "")).toLowerCase(); } catch { return ""; } };
  const SOURCE_RANK = { site: 0, company: 1, ats: 1, aggregator: 2, board: 3, user: 4, example: 5 };
  function prep(j) {
    return { j, co: company(j.company), tt: titleTokens(j.title), pl: place(j.location), ref: refOf(j.description) || (j.ref ? String(j.ref).toUpperCase() : ""), uk: urlKey(j.url), sh: shingles(String(j.description || "").slice(0, 3000)) };
  }
  // Are two prepared jobs the same job?
  function same(a, b) {
    if (a.uk && a.uk === b.uk) return true;
    const sameCo = a.co && b.co && (a.co === b.co || (a.co.length > 3 && b.co.length > 3 && (a.co.startsWith(b.co) || b.co.startsWith(a.co))));
    if (!sameCo) return false;
    if (a.ref && a.ref === b.ref) return true;
    const ts = jac(a.tt, b.tt);
    const placeOk = !a.pl || !b.pl || a.pl === b.pl || a.pl === "remote" || b.pl === "remote";
    if (ts >= 0.75 && placeOk) return true;
    const ds = jac(a.sh, b.sh);
    return ds >= 0.6 && ts >= 0.4;
  }
  // Group jobs that are the same; the best source becomes the main listing, the others are "also on"
  function cluster(jobs) {
    const P = jobs.map(prep);
    const parent = P.map((_, i) => i);
    const find = i => parent[i] === i ? i : (parent[i] = find(parent[i]));
    const byCo = new Map();
    P.forEach((p, i) => { const k = p.co.slice(0, 6) || "?" + i; if (!byCo.has(k)) byCo.set(k, []); byCo.get(k).push(i); });
    for (const idx of byCo.values()) for (let x = 0; x < idx.length; x++) for (let y = x + 1; y < idx.length; y++) if (same(P[idx[x]], P[idx[y]])) parent[find(idx[x])] = find(idx[y]);
    // links can match across companies spelled differently
    const byUrl = new Map();
    P.forEach((p, i) => { if (!p.uk) return; if (byUrl.has(p.uk)) parent[find(i)] = find(byUrl.get(p.uk)); else byUrl.set(p.uk, i); });
    const groups = new Map();
    P.forEach((p, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(p.j); });
    return [...groups.values()].map(g => {
      const sorted = g.slice().sort((a, b) => (SOURCE_RANK[a.sourceType] ?? 3) - (SOURCE_RANK[b.sourceType] ?? 3) || String(b.description || "").length - String(a.description || "").length || String(b.posted || "").localeCompare(String(a.posted || "")));
      const main = { ...sorted[0] };
      // listings that were already merged (an imported feed) keep their own "also on" list
      const seen = new Set();
      main.also = [...(sorted[0].also || []), ...sorted.slice(1).flatMap(x => [{ source: x.source, url: x.url, posted: x.posted, sourceType: x.sourceType }, ...(x.also || [])])]
        .filter(a => { const k = (a.source || "") + "|" + urlKey(a.url); if (seen.has(k) || (a.source === main.source && urlKey(a.url) === urlKey(main.url))) return false; seen.add(k); return true; });
      main.posted = sorted.map(x => x.posted).filter(Boolean).sort()[0] || main.posted;
      return main;
    });
  }
  return { cluster, same, prep, company, titleTokens, place, refOf, urlKey };
})();
if (typeof module !== "undefined" && module.exports) module.exports = DEDUP;

