/* ===================== Version 22: download everything as one zip, and delete an account properly ===================== */

/* --- A zip file made in the browser: files stored as they are (no compression), which every unzip tool reads --- */
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = bytes => { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
// files: [{ name, text }]
function makeZip(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let offset = 0;
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    const name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034B50, true); head.setUint16(4, 20, true); head.setUint16(6, 0x0800, true); head.setUint16(8, 0, true);
    head.setUint16(10, time, true); head.setUint16(12, date, true); head.setUint32(14, crc, true); head.setUint32(18, data.length, true); head.setUint32(22, data.length, true);
    head.setUint16(26, name.length, true); head.setUint16(28, 0, true);
    parts.push(new Uint8Array(head.buffer), name, data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014B50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true); cen.setUint16(10, 0, true);
    cen.setUint16(12, time, true); cen.setUint16(14, date, true); cen.setUint32(16, crc, true); cen.setUint32(20, data.length, true); cen.setUint32(24, data.length, true);
    cen.setUint16(28, name.length, true); cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cenSize = central.reduce((a, x) => a + x.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054B50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cenSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
}
const safeFile = s => String(s || "file").replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 60) || "file";
// Everything Job Finder holds for you, as readable files
function buildDataZip() {
  const json = o => JSON.stringify(o, null, 2), files = [];
  const add = (name, text) => { if (text != null && String(text).trim()) files.push({ name, text: String(text) }); };
  add("README.txt", `Your Job Finder data, exported ${new Date().toLocaleString("en-AU")}.\n\nprofile.json: everything in your profile (details, jobs, study, skills, extras, design choices).\nresume.txt: your resume as plain text.\ncover-letter.txt and cover-letter.json: your cover letter.\nsaved-resumes/: each resume version you saved.\ncover-letter-templates/: each cover letter you saved.\nlinkedin.json, applications.json: your LinkedIn notes and your application tracker.\n\nYour AI key is never included: it is kept only in your browser.\n`);
  add("profile.json", json(P()));
  try { add("resume.txt", profileToText(P())); } catch { /* nothing to write */ }
  add("cover-letter.json", json(BL()));
  add("cover-letter.txt", blText().join("\n\n"));
  (savedResumes.data.list || []).forEach((x, i) => add(`saved-resumes/${String(i + 1).padStart(2, "0")} ${safeFile(x.name)}.json`, json(x)));
  (savedLetters.data.list || []).forEach((x, i) => add(`cover-letter-templates/${String(i + 1).padStart(2, "0")} ${safeFile(x.name)}.json`, json(x)));
  add("linkedin.json", json(linStore.data.input || {}));
  add("applications.json", json((trk.data && trk.data.items) || []));
  return makeZip(files);
}

/* --- Delete my account and all data --- */
const DELETE_PHRASE = "I want to delete my account and all data";
const PENDING_DELETE = "jobfinder.pendingDelete.v1";
function deleteDialog(verified) {
  let d = $("delDlg");
  if (!d) { d = document.createElement("dialog"); d.id = "delDlg"; d.className = "jf-dialog"; d.setAttribute("aria-labelledby", "delH"); document.body.appendChild(d); }
  const u = account.user || {}, prov = u.provider || "email", social = prov !== "email" && ACCT_PROVIDERS[prov];
  const how = verified ? `<p class="b-check ok">✓ You've verified it's you.</p>`
    : social ? `<p class="small">To make sure it's you, sign in with ${ACCT_PROVIDERS[prov]} again. You'll come back here.</p><div class="b-actions"><button class="btn" type="button" data-del="verify-oauth">Verify with ${ACCT_PROVIDERS[prov]}</button></div>`
      : `<label class="field" for="delPass">Your password, to make sure it's you<input type="password" id="delPass" autocomplete="current-password"></label>`;
  d.innerHTML = `<form class="jf-dialog-card" novalidate><h2 id="delH">Delete my account and all data</h2>
    <p class="small">This permanently deletes your account (${esc(u.email || "")}) and everything saved in it: your profile, resumes, cover letters, applications and practice. It also clears Job Finder's copy in this browser. <b>It can't be undone.</b></p>
    <div class="b-actions"><button class="btn" type="button" data-del="download">Download my data first (zip)</button></div>
    <label class="field" for="delPhrase">Type exactly: <b>${esc(DELETE_PHRASE)}</b><input type="text" id="delPhrase" autocomplete="off" spellcheck="false"></label>
    ${how}
    <p class="acct-msg" id="delMsg" role="status"></p>
    <div class="b-actions"><button class="btn primary danger" type="submit" id="delGo">Delete everything</button><button class="btn ghost" type="button" data-del="close">Cancel</button></div></form>`;
  d.dataset.verified = verified ? "1" : "";
  if (!d.open) d.showModal();
  d.querySelector("#delPhrase").focus();
}
async function deleteSubmit(d) {
  const say = (m, cls) => { const el = d.querySelector("#delMsg"); el.textContent = m; el.className = "acct-msg" + (cls ? " " + cls : ""); };
  const typed = d.querySelector("#delPhrase").value.trim().replace(/\.$/, "").toLowerCase();
  if (typed !== DELETE_PHRASE.toLowerCase()) { say(`Type the sentence exactly as shown: ${DELETE_PHRASE}`, "err"); return; }
  const btn = d.querySelector("#delGo"); btn.disabled = true;
  try {
    if (d.dataset.verified !== "1") {
      const pass = (d.querySelector("#delPass") || {}).value;
      if (!pass) { say("Enter your password to verify it's you.", "err"); return; }
      say("Checking your password…");
      const j = await acctFetch("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: account.user.email, password: pass }) }, false);
      if (!j || !j.user || j.user.id !== account.user.id) throw new Error("That password doesn't match this account.");
      acctStore(acctSession(j));
    }
    say("Deleting your account…");
    await acctFetch("/rest/v1/rpc/delete_my_account", { method: "POST", body: "{}" });
    // the account is gone: clear this browser's copy too, then sign out
    try { Object.keys(localStorage).filter(k => k.startsWith("jobfinder.")).forEach(k => localStorage.removeItem(k)); sessionStorage.clear(); } catch { /* blocked */ }
    acctStore(null);
    say("Done. Your account and data are deleted.", "ok");
    setTimeout(() => { location.hash = "home"; location.reload(); }, 900);
  } catch (e) {
    say(e.status === 404 ? "Deleting an account isn't switched on for this site yet (the database function is missing). Your data wasn't changed." : e.message || "Couldn't delete the account. Nothing was changed.", "err");
  } finally { btn.disabled = false; }
}
onInit(() => {
  document.addEventListener("click", async e => {
    const b = e.target.closest("[data-del]");
    if (!b) return;
    const d = $("delDlg"), a = b.dataset.del;
    if (a === "close" && d) d.close();
    else if (a === "download" && d) {
      const st = d.querySelector("#delMsg"); st.className = "acct-msg"; st.textContent = "";
      await downloadMade(`Job Finder data ${todayISO()}.zip`, async () => buildDataZip(), st, b);
    } else if (a === "verify-oauth") {
      try { try { sessionStorage.setItem(PENDING_DELETE, "1"); } catch { /* blocked */ } location.href = await acctOAuthUrl(account.user.provider, "delete"); }
      catch (err) { const m = d.querySelector("#delMsg"); m.textContent = err.message; m.className = "acct-msg err"; }
    }
  });
  document.addEventListener("submit", e => { const d = e.target.closest("#delDlg"); if (d) { e.preventDefault(); deleteSubmit(d); } });
  // back from signing in again to verify: pick up where the deletion left off
  accountReady.then(u => {
    let pending = false; try { pending = sessionStorage.getItem(PENDING_DELETE) === "1"; sessionStorage.removeItem(PENDING_DELETE); } catch { /* blocked */ }
    if (pending && u && account.verifiedFor === u.id) { openView("profile"); setTimeout(() => deleteDialog(true), 400); }
  });
});
