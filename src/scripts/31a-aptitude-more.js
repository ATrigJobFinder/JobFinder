/* ===================== Aptitude tests: the test library, and four more that employers commonly use ===================== */
// Mechanical reasoning, spatial reasoning, error checking and memory join the six in 30 and 31. Every question is made up fresh each time.
// "Style" names say what the format is like; these are our own practice questions, not the questions of any test publisher.

/* --- How each test is labelled in the library --- */
Object.assign(APT_TYPES.find(t => t.key === "numerical"), { group: "Reasoning", style: "Like SHL and Saville numerical tests", real: "Charts and tables, calculator allowed, about a minute a question." });
Object.assign(APT_TYPES.find(t => t.key === "verbal"), { group: "Reasoning", style: "Like SHL and Cut-e verbal tests", real: "A short passage, then True, False or Cannot say." });
Object.assign(APT_TYPES.find(t => t.key === "logical"), { group: "Reasoning", style: "Number sequences and deduction", real: "Find the rule, or decide what must follow from the statements." });
Object.assign(APT_TYPES.find(t => t.key === "abstract"), { group: "Reasoning", style: "Like inductive and Raven's-style tests", real: "Shapes in a sequence, then pick the one that comes next." });
Object.assign(APT_TYPES.find(t => t.key === "sjt"), { group: "Judgement and speed", style: "Like graduate and public service judgement tests", real: "A work scenario, then choose the most effective response." });
Object.assign(APT_TYPES.find(t => t.key === "speed"), { group: "Judgement and speed", style: "Like the Criteria CCAT", real: "A fast mix of maths, words and logic. Most people don't finish." });
APT_TYPES.push(
  { key: "spatial", name: "Spatial reasoning", n: 8, secs: 480, group: "Reasoning", style: "Like spatial and diagrammatic tests", real: "Turn a shape in your head and pick the match.",
    measures: "Picturing a shape turned around, and telling a turned shape from a flipped one.",
    who: "Engineering, architecture, trades apprenticeships, defence and pilot selection.",
    tips: ["Pick one feature of the target, like a long arm or a corner notch, and follow it through each option.", "Turning is allowed; flipping over is not. A flipped shape looks like a mirror image and can never be turned to fit.", "Rule out options by counting squares in each row and column first.", "Turn the page or your head if you're allowed to; on screen, turn it in your mind one quarter turn at a time.", "Don't spend more than about a minute: pick the best fit and move on."] },
  { key: "mechanical", name: "Mechanical reasoning", n: 10, secs: 600, group: "Practical and office", style: "Like trades, defence and police aptitude tests", real: "Levers, gears, pulleys and simple circuits in short problems.",
    measures: "How levers, gears, pulleys, hydraulics and simple circuits behave.",
    who: "Trades and apprenticeships, defence, police, manufacturing, mining and utilities.",
    tips: ["Levers balance when force × distance is equal on both sides.", "Meshed gears turn in opposite directions; a gear between them (an idler) keeps the direction the same. A smaller driven gear turns faster.", "With an ideal pulley system, the force needed = load ÷ the number of rope sections holding the load.", "In a hydraulic system, pressure is the same everywhere: force = pressure × area.", "Parallel resistors give less than the smallest one; series resistors just add."] },
  { key: "errorcheck", name: "Error checking", n: 10, secs: 240, group: "Practical and office", style: "Like data accuracy and clerical tests", real: "Spot the differences between two lists, against the clock.",
    measures: "Attention to detail: comparing codes, names and numbers quickly and accurately.",
    who: "Public service, banks, insurance, administration, data entry and payroll roles.",
    tips: ["Compare in the same order every time: first character, then the last, then the middle.", "Read both entries aloud in your head. Your eye skips over swapped digits, but your ear catches them.", "Watch for the common slips: two digits swapped, one letter changed, a dropped character, 0 and O, 1 and l.", "Don't rush the first pair: accuracy first, then speed.", "Mark pairs as you go so you can count them at the end."] },
  { key: "memory", name: "Memory and attention", n: 8, secs: 420, group: "Judgement and speed", style: "Like game-based and short-term memory assessments", real: "Something flashes on screen, then you answer questions from memory.",
    measures: "Holding numbers, words and patterns in short-term memory.",
    who: "Graduate programs using game-based assessments, air traffic control, call centres, and many online screening tools.",
    tips: ["Group digits in chunks (7 4 9 2 1 6 becomes 749, 216) instead of memorising them one at a time.", "For words, make a quick story or picture that links them.", "For patterns, notice the shape of the group first (a line, a corner, a block) before the exact squares.", "Take a breath before the flash. Looking calmly works better than staring hard.", "If you lose it, guess: you can't go back."] }
);
// Which tests are common in each kind of job
const APT_AREAS = [
  { key: "grad", label: "Graduate programs", tests: ["numerical", "verbal", "logical", "abstract", "sjt"] },
  { key: "finance", label: "Banking and finance", tests: ["numerical", "verbal", "logical", "speed", "errorcheck"] },
  { key: "gov", label: "Government and admin", tests: ["verbal", "errorcheck", "numerical", "sjt", "memory"] },
  { key: "trades", label: "Trades, defence and police", tests: ["mechanical", "spatial", "abstract", "verbal", "numerical", "memory"] },
  { key: "tech", label: "Tech and engineering", tests: ["logical", "abstract", "numerical", "spatial", "mechanical", "speed"] },
  { key: "service", label: "Customer service and retail", tests: ["sjt", "speed", "errorcheck", "verbal", "memory"] },
  { key: "health", label: "Health and community", tests: ["sjt", "verbal", "memory", "numerical"] }
];
const APT_AREA_OF_JOB = { graduate: "grad", accounting: "finance", banking: "finance", insurance: "finance", consulting: "finance", legal: "finance", management: "finance", government: "gov", admin: "gov", hr: "gov", trades: "trades", construction: "trades", mining: "trades", logistics: "trades", engineering: "tech", tech: "tech", science: "tech", callcentre: "service", retail: "service", hospitality: "service", sales: "service", sport: "service", property: "service", health: "health", community: "health", education: "health" };

/* --- Mechanical reasoning --- */
const fmtNum = x => String(Math.round(x * 100) / 100);
function genMechanical() {
  const kind = aptMechKind();
  if (APT_HARD_MECH[kind]) return APT_HARD_MECH[kind]();   // the Hard kinds are in 31c
  if (kind === "lever") {
    let ans, eff, d, load, t = 0;
    do { ans = pick([0.5, 1, 1.5, 2, 2.5, 3]); eff = pick([10, 20, 30, 40]); d = pick([0.5, 1, 2]); load = ans * eff / d; } while (!Number.isInteger(load) && ++t < 30);
    return { text: `A plank is balanced on a pivot at its centre. A ${load} kg load sits ${fmtNum(d)} m from the pivot on the left. How far from the pivot on the right must a ${eff} kg load sit to balance it?`, ...withOptions(ans, [ans * 2, ans / 2, load / eff, d, ans + 0.5], 5, x => `${fmtNum(x)} m`), why: `It balances when load × distance is equal on both sides: ${load} × ${fmtNum(d)} = ${eff} × distance, so distance = ${fmtNum(load * d)} ÷ ${eff} = ${fmtNum(ans)} m.`, skill: "levers and balance" };
  }
  if (kind === "gear") {
    const [tA, tB] = pick([[12, 36], [20, 40], [15, 45], [30, 10], [40, 20], [24, 12], [18, 54]]);
    let rpm; do { rpm = pick([60, 90, 120, 150, 180, 240]); } while ((rpm * tA) % tB);
    const idler = aptLevel === "easy" ? false : Math.random() < 0.4, out = rpm * tA / tB, same = idler, dirB = same ? "clockwise" : "anticlockwise", other = same ? "anticlockwise" : "clockwise";
    const fmt = (r, d) => `${r} rpm ${d}`;
    return { text: `Gear A has ${tA} teeth and turns clockwise at ${rpm} rpm. ${idler ? `It drives gear B (${tB} teeth) through a small idler gear in between.` : `It meshes directly with gear B, which has ${tB} teeth.`} How does gear B turn?`, ...withOptions(fmt(out, dirB), [fmt(out, other), fmt(rpm * tB / tA, dirB), fmt(rpm * tB / tA, other), fmt(rpm, dirB)], 4, x => x), why: `Speed: ${rpm} × ${tA} ÷ ${tB} = ${out} rpm (the gear with fewer teeth turns faster). Direction: ${idler ? "the idler reverses it once and gear B reverses it again, so B turns the same way as A: clockwise" : "meshed gears turn in opposite directions, so B turns anticlockwise"}.`, skill: "gears" };
  }
  if (kind === "pulley") {
    let n, load; do { n = pick([2, 3, 4]); load = pick([60, 90, 120, 180, 240]); } while (load % n);
    const ans = load / n;
    return { text: `A load of ${load} N is lifted by an ideal pulley system in which ${n} sections of rope support the load. What force is needed to lift it steadily?`, ...withOptions(ans, [load, load * n, load / (n + 1), load / 2 + 10], 4, x => `${fmtNum(x)} N`), why: `Each of the ${n} rope sections shares the load: ${load} ÷ ${n} = ${fmtNum(ans)} N.`, skill: "pulleys" };
  }
  if (kind === "hydraulic") {
    const a1 = pick([5, 10, 20]), f1 = pick([50, 100, 200]), m = pick([2, 3, 4, 5]), a2 = a1 * m, ans = f1 * m;
    return { text: `In a hydraulic jack, a force of ${f1} N is applied to a piston of ${a1} cm². The lifting piston has an area of ${a2} cm². What force does it produce?`, ...withOptions(ans, [f1 / m, f1 + a2, f1 * a1, ans * 2], 4, x => `${fmtNum(x)} N`), why: `Pressure is the same on both pistons, so force scales with area: ${f1} × (${a2} ÷ ${a1}) = ${ans} N.`, skill: "hydraulics" };
  }
  if (kind === "belt") {
    const d1 = pick([10, 12, 15, 20]), m = pick([2, 3, 4]), d2 = d1 * m, rpm = pick([120, 240, 360, 480, 600]), ans = rpm / m;
    return { text: `A belt joins a pulley of diameter ${d1} cm, turning at ${rpm} rpm, to a larger pulley of diameter ${d2} cm. How fast does the larger pulley turn?`, ...withOptions(ans, [rpm * m, rpm, rpm / (m + 1), rpm - d1], 4, x => `${fmtNum(x)} rpm`), why: `The belt moves at the same speed, so a pulley ${m} times bigger turns ${m} times slower: ${rpm} ÷ ${m} = ${ans} rpm.`, skill: "belt drives" };
  }
  if (kind === "resistor") {
    const par = aptLevel === "easy" ? false : Math.random() < 0.6, [a, b] = pick([[6, 12], [10, 10], [4, 12], [3, 6], [20, 30], [15, 10]]), ans = par ? a * b / (a + b) : a + b;
    return { text: `Two resistors of ${a} Ω and ${b} Ω are connected in ${par ? "parallel" : "series"}. What is the total resistance?`, ...withOptions(ans, [par ? a + b : a * b / (a + b), (a + b) / 2, a * b, Math.abs(a - b) + 1], 4, x => `${fmtNum(x)} Ω`), why: par ? `In parallel: (${a} × ${b}) ÷ (${a} + ${b}) = ${fmtNum(ans)} Ω, always less than the smaller resistor.` : `In series the resistances add: ${a} + ${b} = ${ans} Ω.`, skill: "circuits" };
  }
  const f = pick([20, 30, 40, 50]), d = pick([0.2, 0.3, 0.4, 0.5]), ans = f * d;
  return { text: `A spanner is pulled with a force of ${f} N at a point ${d} m from the nut. What torque is applied?`, ...withOptions(ans, [f / d, f + d, ans * 2, ans / 2], 4, x => `${fmtNum(x)} N·m`), why: `Torque = force × distance = ${f} × ${d} = ${fmtNum(ans)} N·m.`, skill: "torque" };
}
const genMechanicalSet = n => Array.from({ length: n }, genMechanical);

/* --- Error checking: spot the differences between an original and its copy --- */
const EC_NAMES = ["Hartley", "Nguyen", "Okafor", "Sharma", "Papadopoulos", "Kowalski", "Tran", "McBride", "Fitzgerald", "Alvarez"];
const ecMakers = [
  () => "INV-" + rnd(10000, 99999),
  () => pick("ABCDKMRT") + pick("ABCK") + "-" + rnd(1000, 9999) + "-" + pick("XYZK"),
  () => "$" + rnd(1, 9) + "," + String(rnd(0, 999)).padStart(3, "0") + "." + String(rnd(0, 99)).padStart(2, "0"),
  () => pick(EC_NAMES) + ", " + pick("JAMSLP") + ".",
  () => rnd(2000, 7999) + " " + pick(["NSW", "VIC", "QLD", "WA", "SA", "TAS"]),
  () => String(rnd(1, 28)).padStart(2, "0") + "/" + String(rnd(1, 12)).padStart(2, "0") + "/" + rnd(2019, 2025)
];
function ecCorrupt(s) {
  for (let t = 0; t < 30; t++) {
    const ch = [...s], idx = ch.map((c, i) => /[A-Za-z0-9]/.test(c) ? i : -1).filter(i => i >= 0), i = pick(idx);
    const kind = pick(aptEc().kinds);
    let out = s;
    if (kind === "digit" && /\d/.test(ch[i])) { ch[i] = String((+ch[i] + rnd(1, 8)) % 10); out = ch.join(""); }
    else if (kind === "letter" && /[A-Za-z]/.test(ch[i])) { ch[i] = pick("ABCDEFGHKLMNPRSTXYZ".split("").filter(x => x.toLowerCase() !== ch[i].toLowerCase())); out = ch.join(""); }
    else if (kind === "drop") { ch.splice(i, 1); out = ch.join(""); }
    else if (kind === "swap" && i < ch.length - 1 && /[A-Za-z0-9]/.test(ch[i + 1]) && ch[i] !== ch[i + 1]) { [ch[i], ch[i + 1]] = [ch[i + 1], ch[i]]; out = ch.join(""); }
    else if (kind === "double") { ch.splice(i, 0, ch[i]); out = ch.join(""); }
    if (out !== s) return out;
  }
  return s + "0";
}
function genErrorCheck() {
  const L = aptEc(), make = pick(L.makers.map(k => ecMakers[k])), counting = Math.random() < L.rate;
  const rowsN = counting ? L.rows[0] : L.rows[1];
  const orig = Array.from({ length: rowsN }, make);
  let bad;
  if (counting) { const c = rnd(L.bad[0], L.bad[1]); bad = new Set(shuffle(Array.from({ length: rowsN }, (_, k) => k)).slice(0, c)); }
  else bad = Math.random() < L.none ? new Set() : new Set([rnd(0, rowsN - 1)]);
  const copy = orig.map((s, k) => bad.has(k) ? ecCorrupt(s) : s);
  const table = { title: "Compare each original with its copy", cols: ["Original", "Copy"], rows: orig.map((_, k) => `Row ${k + 1}`), data: orig.map((s, k) => [s, copy[k]]) };
  const diffRows = [...bad].sort((a, b) => a - b).map(k => `Row ${k + 1}: “${orig[k]}” became “${copy[k]}”`);
  if (counting) {
    const ans = bad.size, opts = shuffle(Array.from({ length: rowsN + 1 }, (_, k) => k).filter(x => x !== ans)).slice(0, 3);
    return { text: "How many of these pairs do not match exactly?", table, ...withOptions(ans, opts, 4, String), why: diffRows.length ? `${diffRows.join("; ")}. That's ${ans}.` : "Every copy matches its original, so the answer is 0.", skill: "spotting differences" };
  }
  const labels = Array.from({ length: rowsN }, (_, k) => `Row ${k + 1}`).concat("No errors");
  return { text: "Which row has an error in the copy?", table, options: labels, answer: bad.size ? [...bad][0] : rowsN, why: bad.size ? `${diffRows[0]}.` : "All the copies match their originals.", skill: "spotting differences" };
}
const genErrorCheckSet = n => Array.from({ length: n }, genErrorCheck);

/* --- Spatial reasoning: the same shape turned, or flipped? --- */
const cellKey = cs => { const r0 = Math.min(...cs.map(c => c[0])), c0 = Math.min(...cs.map(c => c[1])); return cs.map(([r, c]) => `${r - r0},${c - c0}`).sort().join("|"); };
const cellNorm = cs => { const r0 = Math.min(...cs.map(c => c[0])), c0 = Math.min(...cs.map(c => c[1])); return cs.map(([r, c]) => [r - r0, c - c0]); };
const rot90 = cs => cs.map(([r, c]) => [c, -r]);
const mirror = cs => cs.map(([r, c]) => [r, -c]);
const rotN = (cs, n) => { let x = cs; for (let i = 0; i < n; i++) x = rot90(x); return x; };
const bbox = cs => [Math.max(...cs.map(c => c[0])) - Math.min(...cs.map(c => c[0])) + 1, Math.max(...cs.map(c => c[1])) - Math.min(...cs.map(c => c[1])) + 1];
function randomShape(size) {
  for (let t = 0; t < 60; t++) {
    const cells = [[0, 0]];
    let guard = 0;
    while (cells.length < size && guard++ < 80) {
      const [r, c] = pick(cells), [dr, dc] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), n = [r + dr, c + dc];
      if (!cells.some(x => x[0] === n[0] && x[1] === n[1])) cells.push(n);
    }
    const [h, w] = bbox(cells);
    if (cells.length === size && h <= 3 && w <= 4 && h * w <= 10 && h >= 2) return cellNorm(cells);
  }
  return cellNorm([[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]);
}
// A shape drawn on a small grid (also used for the pattern in the memory test)
function gridSVG(cells, label, size = 4) {
  const cs = 16, W = size * cs;
  const on = new Set(cells.map(([r, c]) => `${r},${c}`));
  let g = "";
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) g += `<rect x="${c * cs + 1}" y="${r * cs + 1}" width="${cs - 2}" height="${cs - 2}" rx="2" fill="${on.has(`${r},${c}`) ? "currentColor" : "none"}" stroke="currentColor" stroke-opacity="${on.has(`${r},${c}`) ? 1 : 0.2}"/>`;
  return `<svg viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" role="img" aria-label="${esc(label)}: ${cells.length} filled squares">${g}</svg>`;
}
const placeShape = cs => { const n = cellNorm(cs), [h, w] = bbox(n), dr = Math.floor((4 - h) / 2), dc = Math.floor((4 - w) / 2); return n.map(([r, c]) => [r + dr, c + dc]); };
function genSpatial(depth = 0) {
  const size = pick(aptSpatialSizes());
  let shape, rots, mir, t = 0;
  do { shape = randomShape(size); rots = new Set([0, 1, 2, 3].map(k => cellKey(rotN(shape, k)))); mir = mirror(shape); } while (rots.has(cellKey(mir)) && ++t < 40);
  const correct = rotN(shape, rnd(1, 3));
  const variants = [], seen = new Set([cellKey(correct)]);
  const add = cs => { const k = cellKey(cs); if (!seen.has(k) && !rots.has(k) && bbox(cs).every(x => x <= 4)) { seen.add(k); variants.push(cs); } };
  if (aptLevel !== "easy" && !rots.has(cellKey(mir))) add(rotN(mir, rnd(0, 3)));   // the flipped shape is the Medium and Hard trap
  for (let tries = 0; tries < 60 && variants.length < 3; tries++) {
    const cs = shape.map(c => c.slice()), i = rnd(0, cs.length - 1), [dr, dc] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    const moved = [cs[i][0] + dr, cs[i][1] + dc];
    if (cs.some(x => x[0] === moved[0] && x[1] === moved[1])) continue;
    cs[i] = moved;
    // still one connected piece?
    const set = new Set(cs.map(x => x.join(","))), stack = [cs[0]], seenC = new Set([cs[0].join(",")]);
    while (stack.length) { const [r, c] = stack.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${r + a},${c + b}`; if (set.has(k) && !seenC.has(k)) { seenC.add(k); stack.push([r + a, c + b]); } } }
    if (seenC.size === cs.length) add(rotN(cs, rnd(0, 3)));
  }
  if (variants.length < 3 && depth < 20) return genSpatial(depth + 1);   // not enough different wrong options: make another shape
  const opts = shuffle([correct, ...variants.slice(0, 3)]);
  return { text: "Which option is the target shape turned around? (Turning is allowed. Flipping over is not.)", stem: `<div class="apt-target"><span>Target</span>${gridSVG(placeShape(shape), "Target shape")}</div>`, optHtml: opts.map((o, k) => gridSVG(placeShape(o), `Option ${LETTERS[k]}`)), options: opts.map((_, k) => `Option ${LETTERS[k]}`), answer: opts.indexOf(correct), why: "The right option can be turned to sit exactly on the target. The mirror-image option looks very close, but a flipped shape can never be turned into the original. The others have a square in a different place.", skill: "rotating shapes" };
}
const genSpatialSet = n => Array.from({ length: n }, genSpatial);

/* --- Memory and attention: something flashes up, then you answer from memory --- */
const MEM_WORDS = ["anchor", "bridge", "candle", "dolphin", "engine", "forest", "garden", "hammer", "island", "jacket", "kettle", "ladder", "magnet", "needle", "orchard", "pencil", "quarry", "ribbon", "saddle", "tunnel", "umbrella", "valley", "window", "yellow", "zipper", "basket", "cactus", "dragon"];
function genMemory() {
  const kind = pick(["digits", "words", "pattern"]);
  if (kind === "digits") {
    const ML = aptMem(), n = rnd(ML.digits[0], ML.digits[1]), d = Array.from({ length: n }, () => rnd(0, 9));
    if (new Set(d).size < 4) d[1] = (d[0] + 3) % 10;
    const seq = d.join(" "), alt = (arr) => arr.join(" ");
    const swap = d.slice(); const i = rnd(0, n - 2); [swap[i], swap[i + 1]] = [swap[i + 1], swap[i]];
    const change = d.slice(); change[rnd(0, n - 1)] = (change[rnd(0, n - 1)] + 3) % 10;
    const rev = d.slice().reverse(), shift = d.slice(1).concat(d[0]);
    const c2 = d.slice(); const j = rnd(0, n - 1); c2[j] = (c2[j] + rnd(1, 8)) % 10;
    return { flash: { html: `<p class="apt-digits">${seq}</p>`, secs: Math.round(5 * ML.secs), note: `Remember these ${n} numbers, in order.` }, text: "Which sequence was shown?", ...withOptions(seq, [alt(swap), alt(c2), alt(rev), alt(shift), alt(change)], 4, x => x), why: `The sequence was ${seq}. The wrong options have two numbers swapped, one number changed, or the order turned around.`, skill: "number memory" };
  }
  if (kind === "words") {
    const WK = aptMem().words, words = shuffle(MEM_WORDS).slice(0, WK + 4), shown = words.slice(0, WK), unseen = words.slice(WK);
    const missing = Math.random() < 0.5;
    const flash = { html: `<p class="apt-words">${shown.map(esc).join(" · ")}</p>`, secs: Math.round(6 * aptMem().secs), note: `Remember these ${NUM_WORD[WK]} words.` };
    if (missing) return { flash, text: "Which of these words was NOT shown?", ...withOptions(unseen[0], shown.slice(0, 4), 5, x => x), why: `The words shown were ${shown.join(", ")}. “${unseen[0]}” wasn't one of them.`, skill: "word memory" };
    return { flash, text: "Which of these words WAS shown?", ...withOptions(shown[rnd(0, WK - 1)], unseen.slice(0, 4), 5, x => x), why: `The words shown were ${shown.join(", ")}.`, skill: "word memory" };
  }
  const cells = shuffle(Array.from({ length: 16 }, (_, k) => [Math.floor(k / 4), k % 4])).slice(0, aptMem().cells);
  const vars = [], seen = new Set([cellKey(cells)]);
  for (let t = 0; t < 40 && vars.length < 3; t++) {
    const cs = cells.map(c => c.slice()), i = rnd(0, cells.length - 1), free = Array.from({ length: 16 }, (_, k) => [Math.floor(k / 4), k % 4]).filter(c => !cs.some(x => x[0] === c[0] && x[1] === c[1]));
    cs[i] = pick(free);
    const k = cs.map(c => c.join(",")).sort().join("|");
    if (!seen.has(k) && !seen.has(cellKey(cs))) { seen.add(k); vars.push(cs); }
  }
  const exact = c => c.map(x => x.join(",")).sort().join("|");
  const opts = shuffle([cells, ...vars.slice(0, 3)]);
  return { flash: { html: `<div class="apt-flashgrid">${gridSVG(cells, "Pattern to remember")}</div>`, secs: Math.round(4 * aptMem().secs), note: "Remember which squares are filled." }, text: "Which pattern was shown?", optHtml: opts.map((o, k) => gridSVG(o, `Option ${LETTERS[k]}`)), options: opts.map((_, k) => `Option ${LETTERS[k]}`), answer: opts.findIndex(o => exact(o) === exact(cells)), why: "Look at the overall shape first (a line, a corner, a block), then check the odd squares. The wrong options have one square in a different place.", skill: "pattern memory" };
}
const genMemorySet = n => Array.from({ length: n }, genMemory);

Object.assign(APT_GEN, { mechanical: genMechanicalSet, errorcheck: genErrorCheckSet, spatial: genSpatialSet, memory: genMemorySet });
