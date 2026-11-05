/* ===================== Developer: see the site as a brand new visitor, then put your data back ===================== */
// Everything Job Finder saves in this browser starts with "jobfinder." (your profile, resumes, AI choice, sign-in, which tab you were on).
// "View as a new visitor" moves all of it into one stash entry and reloads, so the site looks like the very first visit.
// Nothing is deleted: "Restore my data" clears whatever the new-visitor session made and puts the stash back.
// Inside Claude, where data is kept in your Claude account, the new-visitor view just stops reading it (see 08).
const DEV_STASH = "jobfinder.dev.stash.v1", DEV_FLAG = "jobfinder.dev.v1";
const devRead = k => { try { return localStorage.getItem(k); } catch { return null; } };
const devFresh = () => !!devRead(DEV_STASH);   // true while the new-visitor view is on
// The Developer button is for you, not for visitors: it shows on localhost and local files, after adding ?dev to the address, or after Ctrl+Shift+D
const devAllowed = () => devRead(DEV_FLAG) === "1" || devFresh();
try { if (/[?&]dev(=1|&|$)/.test(location.search)) localStorage.setItem(DEV_FLAG, "1"); } catch { /* storage blocked */ }
const devOwnKeys = store => { const out = []; try { for (let i = 0; i < store.length; i++) { const k = store.key(i); if (k && k.startsWith("jobfinder.") && k !== DEV_STASH && k !== DEV_FLAG) out.push(k); } } catch { /* storage blocked */ } return out; };
function devStorageOk() { try { localStorage.setItem("jobfinder.dev.probe", "1"); localStorage.removeItem("jobfinder.dev.probe"); return true; } catch { return false; } }
// Put everything aside and reload as a new visitor. False if this browser won't let the site store anything.
function devEnterFresh() {
  if (devFresh()) return true;
  if (!devStorageOk()) return false;
  const keep = { local: {}, session: {} };
  for (const k of devOwnKeys(localStorage)) keep.local[k] = localStorage.getItem(k);
  for (const k of devOwnKeys(sessionStorage)) keep.session[k] = sessionStorage.getItem(k);
  localStorage.setItem(DEV_STASH, JSON.stringify({ at: new Date().toISOString(), keep }));
  for (const k of Object.keys(keep.local)) localStorage.removeItem(k);
  for (const k of Object.keys(keep.session)) { try { sessionStorage.removeItem(k); } catch { /* blocked */ } }
  location.hash = "";
  location.reload();
  return true;
}
// Throw away what the new-visitor session made, put your own data back, and reload
function devLeaveFresh() {
  let saved = null; try { saved = JSON.parse(devRead(DEV_STASH) || "null"); } catch { saved = null; }
  for (const k of devOwnKeys(localStorage)) localStorage.removeItem(k);
  for (const k of devOwnKeys(sessionStorage)) { try { sessionStorage.removeItem(k); } catch { /* blocked */ } }
  if (saved && saved.keep) {
    for (const [k, v] of Object.entries(saved.keep.local || {})) { try { localStorage.setItem(k, v); } catch { /* full */ } }
    for (const [k, v] of Object.entries(saved.keep.session || {})) { try { sessionStorage.setItem(k, v); } catch { /* blocked */ } }
  }
  try { localStorage.removeItem(DEV_STASH); } catch { /* blocked */ }
  location.reload();
}
