/* ===================== Home globe: what you're looking for ===================== */
// The "Job or industry" box on Home takes a job title ("Barista") or an industry and what it covers ("Retail > Fashion").
// This turns whatever was typed into the made-up example jobs the globe shows (see 36f). They are examples, not live listings.
// name, the group of roles in GLOBE_ROLES it belongs to, and what it covers (each with its own roles)
const GLOBE_TREE = [
  ["Retail", "retail", { Fashion: ["Fashion Sales Assistant", "Visual Merchandiser", "Personal Stylist", "Store Manager"], Grocery: ["Supermarket Team Member", "Deli Assistant", "Stock Controller", "Department Manager"], Homewares: ["Homewares Sales Assistant", "Visual Merchandiser", "Store Manager"], Electronics: ["Electronics Sales Consultant", "Customer Service Representative", "Store Manager"], Hardware: ["Hardware Team Member", "Trade Sales Consultant", "Store Manager"], Beauty: ["Beauty Advisor", "Cosmetics Consultant", "Store Manager"] }],
  ["Hospitality", "hospitality", { Cafe: ["Barista", "Cafe Manager", "Kitchen Hand", "Waiter"], Restaurant: ["Chef de Partie", "Waiter", "Restaurant Manager", "Sous Chef"], Bar: ["Bar Attendant", "Bartender", "Venue Manager", "Duty Manager"], Hotel: ["Front Office Supervisor", "Hotel Receptionist", "Housekeeper", "Events Coordinator"] }],
  ["Health", "health", { Nursing: ["Registered Nurse", "Enrolled Nurse", "Nurse Unit Manager"], "Allied health": ["Physiotherapist", "Occupational Therapist", "Allied Health Assistant", "Radiographer"], "Aged care": ["Personal Care Worker", "Registered Nurse", "Lifestyle Coordinator"], Admin: ["Medical Receptionist", "Practice Manager", "Health Information Officer"] }],
  ["IT", "tech", { Software: ["Software Engineer", "QA Tester", "Product Designer"], Data: ["Data Analyst", "Data Engineer", "BI Developer"], Support: ["IT Support Officer", "Service Desk Analyst", "Systems Administrator"], Security: ["Cyber Security Analyst", "Security Engineer"] }],
  ["Trades", "trades", { Electrical: ["Electrician", "Electrical Apprentice"], Plumbing: ["Plumber", "Plumbing Apprentice"], Carpentry: ["Carpenter", "Carpentry Apprentice", "Site Supervisor"], Welding: ["Boilermaker", "Fitter and Turner", "Welder"] }],
  ["Finance", "finance", { Accounting: ["Graduate Accountant", "Bookkeeper", "Payroll Officer", "Internal Auditor"], Banking: ["Credit Analyst", "Bank Teller", "Financial Analyst"], Insurance: ["Claims Officer", "Risk Analyst", "Underwriting Assistant"] }],
  ["Education", "education", { Teaching: ["Primary School Teacher", "Secondary Teacher", "Teacher's Aide"], Childcare: ["Early Childhood Educator", "Centre Director", "Educator's Assistant"], University: ["Lecturer", "Learning Designer", "Student Support Officer"] }],
  ["Creative", "creative", { Design: ["Graphic Designer", "Product Designer", "Video Editor"], Marketing: ["Marketing Coordinator", "Social Media Manager", "Brand Strategist"], Writing: ["Content Writer", "Copywriter", "Editor"] }],
  ["Logistics", "logistics", { Warehouse: ["Warehouse Supervisor", "Forklift Operator", "Stock Controller"], Transport: ["Freight Coordinator", "Fleet Planner", "Truck Driver"], "Supply chain": ["Supply Chain Analyst", "Procurement Officer", "Logistics Coordinator"] }],
  ["Mining", "mining", { Operations: ["Process Operator", "Drill and Blast Operator", "Heavy Diesel Mechanic"], Geoscience: ["Geologist", "Mining Engineer", "Environmental Advisor"] }],
  ["Engineering", "engineering", { Civil: ["Graduate Civil Engineer", "Structural Drafter", "Site Engineer"], Mechanical: ["Mechanical Engineer", "Project Engineer"], Electrical: ["Electrical Engineer", "Grid Engineer"] }],
  ["Government", "gov", { Policy: ["Policy Officer", "Grants Administrator"], Planning: ["Planning Officer", "Project Officer"], "Community services": ["Case Manager", "Records Officer"] }],
  ["Energy", "energy", { Solar: ["Solar Installer", "Energy Analyst"], Wind: ["Wind Technician", "Network Planner"], Grid: ["Grid Engineer", "Network Planner"] }],
  ["Agriculture", "agri", { Farming: ["Farm Manager", "Livestock Handler", "Irrigation Technician"], Science: ["Agronomist", "Food Technologist"] }]
];
// What the "Job or industry" box suggests as you type: each industry, what it covers ("Retail > Fashion"), then every job title the globe knows
const GLOBE_NO_EXP = "No experience needed";
const GLOBE_NO_EXP_ROLES = ["Retail Team Member", "Kitchen Hand", "Warehouse Team Member", "Cleaner", "Barista (will train)", "Customer Service Assistant", "Labourer", "Delivery Driver's Assistant", "Dishwasher", "Pick and Pack Operator"];
const GLOBE_WHAT_OPTIONS = (() => {
  const out = [GLOBE_NO_EXP];
  for (const [name, , subs] of GLOBE_TREE) { out.push(name); for (const s of Object.keys(subs)) out.push(`${name} > ${s}`); }
  const seen = new Set(out.map(x => x.toLowerCase()));
  for (const roles of Object.values(GLOBE_ROLES)) for (const r of roles) if (!seen.has(r.toLowerCase())) { seen.add(r.toLowerCase()); out.push(r); }
  return out;
})();
const globeTitleCase = s => s.replace(/\b[a-z]/g, c => c.toUpperCase());
// What was typed, as { label, roles, key }: an industry and what it covers, an industry, part of a job title, or any other words as a job title of their own
function globeWhat(text) {
  const t = String(text || "").replace(/\s*[>›»\/]\s*/g, " > ").replace(/\s+/g, " ").trim();
  if (!t) return null;
  const k = t.toLowerCase();
  if (/^(no|zero|without) (work |job )?experience|entry level|beginner|first job/.test(k)) return { label: GLOBE_NO_EXP, roles: GLOBE_NO_EXP_ROLES, key: "retail" };
  if (k === "hospo") return globeWhat("Hospitality");   // everyday word for hospitality (it is one of the prompts the box cycles through)
  for (const [name, key, subs] of GLOBE_TREE) {
    for (const [sub, roles] of Object.entries(subs)) if (k === `${name} > ${sub}`.toLowerCase()) return { label: `${name} > ${sub}`, roles, key };
    if (k === name.toLowerCase()) return { label: name, roles: GLOBE_ROLES[key], key };
  }
  const hits = [];
  for (const [key, roles] of Object.entries(GLOBE_ROLES)) for (const r of roles) if (r.toLowerCase().includes(k) && !hits.some(h => h[0] === r)) hits.push([r, key]);
  if (hits.length) return { label: t, roles: hits.map(h => h[0]), key: hits[0][1] };
  return { label: t, roles: [globeTitleCase(t)], key: "" };
}
// A few example jobs for it near a place: the same ones every time for the same words and place
function globeSearchJobs(w, place, n = 4) {
  const rnd = globeRng([...(w.label + "|" + place)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 11));
  const orgs = (w.key && GLOBE_ORGS[w.key]) || ["Local employer", "Recruitment agency", "Small business"], start = Math.floor(rnd() * w.roles.length), list = [];
  for (let i = 0; i < n; i++) {
    const k = rnd();
    list.push({ title: w.roles[(start + i) % w.roles.length], org: orgs[Math.floor(rnd() * orgs.length)], kind: k < 0.55 ? "Full-time" : k < 0.78 ? "Part-time" : k < 0.9 ? "Contract" : "Casual" });
  }
  return list;
}

// Example jobs around one spot, for the map and its list: the same ones every time for the same place and search. They are placed around the spot
// (mostly within a few kilometres of it), not at real addresses, so zooming in still leaves some in view.
const GLOBE_PAYS = {
  "Full-time": ["$58k to $64k", "$64k to $72k", "$72k to $84k", "$84k to $98k", "$98k to $115k"],
  "Part-time": ["$28 to $32 an hour", "$32 to $38 an hour", "$38 to $45 an hour"],
  Contract: ["$44 to $54 an hour", "$360 to $430 a day", "$430 to $520 a day"],
  Casual: ["$29 to $33 an hour", "$31 to $36 an hour", "$34 to $40 an hour"]
};
const GLOBE_BLURBS = [
  t => `An example ${t.toLowerCase()} job, made up to show how the map works. It isn't at a real address.`,
  t => `Example only: a ${t.toLowerCase()} role placed near here. Real jobs are in Find jobs.`,
  t => `Shows what a ${t.toLowerCase()} listing looks like on the map. Not a live job.`
];
function globeLocalJobs(spot, place, hub, what, n = 36, radiusKm = 3.2) {
  const rnd = globeRng([...(place + "|" + (what ? what.label : ""))].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 17));
  const fams = hub && hub.mix && hub.mix.length ? hub.mix : ["retail", "hospitality", "health", "trades"], list = [];
  for (let i = 0; i < n; i++) {
    const fam = what && what.key ? what.key : fams[i % fams.length];
    const roles = what ? what.roles : GLOBE_ROLES[fam] || GLOBE_ROLES.retail, orgs = GLOBE_ORGS[fam] || ["Local employer", "Small business", "Recruitment agency"];
    const r = radiusKm * Math.sqrt(rnd()), a = rnd() * Math.PI * 2, k = rnd();
    const lat = spot.lat + (r * Math.sin(a)) / 111, lng = spot.lng + (r * Math.cos(a)) / (111 * Math.max(0.2, Math.cos(spot.lat * GLOBE_D)));
    const kind = k < 0.55 ? "Full-time" : k < 0.75 ? "Part-time" : k < 0.88 ? "Contract" : "Casual", pays = GLOBE_PAYS[kind];
    const title = roles[Math.floor(rnd() * roles.length)];
    list.push({ title, org: orgs[Math.floor(rnd() * orgs.length)], kind, pay: pays[Math.floor(rnd() * pays.length)], lat, lng,
      keen: i % 7 === 3,   // a few of them are "paid for" adverts: "Keen for applicants" and a golden pin
      at: r < 0.3 ? `Right by ${place}` : `${r.toFixed(1)} km from ${place}`,
      about: GLOBE_BLURBS[i % GLOBE_BLURBS.length](kind) + (what && what.label === GLOBE_NO_EXP ? " No experience needed." : "") });
  }
  return list;
}
// The company's icon on a map pin: its initials ("Harbourline Advisory" → "HA") on a colour that is the same every time for that company.
// (There are no real logos for made-up employers, so this stands in for one.)
const GLOBE_ICON_COLOURS = ["#1D2B64", "#0F6B5C", "#7A2E8E", "#B3361F", "#1F5FA8", "#5B6B16", "#8A3B5C", "#2E5E4E", "#4C3FA8", "#9A4B0B"];
function globeOrgIcon(org) {
  const words = String(org || "").replace(/&/g, " ").split(/\s+/).filter(w => w && !/^(and|the|of)$/i.test(w));
  const text = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?")[0]).toUpperCase();
  const hash = [...String(org || "")].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 5);
  return { text, colour: GLOBE_ICON_COLOURS[Math.abs(hash) % GLOBE_ICON_COLOURS.length] };
}
