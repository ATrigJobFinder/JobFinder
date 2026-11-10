/* ===================== Aptitude tests: Easy, Medium and Hard ===================== */
// Medium is the set of generators in 31 and 31a, exactly as they were. Easy and Hard are written here, or reach into those generators
// through the small hooks below (how many rules a shape pattern has, how big a shape is, how much there is to remember...).
// The test room (31b) sets aptLevel just before it makes a test.
const APT_LEVELS = [
  { key: "easy", label: "Easy", desc: "Plainer questions and a little more time. A good way to learn the format." },
  { key: "medium", label: "Medium", desc: "Like a typical employer test. The way these tests always worked here." },
  { key: "hard", label: "Hard", desc: "Multi-step questions, traps and a little less time. Use it to check you are ready for the real thing." }
];
const LV_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
const LV_TIME = { easy: 1.25, medium: 1, hard: 0.9 };
let aptLevel = "medium";
const lvPick = (e, m, h) => aptLevel === "easy" ? e : aptLevel === "hard" ? h : m;

/* --- Hooks used by the generators in 31 and 31a --- */
const aptRuleCount = () => lvPick(rnd(1, 2), rnd(2, 3), rnd(3, 4));                       // shape patterns: how many things change at once
const aptSpatialSizes = () => lvPick([4], [5, 6], [6, 7]);                                // spatial: squares in the shape
const aptMechKind = () => aptLevel === "easy" ? pick(["lever", "gear", "pulley", "torque", "resistor"])
  : aptLevel === "hard" ? pick(["pulleydist", "gear3", "resistor3", "moments3"])
  : pick(["lever", "gear", "pulley", "hydraulic", "belt", "resistor", "torque"]);
const aptEc = () => lvPick({ rows: [4, 4], rate: 0.3, bad: [0, 2], none: 0.1, kinds: ["digit", "letter", "drop"], makers: [0, 3, 4] },
  { rows: [5, 4], rate: 0.5, bad: [0, 3], none: 0.2, kinds: ["digit", "letter", "drop", "swap", "double"], makers: [0, 1, 2, 3, 4, 5] },
  { rows: [7, 6], rate: 0.6, bad: [1, 4], none: 0.3, kinds: ["swap", "double", "letter", "digit"], makers: [1, 2, 5] });
const aptMem = () => lvPick({ digits: [4, 5], words: 4, cells: 3, secs: 1.4 }, { digits: [6, 8], words: 6, cells: 5, secs: 1 }, { digits: [8, 9], words: 8, cells: 7, secs: 0.75 });
const NUM_WORD = { 4: "four", 5: "five", 6: "six", 8: "eight" };

/* --- Numerical: easy reads and adds; hard chains percentages together --- */
function genNumericalLv(n) {
  const easy = aptLevel === "easy", qs = [];
  const sum = a => a.reduce((x, y) => x + y, 0), sgn = x => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x).toFixed(1)}`;
  for (let guard = 0; qs.length < n && guard < 300; guard++) {
    const T = pick(TABLES);
    const data = T.rows.map(() => T.cols.map(() => easy ? rnd(2, 20) * 10 : rnd(T.lo / 5, T.hi / 5) * 5));
    const table = { title: T.title, cols: T.cols, rows: T.rows, data };
    const tot = c => sum(data.map(row => row[c]));
    const kinds = shuffle(easy ? ["total", "avg", "top", "diff", "proj"] : ["pct", "share", "most", "totalpct", "reverse", "ppoints"]).slice(0, 3);
    for (const kind of kinds) {
      if (qs.length >= n) break;
      const r = rnd(0, T.rows.length - 1), c = rnd(0, T.cols.length - 1), i = rnd(0, 1), j = rnd(2, 3), v = data[r], col = data.map(row => row[c]);
      let q = null;
      if (kind === "total") {
        const ans = sum(col);
        q = { text: `What was the total for ${T.cols[c]} across all ${T.rows.length} rows?`, ...withOptions(ans, [ans - col[0], ans + col[1], ans - 10 * rnd(1, 4), ans + 15 * rnd(1, 3)], 5, String), why: `${col.join(" + ")} = ${ans}.`, skill: "totals" };
      } else if (kind === "avg") {
        const ans = r1(sum(v) / v.length);
        q = { text: `What was the average for ${T.rows[r]} across the ${v.length} periods?`, ...withOptions(ans, [r1(ans + 7.5), r1(ans - 5), r1((v[0] + v[v.length - 1]) / 2), r1(sum(v) / (v.length - 1))], 5, x => x.toFixed(1)), why: `(${v.join(" + ")}) ÷ ${v.length} = ${ans.toFixed(1)}.`, skill: "averages" };
      } else if (kind === "top") {
        const mx = Math.max(...col);
        if (col.filter(x => x === mx).length > 1) continue;
        const sh = shuffle(T.rows.map((_, k) => k));
        q = { text: `Which had the highest figure in ${T.cols[c]}?`, options: sh.map(k => T.rows[k]), answer: sh.indexOf(col.indexOf(mx)), why: T.rows.map((name, k) => `${name}: ${col[k]}`).join("; ") + `. The highest is ${T.rows[col.indexOf(mx)]}.`, skill: "reading tables" };
      } else if (kind === "diff") {
        const r2 = (r + 1 + rnd(0, T.rows.length - 2)) % T.rows.length, hi = col[r] >= col[r2] ? r : r2, lo = hi === r ? r2 : r, ans = col[hi] - col[lo];
        if (!ans) continue;
        q = { text: `In ${T.cols[c]}, how much higher was ${T.rows[hi]} than ${T.rows[lo]}?`, ...withOptions(ans, [ans + 10, Math.abs(ans - 10) || ans + 20, col[hi] + col[lo], ans * 2], 5, String), why: `${col[hi]} − ${col[lo]} = ${ans}.`, skill: "differences" };
      } else if (kind === "proj") {
        const p = pick([10, 20, 50]), base = v[3], ans = base * (1 + p / 100);
        q = { text: `If ${T.rows[r]} grows by ${p}% after ${T.cols[3]}, what will its next figure be?`, ...withOptions(ans, [base * p / 100, base + p, base * (1 - p / 100), base * (1 + p / 50)], 5, x => x % 1 ? x.toFixed(1) : String(x)), why: `${base} × ${1 + p / 100} = ${ans}.`, skill: "growth" };
      } else if (kind === "pct") {
        const ans = r1((v[j] - v[i]) / v[i] * 100);
        q = { text: `What was the percentage change in ${T.rows[r]} from ${T.cols[i]} to ${T.cols[j]}?`, ...withOptions(ans, [r1((v[j] - v[i]) / v[j] * 100), r1(-ans), r1(ans + 10), r1(ans * 0.5), r1(ans + 4.5)], 5, sgn), why: `(${v[j]} − ${v[i]}) ÷ ${v[i]} × 100 = ${sgn(ans)}%. Divide by the earlier figure.`, skill: "percentage change" };
        q.options = q.options.map(o => o + "%");
      } else if (kind === "share") {
        const ans = r1(v[c] / sum(col) * 100);
        q = { text: `What share of the ${T.cols[c]} total came from ${T.rows[r]}?`, ...withOptions(ans, [r1(v[c] / (sum(col) - v[c]) * 100), r1(100 / T.rows.length), r1(ans + 6), r1(ans - 4.2)], 5, x => `${x.toFixed(1)}%`), why: `${v[c]} ÷ ${sum(col)} × 100 = ${ans.toFixed(1)}%.`, skill: "shares" };
      } else if (kind === "most") {
        const growth = data.map(row => (row[3] - row[0]) / row[0]), best = growth.indexOf(Math.max(...growth));
        if (growth.filter(g => Math.abs(g - growth[best]) < 0.005).length > 1) continue;
        const sh = shuffle(T.rows.map((_, k) => k));
        q = { text: `Which had the largest percentage increase from ${T.cols[0]} to ${T.cols[3]}?`, options: sh.map(k => T.rows[k]), answer: sh.indexOf(best), why: T.rows.map((name, k) => `${name}: ${(growth[k] * 100).toFixed(1)}%`).join("; ") + ". Compare percentages, not raw increases.", skill: "comparing growth" };
      } else if (kind === "totalpct") {
        const ans = r1((tot(j) - tot(i)) / tot(i) * 100);
        q = { text: `What was the percentage change in the combined total of all ${T.rows.length} rows from ${T.cols[i]} to ${T.cols[j]}?`, ...withOptions(ans, [r1((tot(j) - tot(i)) / tot(j) * 100), r1(-ans), r1(ans + 8), r1(ans * 0.5), r1(ans - 5.5)], 5, sgn), why: `Total ${T.cols[i]} = ${tot(i)}, total ${T.cols[j]} = ${tot(j)}. (${tot(j)} − ${tot(i)}) ÷ ${tot(i)} × 100 = ${sgn(ans)}%.`, skill: "multi-step percentages" };
        q.options = q.options.map(o => o + "%");
      } else if (kind === "reverse") {
        const p = pick([10, 20, 25, 40]), fin = v[j], ans = r1(fin / (1 + p / 100));
        q = { text: `Suppose ${T.rows[r]}'s ${T.cols[j]} figure of ${fin} was reached after a ${p}% increase on the period before. What was the figure before?`, ...withOptions(ans, [r1(fin * (1 - p / 100)), r1(fin - p), r1(fin / (1 - p / 100)), r1(fin * p / 100), r1(ans + 5)], 5, x => x.toFixed(1)), why: `Before × ${1 + p / 100} = ${fin}, so before = ${fin} ÷ ${1 + p / 100} = ${ans.toFixed(1)}. Taking ${p}% off ${fin} is the common trap.`, skill: "reverse percentages" };
      } else if (kind === "ppoints") {
        const si = v[i] / tot(i) * 100, sj = v[j] / tot(j) * 100, ans = r1(sj - si);
        if (!ans) continue;
        q = { text: `By how many percentage points did ${T.rows[r]}'s share of the total change between ${T.cols[i]} and ${T.cols[j]}?`, ...withOptions(ans, [r1(Math.abs(ans) + 3), r1(-ans), r1((v[j] - v[i]) / v[i] * 100), r1(ans * 2), r1(ans + 1.5)], 5, x => `${sgn(x)} points`), why: `${T.cols[i]}: ${v[i]} ÷ ${tot(i)} = ${si.toFixed(1)}%. ${T.cols[j]}: ${v[j]} ÷ ${tot(j)} = ${sj.toFixed(1)}%. The share moved ${sgn(ans)} percentage points (not a percentage change of the share).`, skill: "percentage points" };
      }
      if (q) qs.push({ ...q, table });
    }
  }
  return qs;
}

/* --- Verbal: easy is true or false only; hard has "cannot say" traps --- */
const VERBAL_HARD = [
  { p: "Of the 240 staff at Brightwater Logistics, 150 work in the warehouse, 60 in the office and the rest drive delivery trucks. Last year every office worker received a 4% pay rise, while warehouse and driving staff received 3%. The company says it will introduce a four-day week for the warehouse in January, provided that productivity targets are met in the preceding quarter. No decision has been announced about the office.",
    q: [["Thirty of Brightwater's staff drive delivery trucks.", "T", "240 − 150 − 60 = 30."], ["The warehouse will move to a four-day week in January.", "C", "It depends on productivity targets, and the passage doesn't say whether they will be met."], ["Office staff received a larger pay rise than drivers.", "T", "Office staff got 4% and driving staff 3%."]] },
  { p: "A survey of 800 commuters found that 55% usually travel by train, 30% by car and the remainder by bus or bicycle. Among train commuters, three in four said their journey had become less reliable in the past year. The transport authority has said that signalling upgrades, scheduled to finish next year, should improve reliability, but it has not said by how much.",
    q: [["More than 400 of the commuters surveyed usually travel by train.", "T", "55% of 800 is 440."], ["Three in four of all the commuters surveyed said their journey had become less reliable.", "C", "The three in four figure is for train commuters only; the passage doesn't give one for everyone."], ["The signalling upgrades will make the trains run on time.", "C", "They \"should improve reliability\", by an amount that hasn't been said. That isn't the same as running on time."]] },
  { p: "Applicants for the cadetship must hold a current first-aid certificate and a driver's licence. Those with more than two years of relevant experience are exempt from the written test, but not from the interview. The panel interviews every applicant who passes the written test or is exempt from it. Unsuccessful applicants may reapply after six months.",
    q: [["An applicant with three years of relevant experience must still attend an interview.", "T", "Experience exempts them from the written test, but not the interview."], ["An applicant without a driver's licence may be interviewed if they pass the written test.", "F", "A licence is required to apply at all."], ["An applicant who fails the written test may reapply immediately.", "F", "Unsuccessful applicants may reapply after six months."]] },
  { p: "Most of the museum's visitors are school groups, which are admitted free of charge. Revenue from ticket sales fell by 8% last year even though total visitor numbers rose by 5%. The museum's director attributed the fall to a rise in school group visits. A review of admission prices is planned for next year.",
    q: [["The museum had more visitors last year than the year before.", "T", "Total visitor numbers rose by 5%."], ["The number of paying visitors fell last year.", "C", "Revenue fell, but that could also be due to prices or ticket types. The director only attributes it to school groups."], ["The review will lower the price of admission.", "C", "A review is planned. Its result isn't given."]] }
];
function genVerbalLv(n) {
  const SK = { T: "true statements", F: "false statements", C: "“cannot say” statements" };
  if (aptLevel === "easy") {
    const out = [];
    for (const set of shuffle(VERBAL_SETS)) {
      for (const [st, a, why] of set.q) if (a !== "C") out.push({ passage: set.p, text: `“${st}”`, options: ["True", "False"], answer: a === "T" ? 0 : 1, why, skill: SK[a] });
      if (out.length >= n) break;
    }
    return out.slice(0, n);
  }
  const out = [];
  for (const set of shuffle(VERBAL_HARD).slice(0, Math.ceil(n / 3))) for (const [st, a, why] of set.q) out.push({ passage: set.p, text: `“${st}”`, options: ["True", "False", "Cannot say"], answer: { T: 0, F: 1, C: 2 }[a], why, skill: SK[a] });
  return out.slice(0, n);
}

/* --- Logical: sequences and statements --- */
function seqOut(s, next, rule) {
  const last = s[4], gap = s[4] - s[3];
  return { text: "What number comes next?", seq: s, ...withOptions(next, [last + gap, next + 1, next - gap, next + 2 * Math.sign(gap || 1), Math.round(next * 1.1)], 5, x => String(x)), why: rule, skill: "sequences" };
}
function genSequenceLv() {
  const a = rnd(2, 12), d = rnd(2, 9), idx = [0, 1, 2, 3, 4];
  const easy = [
    () => { const s = idx.map(k => a + k * d); return seqOut(s, a + 5 * d, `Add ${d} each time.`); },
    () => { const b = rnd(1, 6), s = idx.map(k => b * 2 ** k); return seqOut(s, b * 32, "Multiply by 2 each time."); },
    () => { const top = a * 8 + d * 5, s = idx.map(k => top - k * d); return seqOut(s, top - 5 * d, `Take away ${d} each time.`); },
    () => { const st = rnd(1, 4), s = idx.map(k => (st + k) ** 2); return seqOut(s, (st + 5) ** 2, "Square numbers: " + idx.map(k => `${st + k}²`).join(", ") + "."); }
  ];
  const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
  const hard = [
    () => { const st = rnd(1, 4), s = idx.map(k => (st + k) ** 3); return seqOut(s, (st + 5) ** 3, "Cube numbers: " + idx.map(k => `${st + k}³`).join(", ") + "."); },
    () => { const s = [a]; for (let k = 1; k < 5; k++) s.push(s[k - 1] + k * k); return seqOut(s, s[4] + 25, "The gaps are the square numbers: +1, +4, +9, +16, so the next gap is +25."); },
    () => { const m = rnd(4, 9), t = rnd(2, 5), s = [m]; for (let k = 1; k < 5; k++) s.push(k % 2 ? s[k - 1] * 2 : s[k - 1] - t); return seqOut(s, s[4] * 2, `Two steps repeat: double, then take away ${t}. The next step is to double.`); },
    () => { const b = rnd(1, 4), s = [a, b]; for (let k = 2; k < 6; k++) s.push(s[k - 1] + s[k - 2] + 1); return seqOut(s.slice(0, 5), s[5], "Each number is the sum of the two before it, plus 1."); },
    () => { const x = rnd(5, 20), e = rnd(2, 6), s = [a, x, a * 2, x + e, a * 4]; return seqOut(s, x + 2 * e, `Two sequences take turns: ${a}, ${a * 2}, ${a * 4} (double) and ${x}, ${x + e}, ${x + 2 * e} (add ${e}).`); },
    () => { const st = rnd(0, PRIMES.length - 6), s = PRIMES.slice(st, st + 5); return seqOut(s, PRIMES[st + 5], "These are the prime numbers in order."); },
    () => { const b = rnd(1, 3), s = [b]; for (let k = 1; k < 5; k++) s.push(s[k - 1] * k); return seqOut(s, s[4] * 5, "Multiply by 1, then 2, then 3, then 4. The next number is × 5."); }
  ];
  return pick(aptLevel === "easy" ? easy : hard)();
}
function genSyllogismLv() {
  const [A, B, C, D] = shuffle(GROUPS).slice(0, 4);
  const easy = [
    [`All ${A} are ${B}. All ${B} are ${C}.`, `All ${A} are ${C}.`, 0, `Everything in ${A} is in ${B}, and everything in ${B} is in ${C}, so everything in ${A} is in ${C}.`],
    [`No ${A} are ${B}. All ${C} are ${A}.`, `No ${C} are ${B}.`, 0, `Every one of the ${C} is one of the ${A}, and none of the ${A} are ${B}.`],
    [`All ${A} are ${B}. No ${B} are ${C}.`, `No ${A} are ${C}.`, 0, `The ${A} are all ${B}, and no ${B} are ${C}.`],
    [`All ${A} are ${B}. No ${B} are ${C}.`, `Some ${A} are ${C}.`, 1, `The ${A} are all ${B}, and no ${B} are ${C}, so no ${A} can be ${C}.`],
    [`No ${A} are ${B}. All ${C} are ${A}.`, `Some ${C} are ${B}.`, 1, `Every one of the ${C} is one of the ${A}, and none of the ${A} are ${B}.`]
  ];
  const hard = [
    [`Some ${A} are ${B}. Some ${B} are ${C}.`, `Some ${A} are ${C}.`, 2, `The ${B} who are ${A} and the ${B} who are ${C} might be different ones. Two "some" statements don't have to link up.`],
    [`All ${A} are ${B}. Some ${C} are not ${B}.`, `Some ${C} are not ${A}.`, 0, `Those ${C} aren't ${B}, and every ${A.slice(0, -1)} is a ${B.slice(0, -1)}, so those ${C} can't be ${A}.`],
    [`No ${A} are ${B}. Some ${C} are not ${A}.`, `Some ${C} are ${B}.`, 2, `Being "not ${A}" says nothing about being ${B}. They might or might not be.`],
    [`Some ${A} are ${B}. No ${B} are ${C}.`, `Some ${A} are not ${C}.`, 0, `The ${A} who are ${B} can't be ${C}.`],
    [`All ${A} are ${B}. All ${C} are ${B}.`, `All ${A} are ${C}.`, 2, `Both groups sit inside ${B}, but that doesn't make one group the same as the other.`],
    [`All ${A} are ${B}. All ${B} are ${C}. Some ${D} are ${A}.`, `Some ${D} are ${C}.`, 0, `The ${D} who are ${A} are ${B}, and so they are ${C}.`],
    [`All ${A} are ${B}. All ${B} are ${C}. No ${C} are ${D}.`, `No ${A} are ${D}.`, 0, `${A} → ${B} → ${C}, and no ${C} are ${D}, so no ${A} are ${D}.`],
    [`Some ${A} are not ${B}. All ${B} are ${C}.`, `Some ${A} are not ${C}.`, 2, `The ${A} who aren't ${B} could still be ${C}, because ${C} may include more than ${B}.`]
  ];
  const [prem, concl, ans, why] = pick(aptLevel === "easy" ? easy : hard);
  return { text: `${prem}\nIf these statements are true, is this conclusion true, false, or can't you tell?\n“${concl}”`, options: ["True", "False", "Cannot tell"], answer: ans, why, skill: "logic statements" };
}
const genLogicalLv = n => Array.from({ length: n }, (_, k) => k % 3 === 2 ? genSyllogismLv() : genSequenceLv());

/* --- Situational judgement: clear-cut scenarios, or ones with two tempting answers --- */
const SJT_EASY = [
  { s: "You arrive at work and see a spill on the floor near the entrance.", o: ["Step around it and carry on.", "Put up a warning sign or cover it, then clean it up or tell the person responsible.", "Wait for someone else to notice it.", "Take a photo and post it in the staff chat only."], best: 1, why: "A hazard is dealt with straight away, and the right person is told." },
  { s: "A customer asks you about a product you don't know much about.", o: ["Make up an answer that sounds right.", "Tell them you don't know and walk away.", "Say you'll find out, then ask a colleague or check, and come back to them.", "Tell them to look it up online."], best: 2, why: "Honest, helpful and it finishes the job. Guessing could mislead the customer." },
  { s: "A train delay means you will be ten minutes late for your shift.", o: ["Arrive and say nothing.", "Let your manager know as soon as you can and say when you expect to arrive.", "Explain once you get there.", "Ask a friend at work to cover for you without telling anyone."], best: 1, why: "Telling them early lets the team plan around it." },
  { s: "A colleague is struggling to carry a heavy box.", o: ["Offer to help, or show them a safe way to lift it.", "Tell them to ask someone else.", "Ignore it: it's not your job.", "Laugh about it with others."], best: 0, why: "Helping prevents an injury and builds trust." },
  { s: "You notice you made a small mistake in a spreadsheet after you've saved and shared it.", o: ["Hope nobody notices.", "Fix it, check whether it affected anyone else's work, and tell your supervisor.", "Blame the software.", "Delete the whole file."], best: 1, why: "Owning a mistake and fixing it quickly is what employers want to see." },
  { s: "Your supervisor gives you instructions and you didn't fully understand them.", o: ["Nod and work it out as you go.", "Ask them to go through it again straight away, and write it down.", "Ask a colleague to do it instead.", "Wait until it's due and explain then."], best: 1, why: "Checking early is quicker than redoing the work." }
];
const SJT_HARD = [
  { s: "Two senior colleagues give you conflicting instructions about the same task, and each says theirs is the priority. Neither is available to talk right now.", o: ["Follow whoever is more senior.", "Do whichever is quicker.", "Tell both of them about the conflict in writing, say what you will do first and why, and ask them to confirm or sort it out.", "Do both versions and hand in the better one."], best: 2, why: "It makes the conflict visible, keeps you moving and puts the decision with the people who own it." },
  { s: "You find that a teammate has been rounding figures in a client report in a way that slightly favours your team. It isn't clearly against policy.", o: ["Say nothing: it's within policy.", "Raise it with your teammate first, check the policy together, and take it to your manager if you still think the client could be misled.", "Report your teammate straight to HR.", "Quietly change the figures yourself."], best: 1, why: "It gives your teammate a fair chance to explain, and still deals with the risk to the client." },
  { s: "You are two days from a major deadline. A client asks for a change that would take a day and a half. Your manager is on leave and can't be reached.", o: ["Refuse the change.", "Agree and work overtime without telling anyone.", "Explain the effect on the deadline to the client, offer options (a later date for the change, or a smaller change), and let the acting manager know what you've said.", "Make the change and skip testing."], best: 2, why: "It is honest with the client, offers a way forward and keeps the right person informed." },
  { s: "A long-serving colleague you respect keeps taking credit for your ideas in team meetings.", o: ["Call it out in front of everyone at the next meeting.", "Say nothing and stop sharing your ideas.", "Speak to them privately, give specific examples, and agree how ideas will be credited. Involve your manager if it continues.", "Tell the rest of the team what they've been doing."], best: 2, why: "A private, specific conversation first is fair and effective, with escalation as a backup." },
  { s: "Your manager asks you to calm an unhappy customer by promising a discount you know hasn't been approved.", o: ["Promise it to close the matter.", "Refuse to deal with the complaint.", "Acknowledge the complaint, promise only what you can deliver, and get the discount approved (or offer what is approved) before telling the customer.", "Pass the complaint to a colleague without explanation."], best: 2, why: "It keeps the customer's trust without making a promise the business can't keep." },
  { s: "During a busy shift you realise you've been given access to a file with other staff's personal details by mistake.", o: ["Look through it in case it's useful.", "Say nothing and delete it later.", "Close it without sharing it, and tell your supervisor or IT that you have access you shouldn't, so it can be fixed.", "Forward it to your manager to check."], best: 2, why: "It protects people's privacy, and reporting it lets the cause be fixed." }
];
const genSjtLv = n => shuffle(aptLevel === "easy" ? SJT_EASY : SJT_HARD).slice(0, n).map(s => { const order = shuffle([0, 1, 2, 3]); return { text: s.s + "\nWhat is the most effective response?", options: order.map(k => s.o[k]), answer: order.indexOf(s.best), why: s.why, skill: "judgement" }; });

/* --- Speed test --- */
const SPEED_WORDS_HARD = [
  ["Which word means the opposite of EPHEMERAL?", ["Fleeting", "Lasting", "Fragile", "Brief"], 1],
  ["Which word means the same as AMBIGUOUS?", ["Unclear", "Obvious", "Precise", "Hostile"], 0],
  ["Which word means the same as MITIGATE?", ["Worsen", "Lessen", "Ignore", "Repeat"], 1],
  ["ARCHITECT is to BLUEPRINT as COMPOSER is to…", ["Orchestra", "Score", "Concert", "Instrument"], 1],
  ["Which word means the opposite of BENEVOLENT?", ["Malicious", "Generous", "Gentle", "Wealthy"], 0],
  ["Which word does not belong?", ["Obstinate", "Stubborn", "Adamant", "Flexible"], 3],
  ["Which word means the same as CANDID?", ["Secretive", "Frank", "Polite", "Careless"], 1],
  ["ENTHUSIASM is to APATHY as GENEROSITY is to…", ["Charity", "Greed", "Kindness", "Wealth"], 1]
];
function genQuickMathsLv() {
  if (aptLevel === "easy") {
    const k = rnd(0, 3);
    if (k === 0) { const p = pick([10, 20, 25, 50]), x = rnd(2, 20) * 20, ans = x * p / 100; return { text: `What is ${p}% of ${x}?`, ...withOptions(ans, [ans * 2, ans / 2, x - ans, ans + 10], 5, String), why: `${x} × ${p / 100} = ${ans}.`, skill: "percentages" }; }
    if (k === 1) { const a = rnd(20, 90), b = rnd(10, 60), c = rnd(5, 30), ans = a + b - c; return { text: `What is ${a} + ${b} − ${c}?`, ...withOptions(ans, [a + b + c, a - b + c, ans + 10, ans - 10], 5, String), why: `${a} + ${b} = ${a + b}, then − ${c} = ${ans}.`, skill: "arithmetic" }; }
    if (k === 2) { const u = rnd(2, 9), n = rnd(2, 5), m = rnd(6, 10), ans = u * m; return { text: `If ${n} pens cost $${u * n}, how much do ${m} cost?`, ...withOptions(ans, [u * n + m, ans + u, ans - u, u * n * m / 2], 5, x => "$" + x), why: `One pen costs $${u}, so ${m} cost $${ans}.`, skill: "ratios" }; }
    const h = rnd(2, 5), sp = rnd(4, 9) * 10, ans = h * sp;
    return { text: `A truck travels at ${sp} km/h for ${h} hours. How far does it go?`, ...withOptions(ans, [ans + sp, ans - sp, sp / h, ans * 2], 5, x => `${Math.round(x)} km`), why: `${sp} × ${h} = ${ans} km.`, skill: "speed and distance" };
  }
  const k = rnd(0, 4);
  if (k === 0) { const p = pick([10, 20, 30]), ans = -p * p / 100; return { text: `A price rises by ${p}% and then falls by ${p}%. What is the overall change?`, ...withOptions(ans, [0, p / 2, -p, p, ans * 2], 5, x => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x)}%`), why: `1.${p / 10} × 0.${10 - p / 10} = ${(1 - p * p / 10000).toFixed(2)}, which is a ${p * p / 100}% fall. The second percentage is of a bigger number.`, skill: "percentages" }; }
  if (k === 1) { const price = pick([100, 200, 300, 400, 500]), d = pick([10, 20, 25]), ans = price * (1 - d / 100) * 1.1; return { text: `An item costing $${price} is discounted by ${d}%, then 10% GST is added to the discounted price. What is the final price?`, ...withOptions(ans, [price * (1 - d / 100 + 0.1), price * (1 - d / 100), price * 1.1 - d, ans + 10], 5, x => "$" + x.toFixed(2)), why: `$${price} × ${(1 - d / 100).toFixed(2)} × 1.10 = $${ans.toFixed(2)}.`, skill: "percentages" }; }
  if (k === 2) { const T = pick([240, 360, 480]), [a, b] = pick([[3, 5], [2, 3], [1, 3], [3, 7]]), ans = T / (a + b) * b; return { text: `$${T} is shared in the ratio ${a}:${b}. How much is the larger share?`, ...withOptions(ans, [T / (a + b) * a, T / b, T * b / (b + 1), ans + 20], 5, x => "$" + x), why: `${a + b} parts, so one part is $${T / (a + b)}. The larger share is ${b} parts = $${ans}.`, skill: "ratios" }; }
  if (k === 3) { const [a, b, h] = pick([[30, 60, 40], [40, 60, 48], [20, 30, 24], [60, 90, 72]]); return { text: `A driver travels a route at ${a} km/h and returns the same way at ${b} km/h. What is the average speed for the whole trip?`, ...withOptions(h, [(a + b) / 2, h + 4, h - 4, a + b - h], 5, x => `${x} km/h`), why: `Over a distance d the time is d/${a} + d/${b}, and the average is 2ab ÷ (a + b) = ${h} km/h. It isn't just the middle of the two speeds, because more time is spent going slowly.`, skill: "speed and distance" }; }
  const [p1, d1, p2] = pick([[3, 12, 4], [4, 18, 6], [6, 10, 5], [5, 12, 10]]), ans = p1 * d1 / p2;
  return { text: `${p1} people take ${d1} days to finish a job. How many days would ${p2} people take, working at the same rate?`, ...withOptions(ans, [d1 + (p2 - p1), d1 * p2 / p1, Math.max(1, d1 - (p2 - p1)), (d1 + ans) / 2], 5, x => `${x} days`), why: `${p1} × ${d1} = ${p1 * d1} person-days. ÷ ${p2} people = ${ans} days.`, skill: "ratios" };
}
function genSpeedLv(n) {
  const words = shuffle(aptLevel === "easy" ? SPEED_WORDS : SPEED_WORDS_HARD).slice(0, 4).map(([t, o, a]) => ({ text: t, options: o, answer: a, why: `The answer is “${o[a]}”.`, skill: "words" }));
  return shuffle([...Array.from({ length: 5 }, genQuickMathsLv), ...Array.from({ length: 4 }, genSequenceLv), ...words, genSyllogismLv(), genSyllogismLv()]).slice(0, n);
}

/* --- Mechanical: the harder kinds chain two things together --- */
const APT_HARD_MECH = {
  pulleydist() {
    const n = pick([2, 3, 4]), h = pick([1, 1.5, 2, 3]), load = pick([60, 120, 180, 240]), f = load / n, d = n * h;
    const ans = `${fmtNum(d)} m at ${fmtNum(f)} N`;
    return { text: `A person lifts a load of ${load} N through ${fmtNum(h)} m using an ideal pulley system with ${n} sections of rope supporting the load. How far must they pull the rope, and with what force?`, ...withOptions(ans, [`${fmtNum(h)} m at ${fmtNum(f)} N`, `${fmtNum(d)} m at ${fmtNum(load)} N`, `${fmtNum(h)} m at ${fmtNum(load)} N`], 4, x => x), why: `The force is ${load} ÷ ${n} = ${fmtNum(f)} N, but the rope is pulled ${n} times as far: ${n} × ${fmtNum(h)} = ${fmtNum(d)} m. Less force means more distance, so the work done is the same.`, skill: "pulleys" };
  },
  gear3() {
    const [tA, tB, tC, tD, rpm] = pick([[20, 40, 10, 30, 360], [30, 10, 20, 40, 120], [15, 45, 40, 20, 180], [24, 12, 12, 36, 90]]), out = rpm * (tA / tB) * (tC / tD);
    const fmt = (r, d) => `${fmtNum(r)} rpm ${d}`;
    return { text: `Gear A (${tA} teeth) turns clockwise at ${rpm} rpm and meshes with gear B (${tB} teeth). Gear C (${tC} teeth) is fixed to the same shaft as gear B and meshes with gear D (${tD} teeth). How does gear D turn?`, ...withOptions(fmt(out, "clockwise"), [fmt(out, "anticlockwise"), fmt(rpm * tB / tA * (tD / tC), "clockwise"), fmt(rpm * (tA / tB), "clockwise"), fmt(rpm * (tC / tD), "anticlockwise")], 4, x => x), why: `B turns at ${rpm} × ${tA}/${tB} = ${fmtNum(rpm * tA / tB)} rpm, anticlockwise. C is on the same shaft, so it turns the same way and speed. D turns at ${fmtNum(rpm * tA / tB)} × ${tC}/${tD} = ${fmtNum(out)} rpm, and meshing reverses the direction again: clockwise.`, skill: "gears" };
  },
  resistor3() {
    const [a, b] = pick([[6, 12], [10, 10], [4, 12], [20, 30], [15, 10]]), r1v = pick([5, 10, 15]), par = a * b / (a + b), ans = r1v + par;
    return { text: `A ${r1v} Ω resistor is connected in series with two resistors, ${a} Ω and ${b} Ω, that are connected in parallel with each other. What is the total resistance?`, ...withOptions(ans, [r1v + a + b, (r1v + a) * b / (r1v + a + b), par, r1v + (a + b) / 2], 4, x => `${fmtNum(x)} Ω`), why: `The parallel pair: ${a} × ${b} ÷ (${a} + ${b}) = ${fmtNum(par)} Ω. In series with ${r1v} Ω: ${r1v} + ${fmtNum(par)} = ${fmtNum(ans)} Ω.`, skill: "circuits" };
  },
  moments3() {
    let m1, d1, m2, d2, m3, ans, t = 0;
    do { m1 = pick([10, 20]); d1 = pick([1, 2]); m2 = pick([10, 20, 30]); d2 = pick([0.5, 1]); m3 = pick([10, 20, 25, 50]); ans = (m1 * d1 + m2 * d2) / m3; } while (!Number.isInteger(ans * 4) && ++t < 60);
    return { text: `A plank is balanced on a pivot at its centre. On the left, a ${m1} kg load sits ${fmtNum(d1)} m from the pivot and a ${m2} kg load sits ${fmtNum(d2)} m from the pivot. How far from the pivot on the right must a ${m3} kg load sit to balance the plank?`, ...withOptions(ans, [(m1 + m2) * Math.max(d1, d2) / m3, ans * 2, ans / 2, (m1 * d1) / m3 + d2], 4, x => `${fmtNum(x)} m`), why: `Left moments: ${m1} × ${fmtNum(d1)} + ${m2} × ${fmtNum(d2)} = ${fmtNum(m1 * d1 + m2 * d2)}. The right side must match: ${m3} × d = ${fmtNum(m1 * d1 + m2 * d2)}, so d = ${fmtNum(ans)} m.`, skill: "levers" };
  }
};

/* --- Put it together: Medium keeps its own generators, Easy and Hard use these --- */
const APT_LEVEL_GEN = {
  numerical: genNumericalLv,
  verbal: genVerbalLv,
  logical: genLogicalLv,
  sjt: genSjtLv,
  speed: genSpeedLv
};
for (const key of Object.keys(APT_LEVEL_GEN)) {
  const medium = APT_GEN[key];
  APT_GEN[key] = n => aptLevel === "medium" ? medium(n) : APT_LEVEL_GEN[key](n);
}
// (abstract, spatial, mechanical, error checking and memory change through the hooks at the top of this file)
Object.assign(APT_ADVICE, {
  "multi-step percentages": "When a percentage change is of a total, add up first, then compare: percentages of different bases can't be added.",
  "reverse percentages": "To undo a percentage increase, divide by 1 + the percentage. Taking the percentage off the final figure gives the wrong answer.",
  "percentage points": "A change in a share is in percentage points. A percentage change of that share is a different number.",
  "“cannot say” statements": "Choose Cannot say when the passage doesn't settle it, even if it sounds likely. Don't bring in what you already know.",
  "pulleys": "More rope sections means less force but more rope to pull. The work stays the same.",
  "gears": "Work through a gear train one mesh at a time, and remember each mesh reverses the direction. Gears on the same shaft turn together.",
  "circuits": "Combine the parallel part first, then add the series parts."
});
