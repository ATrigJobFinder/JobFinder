/* ===================== Accounts: sign up, and everything you save goes to your account ===================== */
// The saving code everywhere uses one small interface: db.doc(path).get() and .set(body). Inside Claude that's
// Claude's own storage. On your own site, once someone signs in, this file gives the same interface backed by
// Supabase (its REST API, so there's nothing to install), and everything they save follows them to any device.
// This runs before the saved-answers code (08), which decides where to save.
const ACCT_KEY = "jobfinder.account.v1";
const account = { user: null, session: null, docs: [] };
const acctOn = () => !!(ACCOUNT_CFG.url && ACCOUNT_CFG.anonKey);
const acctUrl = p => ACCOUNT_CFG.url.replace(/\/+$/, "") + p;
function acctLoad() { try { const s = JSON.parse(localStorage.getItem(ACCT_KEY) || "null"); if (s && s.access_token && s.user) { account.session = s; account.user = s.user; } } catch { /* storage blocked */ } }
function acctStore(s) {
  account.session = s; account.user = s ? s.user : null;
  try { if (s) localStorage.setItem(ACCT_KEY, JSON.stringify(s)); else localStorage.removeItem(ACCT_KEY); } catch { /* storage blocked */ }
}
// Supabase's error messages, in plain words
function acctErr(j, status) {
  const m = String((j && (j.error_description || j.msg || j.message || j.error)) || "");
  if (/invalid login|invalid credentials/i.test(m)) return "That email and password don't match an account.";
  if (/already registered|already exists/i.test(m)) return "There's already an account with that email. Sign in instead.";
  if (/password/i.test(m) && /least|short|weak/i.test(m)) return "Choose a longer password: at least 8 characters.";
  if (/email not confirmed/i.test(m)) return "Confirm your email first: open the link we sent you, then sign in.";
  if (/rate limit|too many/i.test(m) || status === 429) return "Too many tries. Wait a minute, then try again.";
  return m || `Something went wrong (${status}). Try again.`;
}
async function acctFetch(path, opts = {}, auth = true) {
  if (auth) await acctFresh();
  const headers = { apikey: ACCOUNT_CFG.anonKey, "Content-Type": "application/json", ...(opts.headers || {}) };
  if (auth && account.session) headers.Authorization = "Bearer " + account.session.access_token;
  let res;
  try { res = await fetch(acctUrl(path), { ...opts, headers }); }
  catch { throw new Error("Couldn't reach the account server. Check your connection."); }
  const text = await res.text();
  let j = null; try { j = text ? JSON.parse(text) : null; } catch { j = null; }
  if (!res.ok) { const e = new Error(acctErr(j, res.status)); e.status = res.status; throw e; }
  return j;
}
const acctSession = j => {
  const md = j.user.user_metadata || {};
  return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, user: { id: j.user.id, email: j.user.email || md.email || "", name: md.full_name || md.name || "", provider: (j.user.app_metadata && j.user.app_metadata.provider) || "email" } };
};
// Tokens last an hour: swap for a fresh one shortly before then
async function acctFresh() {
  const s = account.session;
  if (!s || s.expires_at - Date.now() > 60000) return;
  try { acctStore(acctSession(await acctFetch("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: s.refresh_token }) }, false))); }
  catch (e) { if (e.status === 400 || e.status === 401) acctStore(null); }
}
async function acctSignUp(email, password) {
  const j = await acctFetch("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password }) }, false);
  if (j && j.access_token) { acctStore(acctSession(j)); return "in"; }
  return "confirm";   // the project asks people to confirm their email first
}
async function acctSignIn(email, password) { acctStore(acctSession(await acctFetch("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) }, false))); }
async function acctSignOut() { try { await acctFetch("/auth/v1/logout", { method: "POST" }); } catch { /* signed out here anyway */ } acctStore(null); }
async function acctResetPassword(email) { await acctFetch("/auth/v1/recover", { method: "POST", body: JSON.stringify({ email }) }, false); }
/* --- Sign in with Google, Facebook or Apple (through Supabase). The code comes back as ?code=..., not in the # part the pages use. --- */
const PKCE_KEY = "jobfinder.pkce.v1";
const ACCT_PROVIDERS = { google: "Google", facebook: "Facebook", apple: "Apple" };
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function acctOAuthUrl(provider, intent) {
  if (!ACCT_PROVIDERS[provider]) throw new Error("Unknown sign-in.");
  if (!(window.crypto && crypto.subtle)) throw new Error("This browser can't do a secure sign-in here. Use your email instead.");
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  try { sessionStorage.setItem(PKCE_KEY, JSON.stringify({ v: verifier, p: provider, hash: location.hash, intent: intent || "" })); } catch { throw new Error("Your browser is blocking site storage, which a Google, Facebook or Apple sign-in needs. Use your email instead."); }
  return acctUrl("/auth/v1/authorize?provider=" + provider + "&redirect_to=" + encodeURIComponent(location.origin + location.pathname) + "&code_challenge=" + challenge + "&code_challenge_method=s256");
}
async function acctOAuth(provider) { location.href = await acctOAuthUrl(provider); }
// A notice that stays until it's dismissed (the header box is redrawn often, so it can't live there)
function acctNotify(msg) {
  let n = document.getElementById("acctNotice");
  if (!n) { n = document.createElement("div"); n.id = "acctNotice"; n.className = "ai-banner"; n.setAttribute("role", "alert"); document.body.appendChild(n); }
  n.innerHTML = `<p></p><div class="b-actions"><button class="btn" type="button" data-acct="notice-close">OK</button></div>`;
  n.firstChild.textContent = msg; n.hidden = false;
}
// Back from Google, Facebook or Apple: swap the code for a session, then tidy the address
async function acctFinishOAuth() {
  const q = new URLSearchParams(location.search), code = q.get("code"), err = q.get("error_description") || q.get("error");
  if (!code && !err) return;
  let saved = null; try { saved = JSON.parse(sessionStorage.getItem(PKCE_KEY) || "null"); sessionStorage.removeItem(PKCE_KEY); } catch { saved = null; }
  const clean = () => { for (const k of ["code", "state", "error", "error_code", "error_description"]) q.delete(k); const rest = q.toString(); history.replaceState(null, "", location.pathname + (rest ? "?" + rest : "") + (saved && saved.hash ? saved.hash : location.hash)); };
  if (err) { acctNotify("That sign-in didn't finish: " + err.replace(/\+/g, " ")); clean(); return; }
  if (!saved || !saved.v) { clean(); return; }   // a code we didn't ask for
  try {
    acctStore(acctSession(await acctFetch("/auth/v1/token?grant_type=pkce", { method: "POST", body: JSON.stringify({ auth_code: code, code_verifier: saved.v }) }, false)));
    clean();
    if (saved.intent === "delete") account.verifiedFor = account.user.id;   // signed in again on purpose, to confirm deleting the account
    try { await acctBringBrowserData(); } catch { /* the table may not exist yet: saving falls back to this browser */ }
  } catch (e) { acctNotify("Couldn't finish signing in with " + (ACCT_PROVIDERS[saved.p] || "that account") + ": " + e.message); clean(); }
}
// Which providers are switched on in Supabase, and has the accounts table been created?
let acctInfo = null;
async function acctProviders() {
  if (acctInfo) return acctInfo;
  const want = ACCOUNT_CFG.providers || ["google", "facebook", "apple"];
  const info = { providers: [], tableOk: true };
  try { const j = await acctFetch("/auth/v1/settings", {}, false); const ext = (j && j.external) || {}; info.providers = want.filter(p => ext[p]); } catch { /* none shown */ }
  try { await acctFetch("/rest/v1/user_docs?select=name&limit=1", {}, false); } catch (e) { if (e.status === 404) info.tableOk = false; }
  return (acctInfo = info);
}
// The same shape as Claude's storage: doc(path).get() / .set(body), one row per document
const docName = path => String(path).split("/").pop();
const accountDb = {
  doc(path) {
    const name = docName(path);
    return {
      async get() {
        const rows = await acctFetch(`/rest/v1/user_docs?select=body&name=eq.${encodeURIComponent(name)}`);
        const row = Array.isArray(rows) && rows[0];
        return { exists: !!row, data: () => (row ? row.body : undefined) };
      },
      async set(body) {
        await acctFetch("/rest/v1/user_docs", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: account.user.id, name, body, updated_at: new Date().toISOString() }) });
      }
    };
  }
};
// Every document Job Finder saves, and its key in the browser, so signing up can bring what's already here
const ACCOUNT_DOCS = [["resumeProfile", "jobfinder.profile.v1"], ["skillMemory", "jobfinder.skillMemory.v1"], ["coverLetters", "jobfinder.coverLetters.v1"], ["interviewPractice", "jobfinder.interview.v1"]];
const acctRegister = (name, lsKey) => { if (!ACCOUNT_DOCS.some(d => d[0] === name)) ACCOUNT_DOCS.push([name, lsKey]); };
// After signing up or in: copy anything saved in this browser that the account doesn't have yet
async function acctBringBrowserData(progress) {
  let n = 0;
  for (const [name, key] of ACCOUNT_DOCS) {
    let raw = null;
    try { raw = localStorage.getItem(key); } catch { raw = null; }
    if (!raw) continue;
    let body; try { body = JSON.parse(raw); } catch { continue; }
    const d = accountDb.doc("data/users/" + account.user.id + "/" + name);
    if ((await d.get()).exists) continue;
    if (progress) progress(`Copying what's saved in this browser to your account (${++n})…`);
    await d.set(body);
  }
  return n;
}
async function acctDeleteData() { await acctFetch(`/rest/v1/user_docs?user_id=eq.${encodeURIComponent(account.user.id)}`, { method: "DELETE" }); }
// Signed in on this browser (and the session is still good)?
const accountReady = (async () => {
  if (!acctOn() || (window.claude && window.claude.use)) return null;
  await acctFinishOAuth();
  acctLoad();
  if (!account.session) return null;
  await acctFresh();
  return account.user;
})().catch(() => null);
const accountWords = () => account.user && memory.viaAccount ? `saved to your Job Finder account (${account.user.email})` : "saved privately to your Claude account";

/* --- The sign-up and sign-in box --- */
function renderAccount() {
  const box = document.getElementById("acct");
  if (!box) return;
  const inClaude = !!(window.claude && window.claude.use);
  if (inClaude) { box.innerHTML = ""; return; }
  if (account.user) {
    const u = account.user, name = u.name || (u.email ? u.email.split("@")[0] : "Your account");
    box.innerHTML = `<span class="acct-avatar" aria-hidden="true">${esc(name.trim().charAt(0).toUpperCase() || "?")}</span><span class="acct-who" title="${esc(u.email || name)}">${esc(name)}</span><button class="btn ghost acct-btn" type="button" data-acct="out"><span>Sign out</span></button>`;
  } else box.innerHTML = `<button class="btn ghost acct-btn" type="button" data-acct="open-in"><span>Log in</span></button><button class="btn primary acct-btn" type="button" data-acct="open" title="Sign up to keep your data"><span>Sign up</span></button>`;
}
function acctDialog(mode = "up") {
  let d = document.getElementById("acctDlg");
  if (!d) { d = document.createElement("dialog"); d.id = "acctDlg"; d.className = "jf-dialog"; d.setAttribute("aria-labelledby", "acctH"); document.body.appendChild(d); }
  if (!acctOn()) {
    d.innerHTML = `<div class="jf-dialog-card"><h2 id="acctH">Accounts aren't switched on here yet</h2><p class="small">Everything you add is saved in this browser. To keep it with an account instead, so it follows you to any device, the person who runs this copy of Job Finder needs to connect a free Supabase project (see “Accounts” in the README). Opened inside Claude, Job Finder saves to your Claude account.</p><p class="small muted">Until then, use <b>Download my data</b> on Create or edit profile to keep a copy.</p><div class="b-actions"><button class="btn primary" type="button" data-acct="close">OK</button></div></div>`;
    d.showModal(); return;
  }
  const up = mode === "up";
  d.innerHTML = `<form class="jf-dialog-card acct-form" novalidate><h2 id="acctH">${up ? "Sign up to keep your data" : "Sign in"}</h2>
    <div class="seg acct-tabs" role="group" aria-label="Sign up or sign in"><button type="button" data-acct="mode-up" aria-pressed="${up}">Sign up</button><button type="button" data-acct="mode-in" aria-pressed="${!up}">Sign in</button></div>
    <p class="small muted">${up ? "Everything you add (your resume, letters, applications and practice) is saved to your account, so you can pick it up on any device. What's already saved in this browser comes with you." : "Welcome back. Everything you saved will load once you're in."}</p>
    <div class="acct-social" id="acctSocial" hidden></div>
    <p class="acct-or small muted" id="acctOr" hidden><span>or use your email</span></p>
    <label class="field" for="acctEmail">Email<input type="email" id="acctEmail" autocomplete="email" required></label>
    <label class="field" for="acctPass">Password${up ? " (at least 8 characters)" : ""}<input type="password" id="acctPass" autocomplete="${up ? "new-password" : "current-password"}" minlength="8" required></label>
    <p class="acct-msg" id="acctMsg" role="status"></p>
    <div class="b-actions"><button class="btn primary" type="submit">${up ? "Sign up" : "Sign in"}</button><button class="btn ghost" type="button" data-acct="close">Cancel</button>${up ? "" : '<button class="linkish" type="button" data-acct="reset">Forgot your password?</button>'}</div>
    <p class="small muted">Your AI key, if you added one, stays in this browser only and is never saved to your account. With Google, Facebook or Apple we only receive your name and email, never your password.</p></form>`;
  if (!d.open) d.showModal();
  d.dataset.mode = mode;
  d.querySelector("#acctEmail").focus();
  acctProviders().then(info => {
    const soc = d.querySelector("#acctSocial");
    if (!soc) return;
    if (!info.tableOk) { const m = d.querySelector("#acctMsg"); m.textContent = "Accounts aren't finished being set up on this site yet (the storage table is missing), so what you add can only be kept in this browser for now."; m.className = "acct-msg err"; }
    if (!info.providers.length) return;
    soc.innerHTML = info.providers.map(p => `<button class="btn acct-prov acct-${p}" type="button" data-acct="oauth:${p}">Continue with ${ACCT_PROVIDERS[p]}</button>`).join("");
    soc.hidden = false; d.querySelector("#acctOr").hidden = false;
  });
}
async function acctSubmit(d) {
  const email = d.querySelector("#acctEmail").value.trim(), pass = d.querySelector("#acctPass").value, msg = d.querySelector("#acctMsg"), btn = d.querySelector('button[type="submit"]');
  const say = (m, cls) => { msg.textContent = m; msg.className = "acct-msg" + (cls ? " " + cls : ""); };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say("Check your email address.", "err"); return; }
  if (pass.length < 8) { say("Use a password of at least 8 characters.", "err"); return; }
  btn.disabled = true;
  try {
    if (d.dataset.mode === "up") {
      say("Making your account…");
      if (await acctSignUp(email, pass) === "confirm") { say("Nearly there: we've emailed you a link. Open it, then come back and sign in.", "ok"); return; }
    } else { say("Signing in…"); await acctSignIn(email, pass); }
    const n = await acctBringBrowserData(m => say(m));
    say(n ? "Done. Loading your account…" : "Signed in. Loading your account…", "ok");
    setTimeout(() => location.reload(), 600);
  } catch (e) { say(e.message || "Something went wrong. Try again.", "err"); }
  finally { btn.disabled = false; }
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-acct]");
  if (!b) return;
  const a = b.dataset.acct, d = document.getElementById("acctDlg");
  if (a === "notice-close") { const n = document.getElementById("acctNotice"); if (n) n.hidden = true; return; }
  if (a.startsWith("oauth:")) {
    const msg = d && d.querySelector("#acctMsg");
    try { await acctOAuth(a.slice(6)); } catch (err) { if (msg) { msg.textContent = err.message; msg.className = "acct-msg err"; } }
  }
  else if (a === "open") acctDialog("up");
  else if (a === "open-in") acctDialog("in");
  else if (a === "mode-up" || a === "mode-in") acctDialog(a === "mode-up" ? "up" : "in");
  else if (a === "close" && d) d.close();
  else if (a === "reset" && d) {
    const email = d.querySelector("#acctEmail").value.trim(), msg = d.querySelector("#acctMsg");
    if (!email) { msg.textContent = "Type your email first, then choose Forgot your password."; msg.className = "acct-msg err"; return; }
    try { await acctResetPassword(email); msg.textContent = "If there's an account with that email, a link to choose a new password is on its way."; msg.className = "acct-msg ok"; }
    catch (err) { msg.textContent = err.message; msg.className = "acct-msg err"; }
  }
  else if (a === "out") { await acctSignOut(); location.reload(); }
});
document.addEventListener("submit", e => { const d = e.target.closest("#acctDlg"); if (d) { e.preventDefault(); acctSubmit(d); } });
