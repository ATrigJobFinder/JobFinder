/* ===================== Directory employers: read from Supabase, 50 at a time ===================== */
// The employers without a full guide (about 2,800) are in the directory_employers table, not in the page.
// The page asks for 50 rows at a time, already filtered and ordered by the database, and for the totals by industry.
// Table and rules: supabase/migrations/006_directory_employers.sql. Data: data/directory/, sent by scripts/seed-directory.mjs.
const DIR_PAGE = 50;
const dirOn = () => jobsDbOn();
const dirKnown = new Map();   // every directory employer loaded so far, by id ("d:" + slug)
// the search text as the database gets it: lower case, and without the characters that mean "anything" in a pattern
const dirQ = q => String(q || "").toLowerCase().replace(/[%_*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

async function dirFetch(pathAndQuery, opts) {
  const res = await fetch(dbBase() + pathAndQuery, { ...opts, headers: { ...dbHeaders(), ...(opts && opts.headers) } });
  if (!res.ok) throw Object.assign(new Error("The employer directory answered " + res.status), { status: res.status });
  return res.json();
}
// a table row as the page uses it (the same shape the directory had when it was part of the page)
function dirFromRow(r) {
  const e = { id: "d:" + r.slug, kind: "dir", name: r.name, sortKey: r.sort_key || String(r.name).toLowerCase(), industry: r.industry, size: r.size, st: (r.states || []).join(","), u: r.careers_url || "", g: r.grad_url || "", asx: r.asx || "", profile: r.profile || null };
  dirKnown.set(e.id, e);
  return e;
}
const DIR_ORDER = { rank: "size_rank.desc,sort_key.asc", big: "size_rank.desc,sort_key.asc", small: "size_rank.asc,sort_key.asc", az: "sort_key.asc" };
// the filters as the address of a request. f: { industry, size, state, q, sort }
function dirQuery(f) {
  const p = ["select=slug,name,sort_key,industry,size,states,careers_url,grad_url,asx,profile"];
  if (f.industry && f.industry !== "all") p.push("industry=eq." + encodeURIComponent(f.industry));
  if (f.size && f.size !== "all") p.push("size=eq." + encodeURIComponent(f.size));
  if (f.state && f.state !== "all") p.push("states=ov." + encodeURIComponent(`{${f.state},National}`));
  if (f.q) p.push("search=ilike." + encodeURIComponent(`*${f.q}*`));
  p.push("order=" + (DIR_ORDER[f.sort] || DIR_ORDER.rank));
  return p.join("&");
}

/* --- Lists: one for the single list, one for each industry group that has been opened --- */
// A list remembers the rows it has, so drawing the page again (ticking a box, opening a card) asks for nothing.
const dirLists = new Map();   // filters -> { rows, done, failed, loading }
function dirList(f) {
  const key = [f.industry, f.size, f.state, f.q, f.sort].join("|");
  if (!dirLists.has(key)) {
    if (dirLists.size > 60) dirLists.clear();   // a long search session: start again rather than keep every list
    dirLists.set(key, { f: { ...f }, rows: [], done: false, failed: false, loading: null });
  }
  return dirLists.get(key);
}
// the next 50 rows of a list
function dirMore(L) {
  if (L.done || L.loading) return L.loading || Promise.resolve();
  L.failed = false;
  L.loading = dirFetch(`/directory_employers?${dirQuery(L.f)}&limit=${DIR_PAGE}&offset=${L.rows.length}`)
    .then(rows => { L.rows.push(...rows.map(dirFromRow)); if (rows.length < DIR_PAGE) L.done = true; }, () => { L.failed = true; })
    .then(() => { L.loading = null; });
  return L.loading;
}

/* --- Totals by industry, for the same filters --- */
const dirCountCache = new Map();   // filters -> { counts } once loaded, { failed } if it couldn't be, { loading } meanwhile
function dirCounts(f) {
  const key = [f.size, f.state, f.q].join("|");
  let c = dirCountCache.get(key);
  if (!c) {
    if (dirCountCache.size > 60) dirCountCache.clear();
    c = { counts: null, failed: false, loading: null };
    dirCountCache.set(key, c);
  }
  if (!c.counts && !c.failed && !c.loading) {
    c.loading = dirFetch("/rpc/directory_counts", { method: "POST", body: JSON.stringify({ q: f.q || "", sz: f.size || "all", st: f.state || "all" }) })
      .then(rows => { c.counts = {}; for (const r of rows) c.counts[r.industry] = r.n; }, () => { c.failed = true; })
      .then(() => { c.loading = null; });
  }
  return c;
}
const DIR_ALL = { size: "all", state: "all", q: "" };
// try again after a failure (the Try again button)
function dirRetry() {
  for (const c of dirCountCache.values()) c.failed = false;
  for (const L of dirLists.values()) L.failed = false;
}

/* --- One employer by name: for an ad's company line, a job listing's company, or an interview --- */
// A name matches an employer when it is the same, or one is the other with more words on the end ("Bupa" and "Bupa Aged Care").
const dirNameCache = new Map();   // slug of the name asked for -> employer, null if there isn't one, or a promise while it loads
function dirLookup(name) {
  const named = empSlug(name);
  if (!named || !dirOn()) return Promise.resolve(null);
  if (dirNameCache.has(named)) return Promise.resolve(dirNameCache.get(named));
  const parts = named.split("-"), starts = parts.map((_, i) => parts.slice(0, i + 1).join("-"));
  const p = dirFetch(`/directory_employers?select=slug,name,sort_key,industry,size,states,careers_url,grad_url,asx,profile&or=(slug.in.(${starts.join(",")}),slug.like.${named}-*)&order=slug.asc&limit=20`)
    .then(rows => {
      const exact = rows.find(r => r.slug === named);
      // otherwise the longest employer name the asked-for name starts with, then the first that starts with it
      const hit = exact || rows.filter(r => named.startsWith(r.slug + "-")).sort((a, b) => b.slug.length - a.slug.length)[0] || rows.find(r => r.slug.startsWith(named + "-")) || null;
      const e = hit ? dirFromRow(hit) : null;
      dirNameCache.set(named, e);
      return e;
    }, () => { dirNameCache.delete(named); return null; });
  dirNameCache.set(named, p);
  return p;
}
// The answer if we already have it (an employer, or null for none). Otherwise undefined: it is asked for, and then() runs when it arrives.
function dirLookupNow(name, then) {
  const named = empSlug(name);
  if (!named || !dirOn()) return null;
  const v = dirNameCache.get(named);
  if (v !== undefined && !(v instanceof Promise)) return v;
  dirLookup(name).then(e => { if (then) { try { then(e); } catch (err) { console.error(err); } } });
  return undefined;
}

/* --- Employer names by industry, for the Employer box in the resume builder --- */
const dirNameLists = new Map();   // industries -> names (empty until they arrive)
function dirNames(industries) {
  const key = industries.join(",");
  if (!key || !dirOn()) return [];
  if (!dirNameLists.has(key)) {
    dirNameLists.set(key, []);
    dirFetch(`/directory_employers?select=name&industry=in.(${industries.map(encodeURIComponent).join(",")})&order=size_rank.desc,sort_key.asc&limit=1000`)
      .then(rows => { dirNameLists.set(key, rows.map(r => r.name)); }, () => { dirNameLists.delete(key); });
  }
  return dirNameLists.get(key);
}
