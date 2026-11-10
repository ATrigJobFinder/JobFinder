/* ===================== File reading ===================== */
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const MAMMOTH = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";
const loaded = {};
function loadScript(src) {
  if (!loaded[src]) loaded[src] = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error("Couldn't load the file reader. Check your connection and try again, or paste the text instead.")); };
    document.head.appendChild(s);
  });
  return loaded[src];
}
function pdfItemsToText(items) {
  const rows = [];
  for (const it of items) {
    if (!it.str || !it.transform) continue;
    const x = it.transform[4], y = it.transform[5];
    const h = Math.abs(it.transform[3]) || it.height || 10;
    let row = rows.find(r => Math.abs(r.y - y) < 2.5);
    if (!row) { row = { y, parts: [] }; rows.push(row); }
    row.parts.push({ x, w: it.width || 0, s: it.str, h });
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map(r => {
    r.parts.sort((a, b) => a.x - b.x);
    let line = "", end = null;
    for (const p of r.parts) {
      // Letter-spaced headings come out one glyph at a time; only a gap wider than ~a third of the font size is a real space.
      const gap = end === null ? 0 : p.x - end;
      if (end !== null && gap > 0.3 * p.h && !/\s$/.test(line) && !/^\s/.test(p.s)) line += gap > 2 * p.h ? "   " : " ";
      line += p.s; end = p.x + p.w;
    }
    return fixSpacedLine(line.replace(/[ \t]+$/g, ""));
  }).join("\n");
}
// Headings set with wide letter spacing are read as "P R O F I L E". Re-join them so the scan
// can still find sections, and remember them so the ATS check can warn about it.
const HEAD_WORDS = ["engineering", "analytical", "professional", "relevant", "technical", "additional", "volunteering", "community", "experience", "education", "skills", "skill", "certifications", "certification", "profile", "summary", "referees", "references", "projects", "project", "awards", "achievements", "interests", "languages", "qualifications", "employment", "history", "career", "publications", "leadership", "activities", "training", "courses", "coursework", "objective", "personal", "details", "contact", "selected", "research", "extracurricular", "work", "key", "core", "other", "about", "and", "me"].sort((a, b) => b.length - a.length);
let spacedFound = [];
function fixSpacedLine(line) {
  const toks = line.trim().split(/\s+/);
  if (toks.length < 4 || toks.filter(t => t.length === 1).length / toks.length < 0.8) return line;
  spacedFound.push(line.trim());
  const joined = toks.join("");
  const low = joined.toLowerCase(), parts = [];
  let i = 0;
  while (i < low.length) {
    if (!/[a-z]/.test(low[i])) { parts.push(joined[i]); i++; continue; }
    const w = HEAD_WORDS.find(w => low.startsWith(w, i));
    if (!w) return joined;
    parts.push(joined.slice(i, i + w.length)); i += w.length;
  }
  return parts.join(" ");
}
async function readFile(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "doc") throw new Error("Older .doc files can't be read here. Open it in Word, save it as .docx or PDF, and upload that.");
  if (!["pdf", "docx", "txt"].includes(ext)) throw new Error("Upload a PDF, Word (.docx) or text file.");
  if (file.size > 15 * 1024 * 1024) throw new Error("That file is over 15 MB. Resumes are usually under 1 MB; try exporting it again.");
  let text = "", buffer = null;
  spacedFound = [];
  if (ext === "pdf") {
    await loadScript(PDFJS);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      pages.push(pdfItemsToText(tc.items));
    }
    text = pages.join("\n\n");
  } else if (ext === "docx") {
    await loadScript(MAMMOTH);
    const buf = await file.arrayBuffer();
    buffer = buf.slice(0);   // kept so the download can edit the original document in place
    const r = await window.mammoth.extractRawText({ arrayBuffer: buf });
    text = r.value.replace(/\n{3,}/g, "\n\n");
  } else {
    text = await file.text();
  }
  return { text: text.trim(), ext, spaced: spacedFound.slice(), buffer };
}
async function handleFile(file) {
  if (!file) return;
  els.fileStatus.classList.remove("err");
  els.fileStatus.textContent = `Reading ${file.name}…`;
  try {
    const { text, ext, spaced, buffer } = await readFile(file);
    els.resume.value = text;
    tlFileLoaded(file);   // (before anything redraws: on the opening page the file stays until Next is pressed)
    fileInfo = { name: file.name, ext, words: wordCount(text), spaced, buffer, text };
    updateDownloadBtn();
    setExample(false);
    updateCounts();
    els.fileStatus.textContent = `Read ${fileInfo.words} words from ${file.name}.`;
    updateFlow();
  } catch (e) {
    els.fileStatus.classList.add("err");
    els.fileStatus.textContent = e && e.message ? e.message : "Couldn't read that file. Try saving it as a PDF or .docx and uploading that.";
  } finally {
    els.fileInput.value = "";
  }
}

