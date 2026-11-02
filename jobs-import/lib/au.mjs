// Is a job in Australia, and which state? One shared, tested place for the location rules.

export const STATE_NAMES = { "new south wales": "NSW", victoria: "VIC", queensland: "QLD", "western australia": "WA", "south australia": "SA", tasmania: "TAS", "australian capital territory": "ACT", "northern territory": "NT" };
const CITY_STATE = {
  sydney: "NSW", parramatta: "NSW", wollongong: "NSW", "central coast": "NSW", "north sydney": "NSW", "western sydney": "NSW", penrith: "NSW", liverpool: "NSW", newcastle: "NSW", "port macquarie": "NSW", orange: "NSW", dubbo: "NSW", tamworth: "NSW", wagga: "NSW",
  melbourne: "VIC", geelong: "VIC", ballarat: "VIC", bendigo: "VIC", "mornington peninsula": "VIC", shepparton: "VIC", "latrobe valley": "VIC", traralgon: "VIC", "mount waverley": "VIC",
  brisbane: "QLD", "gold coast": "QLD", "sunshine coast": "QLD", townsville: "QLD", cairns: "QLD", toowoomba: "QLD", mackay: "QLD", rockhampton: "QLD", gladstone: "QLD", ipswich: "QLD", "mount isa": "QLD", moranbah: "QLD",
  perth: "WA", fremantle: "WA", bunbury: "WA", kalgoorlie: "WA", karratha: "WA", "port hedland": "WA", geraldton: "WA", pilbara: "WA", broome: "WA", joondalup: "WA",
  adelaide: "SA", "mount gambier": "SA", whyalla: "SA", "port augusta": "SA", "port pirie": "SA", "roxby downs": "SA",
  canberra: "ACT", hobart: "TAS", launceston: "TAS", devonport: "TAS", darwin: "NT", "alice springs": "NT", palmerston: "NT"
};
// Names that are also places overseas (Perth in Scotland, Melbourne in Florida): they only count when nothing says the job is somewhere else
const AMBIGUOUS_CITIES = new Set(["perth", "melbourne", "newcastle", "orange", "liverpool", "sydney", "adelaide", "darwin", "hobart", "wagga", "penrith", "geelong", "ballarat", "bendigo", "mackay", "ipswich", "cairns", "devonport", "launceston", "palmerston", "broome", "fremantle", "bunbury"]);
const FOREIGN = /\b(united states|usa|u\.s\.a?\.?|united kingdom|uk|england|scotland|wales|ireland|canada|india|singapore|new zealand|germany|france|netherlands|spain|italy|poland|brazil|mexico|japan|china|hong kong|philippines|south africa|nigeria|kenya|uae|dubai|saudi|israel|florida|texas|california|new york|ontario|british columbia|nova scotia|quebec|alberta|ohio|georgia|pennsylvania|maryland)\b/i;
// ", FL" or ", ON" after a place: a US state or Canadian province, not an Australian one
const FOREIGN_STATE_CODE = /,\s*(?!NSW\b|VIC\b|QLD\b|WA\b|SA\b|TAS\b|ACT\b|NT\b)[A-Z]{2}\b/;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CITY_RE = new RegExp("\\b(" + Object.keys(CITY_STATE).sort((a, b) => b.length - a.length).map(esc).join("|") + ")\\b", "i");

// "Sydney, NSW" gives "NSW". Returns "" when no state can be told.
export function extractState(text) {
  const t = String(text ?? "");
  for (const n of Object.keys(STATE_NAMES)) {
    if (!new RegExp("\\b" + n + "\\b", "i").test(t)) continue;
    // "Victoria" alone is also in Canada and the Seychelles
    if (n === "victoria" && !/\bvic\b/i.test(t) && !/australia/i.test(t) && (FOREIGN.test(t) || FOREIGN_STATE_CODE.test(t))) continue;
    if (n === "western australia" || n === "south australia" || n === "northern territory" || n === "australian capital territory" || n === "new south wales" || n === "queensland" || n === "tasmania" || n === "victoria") return STATE_NAMES[n];
  }
  const ab = t.match(/\b(NSW|VIC|QLD|TAS|ACT)\b/);
  if (ab) return ab[1];
  // WA, SA and NT are also other things (South Africa is "SA"), so they need an Australian clue
  const ab2 = t.match(/(?:^|[\s,(])(WA|SA|NT)\b/);
  if (ab2 && (/australia/i.test(t) || CITY_RE.test(t)) && !FOREIGN.test(t)) return ab2[1];
  const c = t.match(CITY_RE);
  if (c && (!AMBIGUOUS_CITIES.has(c[1].toLowerCase()) || (!FOREIGN.test(t) && !FOREIGN_STATE_CODE.test(t)))) return CITY_STATE[c[1].toLowerCase()];
  return "";
}

// A job is Australian when its place says so. A remote job counts only when it is open to Australia.
export function isAustralian({ location = "", country = "", isRemote = false, extra = "" } = {}) {
  const t = `${location} ${country}`.trim();
  const cc = String(country).trim();
  if (/^(au|aus|australia)$/i.test(cc)) return true;
  if (/\baustralia\b|\baustralian\b/i.test(t)) return true;
  if (extractState(t)) return true;
  if (isRemote || /\bremote\b|\banywhere\b|work from home/i.test(t)) return /\baustralia\b|\bANZ\b|\bAPAC\b|\bAsia[- ]Pacific\b/i.test(`${t} ${extra}`) || /\bAU\b/.test(`${t} ${extra}`);
  return false;
}

// "Sydney, NSW" gives { city: "Sydney", state: "NSW" }
export function placeParts(location, area) {
  const loc = String(location ?? "").trim();
  const state = extractState([...(area || []), loc].join(", "));
  let city = "";
  if (area && area.length >= 3) city = area[area.length - 1];
  else { const m = loc.match(CITY_RE); city = m ? m[1].replace(/\b\w/g, c => c.toUpperCase()) : loc.split(/[,(]/)[0].trim(); }
  if (/^(australia|remote|anywhere)$/i.test(city)) city = "";
  return { city: city.replace(/\s+/g, " ").trim(), state };
}
