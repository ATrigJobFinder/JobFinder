/* ===================== Resume creator: smarter inputs, finishing entries, fixes and the AI check ===================== */

/* --- Capitals: names, job titles, employers, places --- */
const NAME_PARTICLES = new Set(["van", "von", "de", "da", "di", "du", "la", "le", "der", "den", "bin", "binti", "al", "el"]);
const TITLE_SMALL = new Set(["of", "and", "in", "the", "for", "at", "to", "a", "an", "with", "on", "or", "by", "from", "&", "as"]);
const KEEP_UPPER = new Set(["IT", "HR", "CEO", "CFO", "COO", "CTO", "UX", "UI", "AI", "QA", "ICT", "CAD", "HVAC", "BIM", "GIS", "SQL", "PR", "RN", "EN", "PA", "EA", "AV", "OHS", "WHS", "NDIS", "ATO", "ABC", "CBD", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", "UNSW", "UWA", "QUT", "RMIT", "UTS", "ANU", "UQ", "UTAS", "ECU", "TAFE", "BHP", "ANZ", "NAB", "CBA", "KPMG", "PWC", "EY", "AFL", "NRL", "MBA", "PHD", "BSC", "BA", "BE", "BENG", "MENG", "II", "III", "IV", "ATAR", "WAM", "GPA", "EFTPOS", "POS", "CPA", "CA"]);
function smartCase(v, kind) {
  const t = String(v || "").replace(/\s+/g, " ").trim();
  if (!t) return t;
  const allLow = t === t.toLowerCase(), allUp = t === t.toUpperCase() && /[A-Z]{3}/.test(t);
  const cap = w => w.replace(/^(\(?)([a-z])/, (m, a, c) => a + c.toUpperCase());
  if (kind === "name" || kind === "surname") {
    const words = t.split(" ");
    return words.map((w, i) => {
      let x = w === w.toLowerCase() || w === w.toUpperCase() ? w.toLowerCase() : w;
      if ((i > 0 || (kind === "surname" && words.length > 1)) && NAME_PARTICLES.has(x)) return x;
      x = x.split(/([-'’])/).map(part => /^[-'’]$/.test(part) ? part : cap(part)).join("");
      return x.replace(/^Mc([a-z])/, (m, c) => "Mc" + c.toUpperCase());
    }).join(" ");
  }
  // titles, employers, degrees and places: only fix text typed all in lower or upper case
  if (!allLow && !allUp) return cap(t);
  return t.split(" ").map((w, i) => {
    const bare = w.replace(/[^A-Za-z]/g, "").toUpperCase();
    if (KEEP_UPPER.has(bare) && bare.length <= 5 && (allUp || bare.length <= 4 && !TITLE_SMALL.has(bare.toLowerCase()) && !["BE", "BA", "EN", "PA", "EA", "AV", "AL"].includes(bare))) return w.toUpperCase();
    const x = w.toLowerCase();
    if (i > 0 && TITLE_SMALL.has(x.replace(/[^a-z&]/g, ""))) return x;
    return x.split(/([-/])/).map(part => /^[-/]$/.test(part) ? part : cap(part)).join("");
  }).join(" ");
}

// Job titles always read as titles: "senior retail assistant" → "Senior Retail Assistant", "it support officer" → "IT Support Officer".
// live: while typing, only the words already finished (followed by a space) change, so the cursor never jumps.
const TITLE_UPPER_SKIP = new Set(["BE", "BA", "EN", "AL", "AS", "ME", "MY"]);
const TITLE_UPPER_MORE = new Set(["OSHC", "FIFO", "AOD", "SEO", "SEM", "HSE", "CNC", "SAP", "ERP", "BI", "ML", "VR", "AWS", "GP", "ICU", "RSA", "LR", "MR", "HC", "EWP", "IOT", "CRM", "GM", "MD", "VP", "CFO", "CMO", "CIO", "CISO", "APS", "EL", "SES", "NSW", "IVF", "EAL", "TESOL", "ESL", "OT", "PE", "STEM", "AV", "CCTV", "PLC", "SCADA", "RTO"]);
const TITLE_SPECIAL = { ios: "iOS", devops: "DevOps", sharepoint: "SharePoint", javascript: "JavaScript", phd: "PhD", "e-commerce": "E-commerce", ecommerce: "E-commerce", eal: "EAL", "eal/d": "EAL/D" };
function casePart(part, first) {
  const bare = part.replace(/[^A-Za-z0-9&]/g, ""), up = bare.toUpperCase(), low = bare.toLowerCase();
  if (!bare) return part;
  if (TITLE_SPECIAL[low]) return part.replace(bare, TITLE_SPECIAL[low]);
  if (/\d/.test(bare)) return part.toUpperCase();                                                        // 2IC
  if ((KEEP_UPPER.has(up) && !TITLE_UPPER_SKIP.has(up)) || TITLE_UPPER_MORE.has(up)) return part.replace(bare, up);   // IT, HR, CEO, UX
  if (!first && TITLE_SMALL.has(low)) return part.toLowerCase();                                          // of, and, the
  if (/[a-z][A-Z]/.test(part) && part !== part.toUpperCase()) return part.replace(/^(\(?)([a-z])/, (m, a, c) => a + c.toUpperCase());   // McDonald's, SharePoint
  return part.toLowerCase().replace(/^(\(?)([a-z])/, (m, a, c) => a + c.toUpperCase()).replace(/^Mc([a-z])/, (m, c) => "Mc" + c.toUpperCase());
}
function caseTitleWord(w, first) {
  if (TITLE_SPECIAL[w.toLowerCase()]) return TITLE_SPECIAL[w.toLowerCase()];
  return w.split(/([-/])/).map((part, k) => /^[-/]$/.test(part) ? part : casePart(part, first && k === 0)).join("");
}
function jobTitleCase(v, live) {
  const t = String(v || "");
  if (!t.trim()) return t;
  const parts = t.split(/(\s+)/);   // words, and the spaces between them
  let n = 0;
  const out = parts.map((w, i) => {
    if (!w || /^\s+$/.test(w)) return w;
    const first = n++ === 0;
    // the word being typed (nothing after it yet): only the first word's first letter
    if (live && i === parts.length - 1) return first ? w.replace(/^([a-z])/, c => c.toUpperCase()) : w;
    return caseTitleWord(w, first);
  }).join("");
  return live ? out : out.replace(/\s+/g, " ").trim();
}

/* --- Places: only real suburbs and towns, picked from a list, so the state (and where it is) is always known --- */
const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
// Regions people use that aren't one suburb, and a few places abroad, for jobs and study overseas
const AU_REGIONS = [["Gold Coast", "QLD", "4217", -2800, 15343], ["Sunshine Coast", "QLD", "4558", -2665, 15306], ["Central Coast", "NSW", "2250", -3343, 15134], ["Northern Beaches", "NSW", "2100", -3375, 15128], ["Inner West", "NSW", "2204", -3390, 15115], ["Illawarra", "NSW", "2500", -3443, 15089], ["Hunter Valley", "NSW", "2320", -3274, 15156], ["Blue Mountains", "NSW", "2780", -3371, 15031], ["Mornington Peninsula", "VIC", "3931", -3835, 14503], ["Yarra Valley", "VIC", "3777", -3766, 14551], ["Pilbara", "WA", "6714", -2074, 11685], ["Goldfields", "WA", "6430", -3075, 12147], ["South West", "WA", "6230", -3333, 11564], ["Riverina", "NSW", "2650", -3512, 14737]];
const WORLD_CITIES = "Auckland|New Zealand;Wellington|New Zealand;Christchurch|New Zealand;London|United Kingdom;Manchester|United Kingdom;Edinburgh|United Kingdom;Birmingham|United Kingdom;Glasgow|United Kingdom;Dublin|Ireland;Singapore|Singapore;Kuala Lumpur|Malaysia;Penang|Malaysia;Jakarta|Indonesia;Bali|Indonesia;Bangkok|Thailand;Manila|Philippines;Cebu|Philippines;Ho Chi Minh City|Vietnam;Hanoi|Vietnam;Hong Kong|Hong Kong;Shanghai|China;Beijing|China;Shenzhen|China;Guangzhou|China;Taipei|Taiwan;Tokyo|Japan;Osaka|Japan;Seoul|South Korea;Mumbai|India;Delhi|India;Bengaluru|India;Hyderabad|India;Chennai|India;Pune|India;Kolkata|India;Kathmandu|Nepal;Colombo|Sri Lanka;Dhaka|Bangladesh;Karachi|Pakistan;Lahore|Pakistan;Dubai|United Arab Emirates;Abu Dhabi|United Arab Emirates;Doha|Qatar;Riyadh|Saudi Arabia;Johannesburg|South Africa;Cape Town|South Africa;Nairobi|Kenya;Lagos|Nigeria;Cairo|Egypt;Paris|France;Berlin|Germany;Munich|Germany;Amsterdam|Netherlands;Brussels|Belgium;Zurich|Switzerland;Geneva|Switzerland;Vienna|Austria;Madrid|Spain;Barcelona|Spain;Lisbon|Portugal;Rome|Italy;Milan|Italy;Athens|Greece;Stockholm|Sweden;Copenhagen|Denmark;Oslo|Norway;Helsinki|Finland;Warsaw|Poland;Prague|Czechia;Istanbul|Turkey;New York|United States;San Francisco|United States;Los Angeles|United States;Seattle|United States;Boston|United States;Chicago|United States;Houston|United States;Toronto|Canada;Vancouver|Canada;Montreal|Canada;Mexico City|Mexico;São Paulo|Brazil;Buenos Aires|Argentina;Santiago|Chile;Bogotá|Colombia;Lima|Peru;Suva|Fiji;Port Moresby|Papua New Guinea;Apia|Samoa;Nuku'alofa|Tonga;Nouméa|New Caledonia";
const STATE_RANK = { NSW: 0, VIC: 1, QLD: 2, WA: 3, SA: 4, TAS: 5, ACT: 6, NT: 7 };
const BIG_PLACES = new Set(["sydney", "melbourne", "brisbane", "perth", "adelaide", "hobart", "darwin", "canberra", "gold coast", "sunshine coast", "central coast", "newcastle", "wollongong", "geelong", "townsville", "cairns", "toowoomba", "ballarat", "bendigo", "launceston", "albury", "mackay", "rockhampton", "bunbury", "parramatta", "fremantle"]);
const placeKey = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
let placeList = null;
// Unpacked the first time someone types a place: about 15,000 suburbs and towns
function allPlaces() {
  if (placeList) return placeList;
  const out = [], seen = new Set();
  const add = (n, s, pc, lat, lng, kind) => { const k = placeKey(n) + "|" + s; if (seen.has(k)) return; seen.add(k); out.push({ n, s, pc, lat: lat / 100, lng: lng / 100, kind, key: placeKey(n), big: BIG_PLACES.has(placeKey(n)) && kind === "au" }); };
  for (const [s, str] of Object.entries(AU_PLACE_DATA)) for (const g of str.split("|")) {
    const m = g.match(/^(\d{4})(-?\d+),(-?\d+):(.*)$/);
    if (m) for (const n of m[4].split(",")) add(n, s, m[1], +m[2], +m[3], "au");
  }
  for (const [n, s, pc, la, lo] of AU_REGIONS) add(n, s, pc, la, lo, "au");
  for (const x of WORLD_CITIES.split(";")) { const [n, c] = x.split("|"); add(n, c, "", 0, 0, "world"); }
  add("Remote", "", "", 0, 0, "remote");
  return (placeList = out);
}
// "Richmond", "richmond vic", "Richmond, VIC 3121" or "3121"
function findPlaces(q, max = 8) {
  const raw = placeKey(q);
  if (!raw) return [];
  let st = "", pc = "", words = raw;
  const m = raw.match(/^(.*?)\s*\b(nsw|vic|qld|wa|sa|tas|act|nt)\b\s*(\d{4})?$/);
  if (m && m[1]) { words = m[1]; st = m[2].toUpperCase(); pc = m[3] || ""; }
  const pm = words.match(/^(.*?)\s*(\d{3,4})$/);
  if (pm) { words = pm[1]; pc = pm[2]; }
  const hits = [];
  for (const x of allPlaces()) {
    if (st && x.s !== st) continue;
    if (pc && !x.pc.startsWith(pc)) continue;
    let score;
    if (!words) score = 1;
    else if (x.key === words) score = 0;
    else if (x.key.startsWith(words)) score = 1;
    else if ((" " + x.key).includes(" " + words)) score = 2;
    else if (words.length >= 4 && x.key.includes(words)) score = 3;
    else if (x.kind === "remote" && /^(work from home|home|wfh|online)/.test(words)) score = 1;
    else continue;
    hits.push([score, x]);
  }
  const rank = x => x.kind === "au" ? STATE_RANK[x.s] : x.kind === "world" ? 9 : 10;
  return hits.sort((a, b) => a[0] - b[0] || (b[1].big - a[1].big) || a[1].key.length - b[1].key.length || rank(a[1]) - rank(b[1]) || a[1].key.localeCompare(b[1].key)).slice(0, max).map(h => h[1]);
}
// The exact place someone typed, if there's only one it can be
function exactPlace(q) {
  const list = findPlaces(q, 30), k = placeKey(q).replace(/\s*\b(nsw|vic|qld|wa|sa|tas|act|nt)\b.*$/, "");
  const same = list.filter(x => x.key === k || placeKey(`${x.n} ${x.s}`) === placeKey(q) || placeKey(`${x.n} ${x.s} ${x.pc}`) === placeKey(q));
  return same.length === 1 ? same[0] : null;
}
const placeValue = x => x.kind === "remote" ? "Remote" : `${x.n}, ${x.s}`;
// Look up a saved location ("Richmond, VIC") to get its place again
function placeOf(saved) {
  const t = val(saved);
  if (!t) return null;
  if (/^remote$/i.test(t)) return allPlaces().find(x => x.kind === "remote");
  const [n, s] = t.split(/,\s*/);
  return allPlaces().find(x => x.key === placeKey(n) && (!s || x.s.toLowerCase() === s.toLowerCase())) || null;
}
const placeCoords = saved => { const x = placeOf(saved); return x && x.kind === "au" ? { lat: x.lat, lng: x.lng } : null; };
// Older entries were "Suburb, STATE" typed freely: show the suburb in the box and the state beside it
function splitLoc(s) { const t = val(s); const m = t.match(/^(.*?)[,\s]+(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)(?:\s+\d{4})?$/i); return m ? [m[1].trim(), m[2].toUpperCase()] : [t, ""]; }
function locQ(path, label, o = {}) {
  const saved = val(getPath(P(), path)), id = fid(path), x = placeOf(saved);
  const [sub, st] = x && x.kind === "au" ? [x.n, x.s] : x && x.kind === "world" ? [`${x.n}, ${x.s}`, ""] : splitLoc(saved);
  const known = !saved || !!x;
  return `<div class="q${o.wide ? " wide" : ""}"><label class="q-label" for="${id}">${/suburb|town/i.test(String(label)) ? label : label + " (suburb)"}${o.opt ? ' <span class="opt">(optional)</span>' : ""}</label><div class="q-body">
    <div class="pick place${known ? "" : " bad"}"><input type="text" id="${id}" data-place="${path}" value="${esc(sub)}" placeholder="${esc(o.ph || "Start typing a suburb or town")}" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="${id}-list" aria-describedby="${id}-msg" autocomplete="${o.ac ? "address-level2" : "off"}" spellcheck="false"><span class="pick-tag" aria-hidden="true">${esc(st)}</span><ul class="pick-list" id="${id}-list" role="listbox" aria-label="${esc(label)} suggestions" hidden></ul></div>
    <p class="pick-msg${known ? "" : " err"}" id="${id}-msg" role="status">${known ? "" : "We don't know that place. Pick it from the list as you type, so employers (and Job Finder) know where it is."}</p>${o.hint ? `<p class="q-hint">${o.hint}</p>` : ""}</div></div>`;
}

/* --- Phone: country (flag and full name) plus the number, spaced the usual way --- */
const flagOf = iso => String(iso || "").toUpperCase().replace(/[A-Z]/g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
// Several countries share a code (+1, +7, +44, +61): this is the one picked when only the code is known
const CODE_HOME = { 1: "US", 7: "RU", 39: "IT", 44: "GB", 47: "NO", 61: "AU", 212: "MA", 262: "RE", 290: "SH", 358: "FI", 590: "GP", 599: "CW", 672: "NF" };
const COMMON_COUNTRIES = ["AU", "NZ", "GB", "IN", "CN", "PH", "VN", "US"];
const countryByIso = iso => COUNTRY_CODES.find(c => c[0] === iso) || null;
const countryByCode = code => { const d = String(code || "").replace(/\D/g, ""); return countryByIso(CODE_HOME[d]) || COUNTRY_CODES.find(c => c[2] === d) || null; };
const DIALS = [...new Set(COUNTRY_CODES.map(c => c[2]))].sort((a, b) => b.length - a.length);
function fmtNational(n, c) {
  if (!n) return "";
  if (c === "+61") {
    if (/^4\d{8}$/.test(n)) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
    if (/^[2378]\d{8}$/.test(n)) return `${n[0]} ${n.slice(1, 5)} ${n.slice(5)}`;
    if (/^1[38]00\d{6}$/.test(n)) return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  }
  if (c === "+44" && /^7\d{9}$/.test(n)) return `${n.slice(0, 4)} ${n.slice(4)}`;
  if (c === "+64" && /^2\d{7,9}$/.test(n)) return `${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
  if (c === "+91" && /^\d{10}$/.test(n)) return `${n.slice(0, 5)} ${n.slice(5)}`;
  const g = n.length === 10 ? [3, 3, 4] : n.length === 9 ? [3, 3, 3] : n.length === 8 ? [4, 4] : n.length === 11 ? [3, 4, 4] : null;
  if (!g) return n.replace(/(\d{3})(?=\d)/g, "$1 ");
  let i = 0; return g.map(k => n.slice(i, i += k)).join(" ");
}
// "+61 466 022 120", "0466022120" or "0011 44 7700 900123" → [code, national number]
function splitPhone(s, code) {
  let t = String(s || "").trim(), c = code || "+61";
  if (!t) return [c, ""];
  if (/^(\+|00(?!0)|0011)/.test(t)) {
    const d = t.replace(/^(\+|0011|00)/, "").replace(/\D/g, "");
    const hit = DIALS.find(k => d.startsWith(k));
    if (hit) { c = "+" + hit; t = d.slice(hit.length); } else t = d;
  }
  let n = t.replace(/\D/g, "");
  if (c === "+61" && /^61\d{9}$/.test(n)) n = n.slice(2);
  n = n.replace(/^0+/, "");
  return [c, fmtNational(n, c)];
}
const countryLabel = c => `${c[1]} +${c[2]}`;
function phoneQ() {
  const ct = P().contact, [code, nat] = splitPhone(ct.phone, ct.phoneCode || "+61");
  const c = (countryByIso(ct.phoneIso) && "+" + countryByIso(ct.phoneIso)[2] === code ? countryByIso(ct.phoneIso) : countryByCode(code)) || countryByIso("AU");
  return `<div class="q"><label class="q-label" for="b_phone">Mobile number</label><div class="q-body"><div class="seg-in phone">
    <div class="pick cc"><button type="button" class="cc-btn" data-cc-open="1" aria-haspopup="listbox" aria-expanded="false" aria-label="Country: ${esc(countryLabel(c))}. Change"><span class="flag" aria-hidden="true">${flagOf(c[0])}</span><span class="cc-code">+${esc(c[2])}</span><span class="cc-caret" aria-hidden="true">▾</span></button>
      <div class="cc-pop" hidden><input type="search" class="cc-search" placeholder="Search country or code" aria-label="Search countries" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="ccList" aria-autocomplete="list"><ul class="pick-list" id="ccList" role="listbox" aria-label="Countries"></ul></div></div>
    <input type="tel" id="b_phone" data-phone="1" data-code="+${esc(c[2])}" data-iso="${esc(c[0])}" value="${esc(nat)}" placeholder="${c[0] === "AU" ? "412 345 678" : "Number"}" autocomplete="tel-national" inputmode="tel"></div></div></div>`;
}
function countryOptions(q) {
  const k = placeKey(q).replace(/^\+/, ""), digits = String(q || "").replace(/\D/g, "");
  const li = (c, i) => `<li role="option" id="cc-${c[0]}" data-iso="${c[0]}" aria-selected="${i === 0}"${i === 0 ? ' class="on"' : ""}><span class="flag" aria-hidden="true">${flagOf(c[0])}</span><span class="cc-name">${esc(c[1])}</span><span class="cc-num">+${esc(c[2])}</span></li>`;
  if (!k) {
    const common = COMMON_COUNTRIES.map(countryByIso).filter(Boolean);
    return `<li class="pick-head" role="presentation">Common</li>${common.map(li).join("")}<li class="pick-head" role="presentation">All countries</li>${COUNTRY_CODES.map((c, i) => li(c, i + common.length)).join("")}`;
  }
  const hits = COUNTRY_CODES.map(c => {
    const name = placeKey(c[1]);
    const s = digits && digits === k.replace(/\s/g, "") ? (c[2] === digits ? 0 : c[2].startsWith(digits) ? 1 : 9) : name.startsWith(k) ? 0 : (" " + name).includes(" " + k) ? 1 : c[0].toLowerCase() === k ? 0 : name.includes(k) ? 2 : 9;
    return [s, c];
  }).filter(h => h[0] < 9).sort((a, b) => a[0] - b[0] || a[1][1].localeCompare(b[1][1]));
  return hits.length ? hits.map((h, i) => li(h[1], i)).join("") : `<li class="pick-none" role="presentation">No country matches “${esc(q)}”.</li>`;
}

/* --- Dates, grades and start dates --- */
const datePh = ex => "e.g. " + showDate(ex);
const dateStyleQ = () => { const st = dateStyle(); const b = (v, l) => `<button type="button" data-act="pick" data-path="prefs.dateStyle" data-val="${v}" aria-pressed="${st === v}">${l}</button>`; return `<div class="date-style"><span class="small muted" id="bDateL">Show dates as</span><div class="seg" role="group" aria-labelledby="bDateL">${b("words", "Nov 2012")}${b("long", "November 2012")}${b("numeric", "11/2012")}</div><span class="small muted">You can type any of them.</span></div>`; };
const gradeNoteText = () => `Left off your resume: it's below the cut-off (${GRADE_MIN_WORDS}). A lower grade doesn't help your application.`;
function gradeQ(e, base) {
  const id = fid(base + ".grade"), type = e.gradeType || guessGradeType(e.grade, "");
  return `<div class="q"><label class="q-label" for="${id}">Grade <span class="opt">(optional)</span></label><div class="q-body"><div class="seg-in grade"><input type="text" id="${id}" data-path="${base}.grade" value="${esc(val(e.grade))}" placeholder="e.g. 72.5 or 6.1" inputmode="decimal" autocomplete="off"><select data-path="${base}.gradeType" aria-label="Grade type">${GRADE_TYPES.map(([k, l]) => `<option value="${k}"${k === type ? " selected" : ""}>${l}</option>`).join("")}</select></div></div></div>`;
}
function startQ() {
  const w = P().startWhen, isDate = /^\d{4}-\d{2}-\d{2}$/.test(w);
  const opts = [["", "Choose…"], ["now", "Immediately"], ["1w", "After one week's notice"], ["2w", "After two weeks' notice"], ["4w", "After four weeks' notice"], ["date", "From a date"]];
  return `<div class="q"><label class="q-label" for="b_start">When can you start?</label><div class="q-body"><div class="seg-in"><select id="b_start" data-start="1">${opts.map(([k, l]) => `<option value="${k}"${(isDate ? "date" : w) === k ? " selected" : ""}>${l}</option>`).join("")}</select>${isDate ? `<input type="date" data-path="startWhen" value="${esc(w)}" aria-label="Start date" min="${todayISO()}">` : ""}</div></div></div>`;
}

/* --- Older suggestion lists, still used by the type-ahead boxes (see the lists in 21a) --- */
const COMMON_TITLES = ["Graduate Engineer", "Graduate Mechanical Engineer", "Graduate Civil Engineer", "Graduate Electrical Engineer", "Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Engineering Intern", "Project Engineer", "Site Engineer", "Drafter", "Data Analyst", "Business Analyst", "Financial Analyst", "Consulting Analyst", "Graduate Accountant", "Accountant", "Accounts Assistant", "Administration Officer", "Office Administrator", "Receptionist", "Executive Assistant", "Customer Service Officer", "Customer Service Representative", "Call Centre Operator", "Retail Assistant", "Retail Sales Assistant", "Sales Assistant", "Store Manager", "Assistant Store Manager", "Barista", "Waiter", "Bartender", "Kitchen Hand", "Chef", "Cook", "Warehouse Operator", "Storeperson", "Forklift Driver", "Delivery Driver", "Labourer", "Apprentice Electrician", "Apprentice Carpenter", "Electrician", "Carpenter", "Plumber", "Registered Nurse", "Enrolled Nurse", "Aged Care Worker", "Disability Support Worker", "Support Worker", "Teacher", "Teacher's Aide", "Tutor", "Software Developer", "Software Engineer", "Junior Developer", "IT Support Officer", "Help Desk Analyst", "Marketing Coordinator", "Marketing Assistant", "Social Media Coordinator", "Graphic Designer", "Project Coordinator", "Project Manager", "Research Assistant", "Laboratory Technician", "Policy Officer", "Human Resources Coordinator", "Recruitment Coordinator", "Night Desk Operator", "Team Leader", "Supervisor", "Volunteer"];
const DEGREES = ["Bachelor of Engineering (Honours)", "Bachelor of Engineering (Honours) (Mechanical)", "Bachelor of Engineering (Honours) (Civil)", "Bachelor of Engineering (Honours) (Electrical)", "Bachelor of Science", "Bachelor of Science (Mechanical Engineering)", "Bachelor of Advanced Science", "Bachelor of Commerce", "Bachelor of Business", "Bachelor of Arts", "Bachelor of Laws", "Bachelor of Nursing", "Bachelor of Education (Primary)", "Bachelor of Education (Secondary)", "Bachelor of Information Technology", "Bachelor of Computer Science", "Bachelor of Design", "Bachelor of Psychological Science", "Bachelor of Health Science", "Master of Professional Engineering", "Master of Professional Engineering (Mechanical)", "Master of Engineering", "Master of Business Administration", "Master of Data Science", "Master of Information Technology", "Master of Teaching", "Master of Professional Accounting", "Graduate Certificate", "Graduate Diploma", "Diploma of Business", "Diploma of Information Technology", "Diploma of Nursing", "Diploma of Project Management", "Certificate III in Individual Support", "Certificate III in Early Childhood Education and Care", "Certificate III in Hospitality", "Certificate III in Carpentry", "Certificate III in Electrotechnology Electrician", "Certificate IV in Project Management Practice", "Certificate IV in Training and Assessment", "Year 12 (HSC)", "Year 12 (VCE)", "Year 12 (QCE)", "Year 12 (WACE)", "Year 12 (SACE)"];
const UNI_CITY = { "Australian National University": "Canberra, ACT", "University of Canberra": "Canberra, ACT", "University of Sydney": "Sydney, NSW", "UNSW Sydney": "Sydney, NSW", "University of Technology Sydney": "Sydney, NSW", "Macquarie University": "Sydney, NSW", "Western Sydney University": "Sydney, NSW", "University of Newcastle": "Newcastle, NSW", "University of Wollongong": "Wollongong, NSW", "University of New England": "Armidale, NSW", "Southern Cross University": "Lismore, NSW", "Charles Sturt University": "", "Australian Catholic University": "", "University of Melbourne": "Melbourne, VIC", "Monash University": "Melbourne, VIC", "RMIT University": "Melbourne, VIC", "Deakin University": "", "La Trobe University": "Melbourne, VIC", "Swinburne University of Technology": "Melbourne, VIC", "Victoria University": "Melbourne, VIC", "Federation University Australia": "Ballarat, VIC", "University of Queensland": "Brisbane, QLD", "Queensland University of Technology": "Brisbane, QLD", "Griffith University": "", "James Cook University": "Townsville, QLD", "University of the Sunshine Coast": "Sunshine Coast, QLD", "Bond University": "Gold Coast, QLD", "University of Southern Queensland": "Toowoomba, QLD", "CQUniversity": "", "University of Western Australia": "Perth, WA", "Curtin University": "Perth, WA", "Murdoch University": "Perth, WA", "Edith Cowan University": "Perth, WA", "University of Notre Dame Australia": "", "Adelaide University": "Adelaide, SA", "University of Adelaide": "Adelaide, SA", "Flinders University": "Adelaide, SA", "University of South Australia": "Adelaide, SA", "University of Tasmania": "Hobart, TAS", "Charles Darwin University": "Darwin, NT", "Open Universities Australia": "", "TAFE NSW": "", "TAFE Queensland": "", "TAFE SA": "", "TasTAFE": "", "Canberra Institute of Technology": "Canberra, ACT", "Melbourne Polytechnic": "Melbourne, VIC", "Box Hill Institute": "Melbourne, VIC", "Holmesglen Institute": "Melbourne, VIC", "Kangan Institute": "Melbourne, VIC", "Chisholm Institute": "Melbourne, VIC", "William Angliss Institute": "Melbourne, VIC", "North Metropolitan TAFE": "Perth, WA", "South Metropolitan TAFE": "Perth, WA" };
const LICENCE_OPTS = ["Full C class licence", "Full C class licence, own car", "Manual C class licence", "Provisional (P2) licence", "Provisional (P1) licence", "Learner licence", "Light rigid (LR) licence", "Medium rigid (MR) licence", "Heavy rigid (HR) licence"];
/* --- Finishing an entry: tidy it, polish it with AI (unless it's already polished), then it goes on the resume --- */
const FACT_STOP = STOP;
function keepsFacts(a, b) {
  const words = t => new Set(norm(t).split(/[^a-z0-9%$]+/).filter(w => w.length > 3 && !FACT_STOP.has(w)));
  const A = words(a), B = [...words(b)];
  if (!A.size) return 1;
  let n = 0;
  for (const w of A) if (B.some(x => x === w || x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5)))) n++;
  return n / A.size;
}
const sameLetters = (a, b) => !!a && !!b && norm(String(a)).replace(/[^a-z0-9]/g, "") === norm(String(b)).replace(/[^a-z0-9]/g, "");
// What the entry looked like when it was last polished, so Finish knows whether to polish again
function polishSig(list, e) {
  if (list === "experience" || list === "volunteering") return JSON.stringify((e.bullets || []).map(b => val(b)).filter(Boolean));
  if (list === "projects") return JSON.stringify([e.name, e.details].map(x => val(x)));
  if (list === "education") return JSON.stringify([e.coursework, e.project, e.awards].map(x => val(x)));
  if (list === "referees") return JSON.stringify([e.name, e.role, e.org, e.phone, e.email].map(x => val(x)));
  return "";
}
const isPolished = (list, e) => !!e.polished && e.polished === polishSig(list, e);
// A thesis or major project reads best as "Thesis: Title": "thesis on cooling solar panels" → "Thesis: Cooling solar panels"
function thesisLine(s) {
  let t = String(s || "").replace(/\s+/g, " ").trim().replace(/[.;\s]+$/, "");
  if (isBlank(t)) return "";
  const KIND = "(?:honours|honors|final[- ]year|major|capstone|research|masters?|phd)?\\s*(?:thesis|dissertation|capstone(?: project)?|project)";
  let label = "", body = t, m;
  if ((m = t.match(new RegExp("^(?:my|a|an|the)?\\s*(" + KIND + ")\\b[\\s:,\\-–—(]*(?:(?:on|about|titled|called|was|is|entitled)\\b[\\s:,\\-–—]*)*(.*)$", "i"))) && m[1].trim()) { label = m[1].trim(); body = m[2]; }
  else if ((m = t.match(new RegExp("^(.*?)\\s*[(\\[,\\-–—]\\s*(" + KIND + ")\\s*[)\\]]?$", "i"))) && m[1]) { label = m[2].trim(); body = m[1]; }
  body = body.replace(/^[\s“"'‘(]+|[\s”"'’)]+$/g, "").trim();
  if (!label) label = "Major project";
  if (!body) return /^thesis$/i.test(label) ? "Thesis" : cap1(label.toLowerCase());
  const lab = label.toLowerCase().replace(/\bhonors\b/, "honours").replace(/\bfinal year\b/, "final-year");
  return cap1(lab) + ": " + body[0].toUpperCase() + body.slice(1);
}
const tidyLine = (l, current) => { let x = autocorrect(String(l).replace(/\s+/g, " ").replace(/[.;,\s]+$/, "").replace(/^(I|We)\s+/i, "")).text; x = startVerb(x, current); return x ? x[0].toUpperCase() + x.slice(1) : x; };
function tidyEntry(list, e) {
  if (list === "experience" || list === "volunteering") {
    e.title = jobTitleCase(e.title); e.org = smartCase(e.org, "title");
    e.bullets = e.bullets.map(b => val(b)).filter(Boolean).map(b => tidyLine(b, e.current));
  } else if (list === "projects") {
    e.name = smartCase(e.name, "title");
    e.details = linesOf(e.details).map(l => tidyLine(l, e.current)).join("\n");
  } else if (list === "referees") {
    e.name = smartCase(e.name, "name"); e.role = jobTitleCase(e.role); e.org = smartCase(e.org, "title");
    if (val(e.phone)) e.phone = refPhone(e.phone);
    e.email = val(e.email).toLowerCase();
  } else {
    syncQual(e);
    e.subject = smartCase(e.subject, "title"); syncQual(e);
    e.inst = smartCase(e.inst, "title");
    for (const k of ["grade", "awards", "coursework", "project"]) if (isBlank(e[k])) e[k] = ""; else if (k !== "grade") e[k] = autocorrect(e[k]).text;
    if (e.project) e.project = thesisLine(e.project);
    if (e.grade) e.gradeType = guessGradeType(e.grade, e.gradeType);
  }
}
const POLISH_NANO = `You are a professional resume writer. Polish one job on an Australian resume so every bullet reads as polished, professional writing.
Rules:
1. Keep every fact. Never add tools, numbers, results, people or tasks that aren't there.
2. Rewrite each bullet properly, not just its spelling: a strong, specific action verb first (past tense for a past job, present tense for a current job), then what was done, how or with what, and for whom or why.
3. Each bullet reads as a complete sentence. Turn casual or vague words into professional ones that mean the same ("did the rosters" → "prepared staff rosters"). Spell out short forms ("w/" → "with", "custs" → "customers").
4. Fix spelling (Australian), grammar and capitals, including tool and company names.
5. Each bullet 10 to 30 words, no full stop at the end, never "I", "me" or "my". Don't start two bullets with the same verb.
6. Return the same number of bullets, in the same order.
Reply with JSON only.`;
const POLISH_FULL = `You are an experienced Australian resume writer. Polish one entry so it reads as professionally as a resume written by an expert, while staying completely true to what the candidate wrote.
For each bullet:
- Start with a strong, specific action verb (past tense for a past role, present tense for a current one). Replace weak openers like "Helped with", "Did" or "Was in charge of".
- Make it read as a complete sentence: action, then method (tools, systems, people), then why it mattered or what came of it. Move a number or result towards the front when there is one.
- Replace casual, vague or repetitive wording with precise professional language that means the same thing, and spell out abbreviations and shorthand.
- Correct spelling (Australian English), grammar, punctuation and the capitals of names, tools and companies.
- 10 to 30 words, no full stop at the end, no "I", "me" or "my", and no two bullets starting with the same verb.
Never add a task, tool, number, result, team size or claim that isn't in the bullet. Return exactly the same number of bullets, in the same order, plus the title and organisation with corrected capitals.
Reply with only JSON: {"title": "...", "org": "...", "bullets": ["..."]}`;
const POLISH_EXAMPLES = [[
  `<job>Retail Assistant at Bright Shoes (a past job: past tense)</job>
<bullets>
1. serve customers and help them find the right shoes
2. hitting sales targets most weeks, using the POS
3. trained 2 new staff.
4. did the weekly stock count w/ manager
</bullets>`,
  { title: "Retail Assistant", org: "Bright Shoes", bullets: ["Assisted customers in finding and fitting the right shoes for their needs", "Met sales targets most weeks while processing transactions on the POS system", "Trained 2 new staff members so they could serve customers confidently", "Conducted the weekly stock count with the store manager"] }
]];
const POLISH_SCHEMA = { type: "object", properties: { title: { type: "string" }, org: { type: "string" }, bullets: { type: "array", items: { type: "string" } } }, required: ["title", "org", "bullets"] };
const POLISH_EDU_NANO = `You polish one qualification on an Australian resume so it reads professionally.
Rules:
1. Keep every fact and add nothing: no new subjects, grades, results or details.
2. Subjects: correct names in Title Case, separated by commas. Keep every subject.
3. Project: one clear, professional line. Start with "Thesis:" or "Project:" if it says which.
4. Awards: correct names and capitals, with the year in brackets if one is given.
5. Fix spelling (Australian), grammar and capitals. Leave a field empty if it was empty.
Reply with JSON only.`;
const POLISH_EDU_EXAMPLES = [[
  `<qualification>Bachelor of Engineering (Honours), Curtin University</qualification>
<coursework>thermodynamics, fluid mechanics, enginering design</coursework>
<project>thesis on cooling solar panels passive</project>
<awards>deans list 2024</awards>`,
  { coursework: "Thermodynamics, Fluid Mechanics, Engineering Design", project: "Thesis: Passive cooling of solar panels", awards: "Dean's List (2024)" }
]];
const POLISH_EDU_SCHEMA = { type: "object", properties: { coursework: { type: "string" }, project: { type: "string" }, awards: { type: "string" } }, required: ["coursework", "project", "awards"] };
// One list of bullet points (a job, a volunteer role or a project), polished and checked line by line
function polishLines(kind, e, title, org, lines, progress) {
  const src = [title, org, kind === "experience" ? Object.values(e.answers).join("\n") : "", lines.join("\n")].join("\n");
  const what = kind === "projects" ? " (a project)" : kind === "volunteering" ? " (a volunteer role)" : "";
  const prompt = `<job>${title}${org ? ` at ${org}` : ""}${what}${e.current ? " (current: present tense)" : " (finished: past tense)"}</job>\n<bullets>\n${lines.map((b, k) => `${k + 1}. ${b}`).join("\n")}\n</bullets>`;
  return aiJSON({ nano: POLISH_NANO, full: POLISH_FULL, examples: POLISH_EXAMPLES, prompt, schema: POLISH_SCHEMA, label: "Polishing", progress,
    check: d => {
      const bl = (Array.isArray(d.bullets) ? d.bullets : []).map(b => stripMarkup(String(b)).replace(/\s+/g, " ").trim().replace(/[.\s]+$/, ""));
      if (bl.length !== lines.length) return { ok: false, why: `return exactly ${lines.length} bullets, in the same order` };
      for (let k = 0; k < bl.length; k++) {
        const why = factCheck(bl[k], src, { noFirstPerson: true, min: 3, max: 34 });
        if (why) return { ok: false, why: `bullet ${k + 1}: ${why}` };
        if (keepsFacts(lines[k], bl[k]) < 0.6) return { ok: false, why: `bullet ${k + 1} lost facts from the original` };
      }
      return { ok: true, value: { title: sameLetters(d.title, title) ? String(d.title).trim() : title, org: sameLetters(d.org, org) ? String(d.org).trim() : org, bullets: bl } };
    } });
}
async function polishEntry(list, e, progress) {
  if (list === "experience" || list === "volunteering") {
    if (!e.bullets.some(b => val(b))) return { data: null, via: null };
    const r = await polishLines(list, e, e.title, e.org, e.bullets, progress);
    return r.data ? { ...r, data: { title: r.data.title, org: r.data.org, bullets: r.data.bullets } } : r;
  }
  if (list === "projects") return polishProject(e, progress);
  if (list === "referees") return { data: null, via: null };
  if (![e.coursework, e.project, e.awards].some(x => val(x))) return { data: null, via: null };
  const prompt = `<qualification>${e.degree}, ${e.inst}</qualification>\n<coursework>${val(e.coursework)}</coursework>\n<project>${val(e.project)}</project>\n<awards>${val(e.awards)}</awards>`;
  return aiJSON({ nano: POLISH_EDU_NANO, examples: POLISH_EDU_EXAMPLES, prompt, schema: POLISH_EDU_SCHEMA, label: "Polishing this qualification", progress,
    check: d => {
      const out = {};
      for (const k of ["coursework", "project", "awards"]) {
        const was = val(e[k]), now = stripMarkup(String(d[k] || "")).trim().replace(/[.\s]+$/, was.endsWith(".") ? "." : "");
        if (!was) { out[k] = ""; continue; }
        if (factCheck(now, was, { years: true }) || keepsFacts(was, now) < 0.75 || wordCount(now) > wordCount(was) * 1.6 + 3) return { ok: false, why: `${k}: keep every fact and add nothing new` };
        out[k] = now;
      }
      return { ok: true, value: out };
    } });
}
const entryOf = (list, i) => list === "referees" ? P().referees.list[i] : P()[list][i];
// What an entry needs before it can go on the resume: [missing?, words, the box to jump to]
function entryNeeds(list, e) {
  const rows = {
    experience: () => [[!val(e.title), "a job title", "title"], [!val(e.org), "the employer", "org"], [!val(e.start), "when you started", "start"], [!(e.bullets || []).some(b => val(b)), "at least one bullet point", null]],
    education: () => [[!val(e.degree), "the qualification's level and subject", "level"], [!val(e.inst), "where you studied", "inst"], [!val(e.start) && !val(e.end), "dates", "start"]],
    projects: () => [[!val(e.name), "the project's name", "name"]],
    volunteering: () => [[!val(e.title) && !val(e.org), "the role or organisation", "title"]],
    referees: () => [[!val(e.name), "their name", "name"], [!val(e.phone) && !val(e.email), "a phone number or email", "phone"]]
  }[list];
  return (rows ? rows() : []).filter(x => x[0]);
}
const finSay = (list, i) => (m, err) => { const el = $(`bFin-${list}-${i}`); if (el) { el.textContent = m; el.classList.toggle("err", !!err); el.classList.toggle("busy", !err && /…$/.test(m)); } };
// Polish: tidy and polish the wording now, without finishing
async function polishOnly(list, i, btn) {
  const e = entryOf(list, i), say2 = finSay(list, i);
  if (!e) return;
  keepOpen();
  const before = JSON.parse(JSON.stringify(e));
  if (btn) { btn.disabled = true; btn.textContent = "Polishing…"; }
  tidyEntry(list, e);
  let r = { data: null, via: null };
  if (list !== "referees") { say2("Polishing with AI…"); try { r = await polishEntry(list, e, m => say2(m)); } catch { /* keep the tidy version */ } }
  if (r.data) Object.assign(e, r.data);
  e.polished = polishSig(list, e);
  builder.finNote = { list, i, before, text: r.data ? `Polished by ${viaWords(r.via)}.${e.done ? "" : " Finish it to add it to your resume."}` : list === "referees" ? "Tidied the capitals, number and email." : `Tidied capitals, tense and spelling. ${aiMissWords(r)}` };
  touchProfile("builder");
  renderBuilder(false);
}
async function finishEntry(list, i, btn, quiet) {
  const p = P(), e = entryOf(list, i);
  if (!e) return false;
  const say2 = finSay(list, i);
  const order = endBeforeStart(e);
  if (order) {
    if (quiet) return false;
    say2(order, true);
    const eb = $(fid(`${list === "referees" ? "referees.list" : list}.${i}.end`)); if (eb) eb.focus();
    return false;
  }
  const need = entryNeeds(list, e);
  if (need.length) {
    if (quiet) return false;
    say2(`Add ${listJoin(need.map(x => x[1]))} first.`, true);
    const base = list === "referees" ? `referees.list.${i}` : `${list}.${i}`;
    const f = need[0][2] && $(fid(`${base}.${need[0][2]}`));
    if (f) f.focus(); else if (list === "experience") { const ai = document.querySelector(`[data-act="ai-bullets"][data-i="${i}"]`); if (ai) ai.focus(); }
    return false;
  }
  keepOpen();
  const before = JSON.parse(JSON.stringify(e));
  const wasDone = e.done;
  if (btn) { btn.disabled = true; btn.textContent = "Finishing…"; }
  tidyEntry(list, e);
  let r = { data: null, via: null }, already = isPolished(list, e) || (list === "experience" && e.bullets.length && e.bullets.every(b => builder.aiText.has(norm(b))));
  if (!already && list !== "referees" && list !== "experience" && list !== "education") {
    say2("Polishing with AI…");
    try { r = await polishEntry(list, e, m => say2(m)); } catch { /* keep the tidy version */ }
    if (r.data) Object.assign(e, r.data);
  }
  e.polished = polishSig(list, e);
  e.done = true;
  builder.open[list].delete(i);
  const arr = listArr(p, list);
  const nextI = arr.findIndex((x, k) => k > i && !x.done);
  if (nextI >= 0 && !quiet) builder.open[list].add(nextI);
  builder.finNote = { list, i, before, text: list === "experience" || list === "education" ? (wasDone ? "Saved. It's on your resume." : "Added to your resume.") : already ? (wasDone ? "Saved. It's on your resume." : "Already polished, so it went straight on your resume.") : r.via ? `Polished by ${viaWords(r.via)} and added to your resume.` : `Tidied up and added to your resume.${list === "referees" ? "" : " " + aiMissWords(r)}` };
  touchProfile("builder");
  if (quiet) return true;
  renderBuilder(false);
  const card = document.querySelector(`#bForm details[data-card="${list}"][data-i="${i}"]`);
  if (card) smoothTo(card, 90);
  const paper = $("bPaper"); if (paper) { paper.classList.remove("flash"); void paper.offsetWidth; paper.classList.add("flash"); }
  return true;
}
// Shown under a card that was just finished or polished, with Undo
function finNoteHtml(list, i) {
  const n = builder.finNote;
  return n && n.list === list && n.i === i ? `<p class="b-fin" role="status">✓ ${esc(n.text)} <button class="linkish" type="button" data-act="undo-finish">Undo</button></p>` : "";
}
// Awards, publications and interests: polish the lines, and finish the section
const TEXT_POLISH_NANO = `You polish one short section of an Australian resume.
Rules:
1. Keep every fact and add nothing: no new awards, years, names, places or results.
2. Awards: one per line, like "Award name, who gave it (year)" when those are given. Publications: keep each citation as written, fixing only spelling and capitals. Interests: one short line, the items separated by commas.
3. Fix spelling (Australian), grammar and capitals. No full stop at the end of a line.
Reply with JSON only: {"lines": ["..."]}`;
async function polishText(key, btn, finish) {
  const p = P(), say2 = m => { const el = $(`bFin-text-${key}`); if (el) { el.textContent = m; el.classList.toggle("busy", /…$/.test(m)); } };
  const was = String(p[key] || ""), lines = key === "interests" ? [val(was)].filter(Boolean) : linesOf(was);
  if (!lines.length) { say2(key === "interests" ? "Add a line first." : "Add at least one line first."); return; }
  if (btn) btn.disabled = true;
  const tidied = lines.map(l => { const x = autocorrect(l.replace(/\s+/g, " ").replace(/[.;\s]+$/, "")).text; return x[0].toUpperCase() + x.slice(1); });
  let out = tidied, r = { data: null, via: null };
  const sig = JSON.stringify(tidied);
  if (!(p.extrasDone[key] && finish) && builder.textPolished !== key + sig) {
    say2("Polishing with AI…");
    r = await aiJSON({ nano: TEXT_POLISH_NANO, prompt: `Section: ${key}\n<lines>\n${tidied.map((l, k) => `${k + 1}. ${l}`).join("\n")}\n</lines>`, schema: { type: "object", properties: { lines: strArr }, required: ["lines"] }, label: "Polishing", progress: say2,
      check: d => {
        const ls = (Array.isArray(d.lines) ? d.lines : []).map(x => stripMarkup(String(x)).replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "")).filter(Boolean);
        if (key !== "interests" && ls.length !== tidied.length) return { ok: false, why: `return exactly ${tidied.length} lines, in the same order` };
        const all = ls.join(" ");
        if (factCheck(all, tidied.join("\n"), { years: true }) || keepsFacts(tidied.join(" "), all) < 0.75) return { ok: false, why: "keep every fact and add nothing new" };
        return { ok: true, value: key === "interests" ? [ls.join(", ")] : ls };
      } });
    if (r.data) out = r.data;
  }
  p[key] = out.join("\n");
  builder.textPolished = key + JSON.stringify(out);
  if (finish) p.extrasDone[key] = true;
  touchProfile("builder");
  renderBuilder(false);
  const msg = (r.data ? `Polished by ${viaWords(r.via)}.` : r.tried ? aiMissWords(r) : "Tidied.") + (finish ? " It's on your resume." : "");
  const el = $(`bFin-text-${key}`); if (el) el.textContent = msg;
}

/* --- One-click fixes and rewording for a bullet point --- */
const FIX_NANO = `You improve one bullet point on an Australian resume.
Rules:
1. Fix only the problem you're told about, and change as little else as possible.
2. Keep every fact. Never add numbers, tools, results or tasks that aren't in the bullet or the facts.
3. Start with a strong action verb.
4. 10 to 28 words, no full stop at the end, never "I", "me" or "my".
Reply with JSON only: {"bullet": "..."}`;
const FIX_EXAMPLES = [[
  `Problem: it's thin. Add how they did it, with what, or who it was for, using only the facts given.
Tense: past tense
Bullet: Did the weekly stock count
Facts: Retail Assistant at Bright Shoes. Did the stock count each Monday with the manager using the handheld scanner.`,
  { bullet: "Completed the weekly stock count each Monday with the store manager using a handheld scanner" }
]];
// Starting with an action word gets its own prompt and a list of verbs to choose from, since small models often skip it
const FIX_VERB_NANO = `You rewrite the start of one resume bullet point so its first word is a strong action verb.
Rules:
1. The first word must be an action verb in the tense you're told. Choose the one that fits best from the list you're given.
2. Replace a weak opening ("Responsible for", "Duties included", "Helped with", "Worked on", "In charge of") or a noun opening ("Customer service at the front desk") with that verb.
3. Keep every fact. Change as little else as possible. Never add numbers, tools, results or tasks.
4. 8 to 28 words, no full stop at the end, never "I", "me" or "my".
Reply with JSON only: {"bullet": "..."}`;
const FIX_VERB_EXAMPLES = [[
  `Tense: past tense
Verbs to choose from: Provided, Handled, Managed, Served, Processed, Resolved
Bullet: Customer service at the front desk and on the phones
Facts: Receptionist at Bayside Physio.`,
  { bullet: "Provided customer service at the front desk and on the phones" }
], [
  `Tense: present tense
Verbs to choose from: Prepare, Manage, Coordinate, Schedule, Organise, Plan
Bullet: Responsible for rosters for 12 staff each week
Facts: Café Supervisor at Grind Coffee (current job).`,
  { bullet: "Prepare weekly rosters for 12 staff" }
]];
const FIX_PROBLEMS = {
  verb: "it doesn't start with an action verb. Start it with one that fits what they did",
  long: "it's too long. Cut it to under 26 words and keep the most important facts",
  short: "it's thin. Add how they did it, with what, or who it was for, using only the facts given",
  first: "it uses I, me or my. Remove them",
  tense: "it's a past job but uses present tense. Use past tense",
  present: "it's their current job. Use present tense",
  buzz: "it uses buzzwords. Replace them with plain, specific words",
  number: "it needs this number worked in naturally"
};
const WEAK_SWAP = [[/^responsible for\s+/i, "Managed "], [/^in charge of\s+/i, "Led "], [/^helped( to)?\s+/i, "Supported "], [/^assisted( with)?\s+/i, "Supported "], [/^worked on\s+/i, "Delivered "], [/^(duties|tasks) (included|were)\s+/i, ""]];
// Verbs that suit a bullet, from words in it, for the AI to choose from (and to offer when there's no AI)
function verbChoices(b, current) {
  const t = String(b).toLowerCase(), out = [];
  const add = (...vs) => vs.forEach(v => { if (!out.includes(v)) out.push(v); });
  if (/customer|client|guest|patient|enquir|front desk|phone/.test(t)) add("Provided", "Served", "Assisted", "Resolved");
  if (/report|document|letter|email|minutes|proposal/.test(t)) add("Prepared", "Wrote", "Drafted");
  if (/roster|schedul|booking|meeting|event/.test(t)) add("Coordinated", "Scheduled", "Organised", "Planned");
  if (/team|staff|crew|volunteer/.test(t)) add("Led", "Supervised", "Trained", "Coordinated");
  if (/data|analys|research|test/.test(t)) add("Analysed", "Researched", "Tested");
  if (/stock|order|deliver|warehouse|cash|till|payment|invoice/.test(t)) add("Processed", "Handled", "Managed");
  if (/design|build|develop|code|drawing|model/.test(t)) add("Designed", "Built", "Developed");
  add("Managed", "Delivered", "Handled", "Supported", "Completed", "Coordinated");
  return out.slice(0, 8).map(v => current ? toPresentStart(v) : v);
}
function fixWithoutAI(b, issue, current, number) {
  let x = b;
  if (issue === "verb") { for (const [re, v] of WEAK_SWAP) if (re.test(x)) { x = x.replace(re, v); break; } x = startVerb(x, current); return isActionStart(x) && !WEAK_START.test(x) ? x : null; }
  if (issue === "tense") { const y = startVerb(x, current); return y !== x ? y : null; }
  if (issue === "present") { const y = toPresentStart(x); return y !== x ? y : null; }
  if (issue === "first") return x.replace(/\b(I|we)\s+/gi, "").replace(/\bmy\b/gi, "the").replace(/\bme\b/gi, "them").replace(/^\w/, c => c.toUpperCase());
  if (issue === "buzz") return x.replace(new RegExp(FILLER.source, "gi"), "").replace(/\s{2,}/g, " ").trim();
  if (issue === "number" && number) return `${x}, ${number}`;
  return null;
}
// "Managed" → "Manage", "Delivered" → "Deliver", "Led" → "Lead" (for a current job)
function toPresentStart(s) {
  const m = s.match(/^([A-Za-z]+)(.*)$/s);
  if (!m) return s;
  const w = m[1].toLowerCase(), rest = m[2];
  const irr = Object.entries(IRREG).find(([base, past]) => past === w && base !== w);
  let base = irr ? irr[0] : null;
  if (!base && /ied$/.test(w)) base = w.slice(0, -3) + "y";
  else if (!base && /ed$/.test(w)) {
    if (/([bdgmnprt])\1ed$/.test(w)) base = w.slice(0, -3);            // planned → plan
    else if (/([aeiouy]s|[vczg]|[aiu]t|[ui]r)ed$/.test(w)) base = w.slice(0, -1);   // used, achieved, managed, created, secured → +e
    else base = w.slice(0, -2);                                          // delivered, worked, processed
  }
  return base ? base[0].toUpperCase() + base.slice(1) + rest : s;
}
async function fixBullet(i, j, issue, btn, number) {
  const p = P(), e = p.experience[i], key = `${i}.${j}`;
  if (issue === "number" && number === undefined) { keepOpen(); builder.fixAsk = key; renderBuilder(false); const inp = document.querySelector(`[data-ask="${key}"]`); if (inp) inp.focus(); return; }
  if (issue === "number" && !number) { const inp = document.querySelector(`[data-ask="${key}"]`); if (inp) { inp.focus(); inp.placeholder = "Type the number first, e.g. 120 customers a day"; } return; }
  const b = e.bullets[j];
  keepOpen();
  builder.alts[key] = { busy: issue === "number" ? "Adding your number…" : "Fixing it…" };
  builder.fixAsk = null;
  renderBuilder(false);
  const src = [e.title, e.org, Object.values(e.answers).join("\n"), e.bullets.join("\n"), number || ""].join("\n");
  const facts = `${e.title}${e.org ? ` at ${e.org}` : ""}${e.current ? " (current job)" : ""}. ${Object.values(e.answers).filter(Boolean).join(". ")}`;
  const tense = e.current ? "present tense" : "past tense";
  const verbs = verbChoices(b, e.current);
  const prompt = issue === "verb" ? `Tense: ${tense}\nVerbs to choose from: ${verbs.join(", ")}\nBullet: ${b}\nFacts: ${facts}`
    : `Problem: ${FIX_PROBLEMS[issue]}${number ? `: "${number}"` : ""}.\nTense: ${tense}\nBullet: ${b}\nFacts: ${facts}`;
  const r = await aiJSON({ nano: issue === "verb" ? FIX_VERB_NANO : FIX_NANO, examples: issue === "verb" ? FIX_VERB_EXAMPLES : FIX_EXAMPLES, prompt, schema: { type: "object", properties: { bullet: { type: "string" } }, required: ["bullet"] }, label: "Fixing it", progress: m => { builder.alts[key] = { busy: m }; },
    check: d => {
      const t = stripMarkup(String(d.bullet || "")).replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "");
      const why = factCheck(t, src, { noFirstPerson: true, min: issue === "verb" ? 3 : 5, max: issue === "long" ? 27 : 32 });
      if (why) return { ok: false, why };
      if (keepsFacts(b, t) < (issue === "long" ? 0.45 : 0.6)) return { ok: false, why: "it dropped facts from the original" };
      if (coachNotes(t, e.current).some(n => n[2] === issue && n[0] !== "ok")) return { ok: false, why: issue === "verb" ? `its first word must be one of these verbs: ${verbs.join(", ")}` : `it still has the problem: ${FIX_PROBLEMS[issue]}` };
      return { ok: true, value: t[0].toUpperCase() + t.slice(1) };
    } });
  const fixed = r.data || fixWithoutAI(b, issue, e.current, number);
  if (fixed) { e.bullets[j] = fixed; if (r.data) aiMade(fixed); delete builder.alts[key]; touchProfile("builder"); }
  else if (issue === "verb") {
    // no AI answer: offer starting words to choose from
    const rest = lowerFirst(b.replace(WEAK_START, "").replace(/^(the|a|an)\s+/i, m => m.toLowerCase()).trim());
    // a bullet that starts with a thing ("Customer service at…") needs a verb that takes one: Provided, Delivered, Handled, Managed
    const nounStart = !isActionStart(b) && !WEAK_START.test(b);
    const pickFrom = nounStart ? ["Provided", "Delivered", "Handled", "Managed", "Coordinated"].map(v => e.current ? toPresentStart(v) : v) : verbs;
    builder.alts[key] = { head: "Pick a starting word", items: pickFrom.slice(0, 4).map(v => `${v} ${rest}`), msg: aiMissWords(r) };
  }
  else builder.alts[key] = { items: [], msg: `${aiMissWords(r)} ${issue === "long" || issue === "short" ? "Try editing it yourself, or use Reword." : "Try one of the starting words below the bullet points."}` };
  renderBuilder(false);
  const ta = document.querySelector(`.bl-item[data-i="${i}"][data-j="${j}"] textarea`);
  if (ta && fixed) { ta.classList.remove("flash"); void ta.offsetWidth; ta.classList.add("flash"); }
}
const REWORD_NANO = `You write different wordings of one resume bullet point.
Rules:
1. Write 3 versions. Each keeps every fact and adds nothing new: no new numbers, tools, results or tasks.
2. Each starts with a different strong action verb, in the tense you're told.
3. Each reads as a complete sentence, 10 to 28 words, no full stop at the end, never "I", "me" or "my".
Reply with JSON only: {"options": ["...", "...", "..."]}`;
const REWORD_FULL = `You are an experienced Australian resume writer. Write three different wordings of one bullet point from a candidate's resume.
Each version must keep every fact in the original (the task, any tool, number, team size or result) and add nothing that isn't in the bullet or the facts given. Start each with a different strong, specific action verb in the tense you're told, and vary the structure: one leads with the action, one with the result or scale, one with who it was for. Each reads as a complete sentence of 10 to 28 words, with Australian spelling, no full stop at the end, no "I", "me" or "my", and no buzzwords such as "leverage" or "utilise".
Reply with only JSON: {"options": ["...", "...", "..."]}`;
const REWORD_EXAMPLES = [[
  `Tense: past tense
Bullet: Served up to 80 customers a shift and processed sales on the POS system
Facts: Retail Assistant at Bright Shoes.`,
  { options: ["Assisted up to 80 customers a shift, processing their sales on the POS system", "Processed sales on the POS system for up to 80 customers each shift", "Looked after up to 80 shoppers a shift, from finding the right fit to completing the sale on the POS system"] }
]];
const VERB_SWAPS = { managed: ["Oversaw", "Ran", "Coordinated"], led: ["Directed", "Headed", "Guided"], developed: ["Built", "Created", "Designed"], created: ["Built", "Produced", "Designed"], built: ["Developed", "Created", "Set up"], served: ["Assisted", "Looked after", "Helped"], supported: ["Assisted", "Helped", "Backed"], handled: ["Managed", "Processed", "Resolved"], processed: ["Handled", "Completed", "Managed"], analysed: ["Examined", "Assessed", "Reviewed"], analyzed: ["Examined", "Assessed", "Reviewed"], improved: ["Strengthened", "Upgraded", "Refined"], trained: ["Coached", "Taught", "Mentored"], prepared: ["Produced", "Drafted", "Put together"], monitored: ["Tracked", "Watched over", "Oversaw"], achieved: ["Reached", "Met", "Delivered"], solved: ["Resolved", "Fixed", "Worked through"], operated: ["Ran", "Used", "Worked"], coordinated: ["Organised", "Managed", "Arranged"], assessed: ["Evaluated", "Reviewed", "Examined"], generated: ["Produced", "Created", "Built"], cleaned: ["Prepared", "Tidied", "Organised"], navigated: ["Used", "Worked in", "Operated"], secured: ["Won", "Earned", "Gained"], collaborated: ["Worked with", "Partnered with", "Teamed up with"], hit: ["Met", "Reached", "Achieved"], exceeded: ["Beat", "Topped", "Surpassed"], provided: ["Delivered", "Offered", "Gave"], completed: ["Finished", "Delivered", "Carried out"], conducted: ["Carried out", "Ran", "Completed"], organised: ["Coordinated", "Arranged", "Planned"], delivered: ["Provided", "Completed", "Carried out"] };
function rewordWithoutAI(b, current) {
  const m = b.match(/^([A-Za-z]+)\s+(.*)$/s);
  if (!m) return [];
  const w = m[1].toLowerCase(), alts = VERB_SWAPS[w] || VERB_SWAPS[w.replace(/s$/, "")] || VERB_SWAPS[toPast(w)] || [];
  return alts.map(a => `${current ? toPresentStart(a) : a} ${m[2]}`);
}
async function rewordBullet(i, j) {
  const e = P().experience[i], key = `${i}.${j}`, b = e.bullets[j];
  if (!val(b)) return;
  keepOpen();
  builder.alts[key] = { busy: "Finding other ways to say it…" };
  renderBuilder(false);
  const src = [e.title, e.org, Object.values(e.answers).join("\n"), b].join("\n");
  const r = await aiJSON({ nano: REWORD_NANO, full: REWORD_FULL, examples: REWORD_EXAMPLES, prompt: `Tense: ${e.current ? "present tense" : "past tense"}\nBullet: ${b}\nFacts: ${e.title}${e.org ? ` at ${e.org}` : ""}. ${Object.values(e.answers).filter(Boolean).join(". ")}`,
    schema: { type: "object", properties: { options: { type: "array", items: { type: "string" } } }, required: ["options"] }, label: "Rewording", progress: m => { builder.alts[key] = { busy: m }; const bx = document.querySelector(`.bl-item[data-i="${i}"][data-j="${j}"] .bl-alts .progress`); if (bx) bx.textContent = m; },
    check: d => {
      const seen = new Set([norm(b)]);
      const ok = (Array.isArray(d.options) ? d.options : []).map(x => stripMarkup(String(x)).replace(/\s+/g, " ").trim().replace(/[.\s]+$/, ""))
        .filter(x => x && !factCheck(x, src, { noFirstPerson: true, min: 5, max: 32 }) && keepsFacts(b, x) >= 0.55 && !seen.has(norm(x)) && seen.add(norm(x)));
      return ok.length >= 1 ? { ok: true, value: ok.slice(0, 3).map(x => x[0].toUpperCase() + x.slice(1)) } : { ok: false, why: "write 3 different versions that keep every fact and add nothing" };
    } });
  const items = r.data || rewordWithoutAI(b, e.current);
  builder.alts[key] = items.length ? { items, via: r.data ? r.via : null, msg: r.data ? "" : `${aiMissWords(r)} These only swap the first word.` } : { items: [], msg: `${aiMissWords(r)} Rewording this one needs AI.` };
  renderBuilder(false);
  const box = document.querySelector(`.bl-item[data-i="${i}"][data-j="${j}"] .bl-alts`);
  if (box) box.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
}

/* --- Extras: "What did you do?" boxes (projects, volunteering) get Reword, with up to 3 versions to choose from --- */
const EXTRA_REWORD_NANO = `You write different wordings of a few lines on a resume describing what someone did.
Rules:
1. Write 3 versions. Each keeps every fact and adds nothing new: no new numbers, tools, results or tasks.
2. Each version has the same number of lines as the original, one point per line, each a full sentence of 8 to 28 words starting with a strong action verb, no full stop at the end, never "I", "me" or "my".
3. The three versions must read differently: change the verbs and the order of ideas.
Reply with JSON only: {"options": ["line one\\nline two", "...", "..."]}`;
const EXTRA_REWORD_AWARDS = `You write different wordings of a list of awards and achievements on a resume.
Rules:
1. Write 3 versions. Each keeps every award, year, name and place exactly as given and adds nothing new: no new awards, dates, reasons or results.
2. Each version has the same number of lines as the original, one award per line, in a clear style like "Award name, who gave it (year)". No full stop at the end of a line, never "I", "me" or "my".
3. The three versions must read differently: change the order of the details or add a few words of plain description taken from the original.
Reply with JSON only: {"options": ["line one\nline two", "...", "..."]}`;
const extraBox = (list, i) => list === "awards" ? { text: () => linesOf(P().awards), set: ls => { P().awards = ls.join("\n"); P().extrasDone.awards = false; }, id: fid("awards"), current: false }
  : list === "projects" ? { text: () => linesOf(P().projects[i].details), set: ls => { P().projects[i].details = ls.join("\n"); }, id: fid(`projects.${i}.details`), current: !!P().projects[i].current }
  : { text: () => P().volunteering[i].bullets.filter(b => val(b)), set: ls => { P().volunteering[i].bullets = ls; }, id: fid(`volunteering.${i}.bullets`), current: !!P().volunteering[i].current };
builder.extraAlts = {};
function extraRewordHtml(list, i) {
  const a = builder.extraAlts[`${list}.${i}`];
  const bar = `<div class="x-reword"><button class="btn" type="button" data-act="x-reword" data-list="${list}" data-i="${i}">Reword</button><span class="small muted">Up to three other ways to say it, to choose from.</span></div>`;
  if (!a) return bar;
  const body = a.busy ? `<p class="progress">${esc(a.busy)}</p>` : a.items.length
    ? `<span class="small muted">Pick one to use instead${a.via ? ` (by ${viaWords(a.via)})` : ""}:</span>${a.items.map((t, k) => `<button type="button" class="bl-alt" data-act="x-use" data-list="${list}" data-i="${i}" data-k="${k}">${esc(t.join("\n")).replace(/\n/g, "<br>")}</button>`).join("")}${a.msg ? `<span class="small muted">${esc(a.msg)}</span>` : ""}`
    : `<span class="small muted">${aiMissHtml(a.msg || "No other wordings this time.")}</span>`;
  return bar + `<div class="bl-alts">${body}<button class="linkish" type="button" data-act="x-close" data-list="${list}" data-i="${i}">Close</button></div>`;
}
async function rewordExtra(list, i) {
  const box = extraBox(list, i), lines = box.text().map(l => String(l).replace(BULLET_RE, "").trim()).filter(Boolean), key = `${list}.${i}`;
  if (!lines.length) { keepOpen(); builder.extraAlts[key] = { items: [], msg: "Write what you did first, then reword it." }; renderBuilder(false); return; }
  keepOpen();
  builder.extraAlts[key] = { busy: "Finding other ways to say it…" };
  renderBuilder(false);
  const awards = list === "awards", e = awards ? {} : P()[list][i], src = [e.title, e.org, e.name, lines.join("\n")].join("\n");
  const same = (a, b) => keepsFacts(a.join(" "), b.join(" "));
  const reasonOf = v => {
    if (!v.length) return "it was empty";
    if (v.length > lines.length + 1) return "it has more lines than you gave";
    for (const l of v) { const w = factCheck(l, src, awards ? { noFirstPerson: true, years: true, min: 2, max: 34 } : { noFirstPerson: true, min: 4, max: 34 }); if (w) return w; }
    if (same(lines, v) < 0.55) return "it drops or changes details you gave";
    return "";
  };
  const tidyOpts = d => (Array.isArray(d && d.options) ? d.options : []).map(x => stripMarkup(String(x)).split(/\n+/).map(l => l.replace(BULLET_RE, "").replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "")).filter(Boolean)).filter(v => v.length).map(v => v.map(l => l[0].toUpperCase() + l.slice(1)));
  const r = await aiJSON({ nano: awards ? EXTRA_REWORD_AWARDS : EXTRA_REWORD_NANO, full: awards ? EXTRA_REWORD_AWARDS : EXTRA_REWORD_NANO, noRetry: true, prompt: `Tense: ${box.current ? "present tense" : "past tense"}\nOriginal lines:\n${lines.join("\n")}\nWhere: ${[e.title || e.name, e.org].filter(Boolean).join(" at ")}`,
    schema: { type: "object", properties: { options: { type: "array", items: { type: "string" } } }, required: ["options"] }, label: "Rewording", progress: m => { builder.extraAlts[key] = { busy: m }; },
    check: d => {
      const seen = new Set([norm(lines.join(" "))]), why = [];
      const ok = tidyOpts(d).filter(v => { const w = reasonOf(v); if (w) { why.push(w); return false; } const k = norm(v.join(" ")); if (seen.has(k)) { why.push("it repeats another wording"); return false; } seen.add(k); return true; });
      return ok.length ? { ok: true, value: ok.slice(0, 3) } : { ok: false, why: why[0] || "it didn't give a different wording" };
    } });
  let items = r.data || [], msg = "", via = r.data ? r.via : null;
  if (!items.length && r.raw) {
    // the AI answered, but a check didn't pass: still show what it wrote, and say exactly why
    items = tidyOpts(r.raw).slice(0, 3);
    via = r.rawVia;
    msg = items.length ? `Check ${items.length === 1 ? "this one" : "these"} yourself. ${viaWords(r.rawVia)}'s wording didn't pass the fact check, because ${r.rawWhy || "it doesn't match what you gave"}. It's shown as it was written.` : "";
  }
  if (!items.length && !awards) {
    // without AI: swap each line's first word for another strong verb, up to three ways
    const swaps = lines.map(l => rewordWithoutAI(l, box.current));
    for (let k = 0; k < 3; k++) { const v = lines.map((l, j) => swaps[j][k] || swaps[j][0] || l); if (v.join(" ") !== lines.join(" ") && !items.some(x => x.join(" ") === v.join(" "))) items.push(v); }
    if (items.length) { via = null; msg = `${aiMissWords(r)} These only swap the first word of each line.`; }
  }
  builder.extraAlts[key] = items.length ? { items, via, msg } : { items: [], msg: `${aiMissWords(r)} Rewording this needs AI.` };
  renderBuilder(false);
}

/* --- The whole-resume AI check: combine, shorten or reword first; cut only low-priority lines, with a reason --- */
// How much each job or qualification matters for the target job: newest and most relevant first
function entryPriority(p) {
  const want = contentWords([p.target.title, ...(COMMON_SKILLS[p.target.jobType] || { hard: [] }).hard].join(" "));
  const rel = text => { let n = 0; for (const w of contentWords(text)) if (want.has(w)) n++; return n; };
  const job = finished(p.experience).filter(e => e.title || e.org);
  const pri = {};
  p.experience.forEach((e, n) => {
    const k = job.indexOf(e);
    if (k < 0) return;
    const score = (k === 0 ? 2 : k === 1 ? 1 : 0) + (e.current ? 1 : 0) + Math.min(2, rel(e.title + " " + e.bullets.join(" ")));
    pri["E" + (n + 1)] = score >= 3 ? "high" : score >= 2 ? "medium" : "low";
  });
  const edu = finished(p.education).filter(e => e.degree || e.inst);
  p.education.forEach((e, n) => {
    const k = edu.indexOf(e);
    if (k < 0) return;
    pri["D" + (n + 1)] = /year 1[0-2]|hsc|vce|qce|wace|sace|atar|high school/i.test(e.degree) && edu.length > 1 ? "low" : k === 0 || e.current ? "high" : rel(e.degree + " " + e.coursework) ? "medium" : "low";
  });
  return pri;
}
function resumeLines(p) {
  const L = [], pri = entryPriority(p);
  if (val(p.summary)) L.push({ id: "S", where: "Profile", noCut: true, text: p.summary, set: t => { if (t != null) p.summary = t; } });
  p.experience.forEach((e, n) => { const g = `E${n + 1}`; if (!e.done || !(e.title || e.org)) return; L.push({ head: `[${g}] ${e.title}${e.org ? ", " + e.org : ""} (${rangeOf(e)}) · priority: ${pri[g]}` }); e.bullets.forEach((b, k) => { if (val(b)) L.push({ id: `${g}.${k + 1}`, group: g, job: n, pri: pri[g], where: `${e.title}${e.org ? ", " + e.org : ""}`, text: b, set: t => { e.bullets[k] = t == null ? "\u0000" : t; } }); }); });
  p.education.forEach((e, n) => { const g = `D${n + 1}`; if (!e.done || !(e.degree || e.inst)) return; L.push({ head: `[${g}] ${e.degree}${e.inst ? ", " + e.inst : ""} · priority: ${pri[g]}` }); for (const f of ["coursework", "project", "awards"]) if (val(e[f])) L.push({ id: `${g}.${f}`, group: g + "." + f, pri: pri[g], where: e.degree || e.inst, text: f === "coursework" ? "Relevant coursework: " + listOf(e[f]).join(", ") : e[f], set: t => { e[f] = t == null ? "" : t.replace(/^Relevant coursework:\s*/i, ""); } }); });
  if (p.extras.projects) p.projects.forEach((x, n) => { if (!x.name) return; const lines = linesOf(x.details); lines.forEach((l, k) => L.push({ id: `P${n + 1}.${k + 1}`, group: `P${n + 1}`, pri: "medium", where: x.name, text: l, set: t => { const ls = linesOf(x.details); ls[k] = t == null ? "\u0000" : t; x.details = ls.join("\n"); } })); });
  if (p.extras.volunteering) p.volunteering.forEach((e, n) => e.bullets.forEach((b, k) => { if (val(b)) L.push({ id: `V${n + 1}.${k + 1}`, group: `V${n + 1}`, pri: "low", where: e.title || e.org, text: b, set: t => { e.bullets[k] = t == null ? "\u0000" : t; } }); }));
  if (p.extras.interests && val(p.interests)) L.push({ id: "X.interests", where: "Interests", pri: "low", text: p.interests, set: t => { if (t == null) p.extras.interests = false; else p.interests = t; } });
  if (p.extras.referees) L.push({ id: "X.referees", where: "Referees", pri: "low", cutOnly: true, text: p.referees.mode === "list" ? "Referees listed" : "Referees: available on request", set: t => { if (t == null) p.extras.referees = false; } });
  if (p.skills.soft.length) L.push({ id: "K.soft", where: "Skills", pri: "medium", cutOnly: true, text: "Strengths: " + p.skills.soft.join(", "), set: t => { if (t == null) p.skills.soft = []; } });
  return L;
}
const CHECK_NANO = `You are an experienced Australian recruiter editing a candidate's resume. Make it tighter and more professional without losing anything important.
Rules:
1. Suggest up to 8 edits, most useful first. Each lists the line ids it changes.
2. Prefer, in this order: "combine" 2 or 3 short, related bullets from the same job into one; "shorten" a long line; "rewrite" a weak line. "cut" is the last resort.
3. Never add facts: no new numbers, tools, results or tasks. Combined, shortened and rewritten lines keep every important fact.
4. Only cut a line when you can say why (repeated, vague or irrelevant to the target job), and only from priority: low entries, interests or referees. Never cut the profile (S): shorten or rewrite it.
5. Keep at least two bullets per job. Give a reason under 15 words for every edit, and up to 3 pieces of advice about what to add.
Reply with JSON only.`;
const CHECK_EXAMPLES = [[
  `<goal>It's 2 pages and must fit on one. Save about 6 lines: combine and shorten first, then cut low-priority lines only if you must.</goal>
<target_job>Graduate Accountant</target_job>
<resume>
S | Accounting student with experience in retail and hospitality, skilled in Xero and Excel, looking for a graduate accounting role where attention to detail matters and where there is room to grow
[E1] Accounts Assistant, Lee & Co (Feb 2025 – Present) · priority: high
E1.1 | Reconcile bank accounts in Xero each week
E1.2 | Process supplier invoices
E1.3 | Enter supplier invoices and chase payments
[E2] Kitchen Hand, Pizza Place (2021 – 2023) · priority: low
E2.1 | Washed dishes
E2.2 | Cleaned the kitchen at close
E2.3 | Helped with food prep when it was busy
</resume>`,
  { edits: [{ ids: ["E1.2", "E1.3"], action: "combine", text: "Process and enter supplier invoices and follow up on outstanding payments", why: "Two lines about the same invoice work read better as one." }, { ids: ["S"], action: "shorten", text: "Accounting student with retail and hospitality experience, skilled in Xero and Excel, seeking a graduate accounting role where attention to detail matters", why: "Same message in fewer words." }, { ids: ["E2.1", "E2.2"], action: "combine", text: "Washed dishes and cleaned the kitchen at close", why: "Short related tasks from a less relevant job." }], advice: ["Add a number to your Xero work, such as how many accounts you reconcile."] }
]];
const CHECK_SCHEMA = { type: "object", properties: { edits: { type: "array", items: { type: "object", properties: { ids: { type: "array", items: { type: "string" } }, action: { type: "string", enum: ["combine", "shorten", "rewrite", "cut"] }, text: { type: "string" }, why: { type: "string" } }, required: ["ids", "action", "why"] } }, advice: { type: "array", items: { type: "string" } } }, required: ["edits"] };
const ACTION_ORDER = { combine: 0, shorten: 1, rewrite: 2, cut: 3 }, PRI_ORDER = { low: 0, medium: 1, high: 2 };
const sortChecks = items => items.sort((a, b) => ACTION_ORDER[a.action] - ACTION_ORDER[b.action] || (a.action === "cut" ? PRI_ORDER[a.pri || "medium"] - PRI_ORDER[b.pri || "medium"] : 0));
function overflowLines() {
  const sheet = document.querySelector("#bPaper .paper-sheet");
  if (!sheet) return 0;
  return Math.max(0, Math.ceil((sheet.offsetHeight - 1123 + 8) / 15));
}
// Without AI: join short bullets in less important jobs first, then cut what matters least, always with a reason
function checkWithoutAI(p, L, onePage, over) {
  const items = [], perJob = {}, used = new Set();
  p.experience.forEach((e, n) => { perJob[n] = e.bullets.filter(b => val(b)).length; });
  const cut = (x, why) => { if (used.has(x.id) || x.noCut) return false; if (x.job != null) { if (perJob[x.job] <= 2) return false; perJob[x.job]--; } used.add(x.id); items.push({ ids: [x.id], action: "cut", text: "", why, where: x.where, before: [x.text], pri: x.pri }); return true; };
  let need = onePage ? over : 0;
  if (need > 0) {
    // 1. two short bullets from the same job become one ("Washed dishes" + "Cleaned the kitchen" → "Washed dishes and cleaned the kitchen")
    const groups = [...new Set(L.filter(l => l.job != null).map(l => l.group))].sort((a, b) => PRI_ORDER[(L.find(l => l.group === a) || {}).pri] - PRI_ORDER[(L.find(l => l.group === b) || {}).pri]);
    for (const g of groups) {
      if (need <= 0) break;
      const short = L.filter(l => l.group === g && !used.has(l.id) && wordCount(l.text) <= 12).sort((a, b) => wordCount(a.text) - wordCount(b.text));
      if (short.length < 2 || perJob[short[0].job] <= 2) continue;
      const [a, b] = short;
      const text = `${a.text.replace(/[.\s]+$/, "")} and ${lowerFirst(b.text.replace(/[.\s]+$/, ""))}`;
      if (wordCount(text) > 28) continue;
      perJob[a.job]--; used.add(a.id); used.add(b.id);
      items.push({ ids: [a.id, b.id], action: "combine", text, why: "Two short, related points read better as one line.", where: a.where, before: [a.text, b.text], pri: a.pri });
      need -= 1;
    }
    // 2. then the least important lines
    for (const id of ["X.interests", "X.referees"]) { const x = L.find(l => l.id === id); if (x && need > 0 && cut(x, id === "X.referees" ? "Employers assume referees are available, so this line can go." : "Interests are the first thing to cut for space.")) need -= 2; }
    const low = L.filter(l => l.job != null && l.pri === "low").sort((a, b) => b.job - a.job || (numsOf(a.text).length - numsOf(b.text).length));
    for (const x of low) { if (need <= 0) break; if (!numsOf(x.text).length && cut(x, "It's from a less relevant job and has no result or number.")) need -= Math.ceil(wordCount(x.text) / 14); }
    for (const x of L.filter(l => /^D\d+\.coursework$/.test(l.id) && l.pri !== "high")) { if (need <= 0) break; if (cut(x, "Coursework from a less relevant qualification matters least once you have work experience.")) need -= 2; }
  }
  const advice = [];
  const long = L.filter(l => l.job != null && wordCount(l.text) > 30);
  if (long.length) advice.push(`${long.length} bullet point${long.length === 1 ? " is" : "s are"} over 30 words. Use Fix on ${long.length === 1 ? "it" : "them"} to shorten.`);
  const noNum = L.filter(l => l.job != null && !numsOf(l.text).length).length;
  if (noNum > 3) advice.push(`${noNum} bullet points have no number. Add sizes, amounts or results where you can.`);
  if (need > 0) advice.push("It still runs over one page. Try Compact line spacing or Narrow margins in Page setup below.");
  return { items: sortChecks(items), advice };
}
const GENERIC_WHY = /^(makes it (tighter|shorter|better)|not needed|remove(d)?|cut( it)?|unnecessary|space)\.?$/i;
async function runResumeCheck(btn) {
  const p = P(), onePage = !!p.prefs.onePage, pages = builder.pages || 1, over = onePage && pages > 1 ? overflowLines() : 0;
  const L = resumeLines(p), byId = Object.fromEntries(L.filter(l => l.id).map(l => [l.id, l]));
  if (!L.some(l => l.id)) { builder.check = { items: [], ran: true, note: "Finish a job or add a summary first, so there's something to check." }; renderBuilder(false); return; }
  btn.disabled = true;
  const note = $("bCheckNote");
  const progress = m => { if (note) { note.textContent = m; note.classList.add("busy"); } };
  progress("Reading your resume…");
  const src = sourceText(p);
  const perJob = {};
  p.experience.forEach((e, n) => { perJob[n] = e.bullets.filter(b => val(b)).length; });
  const prompt = `<goal>${onePage && pages > 1 ? `It's ${pages} pages and must fit on one. Save about ${over} lines: combine and shorten first, then cut low-priority lines only if you must.` : onePage ? "It fits on one page. Make it read as professionally as possible without making it longer. Combine or reword; don't cut." : "Make it read as professionally as possible. Length is fine as it is, so combine or reword; don't cut."}</goal>
<target_job>${p.target.title || "(not given)"}</target_job>
<resume>
${L.map(l => l.head ? l.head : `${l.id} | ${l.text}`).join("\n")}
</resume>`;
  const r = await aiJSON({ nano: CHECK_NANO, examples: CHECK_EXAMPLES, prompt, schema: CHECK_SCHEMA, label: "Checking your resume", progress,
    check: d => {
      const left = { ...perJob }, items = [], used = new Set();
      for (const x of (Array.isArray(d.edits) ? d.edits : []).slice(0, 10)) {
        const ids = [...new Set((Array.isArray(x.ids) ? x.ids : [x.id]).map(i => String(i || "").trim()).filter(Boolean))];
        const lines = ids.map(i => byId[i]).filter(Boolean);
        if (!lines.length || lines.length !== ids.length || lines.some(l => used.has(l.id))) continue;
        const action = ACTION_ORDER[x.action] != null ? x.action : null;
        if (!action || (lines.some(l => l.cutOnly) && action !== "cut")) continue;
        const why = stripMarkup(String(x.why || "")).trim().slice(0, 140);
        const line = lines[0];
        if (action === "cut") {
          // a cut needs a real reason, and never touches the profile or a high-priority entry
          if (lines.length !== 1 || line.noCut || line.pri === "high" || wordCount(why) < 4 || GENERIC_WHY.test(why)) continue;
          if (line.job != null) { if (left[line.job] <= 2) continue; left[line.job]--; }
          items.push({ ids, action, text: "", why, where: line.where, before: [line.text], pri: line.pri }); used.add(line.id); continue;
        }
        const t = stripMarkup(String(x.text || "")).replace(/\s+/g, " ").trim().replace(/[.\s]+$/, line.id === "S" ? "." : "");
        if (!t || factCheck(t, src, { noFirstPerson: line.id !== "S" })) continue;
        if (action === "combine") {
          const all = lines.map(l => l.text).join(" ");
          if (lines.length < 2 || lines.length > 3 || lines.some(l => !l.group || l.group !== line.group || l.noCut)) continue;
          if (keepsFacts(all, t) < 0.6 || wordCount(t) > 36 || wordCount(t) >= wordCount(all) + 2) continue;
          if (line.job != null) { if (left[line.job] - (lines.length - 1) < 2) continue; left[line.job] -= lines.length - 1; }
          items.push({ ids, action, text: t, why: why || "These points read better together.", where: line.where, before: lines.map(l => l.text), pri: line.pri }); lines.forEach(l => used.add(l.id)); continue;
        }
        if (lines.length !== 1 || norm(t) === norm(line.text) || keepsFacts(line.text, t) < (action === "shorten" ? 0.45 : 0.55)) continue;
        if (action === "shorten" && wordCount(t) >= wordCount(line.text)) continue;
        if (line.id === "S" && wordCount(t) < 20) continue;   // the profile is reworded, never gutted
        items.push({ ids, action, text: t, why: why || "Reads more clearly.", where: line.where, before: [line.text], pri: line.pri }); used.add(line.id);
      }
      const advice = (Array.isArray(d.advice) ? d.advice : []).map(a => stripMarkup(String(a)).trim()).filter(a => a && !factCheck(a, src + "\n" + a)).slice(0, 3);
      return items.length || advice.length || !(onePage && pages > 1) ? { ok: true, value: { items: sortChecks(items), advice } } : { ok: false, why: `suggest lines to combine or shorten that save about ${over} lines` };
    } });
  btn.disabled = false;
  if (note) note.classList.remove("busy");
  const out = r.data || checkWithoutAI(p, L, onePage, over);
  builder.check = { ...out, ran: true, onePage, startPages: pages, note: r.data ? `Suggestions from ${viaWords(r.via)}. Combining and rewording come first; anything cut says why. Accept the ones you agree with.` : "AI isn't available, so these come from built-in rules." };
  renderBuilder(false);
  const box = document.querySelector(".b-ai-check");
  if (box) smoothTo(box, 80);
}
function applyCheck(act, k) {
  const c = builder.check;
  if (!c) return;
  const p = P();
  // find the lines by their words (ids shift once earlier lines are cut)
  const find = (L, x, text) => L.find(l => l.id && l.text === text && l.where === x.where) || L.find(l => l.id && l.text === text);
  const accept = x => {
    if (x.state) return;
    const L = resumeLines(p), lines = x.before.map(t => find(L, x, t));
    if (lines.some(l => !l)) { x.state = "no"; return; }
    if (x.action === "cut") lines[0].set(null);
    else { lines[0].set(x.text); lines.slice(1).forEach(l => l.set(null)); }
    x.state = "yes";
  };
  if (act === "check-all") c.items.forEach(x => { if (!x.state) accept(x); });
  else if (act === "check-yes") accept(c.items[k]);
  else if (c.items[k]) c.items[k].state = "no";
  // remove the placeholders left by cuts
  p.experience.forEach(e => { e.bullets = e.bullets.filter(b => b !== "\u0000"); });
  p.volunteering.forEach(e => { e.bullets = e.bullets.filter(b => b !== "\u0000"); });
  p.projects.forEach(x => { x.details = String(x.details || "").split("\n").filter(z => z !== "\u0000").join("\n"); });
  touchProfile("builder");
  renderBuilder(false);
  const pages = builder.pages || 1;
  c.note = c.onePage ? (pages === 1 ? "✓ It now fits on one page." : `Still ${pages} pages. Accept more suggestions, try Compact spacing in Page setup, or check again.`) : c.note;
  const n = $("bCheckNote"); if (n) n.textContent = c.note;
}
function reviewCheckHtml() {
  const p = P(), c = builder.check, pages = builder.pages || 1;
  const act = x => ({ cut: "Cut", shorten: "Shorten", combine: "Combine", rewrite: "Reword" })[x.action];
  const item = (x, k) => `<li class="chk${x.state ? " " + x.state : ""}"><div class="chk-head"><span class="chk-act ${x.action}">${act(x)}</span><span class="small muted">${esc(x.where || "")}${x.action === "cut" && x.pri ? ` · ${x.pri} priority` : ""}</span></div>
    ${x.before.map(b => `<p class="chk-before">${esc(b)}</p>`).join("")}${x.action !== "cut" ? `<p class="chk-after">${esc(x.text)}</p>` : ""}<p class="small"><b>Why:</b> ${esc(x.why)}</p>
    <div class="b-actions">${x.state === "yes" ? '<span class="chip found">Done</span>' : x.state === "no" ? '<span class="small muted">Skipped</span>' : `<button class="btn primary" type="button" data-act="check-yes" data-k="${k}">${x.action === "cut" ? "Cut it" : x.action === "combine" ? "Combine them" : "Use this"}</button><button class="btn" type="button" data-act="check-no" data-k="${k}">Keep mine</button>`}</div></li>`;
  return `<div class="b-sub">AI check</div><div class="b-ai-check">
    <p class="q-hint">A read-through of the whole resume, the way a recruiter would. It combines and rewords before it cuts, only cuts less important lines (never your profile), and says why. You decide.</p>
    <div class="b-actions"><label class="q-check"><input type="checkbox" data-path="prefs.onePage"${p.prefs.onePage ? " checked" : ""}> Keep it to one page</label><span class="small muted">It's ${pages} page${pages === 1 ? "" : "s"} now.</span></div>
    <div class="b-actions"><button class="btn primary" type="button" data-act="check-run">${c && c.ran ? "Check again" : "Check my whole resume"}</button><span class="engine-note" id="bCheckNote" role="status">${c && c.note ? esc(c.note) : ""}</span></div>
    ${c && c.items.length ? `<ul class="chk-list">${c.items.map(item).join("")}</ul>${c.items.filter(x => !x.state).length > 1 ? '<div class="b-actions"><button class="btn" type="button" data-act="check-all">Accept all the rest</button></div>' : ""}` : c && c.ran ? `<p class="small">Nothing to change${p.prefs.onePage && pages === 1 ? ", and it fits on one page" : ""}.</p>` : ""}
    ${c && c.advice && c.advice.length ? `<div class="chk-advice"><b>Also worth doing</b><ul>${c.advice.map(a => `<li>${esc(a)}</li>`).join("")}</ul></div>` : ""}
  </div>`;
}

/* --- How the place and country pickers behave --- */
const pickNow = { inp: null, items: [], i: -1 };
function placeMsg(inp, text, bad) {
  const m = $(inp.id + "-msg"); if (m) { m.textContent = text || ""; m.classList.toggle("err", !!bad); }
  inp.parentElement.classList.toggle("bad", !!bad);
  inp.setAttribute("aria-invalid", bad ? "true" : "false");
}
function placeShow(inp) {
  const box = inp.parentElement.querySelector(".pick-list"), q = inp.value.trim();
  const items = q ? findPlaces(q) : [];
  Object.assign(pickNow, { inp, items, i: items.length ? 0 : -1 });
  if (!q) { placeClose(inp); return; }
  box.innerHTML = items.length ? items.map((x, k) => `<li role="option" id="${inp.id}-o${k}" data-k="${k}" aria-selected="${k === 0}"${k === 0 ? ' class="on"' : ""}><b>${esc(x.n)}</b><span>${x.kind === "au" ? `${esc(x.s)} ${esc(x.pc)}` : x.kind === "world" ? esc(x.s) : "Work from home"}</span></li>`).join("")
    : `<li class="pick-none" role="presentation">No suburb or town matches “${esc(q)}”. Check the spelling.</li>`;
  box.hidden = false;
  inp.setAttribute("aria-expanded", "true");
  if (items.length) inp.setAttribute("aria-activedescendant", inp.id + "-o0"); else inp.removeAttribute("aria-activedescendant");
}
function placeClose(inp) {
  const box = inp.parentElement.querySelector(".pick-list");
  if (box) { box.hidden = true; box.innerHTML = ""; }
  inp.setAttribute("aria-expanded", "false"); inp.removeAttribute("aria-activedescendant");
  if (pickNow.inp === inp) Object.assign(pickNow, { inp: null, items: [], i: -1 });
}
function placeMove(inp, d) {
  if (pickNow.inp !== inp || !pickNow.items.length) { placeShow(inp); return; }
  pickNow.i = (pickNow.i + d + pickNow.items.length) % pickNow.items.length;
  inp.parentElement.querySelectorAll(".pick-list [role=option]").forEach((li, k) => { li.classList.toggle("on", k === pickNow.i); li.setAttribute("aria-selected", String(k === pickNow.i)); if (k === pickNow.i) li.scrollIntoView({ block: "nearest" }); });
  inp.setAttribute("aria-activedescendant", `${inp.id}-o${pickNow.i}`);
}
function placePick(inp, x) {
  inp.value = x.kind === "world" ? `${x.n}, ${x.s}` : x.n;
  inp.parentElement.querySelector(".pick-tag").textContent = x.kind === "au" ? x.s : "";
  setPath(P(), inp.dataset.place, placeValue(x));
  placeClose(inp); placeMsg(inp, "");
  touchProfile("builder"); previewSoon();
  inp.blur();
}
// Leaving the box: a typed name that matches one place is fine; anything else has to be picked
function placeCheck(inp) {
  const path = inp.dataset.place, t = inp.value.trim(), p = P();
  if (!t) { if (val(getPath(p, path))) { setPath(p, path, ""); touchProfile("builder"); previewSoon(); } inp.parentElement.querySelector(".pick-tag").textContent = ""; placeMsg(inp, ""); return; }
  const cur = placeOf(getPath(p, path));
  if (cur && [placeKey(cur.n), placeKey(`${cur.n}, ${cur.s}`)].includes(placeKey(t))) { placeMsg(inp, ""); return; }
  const x = exactPlace(t);
  if (x) { placePick(inp, x); return; }
  const some = findPlaces(t).length;
  placeMsg(inp, some ? `Pick one from the list, so we know which “${t}” you mean.` : `We don't know a suburb or town called “${t}”. Check the spelling, then pick it from the list.`, true);
}
function ccOpen(btn) {
  const pop = btn.parentElement.querySelector(".cc-pop"), s = pop.querySelector(".cc-search"), list = pop.querySelector(".pick-list");
  document.querySelectorAll(".cc-pop:not([hidden])").forEach(x => { if (x !== pop) ccClose(x); });
  pop.hidden = false; btn.setAttribute("aria-expanded", "true");
  s.value = ""; list.innerHTML = countryOptions("");
  const iso = btn.closest(".seg-in").querySelector("[data-phone]").dataset.iso;
  ccActive(pop, [...list.querySelectorAll("[role=option]")].findIndex(li => li.dataset.iso === iso));
  s.focus();
}
function ccClose(pop, focusBtn) {
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  const btn = pop.parentElement.querySelector(".cc-btn"); btn.setAttribute("aria-expanded", "false");
  if (focusBtn) btn.focus();
}
function ccActive(pop, k) {
  const opts = [...pop.querySelectorAll("[role=option]")];
  if (!opts.length) return;
  k = Math.max(0, Math.min(opts.length - 1, k < 0 ? 0 : k));
  opts.forEach((li, j) => { li.classList.toggle("on", j === k); li.setAttribute("aria-selected", String(j === k)); });
  opts[k].scrollIntoView({ block: "nearest" });
  pop.querySelector(".cc-search").setAttribute("aria-activedescendant", opts[k].id);
  pop.dataset.k = k;
}
function setPhoneCountry(num, c) {
  num.dataset.code = "+" + c[2]; num.dataset.iso = c[0];
  num.placeholder = c[0] === "AU" ? "412 345 678" : "Number";
  const btn = num.parentElement.querySelector(".cc-btn");
  btn.querySelector(".flag").textContent = flagOf(c[0]);
  btn.querySelector(".cc-code").textContent = "+" + c[2];
  btn.setAttribute("aria-label", `Country: ${countryLabel(c)}. Change`);
}
function ccPick(pop, iso) {
  const c = countryByIso(iso), num = pop.closest(".seg-in").querySelector("[data-phone]");
  if (!c || !num) return;
  setPhoneCountry(num, c);
  ccClose(pop);
  num.dispatchEvent(new Event("change", { bubbles: true }));
  num.focus();
}
onInit(() => {
  // keys first, so Enter picks from a list instead of jumping to the next box
  document.addEventListener("keydown", e => {
    const t = e.target;
    if (t.matches && t.matches("input[data-place]")) {
      const open = t.getAttribute("aria-expanded") === "true";
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); placeMove(t, e.key === "ArrowDown" ? 1 : -1); }
      else if (e.key === "Enter" && open && pickNow.inp === t && pickNow.i >= 0) { e.preventDefault(); e.stopPropagation(); placePick(t, pickNow.items[pickNow.i]); }
      else if (e.key === "Enter" && t.value.trim() && !placeOf(getPath(P(), t.dataset.place))) { e.preventDefault(); e.stopPropagation(); placeCheck(t); }
      else if (e.key === "Escape" && open) { e.preventDefault(); placeClose(t); }
    } else if (t.matches && t.matches(".cc-search")) {
      const pop = t.closest(".cc-pop"), k = +pop.dataset.k || 0;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); ccActive(pop, k + (e.key === "ArrowDown" ? 1 : -1)); }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const li = pop.querySelectorAll("[role=option]")[k]; if (li) ccPick(pop, li.dataset.iso); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); ccClose(pop, true); }
      else if (e.key === "Tab") ccClose(pop);
    }
  }, true);
  document.addEventListener("input", e => {
    const t = e.target;
    if (t.matches && t.matches("input[data-place]")) { placeMsg(t, ""); placeShow(t); }
    else if (t.matches && t.matches(".cc-search")) { const pop = t.closest(".cc-pop"); pop.querySelector(".pick-list").innerHTML = countryOptions(t.value); ccActive(pop, 0); }
  });
  document.addEventListener("focusout", e => {
    const t = e.target;
    if (t.matches && t.matches("input[data-place]")) setTimeout(() => { if (!t.isConnected || document.activeElement === t) return; placeClose(t); placeCheck(t); }, 0);
  });
  // options keep the focus in the box, so a click picks rather than blurs
  document.addEventListener("mousedown", e => { if (e.target.closest(".pick.place .pick-list li")) e.preventDefault(); });
  document.addEventListener("click", e => {
    const li = e.target.closest(".pick.place .pick-list [role=option]");
    if (li) { const inp = li.closest(".pick").querySelector("input[data-place]"); if (pickNow.inp === inp) placePick(inp, pickNow.items[+li.dataset.k]); return; }
    const ccBtn = e.target.closest("[data-cc-open]");
    if (ccBtn) { const pop = ccBtn.parentElement.querySelector(".cc-pop"); if (pop.hidden) ccOpen(ccBtn); else ccClose(pop, true); return; }
    const cli = e.target.closest(".cc-pop [role=option]");
    if (cli) { ccPick(cli.closest(".cc-pop"), cli.dataset.iso); return; }
    if (!e.target.closest(".cc-pop")) document.querySelectorAll(".cc-pop:not([hidden])").forEach(p => ccClose(p));
  });
});

/* --- Languages: add one, then choose the language and how well you speak it --- */
const LANGUAGES = ["Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Arrernte", "Auslan", "Bengali", "Bosnian", "Bulgarian", "Burmese", "Cantonese", "Croatian", "Czech", "Danish", "Dari", "Dinka", "Dutch", "English", "Estonian", "Fijian", "Filipino (Tagalog)", "Finnish", "French", "German", "Greek", "Gujarati", "Hakka", "Hazaragi", "Hebrew", "Hindi", "Hungarian", "Indonesian", "Italian", "Japanese", "Kannada", "Karen", "Khmer", "Korean", "Kriol", "Kurdish", "Lao", "Latvian", "Lithuanian", "Macedonian", "Malay", "Malayalam", "Maltese", "Mandarin", "Māori", "Marathi", "Mongolian", "Nepali", "Norwegian", "Pashto", "Persian (Farsi)", "Pitjantjatjara", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Samoan", "Serbian", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Swahili", "Swedish", "Tamil", "Telugu", "Thai", "Tibetan", "Tigrinya", "Tongan", "Torres Strait Creole", "Turkish", "Ukrainian", "Urdu", "Vietnamese", "Warlpiri", "Welsh", "Yoruba", "Zulu"];
const LANG_LEVELS = [["native", "Native or bilingual"], ["fluent", "Fluent"], ["professional working", "Good enough for work"], ["conversational", "Conversational"], ["basic", "Basic"]];
const levelKey = t => { const x = String(t || "").toLowerCase(); return !x ? "" : /native|mother|first|bilingual/.test(x) ? "native" : /fluent|advanced/.test(x) ? "fluent" : /profession|work|business/.test(x) ? "professional working" : /conversation|intermediate/.test(x) ? "conversational" : /basic|beginner|elementary|some|learning/.test(x) ? "basic" : x; };
function parseLang(s) { const m = String(s || "").match(/^(.*?)\s*\(([^)]*)\)\s*$/); return { name: (m ? m[1] : String(s || "")).trim(), level: m ? levelKey(m[2]) : "" }; }
const langString = (name, level) => name ? (level ? `${name} (${level})` : name) : "";
function langEditor() {
  const p = P(), rows = p.skills.languages.map(parseLang);
  if (builder.langNew) rows.push({ name: "", level: "", draft: true });
  const row = (r, i) => {
    const typing = builder.langOther === i, known = LANGUAGES.includes(r.name);
    const nameBox = typing ? `<input type="text" data-lang="${i}" data-part="other" value="${esc(known ? "" : r.name)}" placeholder="Type the language" aria-label="Language ${i + 1}" autocomplete="off">`
      : `<select data-lang="${i}" data-part="name" aria-label="Language ${i + 1}"><option value="">Choose a language…</option>${r.name && !known ? `<option selected>${esc(r.name)}</option>` : ""}${LANGUAGES.map(l => `<option${l === r.name ? " selected" : ""}>${esc(l)}</option>`).join("")}<option value="__other">Another language…</option></select>`;
    const lvKnown = LANG_LEVELS.some(([k]) => k === r.level);
    const lv = `<select data-lang="${i}" data-part="level" aria-label="Level for language ${i + 1}"${r.name ? "" : " disabled"}>${r.level ? "" : '<option value="" selected disabled hidden>Choose a level</option>'}${r.level && !lvKnown ? `<option value="${esc(r.level)}" selected>${esc(r.level)}</option>` : ""}${LANG_LEVELS.map(([k, l]) => `<option value="${k}"${k === r.level ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    return `<div class="lang-row">${nameBox}${lv}<button type="button" class="chip-x" data-act="lang-del" data-i="${i}" aria-label="Remove ${esc(r.name || "this language")}">×</button></div>`;
  };
  return `<div class="q" data-langs="1"><div class="q-label" id="chl_languages">Languages <span class="opt">(optional)</span></div><p class="q-hint">Any language other than English is worth listing, with your level.</p>
    <div class="lang-list">${rows.map(row).join("")}</div>
    <div class="b-actions"><button class="btn" type="button" data-act="lang-add"${builder.langNew ? " disabled" : ""}>+ Add a language</button></div></div>`;
}
function rerenderLangs(focusSel) {
  const box = document.querySelector("#bForm [data-langs]");
  if (!box) return;
  const tmp = document.createElement("div"); tmp.innerHTML = langEditor();
  box.replaceWith(tmp.firstElementChild);
  if (focusSel) { const f = document.querySelector("#bForm [data-langs] " + focusSel); if (f) f.focus(); }
  previewSoon();
}
function onLangInput(t, change) {
  const arr = P().skills.languages, i = +t.dataset.lang, part = t.dataset.part, draft = i >= arr.length;
  const cur = draft ? { name: "", level: "" } : parseLang(arr[i]);
  if (part === "name" && t.value === "__other") { builder.langOther = i; rerenderLangs(`[data-lang="${i}"][data-part="other"]`); return; }
  if (part === "other" && !change) return;
  if (part === "name" || part === "other") cur.name = part === "other" ? smartCase(t.value.trim(), "title") : t.value;
  else cur.level = t.value;
  if (part === "other") builder.langOther = null;
  if (!cur.name && !draft) { arr.splice(i, 1); builder.langNew = 1; }
  else if (cur.name && draft) { arr.push(langString(cur.name, cur.level)); builder.langNew = 0; }
  else if (cur.name) arr[i] = langString(cur.name, cur.level);
  touchProfile("builder");
  // after choosing a language, go straight to how well
  rerenderLangs(part === "level" ? null : `[data-lang="${Math.min(i, arr.length - 1)}"][data-part="level"]`);
}
function langClick(act, i) {
  const arr = P().skills.languages;
  if (act === "lang-add") { builder.langNew = 1; builder.langOther = null; rerenderLangs(`[data-lang="${arr.length}"][data-part="name"]`); return; }
  if (i >= arr.length) builder.langNew = 0; else arr.splice(i, 1);
  builder.langOther = null;
  touchProfile("builder"); rerenderLangs();
}

/* --- Page setup: line spacing and margins, used by the preview and both downloads --- */
const SPACING = { compact: { lh: 0.9, gap: 0.7, label: "Compact", unit: "0.9× lines" }, normal: { lh: 1, gap: 1, label: "Normal", unit: "1.0× lines" }, relaxed: { lh: 1.12, gap: 1.3, label: "Roomy", unit: "1.12× lines" } };
const MARGINS = { narrow: { mm: 12, label: "Narrow" }, normal: { mm: 0, label: "Normal" }, wide: { mm: 22, label: "Wide" } };
// The design with the person's spacing and margins applied
function tplWithPrefs(tpl, prefs) {
  const pr = prefs || (profile && profile.data && profile.data.prefs) || {};
  const sp = SPACING[pr.spacing] || SPACING.normal, mg = MARGINS[pr.margins] || MARGINS.normal;
  return { ...tpl, lh: sp.lh, gap: sp.gap, margin: mg.mm || tpl.margin };
}
function pageSetupQ() {
  const pr = P().prefs, design = (builderTpl() || {}).margin || 16;
  const unit = (k, o, path) => path === "prefs.margins" ? `${k === "normal" ? design : o.mm} mm` : o.unit;
  const seg = (path, opts, cur, label) => `<div class="q"><div class="q-label" id="ps_${path.split(".")[1]}">${label}</div><div class="seg seg-fill" role="group" aria-labelledby="ps_${path.split(".")[1]}">${Object.entries(opts).map(([k, o]) => `<button type="button" data-act="pick" data-path="${path}" data-val="${k}" aria-pressed="${(cur || "normal") === k}"><span>${o.label}</span><small>${unit(k, o, path)}</small></button>`).join("")}</div></div>`;
  return `<div class="page-setup">${seg("prefs.spacing", SPACING, pr.spacing, "Line spacing")}${seg("prefs.margins", MARGINS, pr.margins, "Page margins")}</div><p class="q-hint">Compact spacing and narrow margins fit more on a page. Line spacing is relative to the design's own (1.0×); normal margins are the design's own (${design} mm).</p>${dateStyleQ()}${languageQ()}`;
}
// Which English to write in: it sets the spelling autocorrect fixes to, and the language the browser's spell check uses
function languageQ() {
  const cur = spellLang();
  return `<div class="q"><label class="q-label" for="ps_lang_sel">Spelling (language)</label><select id="ps_lang_sel" data-v22="lang">${SPELL_LANGS.map(l => `<option value="${l.k}"${cur === l.k ? " selected" : ""}>${l.label} (${l.eg})</option>`).join("")}</select><p class="q-hint">Autocorrect fixes spelling to this English as you type. Your cover letters follow it too.</p></div>`;
}

/* --- Enter moves to the next box in the same section --- */
onInit(() => {
  const f = $("bForm");
  f.addEventListener("keydown", e => {
    if (e.key !== "Enter" || e.defaultPrevented || e.shiftKey || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (!t.matches || !t.matches("input, textarea, select") || t.dataset.chipIn || t.type === "checkbox" || t.type === "radio" || t.dataset.multiline) return;
    e.preventDefault();
    if (t.dataset.ask) { const b = t.closest(".bl-ask").querySelector("button"); if (b) b.click(); return; }
    if (t.dataset.suggEdit) { const b = t.closest(".s-row").querySelector("button"); if (b) b.click(); return; }
    const scope = t.closest(".b-card-body") || f;
    // skip boxes you rarely need to stop at, like the country search
    const own = [...scope.querySelectorAll("input, select, textarea")].filter(x => x === t || (!x.disabled && x.type !== "checkbox" && x.type !== "radio" && x.type !== "hidden" && !x.closest(".b-sugg, .bl-alts, .cc-pop, [hidden]") && x.getClientRects().length && (x.closest(".b-card-body") || f) === scope));
    const next = own[own.indexOf(t) + 1];
    if (next) { next.focus(); return; }
    const btn = scope.querySelector('[data-act="finish"]') || f.querySelector(".b-nav .btn.primary");
    if (btn) btn.focus();
  });
  f.addEventListener("click", e => {
    if (!e.target.closest('[data-act="undo-finish"]')) return;
    const n = builder.finNote;
    if (!n) return;
    keepOpen();
    listArr(P(), n.list)[n.i] = n.before;
    builder.open[n.list].add(n.i);
    builder.finNote = null;
    touchProfile("builder"); renderBuilder(false);
  });
});


/* --- Type-ahead boxes: job titles, employers, places of study, subjects, licences and skills --- */
// Each box can still take anything typed into it; the list just offers what people usually mean.
let uniSet = null, tafeSet = null;
const SUGGEST_SRC = {
  titles: () => [val(P().target.title), ...P().experience.map(e => val(e.title)), ...allJobTitles(), ...COMMON_TITLES],
  employers: () => [val(P().target.company), ...P().experience.map(e => val(e.org)), ...P().volunteering.map(e => val(e.org)), ...employerNames()],
  inst: () => [...P().education.map(e => val(e.inst)), ...institutionNames()],
  licence: () => [...LICENCE_OPTS, ...licenceList().filter(x => /licen[cs]e/i.test(x))],
  subject: inp => { const i = +(inp.dataset.path || "").split(".")[1], e = P().education[i] || {}; return subjectList(/subject2$/.test(inp.dataset.path || "") ? e.level2 : e.level); },
  "chip-software": () => [...Object.values(COMMON_SKILLS).flatMap(x => x.software), ...SOFTWARE, ...PROGRAMMING],
  "chip-hard": () => [...Object.values(COMMON_SKILLS).flatMap(x => x.hard), ...SKILLS.filter(s => s.kind === "hard" && !SOFTWARE.has(s.name) && !PROGRAMMING.has(s.name)).map(s => s.name)],
  "chip-certs": () => [...licenceList(), ...Object.values(COMMON_CERTS).flat()],
  "chip-soft": () => [...COMMON_SOFT, ...SKILLS.filter(s => s.kind === "soft").map(s => s.name)]
};
// short lists open as soon as you click in, like a drop-down; long ones once you start typing (or press the down arrow)
const SUGGEST_OPEN_EMPTY = new Set(["subject", "licence", "chip-certs"]);
const sugNow = { inp: null, items: [], i: -1 };
function sugItems(inp, browse) {
  const src = SUGGEST_SRC[inp.dataset.suggest];
  const have = inp.dataset.chipIn ? new Set(P().skills[inp.dataset.chipIn].map(s => s.toLowerCase())) : null;
  // the box's own value isn't a suggestion
  const seen = new Set([String(inp.value || "").trim().toLowerCase()]), list = [];
  for (const x of src ? src(inp) : []) { const k = String(x || "").trim(); if (!k || seen.has(k.toLowerCase()) || (have && have.has(k.toLowerCase()))) continue; seen.add(k.toLowerCase()); list.push(k); }
  const q = placeKey(inp.value);
  if (!q) return browse || SUGGEST_OPEN_EMPTY.has(inp.dataset.suggest) ? list.slice(0, 80) : [];
  const hits = [];
  for (const x of list) {
    const k = placeKey(x);
    const s = k === q ? 0 : k.startsWith(q) ? 1 : (" " + k).includes(" " + q) ? 2 : q.length >= 3 && k.includes(q) ? 3 : 9;
    if (s < 9) hits.push([s, x]);
  }
  return hits.sort((a, b) => a[0] - b[0] || a[1].length - b[1].length || a[1].localeCompare(b[1])).slice(0, browse ? 80 : 8).map(h => h[1]);
}
function sugSub(kind, x) {
  if (kind === "titles") { const j = jobTypeForTitle(x); return j ? jobLabel(j) : ""; }
  if (kind === "inst") {
    if (!uniSet) { uniSet = new Set(UNIVERSITIES.split(";")); tafeSet = new Set(TAFES.split(";")); }
    return uniSet.has(x) || /university/i.test(x) ? "University" : tafeSet.has(x) ? "TAFE or college" : (typeof AU_SCHOOL_PLACES === "object" && AU_SCHOOL_PLACES && AU_SCHOOL_PLACES[x]) || "";
  }
  return "";
}
function sugShow(inp, browse) {
  const box = $(inp.getAttribute("aria-controls"));
  if (!box) return;
  const items = sugItems(inp, browse);
  Object.assign(sugNow, { inp, items, i: -1 });
  if (!items.length) {
    // nothing in our list matches: say that what they typed will be used as it is
    const typed = inp.value.trim();
    if (!typed || browse) { sugClose(inp); return; }
    box.innerHTML = `<li class="pick-none" role="presentation">Not in our list? That's fine: “${esc(typed)}” will be used as you typed it${inp.dataset.chipIn ? ". Press Enter to add it" : ""}.</li>`;
    box.hidden = false; inp.setAttribute("aria-expanded", "true");
    return;
  }
  const q = inp.value.trim().toLowerCase();
  const mark = x => { const k = q ? x.toLowerCase().indexOf(q) : -1; return k >= 0 ? `${esc(x.slice(0, k))}<mark>${esc(x.slice(k, k + q.length))}</mark>${esc(x.slice(k + q.length))}` : esc(x); };
  box.innerHTML = items.map((x, k) => { const sub = sugSub(inp.dataset.suggest, x); return `<li role="option" id="${inp.id}-s${k}" data-k="${k}" aria-selected="false"><b>${mark(x)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</li>`; }).join("");
  box.hidden = false;
  inp.setAttribute("aria-expanded", "true");
  inp.removeAttribute("aria-activedescendant");
}
function sugClose(inp) {
  const box = inp && $(inp.getAttribute("aria-controls"));
  if (box) { box.hidden = true; box.innerHTML = ""; }
  if (inp) { inp.setAttribute("aria-expanded", "false"); inp.removeAttribute("aria-activedescendant"); }
  if (sugNow.inp === inp) Object.assign(sugNow, { inp: null, items: [], i: -1 });
}
function sugMove(inp, d) {
  if (sugNow.inp !== inp || !sugNow.items.length) { sugShow(inp, true); if (sugNow.inp !== inp || !sugNow.items.length) return; }
  sugNow.i = sugNow.i < 0 ? (d > 0 ? 0 : sugNow.items.length - 1) : (sugNow.i + d + sugNow.items.length) % sugNow.items.length;
  const box = $(inp.getAttribute("aria-controls"));
  box.querySelectorAll("[role=option]").forEach((li, k) => { li.classList.toggle("on", k === sugNow.i); li.setAttribute("aria-selected", String(k === sugNow.i)); if (k === sugNow.i) li.scrollIntoView({ block: "nearest" }); });
  inp.setAttribute("aria-activedescendant", `${inp.id}-s${sugNow.i}`);
}
// Picking from a list closes it and leaves the box: the input event we send must not open the list again
let sugPicking = false;
function sugPick(inp, x) {
  sugClose(inp);
  if (inp.dataset.chipIn) { inp.value = ""; inp.blur(); addChip(inp.dataset.chipIn, x); return; }
  sugPicking = true;
  try {
    inp.value = x;
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));
  } finally { sugPicking = false; }
  sugClose(inp);
  if (inp.isConnected) inp.blur();
}
onInit(() => {
  document.addEventListener("keydown", e => {
    const t = e.target;
    if (!t.matches || !t.matches("input[data-suggest]")) return;
    const open = t.getAttribute("aria-expanded") === "true";
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sugMove(t, e.key === "ArrowDown" ? 1 : -1); }
    else if (e.key === "Enter" && open && sugNow.inp === t && sugNow.i >= 0) { e.preventDefault(); e.stopPropagation(); sugPick(t, sugNow.items[sugNow.i]); }
    else if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); sugClose(t); }
    else if (e.key === "Tab") sugClose(t);
  }, true);
  document.addEventListener("input", e => { const t = e.target; if (!sugPicking && t.matches && t.matches("input[data-suggest]")) sugShow(t); });
  document.addEventListener("focusin", e => { const t = e.target; if (t.matches && t.matches("input[data-suggest]") && !t.value && SUGGEST_OPEN_EMPTY.has(t.dataset.suggest)) sugShow(t); });
  document.addEventListener("focusout", e => { const t = e.target; if (t.matches && t.matches("input[data-suggest]")) setTimeout(() => { if (document.activeElement !== t) sugClose(t); }, 0); });
  document.addEventListener("mousedown", e => { if (e.target.closest(".pick.sugg .pick-list li")) e.preventDefault(); });
  document.addEventListener("click", e => {
    const li = e.target.closest(".pick.sugg .pick-list [role=option]");
    if (!li) return;
    const inp = li.closest(".pick").querySelector("input[data-suggest]");
    if (inp && sugNow.inp === inp) sugPick(inp, sugNow.items[+li.dataset.k]);
  });
});

/* --- Autocorrect: common slips and American spellings, fixed when you leave a box (with Undo) --- */
// The browser's own spell check also underlines words as you type (and suggests fixes on right-click or long-press).
const AC_WORDS = "acheive:achieve;acheived:achieved;acheivement:achievement;acheivements:achievements;accomodate:accommodate;accomodation:accommodation;accross:across;adress:address;advertisment:advertisement;apparant:apparent;apropriate:appropriate;assistence:assistance;basicly:basically;begining:beginning;beleive:believe;buisness:business;bussiness:business;calender:calendar;carreer:career;catagory:category;collegue:colleague;collegues:colleagues;comming:coming;committment:commitment;commitee:committee;comunication:communication;competant:competent;completly:completely;concious:conscious;concientious:conscientious;convienient:convenient;correspondance:correspondence;definately:definitely;definatly:definitely;developement:development;diffrent:different;dissapoint:disappoint;efficent:efficient;embarass:embarrass;enviroment:environment;enviromental:environmental;equiptment:equipment;especialy:especially;excellant:excellent;existance:existence;experiance:experience;expirience:experience;familar:familiar;febuary:February;finaly:finally;foriegn:foreign;goverment:government;greatful:grateful;garantee:guarantee;immediatly:immediately;independant:independent;inteview:interview;knowlege:knowledge;liase:liaise;liason:liaison;maintainance:maintenance;maintenence:maintenance;managment:management;neccessary:necessary;necessery:necessary;noticable:noticeable;occassion:occasion;occassionally:occasionally;occured:occurred;occurence:occurrence;oppurtunity:opportunity;opportunty:opportunity;organistion:organisation;parliment:parliament;particulary:particularly;perseverence:perseverance;posession:possession;prefered:preferred;priviledge:privilege;proffesional:professional;profesional:professional;publically:publicly;recieve:receive;recieved:received;reccomend:recommend;recomend:recommend;refrence:reference;relevent:relevant;revelant:relevant;responsiblity:responsibility;responsable:responsible;resturant:restaurant;schedual:schedule;seperate:separate;seperately:separately;succesful:successful;successfull:successful;succesfully:successfully;supervisior:supervisor;suprise:surprise;techincal:technical;techology:technology;thurough:thorough;truely:truly;untill:until;usefull:useful;volenteer:volunteer;volenteered:volunteered;wich:which;writting:writing;writen:written;stakholder:stakeholder;stakholders:stakeholders;costumer:customer;costumers:customers;custmer:customer;custmers:customers;recieving:receiving;analysys:analysis;arguement:argument;begginning:beginning;buisnesses:businesses;dilligent:diligent;embarassed:embarrassed;enviroments:environments;excercise:exercise;facilitaed:facilitated;goverments:governments;harrass:harass;hygeine:hygiene;inital:initial;intrested:interested;labratory:laboratory;liasing:liaising;millenium:millennium;mispell:misspell;neccessarily:necessarily;occurance:occurrence;pharmacutical:pharmaceutical;questionaire:questionnaire;recieves:receives;remeber:remember;rythm:rhythm;sucess:success;tommorow:tomorrow;traning:training;trainning:training;wierd:weird";
const AC_US = "color:colour;colors:colours;colored:coloured;behavior:behaviour;behaviors:behaviours;behavioral:behavioural;favorite:favourite;favorites:favourites;honor:honour;honors:honours;honored:honoured;neighbor:neighbour;neighbors:neighbours;neighborhood:neighbourhood;center:centre;centers:centres;centered:centred;theater:theatre;fiber:fibre;liter:litre;liters:litres;catalog:catalogue;catalogs:catalogues;defense:defence;offense:offence;traveled:travelled;traveling:travelling;traveler:traveller;travelers:travellers;canceled:cancelled;canceling:cancelling;modeling:modelling;modeled:modelled;labeled:labelled;labeling:labelling;enrollment:enrolment;enrollments:enrolments;fulfill:fulfil;fulfillment:fulfilment;aluminum:aluminium;counseling:counselling;counselor:counsellor;counselors:counsellors;jewelry:jewellery;pediatric:paediatric;anesthetic:anaesthetic;orthopedic:orthopaedic;practicing:practising;cozy:cosy;skeptical:sceptical;maneuver:manoeuvre;esthetic:aesthetic;analog:analogue;dialed:dialled;fueled:fuelled;signaled:signalled;totaled:totalled;leveled:levelled";
// -ize words that Australian English spells -ise (organize → organise); "size" and "prize" are left alone
const AC_IZE = new Set("organize recognize realize specialize summarize finalize minimize maximize standardize customize categorize emphasize optimize prioritize utilize authorize capitalize criticize digitize familiarize harmonize hospitalize memorize modernize normalize stabilize symbolize synchronize visualize apologize energize mobilize monetize centralize generalize legalize localize personalize revitalize sanitize socialize strategize sympathize theorize characterize conceptualize contextualize decentralize incentivize initialize itemize jeopardize marginalize materialize patronize penalize publicize rationalize scrutinize computerize hypothesize immunize industrialize maximize mechanize mesmerize organizer recognizable".split(" "));
// The English the person writes in (Create or edit resume › Page setup). Autocorrect follows it.
const SPELL_LANGS = [
  { k: "en-AU", label: "Australian", eg: "colour, organise" },
  { k: "en-GB", label: "British", eg: "colour, organise" },
  { k: "en-NZ", label: "New Zealand", eg: "colour, organise" },
  { k: "en-CA", label: "Canadian", eg: "colour, organize" },
  { k: "en-US", label: "American", eg: "color, organize" }
];
const spellLang = () => { const l = ((typeof profile !== "undefined" && profile && profile.data && profile.data.prefs) || {}).lang; return SPELL_LANGS.some(x => x.k === l) ? l : "en-AU"; };
// The browser underlines misspellings in this English too
function applySpellLang() { const l = spellLang(); for (const id of ["bForm", "view-letter"]) { const el = $(id); if (el) el.lang = l; } }
onInit(applySpellLang);
let acMap = null, acBrit = null, acAmer = null;
function autocorrect(text, langOverride) {
  if (!acMap) {
    acMap = new Map(); acBrit = new Map(); acAmer = new Map();
    for (const pr of AC_WORDS.split(";")) { const [a, b] = pr.split(":"); if (a && b && a !== b) acMap.set(a, b); }
    for (const pr of AC_US.split(";")) { const [a, b] = pr.split(":"); if (a && b && a !== b) { acBrit.set(a, b); acAmer.set(b, a); } }
  }
  const lang = langOverride || spellLang(), american = lang === "en-US", zed = american || lang === "en-CA";
  const fixed = [];
  const keepCase = (from, to) => from === from.toUpperCase() && from.length > 1 ? to.toUpperCase() : /^[A-Z]/.test(from) ? to[0].toUpperCase() + to.slice(1) : to;
  const out = String(text || "").replace(/\b[A-Za-z][a-z]+(?:-[a-z]+)?\b/g, w => {
    const low = w.toLowerCase();
    let to = acMap.get(low) || (american ? acAmer : acBrit).get(low);
    if (!to && zed) { const m = low.match(/^(.+?)is(e|ed|es|ing|ation|ations|er|ers|able)$/); if (m && AC_IZE.has(m[1] + "ize")) to = m[1] + "iz" + m[2]; }
    if (!to && !zed) { const m = low.match(/^(.+?)iz(e|ed|es|ing|ation|ations|er|ers|able)$/); if (m && AC_IZE.has(m[1] + "ize")) to = m[1] + "is" + m[2]; }
    if (!to) { const m = zed ? low.match(/^(analy|paraly|cataly)s(e|ed|es|ing)$/) : low.match(/^(analy|paraly|cataly)z(e|ed|es|ing)$/); if (m) to = m[1] + (zed ? "z" : "s") + m[2]; }
    if (!to || to === low) return w;
    const res = keepCase(w, to);
    fixed.push([w, res]);
    return res;
  });
  return { text: out, fixed };
}
function acNote(t, fixed) {
  const host = t.closest(".q-body, .bl-item") || t.parentElement;
  if (!host) return;
  let n = host.querySelector(":scope > .ac-note");
  if (!n) { n = document.createElement("p"); n.className = "ac-note"; n.setAttribute("role", "status"); t.insertAdjacentElement("afterend", n); }
  const uniq = [...new Map(fixed.map(([a, b]) => [a + b, [a, b]])).values()].slice(0, 4);
  n.innerHTML = `Spelling fixed: ${uniq.map(([a, b]) => `${esc(a)} → ${esc(b)}`).join(", ")}${fixed.length > 4 ? " and more" : ""}. <button class="linkish" type="button" data-ac-undo="1">Undo</button>`;
}
onInit(() => {
  $("bForm").addEventListener("click", e => {
    if (!e.target.closest("[data-ac-undo]")) return;
    const u = builder.acUndo, note = e.target.closest(".ac-note");
    if (u) { const el = $(u.id); setPath(P(), u.path, el && el.dataset.lines ? u.was.split("\n") : u.was); if (el) { el.value = u.was; } builder.acUndo = null; touchProfile("builder"); previewSoon(); }
    if (note) note.remove();
  });
  $("bForm").addEventListener("input", e => { const host = e.target.closest && e.target.closest(".q-body, .bl-item"); const n = host && host.querySelector(":scope > .ac-note"); if (n && !e.target.dataset.acKeep) n.remove(); });
});
