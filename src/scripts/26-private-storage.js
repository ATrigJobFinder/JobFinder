/* ===================== Private, per-person storage ===================== */
// One document per feature under data/users/<id>/ (private to each person), or this browser outside Claude.
function privateDoc(name, lsKey, empty) {
  acctRegister(name, lsKey);
  const st = { data: empty(), where: "loading", doc: null, listeners: new Set() };
  const merge = raw => ({ ...empty(), ...(raw && typeof raw === "object" ? raw : {}) });
  st.ready = memoryReady.then(async () => {
    try {
      if (memory.db && memory.uid) {
        st.doc = memory.db.doc("data/users/" + memory.uid + "/" + name);
        const snap = await st.doc.get();
        if (snap.exists) st.data = merge(JSON.parse(JSON.stringify(snap.data() || {})));
        st.where = "account";
        return;
      }
    } catch { st.doc = null; }
    try { const raw = lsGet(lsKey); if (raw) st.data = merge(JSON.parse(raw)); st.where = "browser"; } catch { st.where = "none"; }
  }).finally(() => st.listeners.forEach(f => { try { f("load"); } catch (e) { console.error(e); } }));
  let chain = Promise.resolve(), timer = null;
  st.save = now => {
    clearTimeout(timer);
    const go = () => {
      chain = chain.then(async () => {
        const body = JSON.parse(JSON.stringify({ ...st.data, updated: new Date().toISOString() }));
        if (st.doc) { try { await st.doc.set(body); st.where = "account"; return; } catch (e) { if (e && e.code === "quota_exceeded") st.full = true; st.doc = null; } }
        try { localStorage.setItem(lsKey, JSON.stringify(body)); st.where = "browser"; } catch { st.where = "none"; }
      });
    };
    if (now) go(); else timer = setTimeout(go, 600);
  };
  st.on = f => st.listeners.add(f);
  return st;
}
const whereWords = w => w === "account" ? accountWords() : w === "browser" ? "saved in this browser" : w === "loading" ? "loading" : "not saved after you leave";
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (d, n) => { const x = new Date((d || todayISO()) + "T00:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const fmtDay = iso => iso ? new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "";
const uid8 = () => Math.random().toString(36).slice(2, 10);

