/* ===================== Privacy safeguard: contact details never go to an AI over the internet ===================== */
// An AI reached with the person's own key is run by another company. So every request to it is cleaned first (aiScrubMessages, called from
// aiChatInner in 14-ai-engines.js, the only place a request leaves for a key's AI):
//  1. email addresses, phone numbers, street addresses, LinkedIn and other web links, ID numbers (TFN, Medicare, passport), dates of birth, and the
//     person's name are each swapped for a label such as [EMAIL_1];
//  2. the suburb and state is swapped too, on the contact line of a resume;
//  3. a second, separate check looks for the saved details in what is about to be sent, and stops the request if any is still there;
//  4. in the answer, the labels are put back, on this computer, so the letter still reads right.
// The AI in the browser (WebLLM, Transformers.js) and Chrome's built-in AI run on this computer and send nothing, so they are not cleaned.
// What is NOT removed: work history, study, skills, the job ad and the rest of what the person writes. The AI needs those to write.

const AI_PRIV = { requests: 0, removed: 0, kinds: {} };
const aiPrivListeners = new Set();
const PRIV_NAMES = { EMAIL: "email address", PHONE: "phone number", LINK: "web or LinkedIn address", ADDRESS: "street address", NAME: "name", PLACE: "suburb and state", ID: "ID number", DOB: "date of birth" };
const privEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const privWords = s => String(s).trim().split(/\s+/).map(privEsc).join("\\s+");

const PRIV_EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const PRIV_URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+|\b(?:[a-z0-9-]+\.)?(?:linkedin\.com|github\.com|gitlab\.com|behance\.net|dribbble\.com|medium\.com|twitter\.com|x\.com|instagram\.com|facebook\.com)\/[^\s<>"')\]]*|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com\.au|net\.au|org\.au|edu\.au|id\.au|dev|me|design)\b(?:\/[^\s<>"')\]]*)?/gi;
// A run of digits that looks like a phone number; privIsPhone then decides (it must start like one and be 8 to 15 digits, and not be two years)
const PRIV_PHONE_RE = /(?<![\w$.\/-])(?:\+\d{1,3}[ .-]?)?(?:\(\d{1,3}\)|\d{2,4})(?:[ .-]?\d{2,4}){1,3}(?![\w%])/g;
const PRIV_STREET_RE = /\b(?:(?:unit|apt|apartment|suite|level|lvl|shop)\s*\d+[A-Za-z]?\s*[,\/-]?\s*)?\d{1,5}[A-Za-z]?(?:\s?[-\/]\s?\d{1,5}[A-Za-z]?)?\s+(?:[A-Z][A-Za-z'’-]+\s+){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Parade|Pde|Highway|Hwy|Boulevard|Blvd|Crescent|Cres|Terrace|Tce|Way|Close|Circuit|Cct|Square|Sq)\b\.?|\bP\.?\s?O\.?\s?Box\s+\d+/g;
const PRIV_ID_RE = /\b(?:TFN|tax file number|Medicare(?: number| card)?|passport(?: number| no\.?)?)[:#\s-]*[A-Z]{0,2}\d[\d ]{5,14}\d\b/gi;
const PRIV_DOB_RE = /\b(?:DOB|date of birth|born(?: on)?)[:\s]+\d{1,2}[\/.\- ](?:\d{1,2}|[A-Za-z]{3,9})[\/.\- ]\d{2,4}\b/gi;
function privIsPhone(m) {
  const d = m.replace(/\D/g, "");
  return d.length >= 8 && d.length <= 15 && /^(?:\+|\(?0|1300|1800)/.test(m.trim()) && !/(?:19|20)\d{2}[ .-]+(?:19|20)\d{2}/.test(m);
}

// What the profile says about the person: the things to look for by name
function privKnown() {
  let p = null; try { p = typeof P === "function" ? P() : null; } catch { p = null; }
  const c = (p && p.contact) || {}, s = v => String(v == null ? "" : v).trim();
  let refs = []; try { refs = ((p && p.referees && p.referees.list) || []).filter(Boolean); } catch { refs = []; }
  const link = v => s(v).replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").replace(/\/+$/, "");
  return {
    names: [...new Set([s(c.name), ...refs.map(r => s(r.name))].filter(n => n.length >= 4))],
    emails: [...new Set([s(c.email), ...refs.map(r => s(r.email))].filter(e => /@/.test(e)).map(e => e.toLowerCase()))],
    phones: [...new Set([s(c.phone), ...refs.map(r => s(r.phone))].map(x => x.replace(/\D/g, "")).filter(d => d.length >= 8).map(d => d.slice(-9)))],
    links: [...new Set([link(c.linkedin), link(c.website)].filter(l => l.length >= 4))],
    place: s(c.location).length >= 3 ? s(c.location) : ""
  };
}

const privState = () => ({ map: new Map(), seen: new Map(), counts: {}, kinds: {}, removed: 0 });
function privToken(st, kind, value, norm) {
  const key = kind + "|" + String(norm || value).toLowerCase().replace(/\s+/g, " ");
  let t = st.seen.get(key);
  if (!t) { const n = (st.counts[kind] = (st.counts[kind] || 0) + 1); t = `[${kind}_${n}]`; st.seen.set(key, t); st.map.set(t, value); }
  st.kinds[kind] = (st.kinds[kind] || 0) + 1; st.removed++;
  return t;
}
// Trailing punctuation belongs to the sentence, not the link
const privTrail = m => { const t = (m.match(/[.,;:!?]+$/) || [""])[0]; return [t ? m.slice(0, -t.length) : m, t]; };

function privScrubText(text, st, known) {
  let t = String(text == null ? "" : text);
  if (!t) return t;
  const k = known || privKnown();
  for (const n of k.names) t = t.replace(new RegExp(`\\b${privWords(n)}\\b`, "gi"), m => privToken(st, "NAME", m, n));
  t = t.replace(PRIV_EMAIL_RE, m => privToken(st, "EMAIL", m));
  for (const l of k.links) t = t.replace(new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?${privEsc(l)}\\/?`, "gi"), m => privToken(st, "LINK", m, l));
  t = t.replace(PRIV_URL_RE, m => { const [u, tail] = privTrail(m); return privToken(st, "LINK", u) + tail; });
  for (const d of k.phones) t = t.replace(new RegExp(`(?<!\\d)(?:\\+?\\d{1,3}[ ().-]*)?0?[ ().-]*${d.split("").join("[ ().-]*")}(?!\\d)`, "g"), m => privToken(st, "PHONE", m, d));
  t = t.replace(PRIV_PHONE_RE, m => privIsPhone(m) ? privToken(st, "PHONE", m, m.replace(/\D/g, "").slice(-9)) : m);
  t = t.replace(PRIV_STREET_RE, m => privToken(st, "ADDRESS", m));
  t = t.replace(PRIV_ID_RE, m => privToken(st, "ID", m));
  t = t.replace(PRIV_DOB_RE, m => privToken(st, "DOB", m));
  // the suburb and state, only on a contact line (one that now holds a label for an email, phone or link): a job ad or a letter may say the same suburb for other reasons
  if (k.place && /\[(?:EMAIL|PHONE|LINK)_\d+\]/.test(t)) {
    const re = new RegExp(`\\b${k.place.split(/[\s,]+/).filter(Boolean).map(privEsc).join("[\\s,]+")}(?:[\\s,]+\\d{4})?\\b`, "gi");
    t = t.split("\n").map(line => /\[(?:EMAIL|PHONE|LINK)_\d+\]/.test(line) ? line.replace(re, m => privToken(st, "PLACE", m, k.place)) : line).join("\n");
  }
  return t;
}
// Put the labels back in an answer. JSON keeps its quotes safe.
function privRestore(text, st) {
  let out = String(text == null ? "" : text);
  if (!st.map.size) return out;
  const json = /^\s*[\[{]/.test(out);
  for (const [tok, val] of st.map) out = out.replace(new RegExp(`\\[?${privEsc(tok.slice(1, -1))}\\]?(?!\\d)`, "gi"), () => json ? JSON.stringify(val).slice(1, -1) : val);
  return out;
}
// The second check, written separately from the cleaning: does any saved detail appear in what is about to leave?
function privLeaks(messages, known) {
  const k = known || privKnown(), found = new Set();
  for (const m of messages) {
    const text = String(m.content || ""), low = text.toLowerCase();
    for (const e of k.emails) if (low.includes(e)) found.add("EMAIL");
    for (const l of k.links) if (low.includes(l.toLowerCase())) found.add("LINK");
    for (const n of k.names) if (new RegExp(`\\b${privWords(n)}\\b`, "i").test(text)) found.add("NAME");
    if (k.phones.length) for (const line of text.split("\n")) { const d = line.replace(/\D/g, ""); if (k.phones.some(p => d.includes(p))) found.add("PHONE"); }
  }
  return [...found];
}
// → { messages, restore(text), removed }. Throws (and sends nothing) if a saved detail is still in the cleaned messages.
function aiScrubMessages(messages) {
  const st = privState(), known = privKnown();
  const clean = messages.map(m => ({ ...m, content: typeof m.content === "string" ? privScrubText(m.content, st, known) : m.content }));
  const left = privLeaks(clean, known);
  if (left.length) throw aiError("privacy_block", `Job Finder stopped this request because it still held your ${left.map(x => PRIV_NAMES[x]).join(" and ")}. Nothing was sent.`);
  AI_PRIV.requests++; AI_PRIV.removed += st.removed;
  for (const [kind, n] of Object.entries(st.kinds)) AI_PRIV.kinds[kind] = (AI_PRIV.kinds[kind] || 0) + n;
  aiPrivRefresh();
  return { messages: clean, restore: text => privRestore(text, st), removed: st.removed };
}

/* --- Shown to the person --- */
const PRIV_SAMPLE = "Jordan Lee\nParramatta NSW | 0412 345 678 | jordan.lee@example.com | linkedin.com/in/jordan-lee | jordanlee.dev\n12 Smith Street, Parramatta NSW 2150\n\nEXPERIENCE\nWeekend Team Leader | Harbourside Grocers | 2023 to now\n- Cut Saturday queue times by 30% with a floating cashier";
// What would be sent for the person's own resume (or a sample if there isn't one yet), with the details swapped out
function aiPrivacyPreview() {
  let text = "", own = false;
  try { if (typeof hasProfile === "function" && hasProfile(P())) { text = profileToText(P()); own = true; } } catch { text = ""; }
  if (!text.trim()) text = PRIV_SAMPLE;
  const st = privState(), clean = privScrubText(text, st, own ? undefined : { names: ["Jordan Lee"], emails: [], phones: [], links: [], place: "Parramatta NSW" });
  return { own, text: clean, kinds: st.kinds, removed: st.removed };
}
const PRIV_PLURAL = { EMAIL: "email addresses", PHONE: "phone numbers", LINK: "web or LinkedIn addresses", ADDRESS: "street addresses", NAME: "names", PLACE: "suburbs and states", ID: "ID numbers", DOB: "dates of birth" };
const privKindsText = kinds => Object.entries(kinds).map(([k, n]) => `${n} ${n === 1 ? PRIV_NAMES[k] || k.toLowerCase() : PRIV_PLURAL[k] || k.toLowerCase()}`).join(", ");
// The one-line note on the cover letter page and the counter on Choose your AI
function aiPrivNote() {
  const e = aiCfg.engine;
  if (e === "key" && aiUsable("key")) return `Your email, phone, address, links and name are taken out before anything goes to ${AI_NAME()}, and put back here.`;
  if (e === "webllm" || e === "tfjs") return "This AI runs on your computer, so nothing you write is sent anywhere.";
  if (e === "chrome" || e === "auto") return `${BROWSER_AI()} runs on your computer, so nothing you write is sent anywhere.`;
  return "No AI over the internet is in use, so nothing is sent anywhere.";
}
function aiPrivRefresh() {
  const n = document.getElementById("ltPriv");
  if (n) n.innerHTML = `${esc(aiPrivNote())} <button class="linkish" type="button" data-ai-priv>How this works</button>`;
  const s = document.getElementById("aicPrivStats");
  if (s) s.textContent = AI_PRIV.requests ? `This visit: ${AI_PRIV.requests} request${AI_PRIV.requests === 1 ? "" : "s"} sent to your AI with ${AI_PRIV.removed} personal detail${AI_PRIV.removed === 1 ? "" : "s"} taken out${AI_PRIV.removed ? ` (${privKindsText(AI_PRIV.kinds)})` : ""}. None of them were sent.` : "Nothing has been sent to an AI over the internet this visit.";
  aiPrivListeners.forEach(fn => { try { fn(); } catch { /* a closed page */ } });
}
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("[data-ai-priv]");
  if (!a) return;
  openView("connect");
  setTimeout(() => { const p = document.getElementById("aicPriv"); if (p) { p.open = true; p.scrollIntoView({ block: "center" }); } }, 150);
});
aiChangeListeners.add(aiPrivRefresh);
