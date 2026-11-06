/* ===================== Home globe: a 3D Earth you can spin, with example jobs on it ===================== */
// Drawn straight onto a canvas (no 3D library, nothing loaded from the internet), so it works inside Claude and on your own site.
// The land is dots from the map in 36e. The jobs are examples made up here to show how it works, not live listings.
const GLOBE_D = Math.PI / 180;
let globeToGlobe = () => {};   // set by initGlobe; the header logo (18) calls it
// name, country, lat, lng, example jobs, mix of industries (see GLOBE_ROLES)
const GLOBE_HUBS = [
  ["Sydney", "Australia", -33.87, 151.21, 1840, "finance,tech,health,gov"], ["Melbourne", "Australia", -37.81, 144.96, 1710, "tech,health,education,creative"],
  ["Brisbane", "Australia", -27.47, 153.03, 1120, "health,trades,gov,logistics"], ["Perth", "Australia", -31.95, 115.86, 980, "mining,engineering,trades,energy"],
  ["Adelaide", "Australia", -34.93, 138.6, 540, "health,gov,engineering,education"], ["Canberra", "Australia", -35.28, 149.13, 610, "gov,tech,education,finance"],
  ["Hobart", "Australia", -42.88, 147.33, 150, "hospitality,health,agri,gov"], ["Darwin", "Australia", -12.46, 130.84, 120, "gov,mining,trades,hospitality"],
  ["Gold Coast", "Australia", -28.02, 153.4, 330, "hospitality,health,trades,education"], ["Newcastle", "Australia", -32.93, 151.78, 280, "energy,engineering,health,trades"],
  ["Wollongong", "Australia", -34.42, 150.89, 170, "engineering,education,health,tech"], ["Geelong", "Australia", -38.15, 144.36, 160, "engineering,health,logistics,education"],
  ["Sunshine Coast", "Australia", -26.65, 153.07, 150, "hospitality,health,trades,education"], ["Townsville", "Australia", -19.26, 146.82, 140, "mining,health,education,gov"],
  ["Cairns", "Australia", -16.92, 145.77, 130, "hospitality,agri,health,trades"], ["Mackay", "Australia", -21.14, 149.19, 90, "mining,trades,agri,engineering"],
  ["Karratha", "Australia", -20.74, 116.85, 80, "mining,energy,trades,engineering"], ["Kalgoorlie", "Australia", -30.75, 121.47, 70, "mining,trades,engineering,logistics"],
  ["Alice Springs", "Australia", -23.7, 133.88, 40, "gov,health,education,hospitality"], ["Launceston", "Australia", -41.44, 147.14, 60, "agri,health,hospitality,education"],
  ["Auckland", "New Zealand", -36.85, 174.76, 700, "tech,finance,health,logistics"], ["Wellington", "New Zealand", -41.29, 174.78, 300, "gov,tech,creative,education"],
  ["Christchurch", "New Zealand", -43.53, 172.64, 230, "trades,engineering,health,education"], ["Suva", "Fiji", -18.14, 178.44, 50, "hospitality,gov,education,health"],
  ["Port Moresby", "Papua New Guinea", -9.44, 147.18, 70, "mining,gov,logistics,energy"], ["Singapore", "Singapore", 1.35, 103.82, 1500, "finance,tech,logistics,health"],
  ["Jakarta", "Indonesia", -6.2, 106.85, 650, "tech,logistics,finance,creative"], ["Manila", "Philippines", 14.6, 120.98, 520, "tech,finance,health,education"],
  ["Bangkok", "Thailand", 13.76, 100.5, 480, "hospitality,logistics,tech,health"], ["Hong Kong", "China", 22.32, 114.17, 900, "finance,logistics,tech,hospitality"],
  ["Shanghai", "China", 31.23, 121.47, 1100, "engineering,logistics,finance,tech"], ["Beijing", "China", 39.9, 116.4, 1000, "tech,education,gov,engineering"],
  ["Tokyo", "Japan", 35.68, 139.69, 1700, "tech,finance,engineering,creative"], ["Seoul", "South Korea", 37.57, 126.98, 1200, "tech,engineering,creative,finance"],
  ["Mumbai", "India", 19.08, 72.88, 1100, "finance,creative,tech,logistics"], ["Bengaluru", "India", 12.97, 77.59, 1300, "tech,engineering,finance,health"],
  ["Delhi", "India", 28.61, 77.21, 1000, "gov,tech,education,health"], ["Dubai", "United Arab Emirates", 25.2, 55.27, 900, "hospitality,finance,logistics,engineering"],
  ["Istanbul", "Turkey", 41.01, 28.98, 600, "logistics,creative,finance,engineering"], ["Cairo", "Egypt", 30.04, 31.24, 400, "education,health,tech,logistics"],
  ["Nairobi", "Kenya", -1.29, 36.82, 360, "tech,agri,health,education"], ["Lagos", "Nigeria", 6.52, 3.38, 450, "finance,tech,logistics,energy"],
  ["Johannesburg", "South Africa", -26.2, 28.05, 520, "mining,finance,engineering,health"], ["Cape Town", "South Africa", -33.92, 18.42, 380, "tech,hospitality,finance,agri"],
  ["London", "United Kingdom", 51.51, -0.13, 2400, "finance,tech,creative,health"], ["Manchester", "United Kingdom", 53.48, -2.24, 640, "tech,creative,health,education"],
  ["Edinburgh", "United Kingdom", 55.95, -3.19, 380, "finance,education,tech,health"], ["Dublin", "Ireland", 53.35, -6.26, 620, "tech,finance,health,education"],
  ["Paris", "France", 48.86, 2.35, 1500, "creative,finance,engineering,hospitality"], ["Amsterdam", "Netherlands", 52.37, 4.9, 800, "tech,logistics,finance,creative"],
  ["Berlin", "Germany", 52.52, 13.4, 1100, "tech,creative,engineering,gov"], ["Madrid", "Spain", 40.42, -3.7, 780, "hospitality,tech,finance,health"],
  ["Stockholm", "Sweden", 59.33, 18.07, 520, "tech,engineering,energy,health"], ["Moscow", "Russia", 55.76, 37.62, 700, "engineering,energy,finance,tech"],
  ["New York", "United States", 40.71, -74.01, 2600, "finance,tech,creative,health"], ["San Francisco", "United States", 37.77, -122.42, 2000, "tech,finance,health,creative"],
  ["Los Angeles", "United States", 34.05, -118.24, 1600, "creative,logistics,health,tech"], ["Austin", "United States", 30.27, -97.74, 800, "tech,energy,education,gov"],
  ["Chicago", "United States", 41.88, -87.63, 1000, "finance,logistics,health,education"], ["Toronto", "Canada", 43.65, -79.38, 1300, "finance,tech,health,creative"],
  ["Vancouver", "Canada", 49.28, -123.12, 700, "tech,creative,energy,hospitality"], ["Mexico City", "Mexico", 19.43, -99.13, 800, "logistics,finance,creative,engineering"],
  ["Bogotá", "Colombia", 4.71, -74.07, 420, "tech,finance,education,logistics"], ["Lima", "Peru", -12.05, -77.04, 380, "mining,finance,hospitality,logistics"],
  ["São Paulo", "Brazil", -23.55, -46.63, 1400, "finance,tech,logistics,creative"], ["Buenos Aires", "Argentina", -34.6, -58.38, 650, "creative,finance,agri,education"],
  ["Santiago", "Chile", -33.45, -70.67, 520, "mining,finance,energy,agri"]
].map(([name, country, lat, lng, jobs, mix], id) => ({ id, name, country, lat, lng, jobs, mix: mix.split(","), v: globeXYZ(lat, lng) }));

const GLOBE_ROLES = {
  tech: ["Software Engineer", "Data Analyst", "Cloud Engineer", "Cyber Security Analyst", "Product Designer", "IT Support Officer", "QA Tester"],
  finance: ["Graduate Accountant", "Financial Analyst", "Credit Analyst", "Payroll Officer", "Bookkeeper", "Risk Analyst", "Internal Auditor"],
  health: ["Registered Nurse", "Physiotherapist", "Medical Receptionist", "Pharmacist", "Allied Health Assistant", "Occupational Therapist", "Radiographer"],
  trades: ["Electrician", "Carpenter", "Plumber", "Fitter and Turner", "Site Supervisor", "Boilermaker", "Civil Labourer"],
  mining: ["Mining Engineer", "Geologist", "Heavy Diesel Mechanic", "Process Operator", "Drill and Blast Operator", "Environmental Advisor", "Maintenance Planner"],
  education: ["Primary School Teacher", "Teacher's Aide", "Lecturer", "Learning Designer", "Student Support Officer", "Early Childhood Educator"],
  gov: ["Policy Officer", "Project Officer", "Grants Administrator", "Planning Officer", "Case Manager", "Records Officer"],
  hospitality: ["Chef de Partie", "Barista", "Front Office Supervisor", "Events Coordinator", "Restaurant Manager", "Bar Attendant"],
  logistics: ["Warehouse Supervisor", "Supply Chain Analyst", "Freight Coordinator", "Forklift Operator", "Fleet Planner", "Procurement Officer"],
  creative: ["Graphic Designer", "Content Writer", "Marketing Coordinator", "Social Media Manager", "Video Editor", "Brand Strategist"],
  engineering: ["Graduate Civil Engineer", "Mechanical Engineer", "Structural Drafter", "Electrical Engineer", "Project Engineer", "Environmental Engineer"],
  energy: ["Solar Installer", "Grid Engineer", "Wind Technician", "Energy Analyst", "Network Planner"],
  agri: ["Farm Manager", "Agronomist", "Livestock Handler", "Irrigation Technician", "Food Technologist"],
  retail: ["Retail Assistant", "Sales Assistant", "Store Manager", "Visual Merchandiser", "Customer Service Representative", "Stock Controller"]   // not in any city's mix: used when someone searches for retail work
};
const GLOBE_ORGS = {
  tech: ["Software company", "Start-up", "Consultancy"], finance: ["Bank", "Accounting firm", "Insurer"], health: ["Public hospital", "Medical centre", "Aged care provider"],
  trades: ["Building company", "Local contractor", "Maintenance firm"], mining: ["Mining company", "Resources contractor", "Engineering services"], education: ["School", "University", "TAFE or college"],
  gov: ["Local council", "State agency", "Federal department"], hospitality: ["Hotel", "Restaurant group", "Events company"], logistics: ["Freight company", "Retailer", "Distribution centre"],
  creative: ["Agency", "Media company", "In-house team"], engineering: ["Engineering firm", "Infrastructure builder", "Utility"], energy: ["Energy retailer", "Renewables developer", "Grid operator"], agri: ["Farm business", "Food producer", "Research body"],
  retail: ["Fashion retailer", "Department store", "Shopping centre store"]
};

// the land map from 36e, unpacked into one byte per cell
const globeMask = (() => {
  const m = new Uint8Array(360 * 180); let i = 0, v = 0;
  for (const r of GLOBE_LAND.split(",")) { const n = parseInt(r, 36); if (v) m.fill(1, i, i + n); i += n; v ^= 1; }
  return m;
})();
// land or sea at a point; blending the four nearest cells keeps coasts from looking like squares
function globeLandAt(lat, lng) {
  const fy = Math.min(179, Math.max(0, 89.5 - lat)), fx = lng + 179.5;
  const y0 = Math.floor(fy), y1 = Math.min(179, y0 + 1), x0 = Math.floor(fx), tx = fx - x0, ty = fy - y0;
  const a = ((x0 % 360) + 360) % 360, b = (a + 1) % 360;
  const v = (globeMask[y0 * 360 + a] * (1 - tx) + globeMask[y0 * 360 + b] * tx) * (1 - ty) + (globeMask[y1 * 360 + a] * (1 - tx) + globeMask[y1 * 360 + b] * tx) * ty;
  return v > 0.5;
}
function globeXYZ(lat, lng) { const p = lat * GLOBE_D, l = lng * GLOBE_D, c = Math.cos(p); return [c * Math.sin(l), Math.sin(p), c * Math.cos(l)]; }
// land dots on an even grid, as unit vectors. A finer grid is used the closer you zoom.
const globeTiers = {};
function globeTier(step) {
  if (globeTiers[step]) return globeTiers[step];
  const xs = [];
  for (let lat = -90 + step / 2; lat < 90; lat += step) {
    const n = Math.max(1, Math.round(360 * Math.cos(lat * GLOBE_D) / step));
    for (let k = 0; k < n; k++) { const lng = -180 + (k + 0.5) * 360 / n; if (globeLandAt(lat, lng)) xs.push(...globeXYZ(lat, lng)); }
  }
  return (globeTiers[step] = { step, n: xs.length / 3, xyz: Float32Array.from(xs) });
}
const globeKm = (la1, ln1, la2, ln2) => 6371 * Math.acos(Math.min(1, Math.max(-1, Math.sin(la1 * GLOBE_D) * Math.sin(la2 * GLOBE_D) + Math.cos(la1 * GLOBE_D) * Math.cos(la2 * GLOBE_D) * Math.cos((ln2 - ln1) * GLOBE_D))));
function globeRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// the example jobs in a hub: the same ones every time, scattered around the city
function globeJobs(h) {
  if (h.list) return h.list;
  const rnd = globeRng([...h.name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
  const spread = Math.min(0.5, 0.12 + Math.sqrt(h.jobs) * 0.007), list = [];
  for (let i = 0, n = Math.min(18, Math.round(h.jobs / 20) + 4); i < n; i++) {
    const f = h.mix[i % h.mix.length], roles = GLOBE_ROLES[f], orgs = GLOBE_ORGS[f];
    const r = spread * Math.sqrt(rnd()), a = rnd() * Math.PI * 2, lat = h.lat + r * Math.sin(a), lng = h.lng + r * Math.cos(a) / Math.max(0.2, Math.cos(h.lat * GLOBE_D));
    const k = rnd();
    list.push({ title: roles[Math.floor(rnd() * roles.length)], org: orgs[Math.floor(rnd() * orgs.length)], kind: k < 0.62 ? "Full-time" : k < 0.82 ? "Part-time" : k < 0.93 ? "Contract" : "Casual", lat, lng, v: globeXYZ(lat, lng), hub: h });
  }
  return (h.list = list);
}
const globeNear = (lat, lng) => GLOBE_HUBS.map(h => ({ h, km: globeKm(lat, lng, h.lat, h.lng) })).sort((a, b) => a.km - b.km);
const globeNum = n => n.toLocaleString("en-AU");
const globeDist = km => km < 15 ? "right here" : km < 100 ? `${Math.round(km / 5) * 5} km away` : `${globeNum(Math.round(km / 10) * 10)} km away`;

function initGlobe() {
  const cv = $("globeCanvas"), stage = $("globeStage"), panel = $("globePanel");
  const ctx = cv && cv.getContext("2d");
  if (!ctx || !stage || !panel) { if (stage) stage.hidden = true; return; }
  const tip = $("globeTip"), live = $("globeStatus"), hero = $("globeHero"), gap = $("globeGap");
  const earth = $("globeGL") ? globeGL($("globeGL")) : { ok: false }; // the realistic Earth, if this browser can draw it (36h)
  let real = false, RB = 1, PC = null, ui = [], uiAt = -1e9;
  // street level (36i): zooming right in breaks through the clouds into Google's satellite map
  const MAPS_ON = !!GOOGLE_MAPS_KEY, street = MAPS_ON ? globeStreet($("globeMap")) : null, flash = $("globeFlash"), backBtn = $("globeBack");
  let brk = 0, busy = false, streetOn = false, streetIdle = false; // brk: how far through the clouds; busy: a dive or climb is under way
  const ZMIN = 0.8, ZMAX = 6, clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const START = { lat: 8, lng: 118, z: 1 };
  let view = { ...START }, tween = null, vel = { x: 0, y: 0 }, auto = !reduceMotion(), idleAt = performance.now();
  let W = 0, H = 0, dpr = 1, R = 1, cx = 0, cy = 0, C = null, colAt = -1e9, raf = 0, last = 0, inView = true;
  let pins = [], hover = null;
  const hubsBySize = GLOBE_HUBS.slice().sort((a, b) => b.jobs - a.jobs); // big cities first, so their names win when labels collide
  const st = { mode: "ask", me: null, hub: null, err: "" };

  /* ---- colours come from the page's own theme, so light and dark both work ---- */
  const hex = c => { const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c); if (!m) return null; const s = m[1].length === 3 ? [...m[1]].map(x => x + x).join("") : m[1]; return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16)); };
  const alpha = (c, a) => { const r = hex(c); return r ? `rgba(${r[0]},${r[1]},${r[2]},${a})` : c; };
  function readColors() {
    const s = getComputedStyle(document.documentElement), g = n => s.getPropertyValue(n).trim() || "#888888";
    C = { accent: g("--accent"), soft: g("--accent-soft"), surface: g("--surface"), ink: g("--ink"), muted: g("--muted"), line: g("--line"), good: g("--good"), bg: g("--bg"), font: s.getPropertyValue("--font-body").trim() || "system-ui, sans-serif" };
    const b = hex(C.bg); C.dark = b ? (b[0] * 299 + b[1] * 587 + b[2] * 114) / 1000 < 110 : false;
  }

  /* ---- size ---- */
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    layout(); mapFlag(); kick();
  }
  // the words and the card are drawn over the planet, so pins under them are left out
  function measureUI() {
    const hr = hero.getBoundingClientRect(), pad = 8, box = el => { if (!el) return null; const b = el.getBoundingClientRect(); return b.width ? [b.left - hr.left - pad, b.top - hr.top - pad, b.right - hr.left + pad, b.bottom - hr.top + pad] : null; };
    const head = $("globeHead"), cta = head && head.querySelector(".lp-cta"), lede = head && head.querySelector(".lp-lede");
    ui = [box(head && head.querySelector("h1")), box(lede), box(cta), box(panel.firstElementChild)].filter(Boolean);
  }
  const covered = (x, y) => ui.some(b => x > b[0] && x < b[2] && y > b[1] && y < b[3]);
  // where the planet sits: to the right of the words on a wide screen, in the gap between the words and the card on a narrow one
  function layout() {
    if (W >= 780) { cx = W * 0.69; cy = H * 0.5; RB = Math.min(H * 0.41, W * 0.29); }
    else { const hr = hero.getBoundingClientRect(), g = gap.getBoundingClientRect(), h = Math.max(200, g.height); cx = W / 2; cy = g.top - hr.top + g.height / 2; RB = Math.min(W * 0.45, h * 0.46); }
  }

  /* ---- projection: the point (lat, lng) as seen from above (view.lat, view.lng) ---- */
  let cl0 = 1, sl0 = 0, cp0 = 1, sp0 = 0;
  const P = { x: 0, y: 0, z: 0 };
  function setView() { const l = view.lng * GLOBE_D, p = view.lat * GLOBE_D; cl0 = Math.cos(l); sl0 = Math.sin(l); cp0 = Math.cos(p); sp0 = Math.sin(p); }
  function proj(v) {
    const x1 = v[0] * cl0 - v[2] * sl0, z1 = v[0] * sl0 + v[2] * cl0;
    P.x = cx + R * x1; P.y = cy - R * (v[1] * cp0 - z1 * sp0); P.z = v[1] * sp0 + z1 * cp0;
    return P;
  }

  /* ---- movement ---- */
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function flyTo(lat, lng, z, ms) {
    z = clamp(z, ZMIN, ZMAX);
    const dl = (((lng - view.lng) % 360) + 540) % 360 - 180, far = globeKm(view.lat, view.lng, lat, lng) / 111;
    vel.x = vel.y = 0; auto = false;
    if (reduceMotion()) { view.lat = lat; view.lng += dl; view.z = z; tween = null; kick(); return; }
    tween = { t0: performance.now(), dur: ms || Math.min(2600, 900 + far * 18), from: { ...view }, to: { lat, lng: view.lng + dl, z }, bump: ms ? 0 : Math.log(1 + Math.min(1.2, far / 70)) };
    kick();
  }
  const touch = () => { idleAt = performance.now(); };
  function step(now, dt) {
    if (tween) {
      const p = clamp((now - tween.t0) / tween.dur, 0, 1), e = ease(p), a = tween.from, b = tween.to;
      view.lat = a.lat + (b.lat - a.lat) * e; view.lng = a.lng + (b.lng - a.lng) * e;
      view.z = clamp(Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e - tween.bump * Math.sin(Math.PI * p)), ZMIN, ZMAX);
      if (p >= 1) { const done = tween.onEnd; tween = null; touch(); if (done) done(); }
    } else {
      if (Math.abs(vel.x) + Math.abs(vel.y) > 1e-5) { view.lng -= vel.x * dt; view.lat = clamp(view.lat + vel.y * dt, -85, 85); const k = Math.exp(-dt / 320); vel.x *= k; vel.y *= k; }
      else if (auto && !drag && now - idleAt > 3500) view.lng -= 0.004 * dt;
      view.lng = ((view.lng + 540) % 360 + 360) % 360 - 180;
    }
  }
  const moving = () => !!tween || !!drag || Math.abs(vel.x) + Math.abs(vel.y) > 1e-5;
  const active = () => inView && !document.hidden && currentView === "home" && W > 0 && !streetIdle;
  function kick() { if (!raf && active()) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0;
    if (!active()) return;
    step(now, Math.min(64, now - last)); last = now;
    draw(now);
    if (moving() || !reduceMotion()) raf = requestAnimationFrame(frame); // the pins and the "you" marker pulse
  }

  /* ---- drawing ---- */
  function draw(now) {
    if (now - colAt > 1000) { readColors(); colAt = now; }
    if (now - uiAt > 400) { measureUI(); uiAt = now; }
    R = RB * view.z; setView();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (real !== earth.ok) { real = earth.ok; hero.classList.toggle("gl-real", real); const hint = $("globeHint"); if (hint) hint.textContent = `Drag to spin · Scroll or pinch to zoom · ${real ? "Orange dots" : "Green dots"} are example jobs${MAPS_ON ? ": click one to see the map" : ""}`; }
    PC = real ? { pin: "#FFAB1F", ring: "#FFFFFF", text: "#FFFFFF", me: "#38BDF8", halo: "rgba(4, 10, 24, 0.82)" } : { pin: C.good, ring: C.surface, text: C.ink, me: C.accent, halo: alpha(C.surface, 0.92) };
    if (flash) flash.style.opacity = real ? 0 : brk;   // without WebGL the dive fades to white instead
    if (real) { earth.draw({ W, H, cx, cy, R, lat: view.lat, lng: view.lng, t: reduceMotion() ? 0 : now, z: view.z, brk }); if (brk < 0.02) drawPins(now); return; }
    // glow around the planet
    let g = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.22);
    g.addColorStop(0, alpha(C.accent, C.dark ? 0.32 : 0.26)); g.addColorStop(1, alpha(C.accent, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2); ctx.fill();
    // the sea, lit from the top left
    g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.08, cx, cy, R * 1.05);
    g.addColorStop(0, C.dark ? C.soft : C.surface); g.addColorStop(1, C.dark ? C.surface : C.soft);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    // lines of latitude and longitude
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = alpha(C.accent, 0.16); ctx.lineWidth = 1; ctx.beginPath();
    const seg = (la, ln) => { const p = proj(globeXYZ(la, ln)); if (p.z > 0) { if (seg.on) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); seg.on = true; } else seg.on = false; };
    for (let la = -60; la <= 60; la += 30) { seg.on = false; for (let ln = -180; ln <= 180; ln += 6) seg(la, ln); }
    for (let ln = -180; ln < 180; ln += 30) { seg.on = false; for (let la = -84; la <= 84; la += 6) seg(la, ln); }
    ctx.stroke();
    // land
    let tier = globeTier(2);
    for (const s of [0.5, 1]) if (s * GLOBE_D * R >= 3.6) { tier = globeTier(s); break; }
    const sp = tier.step * GLOBE_D * R, size = Math.max(1.3, sp * 0.62), round = size >= 5, xyz = tier.xyz, paths = [new Path2D(), new Path2D(), new Path2D()];
    for (let i = 0, n = tier.n; i < n; i++) {
      const X = xyz[i * 3], Y = xyz[i * 3 + 1], Z = xyz[i * 3 + 2], z1 = X * sl0 + Z * cl0, z2 = Y * sp0 + z1 * cp0;
      if (z2 <= 0.02) continue;
      const x = cx + R * (X * cl0 - Z * sl0), y = cy - R * (Y * cp0 - z1 * sp0);
      if (x < -size || x > W + size || y < -size || y > H + size) continue;
      const p = paths[z2 > 0.5 ? 0 : z2 > 0.2 ? 1 : 2];
      if (round) { p.moveTo(x + size / 2, y); p.arc(x, y, size / 2, 0, Math.PI * 2); } else p.rect(x - size / 2, y - size / 2, size, size);
    }
    ctx.fillStyle = C.accent;
    ctx.globalAlpha = 0.9; ctx.fill(paths[0]); ctx.globalAlpha = 0.6; ctx.fill(paths[1]); ctx.globalAlpha = 0.3; ctx.fill(paths[2]); ctx.globalAlpha = 1;
    ctx.restore();
    ctx.strokeStyle = alpha(C.accent, 0.5); ctx.lineWidth = 1.25; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    drawPins(now);
  }
  function drawPins(now) {
    pins = [];
    const near = st.me ? st.me.hub : null, boxes = [];
    ctx.font = `600 12px ${C.font}`; ctx.textBaseline = "middle";
    const label = (text, x, y, r, strong, left) => {
      const w = ctx.measureText(text).width, bx = left ? x - r - 4 - w : x + r + 4, box = [bx - 2, y - 8, bx + w + 2, y + 8];
      if (!strong && boxes.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) return;
      boxes.push(box);
      ctx.lineWidth = 3; ctx.strokeStyle = PC.halo; ctx.strokeText(text, bx, y); ctx.fillStyle = PC.text; ctx.fillText(text, bx, y);
    };
    const hubs = hubsBySize, t = reduceMotion() ? 0 : now;
    // the individual example jobs spread around each city, once you're close enough to tell them apart
    if (view.z >= 2.6) for (const h of hubs) {
      if (proj(h.v).z < 0.1 || P.x < -80 || P.x > W + 80 || P.y < -80 || P.y > H + 80) continue;
      for (const j of globeJobs(h)) {
        const p = proj(j.v); if (p.z <= 0.05 || covered(p.x, p.y)) continue;
        const on = hover && hover.job === j;
        ctx.globalAlpha = clamp(p.z * 3, 0, 1); ctx.fillStyle = PC.pin; ctx.strokeStyle = PC.ring; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, on ? 5 : 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
        pins.push({ x: p.x, y: p.y, r: 5, job: j, hub: h });
      }
    }
    for (const h of hubs) {
      const p = proj(h.v); if (p.z <= 0.04) continue;
      if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40 || (st.hub !== h && covered(p.x, p.y))) continue;
      const a = clamp(p.z * 3, 0, 1), r = (3 + Math.min(4.5, Math.sqrt(h.jobs) / 9)) * (0.9 + 0.12 * Math.min(view.z, 5));
      const sel = st.hub === h, on = hover && hover.hub === h && !hover.job, x = p.x, y = p.y;
      ctx.globalAlpha = a;
      if (!reduceMotion()) { const ph = ((t / 2200) + h.id * 0.37) % 1; ctx.strokeStyle = PC.pin; ctx.lineWidth = 1.5; ctx.globalAlpha = a * (1 - ph) * 0.55; ctx.beginPath(); ctx.arc(x, y, r + ph * 11, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = a; }
      ctx.fillStyle = PC.pin; ctx.strokeStyle = PC.ring; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, on || sel ? r + 2 : r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (sel || h === near) { ctx.strokeStyle = PC.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke(); }
      if (p.z > 0.25 && (sel || on || h === near || (view.z >= 1.7 && h.jobs >= 1000) || view.z >= 3.2)) label(h.name, x, y, r, sel || on || h === near);
      ctx.globalAlpha = 1;
      pins.push({ x, y, r, hub: h });
    }
    // you
    if (st.me) {
      const p = proj(globeXYZ(st.me.lat, st.me.lng));
      if (p.z > 0.04 && !covered(p.x, p.y)) {
        const ph = reduceMotion() ? 0.4 : (now / 1600) % 1;
        ctx.strokeStyle = PC.me; ctx.lineWidth = 2; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(p.x, p.y, 6 + ph * 18, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = PC.ring; ctx.strokeStyle = PC.me; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        label("You", p.x, p.y, 6, true, true);
      }
    }
  }

  /* ---- pointer: drag to spin, pinch or Ctrl+scroll to zoom, tap a pin ---- */
  const ptrs = new Map();
  let drag = null, pinch = null;
  const at = e => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  function pick(x, y, slack) {
    let best = null, bd = 1e9;
    for (const p of pins) { const d = Math.hypot(p.x - x, p.y - y); if (d <= p.r + slack && d - (p.job ? 0 : 3) < bd) { bd = d - (p.job ? 0 : 3); best = p; } }
    return best;
  }
  function showTip(p, xy) {
    hover = p;
    cv.style.cursor = p ? "pointer" : drag ? "grabbing" : "grab";
    if (!p) { tip.hidden = true; kick(); return; }
    tip.innerHTML = p.job ? `<b>${esc(p.job.title)}</b><span>${esc(p.job.org)} · ${esc(p.job.kind)} · ${esc(p.hub.name)}</span><em>Example job${MAPS_ON ? ": click for the map" : ""}</em>` : `<b>${esc(p.hub.name)}, ${esc(p.hub.country)}</b><span>${globeNum(p.hub.jobs)} example jobs</span><em>${MAPS_ON ? "Click for the map" : "Click to see them"}</em>`;
    tip.hidden = false;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.transform = `translate(${clamp(xy.x + 14, 4, W - tw - 4)}px, ${clamp(xy.y + 14, 4, H - th - 4)}px)`;
    kick();
  }
  cv.addEventListener("pointerdown", e => {
    if (busy) return;
    cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, at(e)); touch(); tween = null; vel.x = vel.y = 0;
    if (ptrs.size === 1) drag = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, lt: e.timeStamp, moved: false };
    else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: view.z }; if (drag) drag.moved = true; }
    tip.hidden = true; kick();
  });
  cv.addEventListener("pointermove", e => {
    const xy = at(e);
    if (!ptrs.has(e.pointerId)) { if (e.pointerType === "mouse") showTip(pick(xy.x, xy.y, 6), xy); return; }
    ptrs.set(e.pointerId, xy); touch();
    if (pinch && ptrs.size >= 2) { const [a, b] = [...ptrs.values()]; const raw = pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d; if (MAPS_ON && raw > ZMAX * 1.3) { pinch = null; drag = null; dive(); return; } view.z = clamp(raw, ZMIN, ZMAX); kick(); return; }
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) { drag.moved = true; cv.style.cursor = "grabbing"; }
    if (!drag.moved) return;
    const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly, dt = Math.max(1, e.timeStamp - drag.lt), k = 1 / R / GLOBE_D;
    view.lng -= dx * k; view.lat = clamp(view.lat + dy * k, -85, 85);
    vel.x = vel.x * 0.5 + (dx * k / dt) * 0.5; vel.y = vel.y * 0.5 + (dy * k / dt) * 0.5;
    drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = e.timeStamp; kick();
  });
  const release = e => {
    if (!ptrs.has(e.pointerId)) return;
    const xy = at(e); ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0 && drag) {
      const d = drag; drag = null;
      if (e.type === "pointerup" && !d.moved) { const p = pick(xy.x, xy.y, e.pointerType === "mouse" ? 6 : 14); if (p) pinGo(p); }
      else if (e.timeStamp - d.lt > 90) vel.x = vel.y = 0;
      cv.style.cursor = "grab"; touch(); kick();
    }
  };
  cv.addEventListener("pointerup", release); cv.addEventListener("pointercancel", release);
  cv.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && !drag) showTip(null); });
  // the globe is the whole page, so the scroll wheel (and a trackpad pinch) zooms it. Scrolling in again once fully zoomed breaks through to the map.
  let push = 0, pushT = 0;
  cv.addEventListener("wheel", e => {
    e.preventDefault(); if (busy) return;
    const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    if (MAPS_ON && dy < 0 && view.z >= ZMAX * 0.97) { push += -dy; clearTimeout(pushT); pushT = setTimeout(() => { push = 0; }, 700); if (push > 220) { push = 0; dive(); } return; }
    push = 0; tween = null; touch(); view.z = clamp(view.z * Math.exp(-dy * 0.0025), ZMIN, ZMAX); kick();
  }, { passive: false });
  cv.addEventListener("keydown", e => {
    if (busy) return;
    const k = e.key, s = 12 / view.z; let used = true;
    if (k === "ArrowLeft") view.lng -= s; else if (k === "ArrowRight") view.lng += s;
    else if (k === "ArrowUp") view.lat = clamp(view.lat + s, -85, 85); else if (k === "ArrowDown") view.lat = clamp(view.lat - s, -85, 85);
    else if (k === "+" || k === "=") zoomBy(1.5); else if (k === "-" || k === "_") zoomBy(1 / 1.5); else if (k === "Home") resetView(); else used = false;
    if (used) { e.preventDefault(); tween = null; touch(); kick(); }
  });
  function zoomBy(f) { if (busy) return; if (MAPS_ON && f > 1 && view.z >= ZMAX * 0.97) { dive(); return; } touch(); flyTo(view.lat, view.lng, view.z * f, 380); }

  /* ---- down to street level ---- */
  const wait = ms => new Promise(r => setTimeout(r, reduceMotion() ? 0 : ms));
  const run = (ms, fn) => new Promise(res => {   // calls fn(0..1) every frame for ms
    if (reduceMotion()) { fn(1); kick(); return res(); }
    const t0 = performance.now();
    (function tick(now) { const p = clamp((now - t0) / ms, 0, 1); fn(p); kick(); if (p < 1) requestAnimationFrame(tick); else res(); })(t0);
  });
  const flyP = (lat, lng, z) => new Promise(res => { flyTo(lat, lng, z); if (tween) tween.onEnd = res; else res(); });
  // back up through the clouds to the globe, above where you were
  async function surface(why) {
    hero.classList.remove("gl-street"); streetIdle = false; streetOn = false; mapFlag(); if (street) street.hide(); sideOn(false); kick();
    await wait(700);
    const z0 = view.z, z1 = 3.4;
    await run(1500, p => { const e = 1 - (1 - p) * (1 - p); view.z = z0 * Math.pow(z1 / z0, e); brk = 1 - p; });
    brk = 0; view.z = z1; busy = false; auto = false; hero.classList.remove("gl-diving"); touch(); kick();
    if (why) { toast(why, "warn"); say(why); }
  }
  // The example jobs for the map: the curated ones on the Melbourne CBD's real corners, otherwise made up around the spot (and for what you typed
  // in Job or industry), close enough together that some are in view when zoomed in. They are not at real addresses.
  function mapJobsFor(spot, hub) {
    const what = globeWhat(readWhat()), cbd = globeKm(spot.lat, spot.lng, GLOBE_CBD.lat, GLOBE_CBD.lng) < 1.5;
    if (cbd && !what) return { cbd: true, jobs: GLOBE_CBD_JOBS };
    const mine = st.me && globeKm(st.me.lat, st.me.lng, spot.lat, spot.lng) < 30;
    const place = mine && st.me.name ? st.me.name : hub ? hub.name : "here";
    return { cbd: false, jobs: globeLocalJobs(spot, place, hub, what) };
  }
  const mapOpts = mj => ({ cbd: mj.cbd, zoom: mj.cbd ? GLOBE_CBD.zoom : 15 });
  // The list beside the map (like a property search): the jobs in view, which follow the map as it moves, and the pins and the list point at each other.
  // In map view the search boxes move to the top of the list, so the search can be changed without going back to the globe.
  function sideOn(on) {
    const head = $("globeHead"), top = $("globeSideTop"), over = hero.querySelector(".gl-over");
    if (!head || !top || !over) return;
    if (on && head.parentElement !== top) top.appendChild(head);
    else if (!on && head.parentElement !== over) over.insertBefore(head, over.firstChild);
  }
  // the logo in the header: leave the map and show the globe again (animated if the map is on screen, at once if another page is)
  globeToGlobe = () => {
    if (!street || !streetOn || busy) return;
    if (currentView === "home") { busy = true; surface(); return; }
    hero.classList.remove("gl-street", "gl-diving"); streetIdle = false; streetOn = false; mapFlag(); street.hide(); sideOn(false);
    brk = 0; view.z = 3.4; auto = false; touch(); kick();
  };
  const mapFlag = () => document.body.classList.toggle("gl-map-open", streetOn && W >= 748);
  const listBox = $("globeList");
  function renderList() {
    if (!listBox || !street || !streetOn) return;
    const jobs = street.inView(), total = street.jobs().length;
    $("glListTitle").textContent = st.me ? "Jobs near you" : "Jobs in this area";
    $("glCount").textContent = `${jobs.length} example job${jobs.length === 1 ? "" : "s"} in this map area${total > jobs.length ? ` of ${total} nearby` : ""}`;
    listBox._jobs = jobs;
    listBox.innerHTML = jobs.length ? jobs.map((j, i) => `<li class="gl-job" data-i="${i}"><button type="button" class="gl-job-b" data-gl-job="${i}">
      <b class="gl-job-title">${esc(j.title)}</b><span class="gl-job-pay">${esc(j.pay || j.kind)}</span>
      <span class="gl-job-org">${esc(j.org)} · ${esc(j.at)}</span>
      <span class="gl-job-tags"><i>${esc(j.kind)}</i><i class="ex">Example job</i>${j.keen ? `<i class="keen">Keen for applicants</i>` : ""}</span>
      <span class="gl-job-about">${esc(j.about)}</span></button></li>`).join("")
      : `<li class="gl-empty"><b>No example jobs in this part of the map</b><span>Zoom out or drag the map to see more.</span><button type="button" class="btn" data-gl-act="recentre">Back to the middle</button></li>`;
  }
  let viewT = 0, scrollT = 0;
  const SCROLL_WAIT = 200;   // ms to rest on a pin before the list scrolls to its job (so sweeping the mouse across pins does not make the list jump about)
  // scroll the list so this card sits at the top, just under the search boxes that stay in place above it
  function listToTop(li) {
    const side = $("globeSide"), top = $("globeSideTop"); if (!side || !li) return;
    const y = side.scrollTop + li.getBoundingClientRect().top - side.getBoundingClientRect().top - (top ? top.offsetHeight : 0) - 8;
    side.scrollTo({ top: Math.max(0, y), behavior: reduceMotion() ? "auto" : "smooth" });
  }
  const hotItem = (j, scroll) => {
    clearTimeout(scrollT);
    if (!listBox || !listBox._jobs) return;
    let target = null;
    listBox.querySelectorAll(".gl-job").forEach(li => { const on = !!j && listBox._jobs[+li.dataset.i] === j; li.classList.toggle("hot", on); if (on) target = li; });
    if (target && scroll) scrollT = setTimeout(() => { if (target.isConnected) listToTop(target); }, SCROLL_WAIT);
  };
  if (listBox) {
    listBox.addEventListener("click", e => {
      const b = e.target.closest("[data-gl-job]"), r = e.target.closest("[data-gl-act=recentre]");
      if (r && street) street.recentre();
      else if (b && street) street.focus(listBox._jobs[+b.dataset.glJob]);
    });
    listBox.addEventListener("mouseover", e => { const li = e.target.closest(".gl-job"); if (li && street) street.hot(listBox._jobs[+li.dataset.i]); });
    listBox.addEventListener("mouseleave", () => { if (street) street.hot(null); });
    listBox.addEventListener("focusin", e => { const li = e.target.closest(".gl-job"); if (li && street) street.hot(listBox._jobs[+li.dataset.i]); });
    listBox.addEventListener("focusout", () => { if (street) street.hot(null); });
  }
  if (street) {
    street.onView = () => { clearTimeout(viewT); viewT = setTimeout(renderList, 120); };
    street.onHot = j => hotItem(j, true);
    street.onPick = j => hotItem(j, true);
  }
  // already looking at the map and someone picked another place: move the map there
  async function restreet(spot, hub) {
    busy = true;
    try {
      const mj = mapJobsFor(spot, hub);
      await street.prepare(spot, mj.jobs, mapOpts(mj));
      street.setMe(st.me); renderList();
    } catch { /* the map stays where it was */ } finally { busy = false; }
  }
  async function dive(at, hub, pick) {
    if (!MAPS_ON || busy) return;
    busy = true; auto = false; tween = null; vel.x = vel.y = 0; showTip(null); hero.classList.add("gl-diving");
    const spot = at || { lat: view.lat, lng: view.lng };
    if (!hub) { const n = globeNear(spot.lat, spot.lng)[0]; if (n.km < 150) hub = n.h; }
    say("Going down to the map.");
    const mj = mapJobsFor(spot, hub);
    if (pick && !mj.jobs.includes(pick)) mj.jobs = mj.jobs.concat([pick]);   // the job that was clicked is always on the map
    const prep = street.prepare(spot, mj.jobs, mapOpts(mj)).then(r => ({ r }), e => ({ e }));   // starts loading Google Maps straight away
    if (at) await flyP(at.lat, at.lng, ZMAX);
    const z0 = view.z;
    await run(1700, p => { view.z = z0 * Math.pow(7, p * p); brk = clamp(p * 1.15, 0, 1); });
    const got = await Promise.race([prep, wait(9000).then(() => ({ e: new Error("slow") }))]);
    if (!street.bad) await wait(got.e ? 800 : 400);   // Google reports a rejected key a moment after it starts
    if (got.e || street.bad) { await surface(street.bad ? "Google turned the Maps key down. Check it in Google Cloud (billing, Maps JavaScript API, allowed website addresses)." : got.e.message === "blocked" ? "Couldn't reach Google Maps from here, so the map isn't available." : "The map isn't available right now."); return; }
    hero.classList.add("gl-street"); streetOn = true; mapFlag();
    sideOn(true);
    street.show(got.r);
    street.setMe(st.me && globeKm(st.me.lat, st.me.lng, got.r.spot.lat, got.r.spot.lng) < 30 ? st.me : null);
    street.resize(); renderList();
    if (pick) street.focus(pick);   // pan to it and open its summary
    say("Map open. Drag to move around. Use Back to the globe to leave it.");
    await wait(1000); streetIdle = true; busy = false; hero.classList.remove("gl-diving");   // the globe stops drawing once the map has faded in
  }
  if (street) {
    street.onBad = () => { if (streetOn && !busy) { busy = true; surface("Google turned the Maps key down."); } };
  }
  if (backBtn) backBtn.addEventListener("click", () => { if (streetOn && !busy) { busy = true; surface(); } });
  const cbdBtn = $("globeCbd"); if (cbdBtn) cbdBtn.addEventListener("click", () => { if (streetOn && !busy && street) street.toCbd(); });
  function resetView() { const m = st.me; if (m) flyTo(m.lat, m.lng, START.z); else { flyTo(START.lat, START.lng, START.z); auto = !reduceMotion(); } }
  hero.addEventListener("click", e => {
    const b = e.target.closest("[data-gl]"); if (!b) return;
    ({ in: () => zoomBy(1.5), out: () => zoomBy(1 / 1.5), reset: resetView, locate: () => locate(false, true), noexp: () => { if (whatBox) whatBox.value = GLOBE_NO_EXP; findNear(); } })[b.dataset.gl]();
  });

  /* ---- what you're after, and where you are ---- */
  const say = m => { if (live) live.textContent = m; };
  const whatBox = $("gfWhat"), whereBox = $("gfWhere"), msgEl = $("gfMsg"), resEl = $("globeResults"), findForm = $("globeFind");
  const setMsg = (t, kind) => { if (msgEl) { msgEl.textContent = t || ""; msgEl.className = "gl-msg small" + (kind ? " " + kind : ""); } };
  const readWhat = () => (whatBox ? whatBox.value.trim() : "");
  // a dot was clicked on the globe: down into Google's map there (or, with no map, the card for that city)
  function pinGo(p) {
    if (!MAPS_ON) { choose(p.hub); return; }
    st.mode = "hub"; st.hub = p.hub; st.err = ""; render();
    dive(p.job ? { lat: p.job.lat, lng: p.job.lng } : { lat: p.hub.lat, lng: p.hub.lng }, p.hub);
  }
  function choose(h) { st.mode = "hub"; st.hub = h; st.err = ""; flyTo(h.lat, h.lng, Math.max(view.z, 3)); render(); say(`${h.name}: ${globeNum(h.jobs)} example jobs.`); }
  // a name for a spot: the nearest Australian suburb if it's close, otherwise the nearest city on the globe
  function nameFor(lat, lng) {
    let best = null, bd = 0.12;
    for (const x of allPlaces()) { if (x.kind !== "au" || !x.lat) continue; const d = (x.lat - lat) ** 2 + ((x.lng - lng) * Math.cos(lat * GLOBE_D)) ** 2; if (d < bd * bd) { bd = Math.sqrt(d); best = x; } }
    if (best) return `${best.n}, ${best.s}`;
    const n = globeNear(lat, lng)[0];
    return n.km < 150 ? `${n.h.name}, ${n.h.country}` : "";
  }
  function arrive(lat, lng, name, go) {
    lat = Math.round(lat * 100) / 100; lng = Math.round(lng * 100) / 100; // about 1 km: approximate on purpose, but close enough to land on the right suburb
    st.me = { lat, lng, name: name || nameFor(lat, lng), hub: globeNear(lat, lng)[0].h }; st.hub = null; st.mode = "near"; st.err = "";
    if (whereBox && st.me.name) whereBox.value = st.me.name;
    if (resEl) resEl.innerHTML = "";
    setMsg("");
    render();
    // with the map open it moves to the place; the buttons (Jobs near me, Use my location) go down through the clouds to the map; picking from the list or an automatic location only turns the globe
    if (MAPS_ON && streetOn && !busy) restreet({ lat, lng }, st.me.hub);
    else if (go && MAPS_ON && !busy && !streetOn) dive({ lat, lng }, st.me.hub);
    else flyTo(lat, lng, 3.4);
    say(`Showing example jobs near ${st.me.name || "you"}.`);
  }
  function locate(quiet, go) {
    if (!navigator.geolocation) { st.mode = "ask"; setMsg("This browser can't share a location. Type a place instead.", "err"); render(); if (whereBox) whereBox.focus({ preventScroll: true }); return; }
    st.mode = "asking"; st.err = ""; setMsg(""); render();
    let answered = false, waitT = 0;
    if (!quiet) waitT = setTimeout(() => {   // only if the browser has not answered straight away, and location is not already allowed
      if (answered) return;
      const show = () => { if (!answered) setMsg("Waiting for your browser to ask you…"); };
      try { navigator.permissions.query({ name: "geolocation" }).then(r => { if (r.state !== "granted") show(); }, show); } catch { show(); }
    }, 500);
    try {
      navigator.geolocation.getCurrentPosition(
        pos => { answered = true; clearTimeout(waitT); arrive(pos.coords.latitude, pos.coords.longitude, undefined, go); },
        err => {
          answered = true; clearTimeout(waitT);
          st.mode = st.me ? "near" : "ask";
          setMsg(quiet ? "" : err && err.code === 1 ? "Your browser has location turned off for this page. Type a place instead." : "Couldn't find your location. Type a place instead.", quiet ? "" : "err");
          render(); if (!quiet && whereBox) whereBox.focus({ preventScroll: true });
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
      );
    } catch { st.mode = "ask"; setMsg("Location isn't available here. Type a place instead.", "err"); render(); }
  }
  function searchPlaces(q) {
    const k = placeKey(q); if (!k) return [];
    const out = GLOBE_HUBS.filter(h => placeKey(h.name).startsWith(k) || placeKey(`${h.name} ${h.country}`).includes(k)).slice(0, 3).map(h => ({ label: `${h.name}, ${h.country}`, lat: h.lat, lng: h.lng }));
    for (const x of findPlaces(q, 8)) if (x.kind === "au" && x.lat && out.length < 6) out.push({ label: `${x.n}, ${x.s} ${x.pc}`, name: `${x.n}, ${x.s}`, lat: x.lat, lng: x.lng });
    return out;
  }
  // "Jobs near me": go to the place in the box, or to where you are, and show example jobs for what's in the other box
  function findNear() {
    const q = whereBox ? whereBox.value.trim() : "";
    if (q && !(st.me && st.me.name === q)) {
      const rs = searchPlaces(q);
      if (!rs.length) { setMsg("We couldn't find that place. Try a suburb, a postcode or a city.", "err"); if (whereBox) whereBox.focus({ preventScroll: true }); return; }
      arrive(rs[0].lat, rs[0].lng, rs[0].name || rs[0].label.replace(/ \d{4}$/, ""), true);
    } else if (st.me) arrive(st.me.lat, st.me.lng, st.me.name, true);
    else locate(false, true);
  }
  let whereAt = -1;
  function showPlaces() {
    if (!resEl || !whereBox) return;
    const rs = whereBox.value.trim().length >= 2 ? searchPlaces(whereBox.value) : [];
    resEl._rs = rs; whereAt = -1;
    resEl.innerHTML = rs.map((r, i) => `<li role="option"><button type="button" data-gl-pick="${i}" tabindex="-1">${esc(r.label)}</button></li>`).join("");
    whereBox.setAttribute("aria-expanded", String(rs.length > 0));
  }
  // "Job or industry": a dropdown that fills in as you type, the same as Location. Arrow keys move, Enter picks, Tab takes the first one.
  const whatRes = $("gfWhatResults");
  const whatMatches = q => {
    const k = q.trim().toLowerCase(); if (!k) return [];
    const starts = [], inside = [];
    for (const o of GLOBE_WHAT_OPTIONS) { const l = o.toLowerCase(); if (l === k) continue; if (l.startsWith(k) || l.split(/[ >]+/).some(w => w.startsWith(k))) starts.push(o); else if (l.includes(k)) inside.push(o); }
    return [...starts, ...inside].slice(0, 7);
  };
  let whatAt = -1;
  function showWhat() {
    if (!whatRes || !whatBox) return;
    const rs = whatBox.value.trim().length >= 1 && document.activeElement === whatBox ? whatMatches(whatBox.value) : [];
    whatRes._rs = rs; whatAt = -1;
    whatRes.innerHTML = rs.map((r, i) => `<li role="option"><button type="button" data-gl-what="${i}" tabindex="-1">${esc(r)}</button></li>`).join("");
    whatBox.setAttribute("aria-expanded", String(rs.length > 0));
  }
  // The placeholder in the box cycles through a few prompts, so people see the kinds of thing they can type. It rests while there is text in the box or the box is being used.
  if (whatBox) {
    const prompts = ["No experience", "Retail", "Hospo", "Barista", "Warehouse", "Nurse", "Trades", "Software", "Teacher"];
    let pi = 0;
    setInterval(() => {
      if (document.hidden || whatBox.value || document.activeElement === whatBox) return;
      whatBox.classList.add("ph-out");   // fades out (31-v28.css), the words change while it is clear, then it fades back in
      setTimeout(() => { pi = (pi + 1) % prompts.length; whatBox.setAttribute("placeholder", prompts[pi]); whatBox.classList.remove("ph-out"); }, reduceMotion() ? 0 : 450);
    }, 3200);
  }
  const pickWhat = r => { if (!r) return; whatBox.value = r; if (whatRes) whatRes.innerHTML = ""; whatBox.setAttribute("aria-expanded", "false"); if (whereBox && !whereBox.value.trim()) whereBox.focus({ preventScroll: true }); };
  if (whatBox && whatRes) {
    whatBox.addEventListener("input", e => {
      showWhat();
      // fill in the rest of the first suggestion, selected, so typing on replaces it (not when deleting)
      const first = whatRes._rs && whatRes._rs[0];
      if (first && e.inputType && !/^delete/.test(e.inputType) && first.toLowerCase().startsWith(whatBox.value.toLowerCase()) && first.length > whatBox.value.length && whatBox.selectionStart === whatBox.value.length) {
        const typed = whatBox.value.length; whatBox.value = whatBox.value + first.slice(typed); whatBox.setSelectionRange(typed, whatBox.value.length);
      }
    });
    whatBox.addEventListener("focus", showWhat);
    whatBox.addEventListener("keydown", e => {
      const items = [...whatRes.querySelectorAll("button")];
      if (e.key === "Escape") { whatRes.innerHTML = ""; return; }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) { e.preventDefault(); whatAt = (whatAt + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach((b, i) => b.classList.toggle("on", i === whatAt)); return; }
      if (e.key === "Enter" && whatAt >= 0 && whatRes._rs) { e.preventDefault(); pickWhat(whatRes._rs[whatAt]); return; }
      if (e.key === "Tab" && whatBox.selectionStart !== whatBox.selectionEnd) { whatBox.setSelectionRange(whatBox.value.length, whatBox.value.length); whatRes.innerHTML = ""; }
    });
    whatRes.addEventListener("mousedown", e => e.preventDefault());
    whatRes.addEventListener("click", e => { const b = e.target.closest("[data-gl-what]"); if (b) pickWhat(whatRes._rs[+b.dataset.glWhat]); });
  }
  if (findForm) findForm.addEventListener("submit", e => { e.preventDefault(); findNear(); });
  if (whereBox) {
    whereBox.addEventListener("input", showPlaces);
    whereBox.addEventListener("keydown", e => {
      const items = resEl ? [...resEl.querySelectorAll("button")] : [];
      if (e.key === "Escape") { if (resEl) resEl.innerHTML = ""; whereBox.setAttribute("aria-expanded", "false"); return; }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) { e.preventDefault(); whereAt = (whereAt + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach((b, i) => { b.classList.toggle("on", i === whereAt); if (i === whereAt) b.scrollIntoView({ block: "nearest" }); }); return; }
      if (e.key === "Enter" && whereAt >= 0 && resEl._rs && resEl._rs[whereAt]) { e.preventDefault(); const r = resEl._rs[whereAt]; arrive(r.lat, r.lng, r.name || r.label.replace(/ \d{4}$/, "")); }
    });
  }
  document.addEventListener("click", e => {
    if (resEl && resEl.innerHTML && !e.target.closest("#gfWhere, #globeResults")) { resEl.innerHTML = ""; if (whereBox) whereBox.setAttribute("aria-expanded", "false"); }
    if (whatRes && whatRes.innerHTML && !e.target.closest("#gfWhat, #gfWhatResults")) { whatRes.innerHTML = ""; whatBox.setAttribute("aria-expanded", "false"); }
  });
  if (resEl) resEl.addEventListener("click", e => { const pk = e.target.closest("[data-gl-pick]"); const r = pk && resEl._rs && resEl._rs[+pk.dataset.glPick]; if (r) arrive(r.lat, r.lng, r.name || r.label.replace(/ \d{4}$/, "")); });

  /* ---- the card under the form ---- */
  function render() {
    const m = st.me, h = st.mode === "hub" ? st.hub : st.mode === "near" && m ? m.hub : null;
    if (!h) { panel.innerHTML = ""; return; }
    const what = st.mode === "near" ? globeWhat(readWhat()) : null, place = st.mode === "near" ? (m.name || "Your area") : `${h.name}, ${h.country}`;
    const jobs = what ? globeSearchJobs(what, place, 12) : globeJobs(h).slice(0, 12), km = m && st.mode === "near" ? globeKm(m.lat, m.lng, h.lat, h.lng) : 0;
    const others = (m ? globeNear(m.lat, m.lng) : globeNear(h.lat, h.lng).slice(1)).filter(x => x.h !== h).slice(0, 3);
    const kicker = what ? what.label : st.mode === "near" ? "" : "Example jobs";
    // give each job a place and pay so it can be pinned on the map (the ones made for the card have no position of their own)
    const base = st.mode === "near" && m ? m : h;
    panel._jobs = jobs.map((j, i) => {
      if (j.lat != null && j.pay) return j;
      const rnd = globeRng([...(j.title + "|" + place + "|" + i)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 3)), pays = GLOBE_PAYS[j.kind] || GLOBE_PAYS["Full-time"];
      const r = 0.012 * Math.sqrt(rnd()), a = rnd() * Math.PI * 2;
      return Object.assign(j, {
        pay: j.pay || pays[Math.floor(rnd() * pays.length)], at: j.at || "Right by " + (st.mode === "near" && m ? place : h.name),
        lat: j.lat != null ? j.lat : base.lat + r * Math.sin(a), lng: j.lng != null ? j.lng : base.lng + r * Math.cos(a) / Math.max(0.2, Math.cos(base.lat * GLOBE_D)),
        about: j.about || GLOBE_BLURBS[i % GLOBE_BLURBS.length](j.kind)
      });
    });
    const jobLi = (j, i, copy) => MAPS_ON
      ? `<li><button type="button" class="gl-jobbtn" data-gl-card="${i}" title="See it on the map"${copy ? ' tabindex="-1"' : ""}><b>${esc(j.title)}</b><span>${esc(j.org)} · ${esc(j.kind)}</span></button></li>`
      : `<li><b>${esc(j.title)}</b><span>${esc(j.org)} · ${esc(j.kind)}</span></li>`;
    panel.innerHTML = `<div class="gl-card">${kicker ? `<p class="gl-k">${esc(kicker)}</p>` : ""}
      <h2>${esc(place)}</h2>
      <p class="small muted">${st.mode === "near" ? `Closest hub: <b>${esc(h.name)}</b>, ${globeDist(km)} · ` : ""}${what ? `${jobs.length} example jobs` : `${globeNum(h.jobs)} example jobs`}</p>
      <div class="gl-jobs-win" tabindex="0" role="group" aria-label="Example jobs in this area. They scroll by on their own, and stop when you point at them. Press one to see it on the map." style="--gl-n:${jobs.length}">
        <ul class="gl-jobs">${jobs.map((j, i) => jobLi(j, i, false)).join("")}</ul>
        <ul class="gl-jobs gl-jobs-copy" aria-hidden="true">${jobs.map((j, i) => jobLi(j, i, true)).join("")}</ul>
      </div>
      <p class="small muted gl-near">Also close by: ${others.map(o => `<button type="button" class="gl-chip" data-gl-hub="${o.h.id}">${esc(o.h.name)}</button>`).join(" ")}</p>
      <div class="b-actions"><a class="btn primary" href="#jobs" data-gl-act="jobs">Find jobs near here</a></div></div>`;
  }
  $("globeSide").addEventListener("click", e => {
    if (e.target.closest("[data-gl-act=jobs]")) { const w = readWhat(), where = whereBox ? whereBox.value.trim() : ""; try { jobsUI.q = w; jobsUI.where = where; const q = $("jbQ"), wh = $("jbWhere"); if (q) q.value = w; if (wh) wh.value = where; } catch { /* the Find jobs page fills itself */ } }
  });
  panel.addEventListener("click", e => {
    const a = e.target.closest("[data-gl-act]"), hb = e.target.closest("[data-gl-hub]"), jb = e.target.closest("[data-gl-card]");
    if (hb) { choose(GLOBE_HUBS[+hb.dataset.glHub]); return; }
    if (jb && MAPS_ON && panel._jobs) {   // a job in the card: down to the map, at that job
      const j = panel._jobs[+jb.dataset.glCard]; if (!j) return;
      const hub = st.mode === "hub" ? st.hub : st.me ? st.me.hub : undefined;
      dive({ lat: j.lat, lng: j.lng }, hub, j); return;
    }
    if (!a) return;
    const act = a.dataset.glAct;
    if (act === "jobs") { const w = readWhat(), where = whereBox ? whereBox.value.trim() : ""; try { jobsUI.q = w; jobsUI.where = where; const q = $("jbQ"), wh = $("jbWhere"); if (q) q.value = w; if (wh) wh.value = where; } catch { /* the Find jobs page fills itself */ } }
  });

  /* ---- start ---- */
  readColors(); render(); resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener("resize", resize);
  if (window.IntersectionObserver) new IntersectionObserver(es => { inView = es[0].isIntersecting; if (inView) kick(); }, { threshold: 0.05 }).observe(stage);
  document.addEventListener("visibilitychange", kick);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { colAt = -1e9; kick(); });
  let asked = false;
  const prevHome = viewHooks.home;
  viewHooks.home = o => {
    if (prevHome) prevHome(o);
    kick();
    if (!asked) {
      asked = true;
      // somebody who already said yes on this site is zoomed in without being asked again
      try { navigator.permissions.query({ name: "geolocation" }).then(r => { if (r.state === "granted" && st.mode === "ask") locate(true); }).catch(() => {}); } catch { /* no Permissions API */ }
    }
  };
  setTimeout(() => globeTier(1), 0);
}
onInit(initGlobe);
