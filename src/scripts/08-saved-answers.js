/* ===================== Saved answers (memory) ===================== */
const MEM_KEY = "jobfinder.skillMemory.v1";
const memory = { skills: {}, where: "loading", doc: null };
const memoryReady = (async () => {
  try {
    const c = window.claude;
    if (c && c.use) {
      const [db, user] = await Promise.all([c.use("db"), c.use("user")]);
      const uid = user ? await user.id() : null;
      if (db && uid) {
        memory.db = db; memory.uid = uid;
        memory.doc = db.doc("data/users/" + uid + "/skillMemory");
        const snap = await memory.doc.get();
        if (snap.exists) memory.skills = { ...((snap.data() || {}).skills || {}) };
        memory.where = "account";
        return;
      }
    }
  } catch { memory.doc = null; }
  // on your own website: signed in to a Job Finder account, everything is saved there (see 07b)
  try {
    const user = await accountReady;
    if (user) {
      memory.db = accountDb; memory.uid = user.id; memory.viaAccount = true;
      memory.doc = accountDb.doc("data/users/" + user.id + "/skillMemory");
      const snap = await memory.doc.get();
      if (snap.exists) memory.skills = { ...((snap.data() || {}).skills || {}) };
      memory.where = "account";
      return;
    }
  } catch { memory.db = null; memory.uid = null; memory.viaAccount = false; memory.doc = null; }
  try {
    const raw = localStorage.getItem(MEM_KEY);
    if (raw) memory.skills = (JSON.parse(raw) || {}).skills || {};
    memory.where = "browser";
  } catch { memory.where = "none"; }
})().finally(() => { if (lastResult) setupPlace(); });

async function saveMemory() {
  const body = { version: 1, skills: memory.skills, updated: new Date().toISOString() };
  if (memory.doc) {
    try { await memory.doc.set(body); memory.where = "account"; return; }
    catch { memory.doc = null; }
  }
  try { localStorage.setItem(MEM_KEY, JSON.stringify(body)); memory.where = "browser"; }
  catch { memory.where = "none"; }
}
function rememberedZone(skill, zones) {
  const m = memory.skills[skill];
  if (!m) return null;
  if (m.zone === "na") return { zoneId: "__na", note: "" };
  if (m.zone === "skills") return { zoneId: "__skills", note: "" };
  let best = null, bestS = 0;
  for (const z of zones) { const s = z.key === m.key ? 1 : similarity(z.key, m.key || ""); if (s > bestS) { bestS = s; best = z; } }
  return best && bestS >= 0.6 ? { zoneId: best.id, note: m.note || "" } : { zoneId: null, hint: m.label };
}

