/* ===================== Aptitude tests: the question generators (the test room is in 31b) ===================== */
const aptStore = privateDoc("aptitude", "jobfinder.aptitude.v1", () => ({ sessions: [] }));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const r1 = x => Math.round(x * 10) / 10;
const LETTERS = "ABCDE";
// Put the right answer among distinct wrong ones
function withOptions(correct, wrongs, n = 5, fmt = String) {
  const seen = new Set([fmt(correct)]), opts = [fmt(correct)];
  for (const w of wrongs) { const f = fmt(w); if (opts.length >= n) break; if (!seen.has(f) && w != null && !(typeof w === "number" && !isFinite(w))) { seen.add(f); opts.push(f); } }
  let k = 1;
  while (opts.length < n && typeof correct === "number") { const f = fmt(correct + k * (k % 2 ? 1 : -1) * Math.max(1, Math.abs(correct) * 0.07)); if (!seen.has(f)) { seen.add(f); opts.push(f); } k++; }
  const sh = shuffle(opts);
  return { options: sh, answer: sh.indexOf(fmt(correct)) };
}

/* --- Numerical: a small data table and questions about it --- */
const TABLES = [
  { title: "Quarterly sales by region ($ thousands)", cols: ["Q1", "Q2", "Q3", "Q4"], rows: ["North", "South", "East", "West"], lo: 120, hi: 480, unit: "$k", money: true },
  { title: "Website visitors by month (thousands)", cols: ["Jan", "Feb", "Mar", "Apr"], rows: ["Desktop", "Mobile", "Tablet"], lo: 20, hi: 260, unit: "k" },
  { title: "Staff numbers by department", cols: ["2022", "2023", "2024", "2025"], rows: ["Sales", "Operations", "Finance", "IT"], lo: 30, hi: 220, unit: "" },
  { title: "Units produced by plant (hundreds)", cols: ["Week 1", "Week 2", "Week 3", "Week 4"], rows: ["Plant A", "Plant B", "Plant C"], lo: 50, hi: 300, unit: "00" }
];
function genNumericalSet(n) {
  const qs = [];
  while (qs.length < n) {
    const T = pick(TABLES);
    const data = T.rows.map(() => T.cols.map(() => rnd(T.lo / 5, T.hi / 5) * 5));
    const table = { title: T.title, cols: T.cols, rows: T.rows, data };
    const kinds = shuffle(["pct", "total", "share", "proj", "avg", "most"]).slice(0, 3);
    for (const kind of kinds) {
      if (qs.length >= n) break;
      const r = rnd(0, T.rows.length - 1), i = rnd(0, 1), j = rnd(2, 3), c = rnd(0, T.cols.length - 1);
      const v = data[r];
      let q;
      if (kind === "pct") {
        const ans = r1((v[j] - v[i]) / v[i] * 100);
        q = { text: `What was the percentage change in ${T.rows[r]} from ${T.cols[i]} to ${T.cols[j]}?`, ...withOptions(ans, [r1((v[j] - v[i]) / v[j] * 100), r1(-ans), r1(ans + 10), r1(ans * 0.5), r1(ans + 4.5)], 5, x => `${x > 0 ? "+" : ""}${x.toFixed(1)}%`), why: `(${v[j]} − ${v[i]}) ÷ ${v[i]} × 100 = ${ans.toFixed(1)}%. The earlier figure (${T.cols[i]}) is the base.`, skill: "percentage change" };
      } else if (kind === "total") {
        const col = data.map(row => row[c]), ans = col.reduce((a, b) => a + b, 0);
        q = { text: `What was the total for ${T.cols[c]} across all ${T.rows.length} rows?`, ...withOptions(ans, [ans - col[0], ans + col[1], ans - 10 * rnd(1, 4), ans + 15 * rnd(1, 3)], 5, x => String(x)), why: `${col.join(" + ")} = ${ans}.`, skill: "totals" };
      } else if (kind === "share") {
        const col = data.map(row => row[c]), sum = col.reduce((a, b) => a + b, 0), ans = r1(v[c] / sum * 100);
        q = { text: `What share of the ${T.cols[c]} total came from ${T.rows[r]}?`, ...withOptions(ans, [r1(v[c] / (sum - v[c]) * 100), r1(100 / T.rows.length), r1(ans + 6), r1(ans - 4.2)], 5, x => `${x.toFixed(1)}%`), why: `${v[c]} ÷ ${sum} × 100 = ${ans.toFixed(1)}%.`, skill: "shares" };
      } else if (kind === "proj") {
        const p = pick([5, 10, 15, 20, 25]), base = v[3], ans = r1(base * (1 + p / 100));
        q = { text: `If ${T.rows[r]} grows by ${p}% after ${T.cols[3]}, what will its next figure be?`, ...withOptions(ans, [r1(base * p / 100), r1(base + p), r1(base * (1 - p / 100)), r1(base * (1 + p / 50))], 5, x => x % 1 ? x.toFixed(1) : String(x)), why: `${base} × ${1 + p / 100} = ${ans}.`, skill: "growth" };
      } else if (kind === "avg") {
        const ans = r1(v.reduce((a, b) => a + b, 0) / v.length);
        q = { text: `What was the average for ${T.rows[r]} across the ${v.length} periods?`, ...withOptions(ans, [r1(ans + 7.5), r1(ans - 5), r1((v[0] + v[3]) / 2), r1(v.reduce((a, b) => a + b, 0) / (v.length - 1))], 5, x => x.toFixed(1)), why: `(${v.join(" + ")}) ÷ ${v.length} = ${ans.toFixed(1)}.`, skill: "averages" };
      } else {
        const growth = data.map(row => (row[3] - row[0]) / row[0]);
        const best = growth.indexOf(Math.max(...growth));
        if (growth.filter(g => Math.abs(g - growth[best]) < 0.005).length > 1) continue;
        const sh = shuffle(T.rows.map((_, k) => k));
        q = { text: `Which had the largest percentage increase from ${T.cols[0]} to ${T.cols[3]}?`, options: sh.map(k => T.rows[k]), answer: sh.indexOf(best), why: T.rows.map((name, k) => `${name}: ${(growth[k] * 100).toFixed(1)}%`).join("; ") + ". Compare percentages, not raw increases.", skill: "comparing growth" };
      }
      qs.push({ ...q, table });
    }
  }
  return qs;
}

/* --- Logical: number sequences and statements --- */
function genSequence() {
  const a = rnd(2, 12), d = rnd(2, 9);
  const pats = [
    () => { const s = [0, 1, 2, 3, 4].map(k => a + k * d); return { s, next: a + 5 * d, rule: `Add ${d} each time.` }; },
    () => { const m = pick([2, 3]); const s = [0, 1, 2, 3, 4].map(k => a * m ** k); return { s, next: a * m ** 5, rule: `Multiply by ${m} each time.` }; },
    () => { const s = [a]; for (let k = 1; k < 5; k++) s.push(s[k - 1] + d * k); return { s, next: s[4] + d * 5, rule: `The gap grows by ${d} each time (+${d}, +${2 * d}, +${3 * d}…).` }; },
    () => { const st = rnd(1, 4); const s = [0, 1, 2, 3, 4].map(k => (st + k) ** 2); return { s, next: (st + 5) ** 2, rule: "Square numbers: " + [0, 1, 2, 3, 4].map(k => `${st + k}²`).join(", ") + "." }; },
    () => { const b = rnd(1, 5); const s = [a, b]; for (let k = 2; k < 6; k++) s.push(s[k - 1] + s[k - 2]); return { s: s.slice(0, 5), next: s[5], rule: "Each number is the sum of the two before it." }; },
    () => { const x = rnd(20, 60), y = rnd(1, 5); const s = [a, x, a + d, x - y, a + 2 * d]; return { s, next: x - 2 * y, rule: `Two sequences take turns: ${a}, ${a + d}, ${a + 2 * d} (add ${d}) and ${x}, ${x - y}, ${x - 2 * y} (take away ${y}).` }; },
    () => { const s = [a]; for (let k = 1; k < 5; k++) s.push(s[k - 1] * 2 + 1); return { s, next: s[4] * 2 + 1, rule: "Double it, then add 1." }; }
  ];
  const { s, next, rule } = pick(pats)();
  const last = s[4], gap = s[4] - s[3];
  return { text: "What number comes next?", seq: s, ...withOptions(next, [last + gap, next + 1, next - gap, next + 2 * Math.sign(gap || 1), Math.round(next * 1.1)], 5, x => String(x)), why: rule, skill: "sequences" };
}
const GROUPS = ["managers", "engineers", "cyclists", "musicians", "teachers", "drivers", "chefs", "students", "nurses", "gardeners"];
function genSyllogism() {
  const [A, B, C] = shuffle(GROUPS).slice(0, 3);
  const forms = [
    [`All ${A} are ${B}. All ${B} are ${C}.`, `All ${A} are ${C}.`, 0, `If every ${A.slice(0, -1)} is one of the ${B}, and every one of the ${B} is one of the ${C}, then every ${A.slice(0, -1)} is one of the ${C}.`],
    [`All ${A} are ${B}. Some ${C} are ${A}.`, `Some ${C} are ${B}.`, 0, `The ${C} who are ${A} must also be ${B}.`],
    [`Some ${A} are ${B}. All ${B} are ${C}.`, `Some ${A} are ${C}.`, 0, `The ${A} who are ${B} are also ${C}.`],
    [`All ${A} are ${B}. Some ${B} are ${C}.`, `Some ${A} are ${C}.`, 2, `The ${B} who are ${C} might not include any ${A}. It could be true, but it doesn't have to be.`],
    [`No ${A} are ${B}. All ${C} are ${A}.`, `No ${C} are ${B}.`, 0, `Every one of the ${C} is one of the ${A}, and none of the ${A} are ${B}.`],
    [`All ${A} are ${B}.`, `All ${B} are ${A}.`, 2, `There could be ${B} who aren't ${A}. “All A are B” doesn't work in reverse.`],
    [`All ${A} are ${B}. No ${B} are ${C}.`, `Some ${A} are ${C}.`, 1, `Every one of the ${A} is one of the ${B}, and none of the ${B} are ${C}, so no ${A} are ${C}.`],
    [`Some ${A} are not ${B}. All ${C} are ${B}.`, `Some ${A} are not ${C}.`, 0, `The ${A} who aren't ${B} can't be ${C}, because all ${C} are ${B}.`]
  ];
  const [prem, concl, ans, why] = pick(forms);
  return { text: `${prem}\nIf these statements are true, is this conclusion true, false, or can't you tell?\n“${concl}”`, options: ["True", "False", "Cannot tell"], answer: ans, why, skill: "logic statements" };
}
function genLogicalSet(n) { return Array.from({ length: n }, (_, k) => k % 3 === 2 ? genSyllogism() : genSequence()); }

/* --- Abstract: shape sequences drawn in SVG --- */
const SHAPES = ["circle", "square", "triangle"];
function frameSVG(f, label) {
  const size = 92, pad = 10;
  const items = [];
  const n = f.count, w = (size - 2 * pad) / n;
  for (let k = 0; k < n; k++) {
    const cx = pad + w * k + w / 2, cy = size / 2, r = Math.min(w / 2 - 3, 13);
    const fill = f.fill ? "currentColor" : "none";
    const sh = SHAPES[f.shape % 3];
    const el = sh === "circle" ? `<circle cx="${cx}" cy="${cy}" r="${r}"/>` : sh === "square" ? `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" transform="rotate(${f.rot} ${cx} ${cy})"/>` : `<polygon points="${cx},${cy - r} ${cx + r},${cy + r * 0.85} ${cx - r},${cy + r * 0.85}" transform="rotate(${f.rot} ${cx} ${cy})"/>`;
    items.push(`<g fill="${fill}" stroke="currentColor" stroke-width="2">${el}</g>`);
  }
  const corners = [[12, 12], [size - 12, 12], [size - 12, size - 12], [12, size - 12]];
  const [dx, dy] = corners[f.dot % 4];
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(label)}: ${n} ${SHAPES[f.shape % 3]}${n > 1 ? "s" : ""}, ${f.fill ? "filled" : "outlined"}, turned ${f.rot} degrees, dot in the ${["top left", "top right", "bottom right", "bottom left"][f.dot % 4]} corner"><rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="6" fill="none" stroke="currentColor" stroke-opacity=".25"/>${items.join("")}<circle cx="${dx}" cy="${dy}" r="4.5" fill="currentColor"/></svg>`;
}
function genAbstract() {
  const rules = shuffle(["count", "shape", "fill", "rot", "dot"]).slice(0, aptRuleCount());
  const start = { count: rules.includes("count") ? rnd(1, 2) : rnd(1, 3), shape: rnd(0, 2), fill: Math.random() < 0.5, rot: 0, dot: rnd(0, 3) };
  if (rules.includes("rot") && start.shape === 0) start.shape = rnd(1, 2);
  const step = (f, k) => ({ count: rules.includes("count") ? f.count + k : f.count, shape: rules.includes("shape") ? (f.shape + k) % 3 : f.shape, fill: rules.includes("fill") ? (k % 2 ? !f.fill : f.fill) : f.fill, rot: rules.includes("rot") ? (f.rot + 45 * k) % 360 : f.rot, dot: rules.includes("dot") ? (f.dot + k) % 4 : f.dot });
  // keep counts small enough to draw
  if (rules.includes("count")) start.count = 1;
  const frames = [0, 1, 2, 3].map(k => step(start, k));
  const ans = step(start, 4);
  const variants = [{ ...ans, count: Math.max(1, ans.count + (ans.count > 1 ? -1 : 1)) }, { ...ans, dot: (ans.dot + 1) % 4 }, { ...ans, fill: !ans.fill }, { ...ans, shape: (ans.shape + 1) % 3 }, { ...ans, rot: (ans.rot + 45) % 360 }];
  const key = f => `${f.count}|${f.shape % 3}|${f.fill}|${f.shape % 3 === 0 ? 0 : f.rot % (SHAPES[f.shape % 3] === "square" ? 90 : 360)}|${f.dot}`;
  const seen = new Set([key(ans)]), opts = [ans];
  for (const v of shuffle(variants)) { if (opts.length >= 4) break; if (!seen.has(key(v))) { seen.add(key(v)); opts.push(v); } }
  const sh = shuffle(opts);
  const names = { count: "one more shape each step", shape: "the shape changes circle → square → triangle", fill: "shading switches on and off", rot: "the shapes turn 45° each step", dot: "the dot moves one corner clockwise" };
  return { text: "Which box comes next in the sequence?", frames, svgOptions: sh, options: sh.map((_, k) => `Option ${LETTERS[k]}`), answer: sh.indexOf(ans), why: "The rules: " + rules.map(r => names[r]).join("; ") + ".", skill: "shape patterns" };
}
function genAbstractSet(n) { return Array.from({ length: n }, genAbstract); }

/* --- Verbal, judgement and speed sets --- */
function genVerbalSet(n) {
  const out = [];
  for (const set of shuffle(VERBAL_SETS).slice(0, Math.ceil(n / 3))) for (const [st, a, why] of set.q) out.push({ passage: set.p, text: `“${st}”`, options: ["True", "False", "Cannot say"], answer: { T: 0, F: 1, C: 2 }[a], why, skill: { T: "true statements", F: "false statements", C: "“cannot say” statements" }[a] });
  return out.slice(0, n);
}
function genSjtSet(n) { return shuffle(SJT_SETS).slice(0, n).map(s => { const order = shuffle([0, 1, 2, 3]); return { text: s.s + "\nWhat is the most effective response?", options: order.map(k => s.o[k]), answer: order.indexOf(s.best), why: s.why, skill: "judgement" }; }); }
function genQuickMaths() {
  const k = rnd(0, 3);
  if (k === 0) { const p = pick([5, 10, 15, 20, 25, 30, 40]), x = rnd(4, 40) * 10, ans = x * p / 100; return { text: `What is ${p}% of ${x}?`, ...withOptions(ans, [ans * 2, ans / 2, x - ans, ans + 10], 5, String), why: `${x} × ${p / 100} = ${ans}.`, skill: "percentages" }; }
  if (k === 1) { const n = rnd(2, 5), price = rnd(3, 9) * 0.5 * n, m = rnd(6, 12), ans = r1(price / n * m); return { text: `If ${n} pens cost $${price.toFixed(2)}, how much do ${m} cost?`, ...withOptions(ans, [r1(price * m / (n + 1)), r1(price + m), r1(ans + price / n), r1(ans - 1)], 5, x => "$" + x.toFixed(2)), why: `One pen costs $${(price / n).toFixed(2)}, so ${m} cost $${ans.toFixed(2)}.`, skill: "rates" }; }
  if (k === 2) { const a = rnd(2, 7), b = rnd(a + 1, 9), dec = r1(a / b + pick([-0.05, 0.04, 0.06])); const bigger = a / b > dec; return { text: `Which is larger: ${a}/${b} or ${dec}?`, options: [`${a}/${b}`, String(dec), "They're equal"], answer: Math.abs(a / b - dec) < 1e-9 ? 2 : bigger ? 0 : 1, why: `${a}/${b} = ${(a / b).toFixed(3)}.`, skill: "fractions" }; }
  const h = rnd(2, 6), sp = rnd(4, 11) * 10, ans = h * sp; return { text: `A truck travels at ${sp} km/h for ${h} hours. How far does it go?`, ...withOptions(ans, [ans + sp, ans - sp, sp / h, ans * 2], 5, x => `${Math.round(x)} km`), why: `${sp} × ${h} = ${ans} km.`, skill: "speed and distance" };
}
function genSpeedSet(n) {
  const words = shuffle(SPEED_WORDS).slice(0, 4).map(([t, o, a]) => ({ text: t, options: o, answer: a, why: `The answer is “${o[a]}”.`, skill: "words" }));
  return shuffle([...Array.from({ length: 5 }, genQuickMaths), ...Array.from({ length: 4 }, genSequence), ...words, genSyllogism(), genSyllogism()]).slice(0, n);
}
const APT_GEN = { numerical: genNumericalSet, verbal: genVerbalSet, logical: genLogicalSet, abstract: genAbstractSet, sjt: genSjtSet, speed: genSpeedSet };
