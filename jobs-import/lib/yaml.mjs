// Reads the small YAML files in config/ (a list of items with simple "key: value" lines). No other YAML is supported.
const scalar = v => {
  v = v.trim();
  if (/^(true|yes)$/i.test(v)) return true;
  if (/^(false|no)$/i.test(v)) return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v.startsWith("[") && v.endsWith("]")) return v.slice(1, -1).split(",").map(x => scalar(x)).filter(x => x !== "");
  return v;
};
export function parseList(text) {
  const items = [];
  let cur = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "").replace(/^\s*#.*$/, "");
    if (!line.trim()) continue;
    const m = line.match(/^(\s*)(-\s+)?([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!m) continue;
    if (m[2]) { cur = {}; items.push(cur); }
    if (cur) cur[m[3]] = scalar(m[4]);
  }
  return items;
}
