// A very small XML reader, enough for the job feeds (Personio's XML and Teamtailor's RSS). It has no packages and runs nothing.
import { decodeEntities } from "./util.mjs";

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Every <tag>…</tag> block in the text, in order
export function blocks(xml, tag) {
  const re = new RegExp("<" + esc(tag) + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + esc(tag) + ">", "g");
  const out = [];
  for (let m; (m = re.exec(String(xml ?? ""))); ) out.push(m[1]);
  return out;
}
// The text inside the first <tag>…</tag>, with CDATA unwrapped and entities decoded ("" if it isn't there)
export function tagText(xml, tag) {
  const m = new RegExp("<" + esc(tag) + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + esc(tag) + ">").exec(String(xml ?? ""));
  if (!m) return "";
  const v = m[1].trim(), c = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(v);
  return c ? c[1].trim() : decodeEntities(v);
}
