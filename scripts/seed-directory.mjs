#!/usr/bin/env node
// Copies the Unlisted jobs directory (data/directory/) into the directory_employers table in Supabase.
//
//   npm run seed:directory            adds new employers, updates changed ones and removes ones no longer in data/directory/
//   npm run seed:directory -- --dry   shows what would be sent, and sends nothing
//   npm run seed:directory -- --sql   writes SQL files to supabase/seed/ to paste into the SQL Editor instead (no key needed)
//
// Before the first run, create the table: paste supabase/migrations/006_directory_employers.sql into the SQL Editor.
// It needs the service role key (Supabase > Project Settings > API keys), which can write to the table. Keep it private:
// put it in a file called .env in this folder (already ignored by git), never in src/:
//   SUPABASE_SERVICE_ROLE_KEY=...
// The project address is read from src/scripts/07a-account-config.js, or from SUPABASE_URL if you set it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { directoryRows } from "./directory-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const TABLE = "directory_employers";
const rows = directoryRows();

const dupes = rows.map(r => r.slug).filter((s, i, a) => a.indexOf(s) !== i);
if (dupes.length) { console.error("Two employers make the same slug: " + [...new Set(dupes)].join(", ")); process.exit(1); }
console.log(`${rows.length} employers read from data/directory/ (${(JSON.stringify(rows).length / 1024 / 1024).toFixed(1)} MB)`);

if (args.has("--sql")) {
  const out = path.join(root, "supabase", "seed");
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(out)) if (/^directory_employers_\d+\.sql$/.test(f)) fs.unlinkSync(path.join(out, f));
  const q = v => v === null || v === undefined ? "null" : "'" + String(v).replace(/'/g, "''") + "'";
  const per = 300, n = Math.ceil(rows.length / per);
  for (let i = 0; i < n; i++) {
    const values = rows.slice(i * per, (i + 1) * per).map(r =>
      `(${q(r.slug)}, ${q(r.name)}, ${q(r.sort_key)}, ${q(r.industry)}, ${q(r.size)}, ${r.size_rank}, ${q("{" + r.states.join(",") + "}")}, ${q(r.careers_url)}, ${q(r.grad_url)}, ${q(r.asx)}, ${q(JSON.stringify(r.profile))}::jsonb, ${q(r.search)})`);
    const sql = `-- Part ${i + 1} of ${n}. Paste into the Supabase SQL Editor and Run. Safe to run again.\n`
      + `insert into public.${TABLE} (slug, name, sort_key, industry, size, size_rank, states, careers_url, grad_url, asx, profile, search) values\n${values.join(",\n")}\n`
      + `on conflict (slug) do update set name = excluded.name, sort_key = excluded.sort_key, industry = excluded.industry, size = excluded.size, size_rank = excluded.size_rank, states = excluded.states, careers_url = excluded.careers_url, grad_url = excluded.grad_url, asx = excluded.asx, profile = excluded.profile, search = excluded.search, updated_at = now();\n`;
    fs.writeFileSync(path.join(out, `directory_employers_${String(i + 1).padStart(2, "0")}.sql`), sql);
  }
  console.log(`Wrote ${n} files to supabase/seed/. Run each one in the SQL Editor, in any order.`);
  process.exit(0);
}

if (args.has("--dry")) {
  const by = {};
  for (const r of rows) by[r.industry] = (by[r.industry] || 0) + 1;
  console.log("By industry:", by);
  console.log("First row:", JSON.stringify(rows[0], null, 1).slice(0, 900));
  process.exit(0);
}

try { process.loadEnvFile(path.join(root, ".env")); } catch { /* no .env file: the key must be in the environment */ }
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = (process.env.SUPABASE_URL || (fs.readFileSync(path.join(root, "src", "scripts", "07a-account-config.js"), "utf8").match(/url:\s*"(https:\/\/[^"]+)"/) || [])[1] || "").replace(/\/+$/, "");
if (!key || !url) {
  console.error("Missing the service role key. Put SUPABASE_SERVICE_ROLE_KEY=... in a .env file in this folder (see the top of this script), or use --sql.");
  process.exit(1);
}
const api = `${url}/rest/v1/${TABLE}`;
if (key.startsWith("sb_publishable_") || /"role"\s*:\s*"anon"/.test((() => { try { return Buffer.from(key.split(".")[1] || "", "base64").toString(); } catch { return ""; } })())) {
  console.error("That's the public (publishable / anon) key, which can't change the table. Use the secret key (sb_secret_...) or the legacy service_role key.");
  process.exit(1);
}
// New secret keys (sb_secret_...) go in the apikey header only; the older service_role key is a JWT and also goes in Authorization.
const headers = { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: "Bearer " + key } : {}), "Content-Type": "application/json" };
const call = async (address, opts) => {
  const res = await fetch(address, { ...opts, headers: { ...headers, ...(opts && opts.headers) } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(res.status === 404 ? "The directory_employers table isn't there yet. Run supabase/migrations/006_directory_employers.sql in the SQL Editor first."
      : res.status === 401 || res.status === 403 ? "Supabase refused the key. Check SUPABASE_SERVICE_ROLE_KEY is the service role (secret) key, not the public one."
      : `Supabase answered ${res.status}: ${body.slice(0, 300)}`);
  }
  return res;
};

try {
  // what's there now, 1,000 at a time
  const existing = [];
  for (let from = 0; ; from += 1000) {
    const page = await (await call(`${api}?select=slug&order=slug.asc&limit=1000&offset=${from}`)).json();
    existing.push(...page.map(r => r.slug));
    if (page.length < 1000) break;
  }
  for (let i = 0; i < rows.length; i += 200) {
    await call(`${api}?on_conflict=slug`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows.slice(i, i + 200).map(r => ({ ...r, updated_at: new Date().toISOString() }))) });
    process.stdout.write(`\rSent ${Math.min(i + 200, rows.length)} of ${rows.length}`);
  }
  process.stdout.write("\n");
  const keep = new Set(rows.map(r => r.slug)), gone = existing.filter(s => !keep.has(s));
  for (let i = 0; i < gone.length; i += 100) await call(`${api}?slug=in.(${gone.slice(i, i + 100).map(s => `"${s}"`).join(",")})`, { method: "DELETE" });
  const added = rows.filter(r => !existing.includes(r.slug)).length;
  console.log(`Done: ${added} added, ${rows.length - added} updated, ${gone.length} removed. The table now has ${rows.length} employers.`);
} catch (e) {
  console.error("\n" + (e && e.message || e));
  process.exit(1);
}
