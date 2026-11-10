/* ===================== Version 23: the whole-letter check, run by Write all ===================== */
// After Write all writes a letter for a specific job, the AI (the stronger model, not the small one) reads all five paragraphs together and fixes every
// problem listed under "Before you send it", plus the repeated words, long sentences and ideas said twice. It is no longer a section or button on the page:
// Write all runs it (lfRun), and its progress shows in the line under Write all.

const LF_LONG = 28;   // a sentence over this many words is long
const lfWords = t => (String(t).toLowerCase().match(/[a-z][a-z'’-]{3,}/g) || []).filter(w => !STOP.has(w));
const lfGapFree = t => String(t).replace(TOKEN_RE, " ");

// What's wrong with the letter as it stands, found without AI: { repeats, longs, doubles }
function lfScan(texts) {
  const out = { repeats: [], longs: [], doubles: [] };
  const all = texts.map(lfGapFree);
  // words used again and again across the letter
  const role = new Set(lfWords([BL().role, BL().company, P().contact.name].join(" ")));
  const count = {};
  for (const t of all) for (const w of lfWords(t)) if (!role.has(w)) count[w] = (count[w] || 0) + 1;
  out.repeats = Object.entries(count).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w, n]) => `“${w}” ${n} times`);
  // sentences that begin with the same word three or more times in one paragraph
  texts.forEach((t, i) => { const starts = {}; for (const s of sentencesOf(lfGapFree(t).trim()).filter(Boolean)) { const w = (s.match(/^[A-Za-z']+/) || [""])[0].toLowerCase(); if (w && !/^(i|my)$/.test(w)) starts[w] = (starts[w] || 0) + 1; } for (const [w, n] of Object.entries(starts)) if (n >= 3) out.repeats.push(`paragraph ${i + 1}: ${n} sentences start with “${w}”`); });
  // long sentences
  texts.forEach((t, i) => { for (const s of sentencesOf(t.trim()).filter(Boolean)) if (wordCount(lfGapFree(s)) > LF_LONG) out.longs.push({ i, s, n: wordCount(lfGapFree(s)) }); });
  // two sentences saying nearly the same thing
  const sents = texts.flatMap((t, i) => sentencesOf(t.trim()).filter(x => wordCount(x) >= 6).map(s => ({ i, s, w: new Set(lfWords(lfGapFree(s))) })));
  for (let a = 0; a < sents.length; a++) for (let b = a + 1; b < sents.length; b++) {
    const A = sents[a], B = sents[b], common = [...A.w].filter(w => B.w.has(w)).length, small = Math.min(A.w.size, B.w.size);
    if (small >= 5 && common / small >= 0.6) out.doubles.push({ a: A, b: B });
  }
  return out;
}
const lfSummary = f => [f.repeats.length ? `repeated words (${f.repeats.slice(0, 3).join(", ")})` : "", f.longs.length ? `${f.longs.length} long sentence${f.longs.length === 1 ? "" : "s"}` : "", f.doubles.length ? `${f.doubles.length} idea${f.doubles.length === 1 ? "" : "s"} said twice` : ""].filter(Boolean);

const LF_NANO = `You edit a whole Australian cover letter so it reads cleanly and persuasively. You are given its paragraphs, numbered, and a list of problems the letter checks found.
Do these things:
1. Fix EVERY problem in the list you are given, in the paragraph it names. Each problem says what is wrong, so change the words that cause it.
2. Repeated words: the same word or phrase (not small words like "the" or "and") used again and again, or several sentences starting with the same word. Use other words.
3. Long sentences: any sentence over 28 words. Shorten it or split it in two.
4. Ideas said twice: two sentences, or two paragraphs, that say the same thing. Say it once, in the paragraph where it belongs, and change or cut the other.
5. Anything else you think would make the letter better: a vague sentence, a stiff phrase, a weak opening, an unclear link between paragraphs, a missed chance to use a fact from the details. Use judgement, and change only what helps.
Rules:
- Keep every fact, number, name and [bracketed gap] exactly as given. Use only the details given: no new jobs, skills, numbers, companies or dates. A project, award or scholarship stays with the university it belongs to. Say "major project", never "thesis".
- Keep the paragraphs in the same order, each doing its own job. Each stays ONE paragraph of full sentences in the first person, with no dashes and no exclamation marks.
- Each paragraph stays within about 15% of its length. A paragraph listed as too short may grow by up to about 30%, using only the details given. It may be shorter if an idea was said twice.
- A paragraph that needs no change is returned exactly as given.
- Never write a phone number, email address, link or LinkedIn.
Reply with JSON only: {"paragraphs": ["...", "...", "...", "...", "..."], "changes": ["one short plain sentence for each change, saying which paragraph"]}`;

const ltFull = { busy: false, orig: null, after: null, changes: [], via: "", msg: "", found: null, autoNote: "" };

// How many rules a set of five paragraphs breaks: each warning listed under "Before you send it" (the clichés, dashes, repeated words and so on,
// the checks on names, dates and length), plus each paragraph that is too short and a whole letter outside its word range
function ltProblemCount(texts) {
  const d = BL(), was = d.parts.map(p => p.text);
  try {
    texts.forEach((t, i) => { if (d.parts[i]) d.parts[i].text = t; });
    const r = letterRange(), src = profileToText(P()) + "\n" + (d.role || "") + " " + (d.company || "") + "\n" + String(ltPlan().salary || "");
    const rows = coverQuality(texts, src, { allowSalary: !!ltPlan().salary }).concat(ltIssueRows()).length;
    const thin = d.parts.filter(p => p.text.trim() && wordCount(p.text) < partMin(p.part, r)).length, total = wordCount(texts.join(" "));
    return rows + thin + (total && (total < r[0] || total > r[1]) ? 1 : 0);
  } finally { was.forEach((t, i) => { if (d.parts[i]) d.parts[i].text = t; }); }
}
// lenient: the facts are still checked (names, numbers, skills, gaps, contact details), but the style rules are not: those are counted instead
function lfCheck(d, orig, lenient = false) {
  const arr = Array.isArray(d && d.paragraphs) ? d.paragraphs.map(x => ltClean(x)) : [];
  if (arr.length !== orig.length) return { ok: false, why: `return exactly ${orig.length} paragraphs, in the same order` };
  const src = [profileToText(P()), BL().role, BL().company, orig.join("\n")].join("\n");
  const okNums = new Set(numsOf(src)), have = skillSet(src);
  for (let i = 0; i < arr.length; i++) {
    const t = arr[i], o = orig[i], part = BL().parts[i].part;
    if (!o.trim()) { if (t) return { ok: false, why: `paragraph ${i + 1} was empty: leave it empty` }; continue; }
    if (!t) return { ok: false, why: `paragraph ${i + 1} is missing` };
    if (t === o) continue;
    const ct = contactIn(t, part); if (ct) return { ok: false, why: `paragraph ${i + 1}: ${contactWhy(ct, part)}` };
    if (!lenient) {
      const hp = hardPhrase(t); if (hp) return { ok: false, why: `paragraph ${i + 1} uses "${hp}", which recruiters skip` };
      const pr = proseOk(t.replace(/\s*(\[[^\]]*\]|\{[^}]*\})\s*$/, ".")); if (pr) return { ok: false, why: `paragraph ${i + 1}: ${pr}` };
      if (/—|!/.test(t)) return { ok: false, why: `paragraph ${i + 1} has a long dash or an exclamation mark` };
    }
    const w = wordCount(t), ow = wordCount(o);
    if (w < ow * 0.6 || w > ow * 1.35 + 5) return { ok: false, why: `paragraph ${i + 1} has ${w} words but should stay near ${ow}` };
    const gapsOf = x => (x.match(TOKEN_RE) || []).sort().join("|");
    if (gapsOf(t) !== gapsOf(o)) return { ok: false, why: `paragraph ${i + 1} changed a [bracketed gap]: keep every one exactly as it was` };
    const badNum = numsOf(t).find(n => !okNums.has(n) && !/^(19|20)\d{2}$/.test(n)); if (badNum) return { ok: false, why: `paragraph ${i + 1} has the number ${badNum}, which isn't in the letter or profile` };
    const badSkill = [...skillSet(t)].find(s => !have.has(s) && (SKILLS.find(k => k.name === s) || {}).kind === "hard"); if (badSkill) return { ok: false, why: `paragraph ${i + 1} mentions ${badSkill}, which isn't in the profile` };
  }
  return { ok: true, value: { paragraphs: arr, changes: (Array.isArray(d.changes) ? d.changes : []).map(x => ltClean(x)).filter(Boolean).slice(0, 12) } };
}

// Everything listed under "Before you send it" (the last time the page was drawn), one line each, saying which paragraph it is in
function lfProblems() {
  const parts = BL().parts, r = letterRange(), out = [];
  for (const q of (typeof ltQualityNow !== "undefined" ? ltQualityNow : [])) {
    const where = (q.where || []).map(i => `paragraph ${i + 1}`).join(", ");
    const asks = (q.fixes || []).map(f => `${f.ask || ""}`).filter(Boolean);
    out.push(`${q.title}${where ? ` (${where})` : ""}: ${q.ask || asks[0] || q.detail}`);
  }
  parts.forEach((p, i) => { if (p.text.trim() && wordCount(p.text) < partMin(p.part, r)) out.push(`Too short (paragraph ${i + 1}, ${wordCount(p.text)} words, it needs at least ${partMin(p.part, r)}): add detail from the details given.`); });
  const total = wordCount(parts.map(p => p.text).join(" "));
  if (total > r[1]) out.push(`The whole letter is ${total} words: trim it to ${r[1]} words or fewer.`); else if (total && total < r[0]) out.push(`The whole letter is ${total} words: it needs about ${r[0]} to ${r[1]}.`);
  return out.slice(0, 20);
}
// o: { into (an element that also shows the progress and the result, e.g. the line under Write all), auto (it was started by Write all) }
async function lfRun(o = {}) {
  if (ltFull.busy || lwBusy) return;
  const into = o.into || null;
  const parts = BL().parts, orig = parts.map(p => p.text);
  if (!orig.some(t => t.trim())) { ltFull.msg = "Write your letter first."; return; }
  const found = lfScan(orig), known = lfSummary(found), listed = lfProblems();
  Object.assign(ltFull, { busy: true, orig: null, after: null, changes: [], msg: "Reading the whole letter…", found });
  const show = m => { ltFull.msg = m; if (into && ltFull.busy) into.textContent = `${o.lead || ""}${m}`; };
  const before = ltProblemCount(orig);
  const prompt = `${orig.map((t, i) => `Paragraph ${i + 1} (${partOf(parts[i].part).label}):\n${t || "(empty)"}`).join("\n\n")}\n\nRole: ${ltTemplate() ? "[the role]" : BL().role || "(not given)"}\nCompany: ${ltTemplate() ? "[the company]" : BL().company || "(not given)"}${ltTemplate() ? LT_NO_NAMES : ""}${listed.length ? `\n\nProblems found by the letter checks (fix every one):\n${listed.map((t, k) => `${k + 1}. ${t}`).join("\n")}` : ""}${known.length ? `\nAlso found: ${known.join("; ")}.` : ""}\n\nDetails you may use (and nothing else):\n${profileToText(P()).slice(0, 3500)}`;
  const res = await aiJSON({ nano: LF_NANO, full: LF_NANO + "\n\n" + CL_CRAFT_SHORT, label: "Checking your letter", tier: "big", progress: show, prompt,
    expect: Math.round(wordCount(orig.join(" ")) * 7 * 1.3) + 400,
    schema: { type: "object", properties: { paragraphs: { type: "array", items: { type: "string" } }, changes: { type: "array", items: { type: "string" } } }, required: ["paragraphs", "changes"] },
    check: d => lfCheck(d, orig) });
  ltFull.busy = false;
  let data = res.data, via = res.via, rule = "";
  // The reply broke a rule, so it was not used as it stood. But a letter that breaks FEWER rules than the one you have is better, so it goes in
  // (the facts are still checked: nothing new about names, numbers, skills, gaps or contact details).
  let worse = null;
  if (!data && res.raw && Array.isArray(res.raw.paragraphs)) {
    const soft = lfCheck(res.raw, orig, true);
    if (soft.ok) {
      const after = ltProblemCount(soft.value.paragraphs);
      if (after < before) { data = soft.value; via = res.rawVia === "chrome" ? "chrome" : "big"; rule = `It still breaks ${after} rule${after === 1 ? "" : "s"}, down from ${before}.`; }
      else worse = { after, before };
    }
  }
  if (!data) {
    const why = worse ? ` Its letter would still break ${worse.after} rule${worse.after === 1 ? "" : "s"}, and yours breaks ${worse.before}, so it wasn't used.` : "";
    ltFull.msg = `${esc(aiMissWords(res))}${esc(why)} ${known.length ? `The checks found ${esc(listJoin(known))}, so they need fixing by hand (use Reword on a paragraph).` : "Nothing obvious needed fixing."}${aiRawHtml(res)}`;
    ltFull.autoNote = worse ? `The AI's fix wasn't better (it broke ${worse.after} rules, your letter ${worse.before}), so your letter is as written.` : "The AI couldn't fix the listed problems this time.";
    return;
  }
  const { paragraphs, changes } = { paragraphs: data.paragraphs, changes: rule ? [...data.changes, rule] : data.changes };
  const changed = paragraphs.map((t, i) => t !== orig[i] ? i : -1).filter(i => i >= 0);
  if (!changed.length) { ltFull.msg = `${esc(viaWords(via))} read the whole letter and found nothing it could improve without adding new facts.`; ltFull.autoNote = "It found nothing more to fix."; return; }
  for (const i of changed) lwApply(i, paragraphs[i]);
  Object.assign(ltFull, { orig, after: paragraphs, changes, via, msg: "" });
  // the page was redrawn with the new words: what is still listed under "Before you send it"?
  const left = lfProblems().length;
  ltFull.autoNote = `Then it fixed the letter: ${before} rule${before === 1 ? "" : "s"} broken before, ${left} now.`;
  if (listed.length) ltFull.changes = [...changes, left ? `${left} thing${left === 1 ? " is" : "s are"} still listed under “Before you send it”: use Reword on ${left === 1 ? "it" : "them"}.` : "Nothing is listed under “Before you send it” any more."];
}
/* ===================== A template: after Write all, the small model rewords one sentence for each problem ===================== */
// For a letter that is a template for any job, Write all is followed by a quick pass with the SMALL model (Gemini 3.5 Flash-Lite, tier "small"):
// for each problem listed under "Before you send it" it rewords ONE sentence the problem is about, and keeps the new wording only if the letter then
// breaks fewer rules. Nothing else in the letter is touched. A link in the status line undoes all of it.
// SWITCHED OFF: the small model no longer touches a template after Write all. The letter is left exactly as Write all wrote it, and the problems
// are shown in soft yellow in their paragraphs (see lwBack) for the person to fix with Reword. Set LT_TEMPLATE_FIX to true to bring this back.
const LT_TEMPLATE_FIX = false;
const ltFix = { before: null };
// Up to three other wordings of one sentence of paragraph i that deal with `ask`; each is checked → [sentence, ...]
async function ltRewordSentence(i, sel, ask, progress) {
  const d = BL(), p = d.parts[i], sents = ltSentences(p.text), scope = (sents[sel] || "").trim();
  if (!scope) return [];
  const orig = wordCount(scope), seen0 = new Set([norm(scope)]), srcNums = new Set(numsOf(scope));
  const bad = (t, seen) => {
    const ct = contactIn(t, p.part); if (ct) return contactWhy(ct, p.part);
    const hp = hardPhrase(t); if (hp) return `it uses "${hp}"`;
    if (/\n/.test(t) || ltSentences(t).length !== 1) return "it must be exactly one sentence";
    if (!/[.]["”']?$/.test(t)) return "it must end with a full stop";
    if (/—|!/.test(t)) return "it uses a long dash or an exclamation mark";
    if (wordCount(t) < orig * 0.6 - 2 || wordCount(t) > orig * 1.4 + 4) return `it isn't close enough to ${orig} words`;
    if (changedWords(scope, t) < 2) return "it only changes one word";
    if (numsOf(t).some(n => !srcNums.has(n))) return "it has a number that isn't in the sentence";
    if (seen.has(norm(t))) return "it repeats another version";
    return "";
  };
  const nano = LT_REWORD_ONE_NANO;
  const res = await aiJSON({ nano, full: nano + "\n\n" + CL_CRAFT, label: "Rewording", tier: "small", progress,
    prompt: `This is one sentence from the "${partOf(p.part).label}" paragraph of a cover letter. Reword only this sentence.\nSentence:\n${scope}\nThe whole paragraph, for context only (do not copy other sentences into it):\n${p.text}\nAbout ${orig} words.\nChange it like this: ${ask}${LT_NO_NAMES}`,
    expect: orig * 7 * 3 + 150, schema: { type: "object", properties: { options: { type: "array", items: { type: "string" } } }, required: ["options"] },
    check: x => {
      const seen = new Set(seen0), why = [], ok = [];
      for (const t0 of (Array.isArray(x.options) ? x.options : [])) { const t = clNoContractions(ltClean(t0)); if (!t) continue; const w = bad(t, seen); if (w) why.push(w); else { seen.add(norm(t)); ok.push(t); } }
      return ok.length ? { ok: true, value: ok.slice(0, 3) } : { ok: false, why: why[0] || "write 3 different versions of the sentence" };
    } });
  return res.data || [];
}
async function ltTemplateFix(st, lead = "") {
  const d = BL(), before = d.parts.map(p => p.text), start = ltProblemCount(before);
  ltFix.before = before.slice();
  const rows = (typeof ltQualityNow !== "undefined" ? ltQualityNow : []).filter(q => q.fix === "reword" && (q.where || []).length).map(q => q.title);
  let done = 0, tried = 0;
  for (const title of rows) {
    const q = ltQualityNow.find(x => x.title === title);   // (the page was redrawn after the last change: look the problem up again)
    if (!q) continue;
    const i = (q.where || []).find(k => ltFixTarget(q, k, d.parts[k].text).sel >= 0);
    if (i == null) continue;
    const t = ltFixTarget(q, i, d.parts[i].text);
    tried++;
    if (st) st.textContent = `${lead}Fixing “${title}” with ${aiProvider().small || "the small model"} (${tried} of ${rows.length})…`;
    let options = [];
    try { options = await ltRewordSentence(i, t.sel, t.ask, m => { if (st) st.textContent = `${lead}${m}`; }); } catch { options = []; }
    const sents = ltSentences(d.parts[i].text), now = ltProblemCount(d.parts.map(x => x.text));
    for (const opt of options) {
      const text = sents.map((x, k) => k === t.sel ? opt + (x.match(/\s*$/) || [""])[0] : x).join("");
      const texts = d.parts.map((x, k) => k === i ? text : x.text);
      if (ltProblemCount(texts) < now) { lwApply(i, text); done++; break; }   // kept only if the letter breaks fewer rules
    }
  }
  const end = ltProblemCount(d.parts.map(x => x.text));
  const msg = done ? `Then ${aiProvider().small || "the small model"} reworded ${done} sentence${done === 1 ? "" : "s"} for the problems under “Before you send it”: ${start} rule${start === 1 ? "" : "s"} broken before, ${end} now. ` : tried ? "I tried to fix the problems under “Before you send it”, but no rewording broke fewer rules, so the letter is as written. " : "";
  if (st) { st.innerHTML = `${esc(lead)}${esc(msg)}${done ? '<button class="linkish" type="button" data-lt-fixundo="1">Undo these fixes</button>' : ""}`; }
  return done;
}
onInit(() => {
  document.addEventListener("click", e => {
    if (!e.target.closest || !e.target.closest("[data-lt-fixundo]") || !ltFix.before) return;
    ltFix.before.forEach((t, i) => { if (BL().parts[i] && BL().parts[i].text !== t) lwApply(i, t); });
    ltFix.before = null;
    const el = e.target.closest("[data-lt-fixundo]"); if (el.parentElement) el.parentElement.textContent = "Put back the letter as Write all wrote it.";
  });
});
