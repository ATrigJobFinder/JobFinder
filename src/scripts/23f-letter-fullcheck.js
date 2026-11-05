/* ===================== Version 23: check the whole cover letter with AI (repeated words, long sentences, ideas said twice) ===================== */
// The AI reads all five paragraphs together and fixes just those three things. The changes go straight into the letter,
// and the original is kept so any paragraph (or all of it) can be put back, like the changes in Tailor to resume.

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

const LF_NANO = `You edit a whole Australian cover letter so it reads cleanly. You are given its paragraphs, numbered.
Fix only these three things:
1. Repeated words: the same word or phrase (not small words like "the" or "and") used again and again, or several sentences starting with the same word. Use other words.
2. Long sentences: any sentence over 28 words. Shorten it or split it in two.
3. Ideas said twice: two sentences, or two paragraphs, that say the same thing. Say it once, in the paragraph where it belongs, and change or cut the other.
Rules:
- Keep every fact, number, name and [bracketed gap] exactly as given. Add nothing new: no new jobs, skills, numbers, companies or dates.
- Keep the paragraphs in the same order, each doing its own job. Each stays ONE paragraph of full sentences in the first person, with no dashes and no exclamation marks.
- Each paragraph stays within about 15% of its length (it may be shorter if an idea was said twice).
- A paragraph that needs no change is returned exactly as given.
- Never write a phone number, email address, link or LinkedIn.
Reply with JSON only: {"paragraphs": ["...", "...", "...", "...", "..."], "changes": ["one short plain sentence for each change, saying which paragraph"]}`;

const ltFull = { busy: false, orig: null, after: null, changes: [], via: "", msg: "", found: null };

function lfCheck(d, orig) {
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
    const hp = hardPhrase(t); if (hp) return { ok: false, why: `paragraph ${i + 1} uses "${hp}", which recruiters skip` };
    const pr = proseOk(t.replace(/\s*(\[[^\]]*\]|\{[^}]*\})\s*$/, ".")); if (pr) return { ok: false, why: `paragraph ${i + 1}: ${pr}` };
    if (/—|!/.test(t)) return { ok: false, why: `paragraph ${i + 1} has a long dash or an exclamation mark` };
    const w = wordCount(t), ow = wordCount(o);
    if (w < ow * 0.6 || w > ow * 1.2 + 5) return { ok: false, why: `paragraph ${i + 1} has ${w} words but should stay near ${ow}` };
    const gapsOf = x => (x.match(TOKEN_RE) || []).sort().join("|");
    if (gapsOf(t) !== gapsOf(o)) return { ok: false, why: `paragraph ${i + 1} changed a [bracketed gap]: keep every one exactly as it was` };
    const badNum = numsOf(t).find(n => !okNums.has(n) && !/^(19|20)\d{2}$/.test(n)); if (badNum) return { ok: false, why: `paragraph ${i + 1} has the number ${badNum}, which isn't in the letter or profile` };
    const badSkill = [...skillSet(t)].find(s => !have.has(s) && (SKILLS.find(k => k.name === s) || {}).kind === "hard"); if (badSkill) return { ok: false, why: `paragraph ${i + 1} mentions ${badSkill}, which isn't in the profile` };
  }
  return { ok: true, value: { paragraphs: arr, changes: (Array.isArray(d.changes) ? d.changes : []).map(x => ltClean(x)).filter(Boolean).slice(0, 12) } };
}

function lfRender() {
  const box = $("ltAiOut"), btn = $("ltAiCheck");
  if (!box || !btn) return;
  const own = blText().length > 0;
  btn.disabled = ltFull.busy || !own;
  const f = ltFull;
  if (f.busy) { box.innerHTML = `<p class="progress">${esc(f.msg)}</p>`; return; }
  if (!f.orig) { box.innerHTML = f.msg ? `<p class="small muted">${f.msg}</p>` : ""; return; }
  const parts = BL().parts, rows = f.orig.map((o, k) => ({ k, o, a: f.after[k], now: parts[k].text })).filter(r => r.o !== r.a);
  const status = r => r.now === r.a ? "changed" : r.now === r.o ? "reverted" : "edited";
  const nChanged = rows.filter(r => status(r) === "changed").length, nBack = rows.filter(r => status(r) === "reverted").length;
  box.innerHTML = `<div class="lf-card">
    <div class="lf-top"><b>${nChanged ? `Tidied ${nChanged} paragraph${nChanged === 1 ? "" : "s"}` : nBack ? "Back to your original letter" : "Your edits are in"}</b>${f.via ? `<span class="small muted"> by ${esc(viaWords(f.via))}</span>` : ""}</div>
    ${f.changes.length ? `<ul class="lf-changes">${f.changes.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    <ul class="lf-rows">${rows.map(r => `<li><span>Paragraph ${r.k + 1}: ${esc(partOf(parts[r.k].part).label.toLowerCase())}</span>${status(r) === "changed" ? `<button class="btn" type="button" data-lf="back" data-k="${r.k}">Go back to my original</button>` : status(r) === "reverted" ? `<button class="btn" type="button" data-lf="again" data-k="${r.k}">Use the checked wording again</button>` : `<span class="small muted">you've edited it since</span>`}</li>`).join("")}</ul>
    <div class="b-actions">${nChanged > 1 ? `<button class="btn" type="button" data-lf="back-all">Go back to my original letter</button>` : ""}${nBack > 1 ? `<button class="btn" type="button" data-lf="again-all">Use the checked letter again</button>` : ""}<button class="linkish" type="button" data-lf="close">Close</button></div></div>`;
}

async function lfRun() {
  if (ltFull.busy || lwBusy) return;
  const parts = BL().parts, orig = parts.map(p => p.text);
  if (!orig.some(t => t.trim())) { ltFull.msg = "Write your letter first."; lfRender(); return; }
  const found = lfScan(orig), known = lfSummary(found);
  Object.assign(ltFull, { busy: true, orig: null, after: null, changes: [], msg: "Reading the whole letter…", found });
  lfRender();
  const show = m => { ltFull.msg = m; const b = $("ltAiOut"); if (b && ltFull.busy) b.innerHTML = `<p class="progress">${esc(m)}</p>`; };
  const prompt = `${orig.map((t, i) => `Paragraph ${i + 1} (${partOf(parts[i].part).label}):\n${t || "(empty)"}`).join("\n\n")}\n\nRole: ${ltTemplate() ? "[the role]" : BL().role || "(not given)"}\nCompany: ${ltTemplate() ? "[the company]" : BL().company || "(not given)"}${ltTemplate() ? LT_NO_NAMES : ""}${known.length ? `\nProblems already found: ${known.join("; ")}.` : ""}`;
  const res = await aiJSON({ nano: LF_NANO, full: LF_NANO + "\n\n" + CL_CRAFT_SHORT, label: "Checking your letter", progress: show, prompt,
    expect: Math.round(wordCount(orig.join(" ")) * 7 * 1.3) + 400,
    schema: { type: "object", properties: { paragraphs: { type: "array", items: { type: "string" } }, changes: { type: "array", items: { type: "string" } } }, required: ["paragraphs", "changes"] },
    check: d => lfCheck(d, orig) });
  ltFull.busy = false;
  if (!res.data) {
    ltFull.msg = `${esc(aiMissWords(res))} ${known.length ? `The checks found ${esc(listJoin(known))}, so they need fixing by hand (try Reword as… on a paragraph).` : "Nothing obvious needed fixing."}${aiRawHtml(res)}`;
    lfRender(); return;
  }
  const { paragraphs, changes } = res.data;
  const changed = paragraphs.map((t, i) => t !== orig[i] ? i : -1).filter(i => i >= 0);
  if (!changed.length) { ltFull.msg = `${esc(viaWords(res.via))} read the whole letter and found nothing to fix. No repeated words, long sentences or doubled-up ideas.`; lfRender(); return; }
  for (const i of changed) lwApply(i, paragraphs[i]);
  Object.assign(ltFull, { orig, after: paragraphs, changes, via: res.via, msg: "" });
  lfRender();
  const el = $("ltAiOut"); if (el) el.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
}
function lfSet(ks, which) {
  const f = ltFull;
  for (const k of ks) { const want = which === "back" ? f.orig[k] : f.after[k]; if (BL().parts[k].text !== want) lwApply(k, want); }
  lfRender();
}
onInit(() => {
  const b = $("ltAiCheck");
  if (!b) return;
  b.addEventListener("click", lfRun);
  $("ltAiOut").addEventListener("click", e => {
    const t = e.target.closest("[data-lf]");
    if (!t || !ltFull.orig) return;
    const act = t.dataset.lf, all = ltFull.orig.map((o, k) => k).filter(k => ltFull.orig[k] !== ltFull.after[k]);
    const parts = BL().parts;
    if (act === "back") lfSet([+t.dataset.k], "back");
    else if (act === "again") lfSet([+t.dataset.k], "after");
    else if (act === "back-all") lfSet(all.filter(k => parts[k].text === ltFull.after[k]), "back");
    else if (act === "again-all") lfSet(all.filter(k => parts[k].text === ltFull.orig[k]), "after");
    else if (act === "close") { ltFull.orig = null; ltFull.msg = ""; lfRender(); }
  });
  // the button follows whether there's a letter to check
  const sync = () => { if (currentView === "letter") lfRender(); };
  onProfile(sync);
  baseLetter.on(sync);
});
