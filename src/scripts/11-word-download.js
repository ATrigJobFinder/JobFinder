/* ===================== Download in the original format ===================== */
const JSZIP = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function exportName(ext) {
  const base = fileInfo ? fileInfo.name.replace(/\.[^.]+$/, "") : ((els.resume.value.split("\n").find(l => l.trim()) || "Resume").trim().replace(/\s+/g, "-") + "-Resume");
  const role = (lastScan && detectTitle(lastScan.jd, lastScan.title)) || "";
  return `${base}${role ? " - " + role : " - updated"}`.replace(/[\\/:*?"<>|]+/g, "").slice(0, 150) + "." + ext;
}

// --- Word: edit the original document in place ---
function walkText(node, out) {
  for (const c of node.childNodes) {
    if (c.nodeType !== 1) continue;
    const ln = c.localName;
    if (ln === "Fallback" || ln === "pPr" || ln === "rPr" || ln === "delText" || ln === "instrText" || ln === "del" || ln === "drawing" || ln === "pict" || ln === "txbxContent") continue;
    if (c.namespaceURI === W_NS && ln === "t") out.push(c.textContent);
    else if (c.namespaceURI === W_NS && ln === "tab") out.push("\t");
    else if (c.namespaceURI === W_NS && (ln === "br" || ln === "cr")) out.push(" ");
    else if (c.namespaceURI === W_NS && ln === "noBreakHyphen") out.push("-");
    else walkText(c, out);
  }
}
const paraText = p => { const out = []; walkText(p, out); return out.join(""); };
const flat = s => String(s).replace(BULLET_RE, "").replace(/\s+/g, " ").trim();
function makeRun(doc, base, text) {
  const r = doc.createElementNS(W_NS, "w:r");
  const rPr = base && [...base.childNodes].find(c => c.localName === "rPr");
  if (rPr) r.appendChild(rPr.cloneNode(true));
  text.split("\t").forEach((part, i) => {
    if (i) r.appendChild(doc.createElementNS(W_NS, "w:tab"));
    if (part) { const t = doc.createElementNS(W_NS, "w:t"); t.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve"); t.textContent = part; r.appendChild(t); }
  });
  return r;
}
function setParaText(p, text, oldText) {
  const doc = p.ownerDocument;
  const textRuns = [...p.getElementsByTagNameNS(W_NS, "r")].filter(r => r.getElementsByTagNameNS(W_NS, "t").length);
  const nt = flat(text), ot = oldText == null ? null : flat(oldText);
  if (ot && textRuns.length && nt.startsWith(ot) && nt.length > ot.length) {
    // Text only added at the end (e.g. a skill on a list): keep every existing run and add one styled like the last
    const last = textRuns[textRuns.length - 1];
    last.parentNode.insertBefore(makeRun(doc, last, nt.slice(ot.length)), last.nextSibling);
    return;
  }
  const base = textRuns.slice().sort((a, b) => paraText(b).length - paraText(a).length)[0] || null;
  for (const h of [...p.getElementsByTagNameNS(W_NS, "hyperlink")]) h.parentNode && h.parentNode.removeChild(h);
  for (const r of [...p.getElementsByTagNameNS(W_NS, "r")]) r.parentNode && r.parentNode.removeChild(r);
  p.appendChild(makeRun(doc, base, text.replace(BULLET_RE, "")));
}
function cloneParaAfter(anchor, text) {
  const clone = anchor.cloneNode(true);
  for (const el of [clone, ...clone.getElementsByTagName("*")]) {
    for (const a of [...el.attributes]) if (/^(paraId|textId)$/.test(a.localName)) el.removeAttributeNode(a);
  }
  for (const tag of ["bookmarkStart", "bookmarkEnd", "sectPr", "commentRangeStart", "commentRangeEnd", "commentReference"]) for (const b of [...clone.getElementsByTagNameNS(W_NS, tag)]) b.parentNode.removeChild(b);
  setParaText(clone, text, null);
  anchor.parentNode.insertBefore(clone, anchor.nextSibling);
  return clone;
}
function removePara(p) {
  const parent = p.parentNode;
  const isLastInCell = parent.localName === "tc" && [...parent.childNodes].filter(c => c.localName === "p").length === 1;
  if (isLastInCell || p.getElementsByTagNameNS(W_NS, "sectPr").length) setParaText(p, "", null);
  else parent.removeChild(p);
}
// Line-level diff between the document's paragraphs and the final text
function diffOps(a, b) {
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const ops = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push(["eq", i++, j++]); }
    else if (L[i + 1][j] >= L[i][j + 1]) ops.push(["del", i++, -1]);
    else ops.push(["ins", -1, j++]);
  }
  while (i < n) ops.push(["del", i++, -1]);
  while (j < m) ops.push(["ins", -1, j++]);
  return ops;
}
async function patchDocx(buffer, finalText) {
  await loadScript(JSZIP);
  const zip = await window.JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml").async("string");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Couldn't read the Word file's contents.");
  const paras = [...doc.getElementsByTagNameNS(W_NS, "p")].filter(p => { for (let n = p.parentNode; n; n = n.parentNode) if (n.localName === "Fallback" || n.localName === "txbxContent") return false; return true; })
    .map(p => ({ p, text: paraText(p) })).filter(x => flat(x.text));
  const finals = finalText.split("\n").map(l => l.replace(/\s+$/, "")).filter(l => flat(l));
  const ops = diffOps(paras.map(x => flat(x.text)), finals.map(flat));
  let anchor = null, k = 0, changed = 0;
  while (k < ops.length) {
    if (ops[k][0] === "eq") { anchor = paras[ops[k][1]].p; k++; continue; }
    const dels = [], ins = [];
    while (k < ops.length && ops[k][0] !== "eq") { (ops[k][0] === "del" ? dels : ins).push(ops[k]); k++; }
    const pairs = Math.min(dels.length, ins.length);
    for (let x = 0; x < pairs; x++) { const d = paras[dels[x][1]]; setParaText(d.p, finals[ins[x][2]], d.text); anchor = d.p; changed++; }
    for (let x = pairs; x < ins.length; x++) {
      const template = anchor || (paras[0] && paras[0].p);
      if (!template) continue;
      anchor = cloneParaAfter(template, finals[ins[x][2]]); changed++;
    }
    for (let x = pairs; x < dels.length; x++) { removePara(paras[dels[x][1]].p); changed++; }
  }
  const out = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + new XMLSerializer().serializeToString(doc).replace(/^<\?xml[^>]*\?>\s*/, "");
  zip.file("word/document.xml", out);
  return { blob: await zip.generateAsync({ type: "blob", mimeType: DOCX_MIME, compression: "DEFLATE" }), changed };
}

// --- Word: a clean layout for resumes that came in as PDF or pasted text ---
async function buildCleanDocx(text) {
  await loadScript(JSZIP);
  const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const run = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}<w:color w:val="${o.color || "222222"}"/>${o.caps ? '<w:spacing w:val="20"/>' : ""}<w:sz w:val="${o.sz || 21}"/></w:rPr>${t.split("\t").map((p, i) => (i ? "<w:tab/>" : "") + (p ? `<w:t xml:space="preserve">${x(p)}</w:t>` : "")).join("")}</w:r>`;
  const para = (runs, o = {}) => `<w:p><w:pPr>${o.keep ? "<w:keepNext/>" : ""}${o.border ? '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="1F3A5F"/></w:pBdr>' : ""}${o.tabs ? `<w:tabs><w:tab w:val="right" w:pos="${o.tabs}"/></w:tabs>` : ""}<w:spacing w:before="${o.before || 0}" w:after="${o.after ?? 40}" w:line="252" w:lineRule="auto"/>${o.ind ? `<w:ind w:left="${o.ind}" w:hanging="220"/>` : ""}${o.center ? '<w:jc w:val="center"/>' : ""}</w:pPr>${runs}</w:p>`;
  const lines = text.split("\n");
  const firstHead = lines.findIndex((l, i) => isHeadingLine(l, i));
  const TEXT_W = 11906 - 2 * 1020;
  let firstSeen = false;
  const body = [];
  lines.forEach((l, i) => {
    const t = l.trim();
    if (!t) return;
    if (!firstSeen) { firstSeen = true; body.push(para(run(t, { b: true, sz: 40, color: "1F3A5F" }), { center: true, after: 40 })); return; }
    if (firstHead < 0 || i < firstHead) { body.push(para(run(t, { sz: 19, color: "444444" }), { center: true, after: 20 })); return; }
    if (isHeadingLine(l, i)) { body.push(para(run(t.toUpperCase(), { b: true, sz: 21, color: "1F3A5F", caps: true }), { before: 200, after: 80, border: true, keep: true })); return; }
    if (BULLET_RE.test(l)) { body.push(para(run("•\t" + t.replace(BULLET_RE, "")), { ind: 340, after: 20 })); return; }
    if (RANGE_TEST.test(t)) {
      const m = t.match(new RegExp(RANGE_RE.source + "(\\s*\\((expected|current|ongoing)\\))?", "i"));
      const left = cleanHeader(t.replace(m[0], " "));
      body.push(para(run(left, { b: true }) + run("\t" + m[0].trim(), { sz: 19, color: "5A5A5A" }), { tabs: TEXT_W, before: 100, after: 0, keep: true }));
      return;
    }
    body.push(para(run(t)));
  });
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W_NS}"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="1020" w:bottom="850" w:left="1020" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const zip = new window.JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.file("word/document.xml", docXml);
  return zip.generateAsync({ type: "blob", mimeType: DOCX_MIME, compression: "DEFLATE" });
}

let downloadsCap;
async function saveFile(filename, blob) {
  if (downloadsCap === undefined) { try { downloadsCap = window.claude && window.claude.use ? await window.claude.use("downloads") : null; } catch { downloadsCap = null; } }
  if (downloadsCap) return downloadsCap.save({ filename, data: blob });
  // Outside Claude (e.g. on your own website) a normal browser download works
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { status: "saved" };
}
async function exportResume(text, statusEl, btn) {
  const say = m => { if (statusEl) statusEl.textContent = m; };
  if (!text || !text.trim()) { say("There's no resume text to download yet."); return; }
  if (btn) btn.disabled = true;
  say("Preparing your file…");
  try {
    let blob, name, note;
    if (fileInfo && fileInfo.ext === "docx" && fileInfo.buffer) {
      const r = await patchDocx(fileInfo.buffer, text);
      blob = r.blob; name = exportName("docx");
      note = r.changed ? `Updated ${r.changed} paragraph${r.changed === 1 ? "" : "s"} in your original layout.` : "No changes from your original file.";
    } else if (fileInfo && fileInfo.ext === "txt") {
      blob = new Blob([text], { type: "text/plain" }); name = exportName("txt"); note = "";
    } else {
      blob = await buildCleanDocx(text); name = exportName("docx"); note = "";
    }
    say("Confirm the download in the prompt…");
    const res = await saveFile(name, blob);
    say(res && res.status === "delivered" ? "Sent." : `Downloaded ${name}. ${note}`.trim());
    return true;
  } catch (e) {
    const code = e && e.code;
    say(code === "declined" ? "Download cancelled."
      : code === "rate_limited" ? "A download prompt is already open. Finish that one first."
      : ["unavailable", "not_granted", "capability_disabled", "capability_removed"].includes(code) ? "Downloads aren't available here. Use Copy text instead."
      : (e && e.message && !code ? e.message : "Couldn't create the file. Try again, or use Copy text."));
  } finally { if (btn) btn.disabled = false; }
}

