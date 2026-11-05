/* ===================== Skill sorter ===================== */
const place = { parsed: null, missing: [], placements: new Map(), hints: new Map(), selected: null, open: false, confirmForget: false };

function setupPlace() {
  const body = $("placeBody");
  if (!body || !lastScan || !lastResult) return;
  place.parsed = parseResume(lastScan.resume);
  place.update = null;
  place.missing = [...lastResult.hard, ...lastResult.soft].filter(x => !x.found).map(x => ({ name: x.name, n: x.jd, kind: x.kind, priority: x.priority, adLine: x.adLine }));
  place.placements = new Map(); place.hints = new Map(); place.selected = null; place.open = true;
  if (memory.where !== "loading") {
    for (const s of place.missing) {
      const r = rememberedZone(s.name, place.parsed.zones);
      if (r && r.zoneId) place.placements.set(s.name, { zoneId: r.zoneId, note: r.note, remembered: true });
      else if (r && r.hint) place.hints.set(s.name, r.hint);
    }
  }
  // the box to place them in is always open
  if (place.missing.length) renderSorter();
  else body.innerHTML = `<p class="empty">This resume already covers every skill we found in the ad.</p>`;
  renderMemoryLine();
}

function renderMemoryLine() {
  const el = $("memoryLine");
  if (!el) return;
  const n = Object.keys(memory.skills).length;
  const where = { account: accountWords(), browser: "saved in this browser only", none: "can't be saved on this page", loading: "loading your saved answers…" }[memory.where];
  if (memory.where === "loading") { el.textContent = where[0].toUpperCase() + where.slice(1); return; }
  el.innerHTML = "";
  const span = document.createElement("span");
  span.textContent = n ? `${n} saved answer${n === 1 ? "" : "s"}, ${where}.` : `No saved answers yet. They'll be ${where.replace("saved ", "")}.`;
  el.appendChild(span);
  if (!n) return;
  if (!place.confirmForget) {
    const b = document.createElement("button"); b.type = "button"; b.className = "linkish"; b.textContent = "Forget saved answers";
    b.onclick = () => { place.confirmForget = true; renderMemoryLine(); };
    el.appendChild(b);
  } else {
    const q = document.createElement("span"); q.textContent = `Forget all ${n}?`;
    const yes = document.createElement("button"); yes.type = "button"; yes.className = "btn copy"; yes.textContent = "Forget";
    const no = document.createElement("button"); no.type = "button"; no.className = "linkish"; no.textContent = "Cancel";
    yes.onclick = async () => { memory.skills = {}; place.confirmForget = false; await saveMemory(); setupPlace(); };
    no.onclick = () => { place.confirmForget = false; renderMemoryLine(); };
    el.append(q, yes, no);
  }
}

function chipEl(s, placed) {
  const c = document.createElement("span");
  c.className = "skill-chip"; c.draggable = true; c.tabIndex = 0;
  c.setAttribute("role", "button"); c.dataset.skill = s.name;
  c.setAttribute("aria-pressed", String(place.selected === s.name));
  c.setAttribute("aria-label", `${s.name}. ${placed ? "Placed. Press to pick up and move." : "Press, then choose where it goes."}`);
  c.append(document.createTextNode(s.name));
  if (!placed) { const n = document.createElement("span"); n.className = "n"; n.textContent = "×" + s.n; c.appendChild(n); }
  const p = place.placements.get(s.name);
  if (placed && p && p.remembered) { const r = document.createElement("span"); r.className = "rem"; r.textContent = "Saved"; c.appendChild(r); }
  if (placed) {
    const x = document.createElement("button"); x.type = "button"; x.className = "chip-x"; x.textContent = "×";
    x.setAttribute("aria-label", `Move ${s.name} back to the list`);
    x.onclick = e => { e.stopPropagation(); place.placements.delete(s.name); renderSorter(); };
    c.appendChild(x);
  }
  const toggleSel = () => { place.selected = place.selected === s.name ? null : s.name; renderSorter(); focusChip(s.name); };
  c.addEventListener("click", e => { if (e.target.closest(".chip-x")) return; e.stopPropagation(); toggleSel(); });
  c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSel(); } });
  c.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", s.name); e.dataTransfer.effectAllowed = "move"; c.classList.add("dragging"); });
  c.addEventListener("dragend", () => c.classList.remove("dragging"));
  return c;
}
function focusChip(name) { const el = [...document.querySelectorAll(".skill-chip")].find(c => c.dataset.skill === name); if (el) el.focus(); }

function dropTarget(el, zoneId) {
  el.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; el.classList.add("over"); });
  el.addEventListener("dragleave", e => { if (!el.contains(e.relatedTarget)) el.classList.remove("over"); });
  el.addEventListener("drop", e => {
    e.preventDefault(); el.classList.remove("over");
    const name = e.dataTransfer.getData("text/plain");
    if (place.missing.some(s => s.name === name)) moveSkill(name, zoneId);
  });
  el.addEventListener("click", e => {
    if (!place.selected || e.target.closest("input, .chip-x, .skill-chip")) return;
    const name = place.selected; place.selected = null; moveSkill(name, zoneId);
  });
}
function moveSkill(name, zoneId) {
  if (zoneId === "__tray") place.placements.delete(name);
  else { const prev = place.placements.get(name); place.placements.set(name, { zoneId, note: prev && prev.zoneId === zoneId ? prev.note : (prev ? prev.note : ""), remembered: false }); }
  renderSorter();
}

function renderSorter() {
  const body = $("placeBody");
  if (!body || !place.open) return;
  const { zones, skillsSec } = place.parsed;
  const sel = place.selected;
  const unplaced = place.missing.filter(s => !place.placements.has(s.name));
  body.innerHTML = `
  <div class="sorter" id="sorterTop">
    <div style="display:grid;gap:4px">
      <p class="sorter-q">Where have you used each of these skills?</p>
      <p class="small muted">Drag a skill onto a job or section, or tap a skill and then tap where it goes. A few words on what you did (optional) let it be written into that job's bullet points. Without a note, technical skills go into your skills section and soft skills into your profile. Only place skills you've genuinely used.</p>
    </div>
    <div class="tray" id="tray">
      <span class="small muted">${unplaced.length ? `Skills from this job ad (${unplaced.length} left)${sel ? ` · <b>${esc(sel)}</b> selected, now tap where it goes` : ""}` : "All skills placed."}</span>
      <div class="tray-chips" id="trayChips"></div>
    </div>
    <div class="zones" id="zones"></div>
    <div class="sorter-foot">
      <button class="btn primary" id="applyBtn" type="button" ${place.placements.size ? "" : "disabled"}>Save answers to profile and tailor my resume →</button>
      <span class="engine-note" id="engineNote"></span>
    </div>
    <div id="updateOut" aria-live="polite"></div>
  </div>`;
  const tray = $("trayChips");
  for (const s of unplaced) {
    const c = chipEl(s, false);
    const hint = place.hints.get(s.name);
    c.title = `${s.priority || ""}${s.adLine ? `. The ad says: "${s.adLine}"` : ""}${hint ? `\nLast time you placed this under "${hint}", which isn't in this resume.` : ""}`;
    tray.appendChild(c);
  }
  dropTarget($("tray"), "__tray");
  const zoneDefs = [
    ...zones.map(z => ({ id: z.id, kind: { role: "Work experience", education: "Education", section: "Section" }[z.kind], title: z.label, notes: true, cls: "" })),
    { id: "__skills", kind: "Skills section", title: skillsSec ? `Add to "${skillsSec.title.toLowerCase().replace(/(^|\s|&)\S/g, c => c.toUpperCase())}"` : "Add a Skills section", notes: false, cls: "skills-zone", empty: "I have it, but not from one job" },
    { id: "__na", kind: "Not applicable", title: "I don't have this skill", notes: false, cls: "na", empty: "Skills you don't have stay off your resume" }
  ];
  const wrap = $("zones");
  for (const d of zoneDefs) {
    const z = document.createElement("div");
    z.className = "zone " + d.cls; z.dataset.zone = d.id;
    const head = document.createElement("button");
    head.type = "button"; head.className = "linkish"; head.style.cssText = "text-decoration:none;text-align:left;color:inherit;display:grid;gap:2px";
    head.setAttribute("aria-label", sel ? `Place ${sel} in ${d.title}` : d.title);
    const k = document.createElement("span"); k.className = "zone-kind"; k.textContent = d.kind;
    const t = document.createElement("span"); t.className = "zone-title"; t.textContent = d.title;
    head.append(k, t);
    head.onclick = e => { e.stopPropagation(); if (place.selected) { const n = place.selected; place.selected = null; moveSkill(n, d.id); } };
    const placed = document.createElement("div"); placed.className = "placed";
    placed.dataset.empty = d.empty || (sel ? "Tap here to place it" : "Drop skills here");
    for (const s of place.missing.filter(s => (place.placements.get(s.name) || {}).zoneId === d.id)) {
      const item = document.createElement("div"); item.className = "placed-item";
      item.appendChild(chipEl(s, true));
      if (d.notes) {
        const inp = document.createElement("input");
        inp.type = "text"; inp.id = "note-" + d.id + "-" + s.name.replace(/[^a-z0-9]/gi, "_");
        inp.placeholder = s.kind === "hard" ? `How did you show this? (optional) e.g. "drafted bracket drawings"` : `How did you show this? (optional) e.g. "trained 3 new starters"`;
        inp.setAttribute("aria-label", `How did you show ${s.name} in ${d.title}? (optional)`);
        inp.value = place.placements.get(s.name).note || "";
        inp.maxLength = 160; inp.dataset.nohelp = "1";
        inp.addEventListener("input", () => { const p = place.placements.get(s.name); if (p) { p.note = inp.value; p.remembered = false; } });
        item.appendChild(inp);
      }
      placed.appendChild(item);
    }
    z.append(head, placed);
    dropTarget(z, d.id);
    wrap.appendChild(z);
  }
  $("applyBtn").onclick = () => applyPlacements(true);
  describeEngine();
}

