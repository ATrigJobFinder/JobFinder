/* ===================== Resume and CV templates ===================== */
// Each template is a set of choices the three renderers (page preview, Word, PDF) all follow,
// so what you see is what you download.
const FONTS = {
  Calibri: { css: 'Calibri, Carlito, "Segoe UI", "Helvetica Neue", Arial, sans-serif', pdf: "helvetica" },
  "Calibri Light": { css: '"Calibri Light", Calibri, Carlito, "Helvetica Neue", Arial, sans-serif', pdf: "helvetica" },
  Arial: { css: 'Arial, "Helvetica Neue", Helvetica, sans-serif', pdf: "helvetica" },
  Georgia: { css: 'Georgia, Cambria, "Times New Roman", serif', pdf: "times" },
  Cambria: { css: 'Cambria, Caladea, Georgia, "Times New Roman", serif', pdf: "times" },
  "Times New Roman": { css: '"Times New Roman", Times, Tinos, serif', pdf: "times" },
  Consolas: { css: 'Consolas, "IBM Plex Mono", Menlo, monospace', pdf: "courier" },
  Aptos: { css: 'Aptos, Calibri, Carlito, "Segoe UI", "Helvetica Neue", Arial, sans-serif', pdf: "helvetica" },
  Verdana: { css: 'Verdana, Geneva, "DejaVu Sans", sans-serif', pdf: "helvetica" },
  "Trebuchet MS": { css: '"Trebuchet MS", "Segoe UI", "Helvetica Neue", Arial, sans-serif', pdf: "helvetica" },
  Tahoma: { css: 'Tahoma, Verdana, "Segoe UI", sans-serif', pdf: "helvetica" },
  "Century Gothic": { css: '"Century Gothic", "Avenir Next", Futura, "Helvetica Neue", Arial, sans-serif', pdf: "helvetica" },
  Garamond: { css: 'Garamond, "EB Garamond", "Adobe Garamond Pro", "Times New Roman", serif', pdf: "times" },
  "Palatino Linotype": { css: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif', pdf: "times" }
};
const SERIF_FONTS = new Set(["Georgia", "Cambria", "Times New Roman", "Garamond", "Palatino Linotype"]);
const CV_TEMPLATES = [
  { key: "professional", name: "Professional", formality: 4, ats: true, style: "simple",
    blurb: "A clean single column that applicant tracking systems read perfectly.",
    goodFor: "Online applications, engineering, graduate programs and most office jobs",
    jobTypes: ["graduate", "engineering", "government", "health", "tech", "corporate"],
    layout: "single", body: "Calibri", head: "Calibri", accent: "#1F3A5F", accents: ["#1F3A5F", "#0F5E59", "#5B2A86", "#8A2432", "#2B2B2B"],
    nm: { size: 24, caps: false, track: 0, align: "left", weight: 700 }, heading: "rule", headCaps: true,
    dates: "right", bullet: "dot", size: 10.5, margin: 16, titles: "standard", order: "standard", skillsAs: "groups" },
  { key: "classic", name: "Classic", formality: 5, ats: true, style: "formal",
    blurb: "Centred serif heading and ruled sections. Traditional and calm.",
    goodFor: "Law, finance, government, and traditional employers",
    jobTypes: ["corporate", "government", "health", "academic"],
    layout: "single", body: "Georgia", head: "Georgia", accent: "#222222", accents: ["#222222", "#1F3A5F", "#5C1A26", "#2F4F3A", "#4A3B2A"],
    nm: { size: 22, caps: true, track: 0.12, align: "center", weight: 700 }, heading: "rules", headCaps: true,
    dates: "right", bullet: "dot", size: 10.5, margin: 18, titles: "formal", order: "standard", skillsAs: "groups" },
  { key: "executive", name: "Executive", formality: 5, ats: true, style: "formal",
    blurb: "Large name, refined serif type and a coloured accent line.",
    goodFor: "Senior, management and consulting roles",
    jobTypes: ["corporate", "government"],
    layout: "single", body: "Cambria", head: "Cambria", accent: "#6B1F2A", accents: ["#6B1F2A", "#1F3A5F", "#0F4C3A", "#3A3A3A", "#7A5C1E"],
    nm: { size: 28, caps: false, track: 0, align: "left", weight: 700 }, heading: "accent", headCaps: true,
    dates: "right", bullet: "square", size: 10.5, margin: 18, titles: "formal", order: "standard", skillsAs: "groups" },
  { key: "corporate", name: "Corporate", formality: 4, ats: true, style: "modern",
    blurb: "A solid colour band across the top with crisp section bars.",
    goodFor: "Business, banking, sales and consulting",
    jobTypes: ["corporate", "graduate", "tech"],
    layout: "band", body: "Calibri", head: "Calibri", accent: "#1D4E89", accents: ["#1D4E89", "#0F5E59", "#34495E", "#7A1F3D", "#2E5E2E"],
    nm: { size: 26, caps: false, track: 0, align: "left", weight: 700 }, heading: "bar", headCaps: true,
    dates: "right", bullet: "dot", size: 10.5, margin: 15, titles: "standard", order: "standard", skillsAs: "groups" },
  { key: "technical", name: "Technical", formality: 3, ats: true, style: "simple",
    blurb: "Skills first, with monospaced headings that suit technical work.",
    goodFor: "Software, data, IT and engineering",
    jobTypes: ["tech", "engineering"],
    layout: "single", body: "Calibri", head: "Consolas", accent: "#1E6B52", accents: ["#1E6B52", "#2440B8", "#8A4B08", "#6B2A86", "#333333"],
    nm: { size: 24, caps: false, track: 0, align: "left", weight: 700 }, heading: "rule", headCaps: true,
    dates: "right", bullet: "dash", size: 10, margin: 15, titles: "standard", order: "skillsFirst", skillsAs: "groups" },
  { key: "modern", name: "Modern", formality: 3, ats: false, style: "modern",
    blurb: "Two columns with a tinted sidebar for contact details and skills.",
    goodFor: "Emailing or handing in your resume; tech, marketing and startups",
    jobTypes: ["tech", "creative", "graduate"],
    layout: "sidebar", tone: "light", side: 0.33, body: "Calibri", head: "Calibri", accent: "#0F766E", accents: ["#0F766E", "#2440B8", "#9D174D", "#B45309", "#374151"],
    nm: { size: 26, caps: false, track: 0, align: "left", weight: 800 }, heading: "accent", headCaps: true,
    dates: "right", bullet: "dot", size: 10, margin: 14, titles: "standard", order: "standard", skillsAs: "list" },
  { key: "minimal", name: "Minimal", formality: 3, ats: true, style: "simple",
    blurb: "Generous white space, light type and dates in the margin.",
    goodFor: "Architecture, design-aware employers and professional services",
    jobTypes: ["creative", "tech", "corporate"],
    layout: "single", body: "Calibri Light", head: "Calibri", accent: "#111111", accents: ["#111111", "#2440B8", "#0F766E", "#9D174D", "#8A4B08"],
    nm: { size: 30, caps: false, track: -0.01, align: "left", weight: 300 }, heading: "quiet", headCaps: true,
    dates: "gutter", bullet: "dash", size: 10, margin: 18, titles: "standard", order: "standard", skillsAs: "groups" },
  { key: "creative", name: "Creative", formality: 2, ats: false, style: "creative",
    blurb: "A bold dark sidebar with your name in lights.",
    goodFor: "Design, marketing, media and portfolio roles",
    jobTypes: ["creative"],
    layout: "sidebar", tone: "dark", side: 0.34, body: "Calibri", head: "Calibri", accent: "#E8590C", accents: ["#E8590C", "#0C8599", "#C2255C", "#7048E8", "#2B8A3E"],
    nm: { size: 24, caps: false, track: 0, align: "left", weight: 800 }, heading: "accent", headCaps: true,
    dates: "right", bullet: "dot", size: 10, margin: 14, titles: "standard", order: "standard", skillsAs: "chips" },
  { key: "friendly", name: "Friendly", formality: 1, ats: true, style: "creative",
    blurb: "Warm and approachable, with your availability up front.",
    goodFor: "Retail, hospitality, casual and part-time work, first jobs",
    jobTypes: ["hospitality", "trades", "health"],
    layout: "single", body: "Calibri", head: "Calibri", accent: "#D9480F", accents: ["#D9480F", "#0C8599", "#7048E8", "#2B8A3E", "#C2255C"],
    nm: { size: 26, caps: false, track: 0, align: "center", weight: 800 }, heading: "pill", headCaps: false,
    dates: "right", bullet: "dot", size: 10.5, margin: 16, titles: "casual", order: "casual", skillsAs: "chips" },
  { key: "trades", name: "Hands-on", formality: 2, ats: true, style: "simple",
    blurb: "Strong headings with your licences and tickets near the top.",
    goodFor: "Trades, construction, mining, warehousing and driving",
    jobTypes: ["trades", "hospitality"],
    layout: "single", body: "Arial", head: "Arial", accent: "#B45309", accents: ["#B45309", "#1D4E89", "#2B8A3E", "#C92A2A", "#343A40"],
    nm: { size: 26, caps: true, track: 0.02, align: "left", weight: 800, rule: true }, heading: "bar", headCaps: true,
    dates: "right", bullet: "square", size: 10.5, margin: 15, titles: "trades", order: "trades", skillsAs: "groups" },
  { key: "academic", name: "Academic CV", formality: 5, ats: true, style: "formal",
    blurb: "Education and publications first, with dates in the margin.",
    goodFor: "Research, PhD, scholarship and university roles",
    jobTypes: ["academic"],
    layout: "single", body: "Times New Roman", head: "Times New Roman", accent: "#222222", accents: ["#222222", "#1F3A5F", "#5C1A26", "#2F4F3A", "#4A3B2A"],
    nm: { size: 20, caps: false, track: 0, align: "center", weight: 700 }, heading: "rule", headCaps: false,
    dates: "gutter", bullet: "dot", size: 11, margin: 20, titles: "academic", order: "academic", skillsAs: "groups" },
  { key: "compact", name: "Compact", formality: 3, ats: true, style: "simple",
    blurb: "Tighter type and margins that fit more on one page without looking crammed.",
    goodFor: "Students and graduates with plenty to show, and one-page applications",
    jobTypes: ["graduate", "engineering", "tech", "hospitality"],
    layout: "single", body: "Arial", head: "Arial", accent: "#1F3A5F", accents: ["#1F3A5F", "#0F5E59", "#7A1F3D", "#5B2A86", "#2B2B2B"],
    nm: { size: 20, caps: false, track: 0, align: "left", weight: 700 }, heading: "rule", headCaps: true,
    dates: "right", bullet: "dot", size: 9.5, margin: 12, titles: "standard", order: "standard", skillsAs: "groups" },
  { key: "harvard", name: "Harvard", formality: 5, ats: true, style: "formal",
    blurb: "The plain, centred format university careers services teach: serif type, education first.",
    goodFor: "Graduate programs, law, finance, consulting and scholarships",
    jobTypes: ["graduate", "corporate", "government", "academic"],
    layout: "single", body: "Times New Roman", head: "Times New Roman", accent: "#111111", accents: ["#111111", "#1F3A5F", "#5C1A26", "#2F4F3A", "#3A3A3A"],
    nm: { size: 20, caps: false, track: 0.02, align: "center", weight: 700 }, heading: "rule", headCaps: true,
    dates: "right", bullet: "dot", size: 11, margin: 18, titles: "standard", order: "eduFirst", skillsAs: "groups" },
  { key: "timeline", name: "Timeline", formality: 3, ats: true, style: "modern",
    blurb: "Dates down the left with a line linking each role, so your path reads at a glance.",
    goodFor: "Career changers, several short roles, and project-based work",
    jobTypes: ["engineering", "tech", "graduate", "health"],
    layout: "single", body: "Calibri", head: "Calibri", accent: "#2440B8", accents: ["#2440B8", "#0F766E", "#9D174D", "#B45309", "#374151"],
    nm: { size: 26, caps: false, track: 0, align: "left", weight: 800 }, heading: "short", headCaps: true,
    dates: "timeline", bullet: "dot", size: 10, margin: 16, titles: "standard", order: "standard", skillsAs: "groups" },
  { key: "elegant", name: "Elegant", formality: 4, ats: true, style: "formal",
    blurb: "Serif headings over clean sans text, with a short accent bar under each section.",
    goodFor: "Professional services, communications, health and education",
    jobTypes: ["corporate", "health", "creative", "government"],
    layout: "single", body: "Calibri", head: "Georgia", accent: "#6D2E46", accents: ["#6D2E46", "#1F3A5F", "#0F5E59", "#7A5C1E", "#333333"],
    nm: { size: 30, caps: false, track: 0, align: "center", weight: 400 }, heading: "short", headCaps: false,
    dates: "right", bullet: "dash", size: 10.5, margin: 18, titles: "formal", order: "standard", skillsAs: "groups" },
  { key: "bold", name: "Bold", formality: 3, ats: true, style: "modern",
    blurb: "A dark header band and strong headings that stand out in a pile.",
    goodFor: "Sales, operations, startups and roles where confidence counts",
    jobTypes: ["tech", "corporate", "trades", "hospitality"],
    layout: "band", body: "Arial", head: "Arial", accent: "#1F2933", accents: ["#1F2933", "#14365D", "#4A1D3F", "#0B4F45", "#7A2E0E"],
    nm: { size: 28, caps: true, track: 0.04, align: "left", weight: 800 }, heading: "short", headCaps: true,
    dates: "right", bullet: "square", size: 10.5, margin: 15, titles: "standard", order: "standard", skillsAs: "chips" },
  { key: "slate", name: "Slate", formality: 3, ats: false, style: "creative",
    blurb: "A cool, light sidebar with skills as tags and plenty of room for your experience.",
    goodFor: "Tech, design, marketing and emailed applications",
    jobTypes: ["tech", "creative", "graduate"],
    layout: "sidebar", tone: "light", side: 0.3, body: "Arial", head: "Arial", accent: "#3D5A80", accents: ["#3D5A80", "#2A9D8F", "#6D597A", "#BC6C25", "#343A40"],
    nm: { size: 24, caps: false, track: 0, align: "left", weight: 800 }, heading: "short", headCaps: true,
    dates: "right", bullet: "dot", size: 10, margin: 14, titles: "standard", order: "standard", skillsAs: "chips" },
  { key: "public", name: "Public Service", formality: 5, ats: true, style: "formal",
    blurb: "Plain, two-page friendly and easy to assess against selection criteria.",
    goodFor: "Australian Public Service, state government and council roles",
    jobTypes: ["government", "health", "academic"],
    layout: "single", body: "Arial", head: "Arial", accent: "#1B3A57", accents: ["#1B3A57", "#222222", "#0F5E59", "#5C1A26", "#3A3A3A"],
    nm: { size: 22, caps: false, track: 0, align: "left", weight: 700 }, heading: "rules", headCaps: false,
    dates: "right", bullet: "dot", size: 11, margin: 20, titles: "formal", order: "standard", skillsAs: "groups" }
];
// More designs: each is one of the 18 above with a different typeface, header, heading style, dates or layout.
// family: the design it's built on (some type details follow it). [base, key, name, changes]
const TPL_VARIANTS = [
  ["professional", "professional-serif", "Professional Serif", { body: "Georgia", head: "Georgia" }],
  ["professional", "professional-centred", "Centred", { nm: { align: "center" }, heading: "rules" }],
  ["professional", "professional-aptos", "Modern Office", { body: "Aptos", head: "Aptos", heading: "short" }],
  ["professional", "professional-band", "Navy Header", { layout: "band", heading: "rule" }],
  ["professional", "professional-compact", "Professional Compact", { size: 9.5, margin: 12 }],
  ["classic", "classic-garamond", "Garamond", { body: "Garamond", head: "Garamond", size: 11 }],
  ["classic", "classic-palatino", "Palatino", { body: "Palatino Linotype", head: "Palatino Linotype" }],
  ["classic", "classic-left", "Classic Left", { nm: { align: "left", caps: false, track: 0 }, heading: "rule" }],
  ["classic", "classic-sans", "Classic Sans", { body: "Calibri" }],
  ["classic", "classic-band", "Classic Banner", { layout: "band", formality: 4 }],
  ["executive", "executive-garamond", "Boardroom", { body: "Garamond", head: "Garamond", heading: "rules", size: 11 }],
  ["executive", "executive-centred", "Executive Centred", { nm: { align: "center" } }],
  ["executive", "executive-sans", "Executive Sans", { body: "Calibri" }],
  ["executive", "executive-band", "Executive Band", { layout: "band", formality: 4 }],
  ["executive", "executive-gutter", "Career Record", { dates: "gutter", heading: "rule" }],
  ["corporate", "corporate-serif", "Corporate Serif", { body: "Cambria", head: "Cambria" }],
  ["corporate", "corporate-centred", "Corporate Centred", { nm: { align: "center" } }],
  ["corporate", "corporate-arial", "Banker", { body: "Arial", head: "Arial", heading: "rule" }],
  ["corporate", "corporate-trebuchet", "Corporate Fresh", { body: "Trebuchet MS", head: "Trebuchet MS", heading: "short" }],
  ["corporate", "corporate-tahoma", "Corporate Clear", { body: "Tahoma", head: "Tahoma", bullet: "dash" }],
  ["technical", "technical-verdana", "Engineer", { body: "Verdana", size: 9.5 }],
  ["technical", "technical-sidebar", "Developer", { layout: "sidebar", tone: "light", side: 0.32, skillsAs: "list" }],
  ["technical", "technical-dark", "Terminal", { layout: "sidebar", tone: "dark", side: 0.32, skillsAs: "chips" }],
  ["technical", "technical-timeline", "Technical Timeline", { dates: "timeline" }],
  ["technical", "technical-plain", "Technical Plain", { body: "Arial", head: "Arial", heading: "rules" }],
  ["modern", "modern-dark", "Modern Dark", { tone: "dark" }],
  ["modern", "modern-serif", "Modern Serif", { head: "Georgia" }],
  ["modern", "modern-wide", "Modern Wide Sidebar", { side: 0.38 }],
  ["modern", "modern-trebuchet", "Fresh", { body: "Trebuchet MS", head: "Trebuchet MS", heading: "short" }],
  ["modern", "modern-century", "Studio", { body: "Century Gothic", head: "Century Gothic", size: 9.5 }],
  ["minimal", "minimal-centred", "Minimal Centred", { nm: { align: "center" } }],
  ["minimal", "minimal-serif", "Minimal Serif", { body: "Garamond", head: "Garamond", size: 11 }],
  ["minimal", "minimal-century", "Gallery", { body: "Century Gothic", head: "Century Gothic", size: 9.5 }],
  ["minimal", "minimal-right", "Minimal Classic", { dates: "right" }],
  ["minimal", "minimal-aptos", "Whitespace", { body: "Aptos", head: "Aptos", heading: "short" }],
  ["creative", "creative-light", "Creative Light", { tone: "light" }],
  ["creative", "creative-serif", "Editorial", { head: "Georgia" }],
  ["creative", "creative-century", "Portfolio", { body: "Century Gothic", head: "Century Gothic", size: 9.5 }],
  ["creative", "creative-band", "Creative Band", { layout: "band", heading: "pill" }],
  ["creative", "creative-trebuchet", "Spotlight", { body: "Trebuchet MS", head: "Trebuchet MS", side: 0.3 }],
  ["friendly", "friendly-left", "Friendly Left", { nm: { align: "left" } }],
  ["friendly", "friendly-trebuchet", "Cheerful", { body: "Trebuchet MS", head: "Trebuchet MS" }],
  ["friendly", "friendly-band", "Friendly Band", { layout: "band", heading: "short" }],
  ["friendly", "friendly-verdana", "Easy Read", { body: "Verdana", head: "Verdana", size: 10 }],
  ["friendly", "friendly-sidebar", "Friendly Sidebar", { layout: "sidebar", tone: "light", side: 0.32 }],
  ["trades", "trades-verdana", "Workshop", { body: "Verdana", head: "Verdana", size: 10 }],
  ["trades", "trades-band", "Site Ready", { layout: "band", nm: { rule: false } }],
  ["trades", "trades-tahoma", "Tradie", { body: "Tahoma", head: "Tahoma", heading: "rule" }],
  ["trades", "trades-centred", "Hands-on Centred", { nm: { align: "center" } }],
  ["trades", "trades-toolbox", "Toolbox", { heading: "pill", skillsAs: "chips", headCaps: false }],
  ["academic", "academic-garamond", "Scholar", { body: "Garamond", head: "Garamond" }],
  ["academic", "academic-palatino", "Research", { body: "Palatino Linotype", head: "Palatino Linotype", size: 10.5 }],
  ["academic", "academic-georgia", "Academic Modern", { body: "Georgia", head: "Georgia", dates: "right", size: 10.5 }],
  ["academic", "academic-left", "Faculty", { nm: { align: "left" }, heading: "rules" }],
  ["academic", "academic-cambria", "Fellowship", { body: "Cambria", head: "Cambria", heading: "accent" }],
  ["compact", "compact-calibri", "Compact Calibri", { body: "Calibri", head: "Calibri" }],
  ["compact", "compact-serif", "Compact Serif", { body: "Georgia", head: "Georgia" }],
  ["compact", "compact-band", "Compact Band", { layout: "band" }],
  ["compact", "compact-sidebar", "Compact Sidebar", { layout: "sidebar", tone: "light", side: 0.3 }],
  ["compact", "compact-tahoma", "One Page", { body: "Tahoma", head: "Tahoma", heading: "short" }],
  ["harvard", "harvard-garamond", "Ivy", { body: "Garamond", head: "Garamond", size: 11.5 }],
  ["harvard", "harvard-georgia", "Harvard Georgia", { body: "Georgia", head: "Georgia", size: 10.5 }],
  ["harvard", "harvard-calibri", "Harvard Sans", { body: "Calibri", head: "Calibri" }],
  ["harvard", "harvard-left", "Harvard Left", { nm: { align: "left" } }],
  ["harvard", "harvard-cambria", "Oxford", { body: "Cambria", head: "Cambria", heading: "rules" }],
  ["timeline", "timeline-serif", "Timeline Serif", { body: "Georgia", head: "Georgia" }],
  ["timeline", "timeline-centred", "Milestones", { nm: { align: "center" } }],
  ["timeline", "timeline-band", "Timeline Band", { layout: "band" }],
  ["timeline", "timeline-sidebar", "Pathway", { layout: "sidebar", tone: "light", side: 0.3 }],
  ["timeline", "timeline-trebuchet", "Journey", { body: "Trebuchet MS", head: "Trebuchet MS" }],
  ["elegant", "elegant-garamond", "Refined", { head: "Garamond", body: "Garamond", size: 11 }],
  ["elegant", "elegant-palatino", "Grace", { head: "Palatino Linotype" }],
  ["elegant", "elegant-left", "Elegant Left", { nm: { align: "left" } }],
  ["elegant", "elegant-sidebar", "Elegant Sidebar", { layout: "sidebar", tone: "light", side: 0.31 }],
  ["bold", "bold-centred", "Bold Centred", { nm: { align: "center" } }],
  ["bold", "bold-trebuchet", "Impact", { body: "Trebuchet MS", head: "Trebuchet MS" }],
  ["bold", "bold-sidebar", "Bold Sidebar", { layout: "sidebar", tone: "dark", side: 0.32 }],
  ["bold", "bold-serif", "Headline", { head: "Georgia", nm: { caps: false } }],
  ["slate", "slate-dark", "Slate Dark", { tone: "dark" }],
  ["slate", "slate-serif", "Slate Serif", { head: "Georgia" }],
  ["slate", "slate-century", "Slate Studio", { body: "Century Gothic", head: "Century Gothic", size: 9.5 }],
  ["public", "public-calibri", "Public Service Calibri", { body: "Calibri", head: "Calibri" }],
  ["public", "public-verdana", "Public Service Clear", { body: "Verdana", head: "Verdana", size: 10 }],
  ["public", "public-georgia", "Public Service Serif", { body: "Georgia", head: "Georgia" }]
];
// What a variant changes, in words, for its description
function variantWords(base, t) {
  const w = [];
  if (t.body !== base.body || t.head !== base.head) w.push(t.body === t.head ? `set in ${t.body}` : `${t.head} headings over ${t.body} text`);
  if (t.layout !== base.layout) w.push(t.layout === "band" ? "a coloured band across the top" : t.layout === "sidebar" ? `a ${t.tone === "dark" ? "dark" : "tinted"} sidebar` : "a single column");
  else if (t.layout === "sidebar" && t.tone !== base.tone) w.push(`a ${t.tone === "dark" ? "dark" : "light"} sidebar`);
  else if (t.layout === "sidebar" && t.side !== base.side) w.push(t.side > base.side ? "a wider sidebar" : "a narrower sidebar");
  if (t.nm.align !== base.nm.align) w.push(t.nm.align === "center" ? "a centred heading" : "your name on the left");
  if (t.dates !== base.dates) w.push(t.dates === "timeline" ? "a timeline of dates down the left" : t.dates === "gutter" ? "dates in the margin" : "dates on the right");
  if (t.heading !== base.heading) w.push({ rule: "a rule under each heading", rules: "ruled sections", accent: "coloured headings", bar: "solid heading bars", quiet: "quiet headings", pill: "rounded heading tabs", short: "a short accent bar under each heading" }[t.heading]);
  if (t.size < base.size || t.margin < base.margin) w.push("tighter type and margins");
  if (t.skillsAs !== base.skillsAs && t.skillsAs === "chips") w.push("skills as tags");
  return w;
}
for (const [b, key, name, o] of TPL_VARIANTS) {
  const base = CV_TEMPLATES.find(t => t.key === b);
  if (!base || CV_TEMPLATES.some(t => t.key === key)) continue;
  const k = CV_TEMPLATES.filter(t => t.family === b).length + 1;
  const t = { ...base, ...o, nm: { ...base.nm, ...(o.nm || {}) }, key, name, family: b };
  if (t.layout === "sidebar") { t.ats = false; t.tone = t.tone || "light"; t.side = t.side || 0.32; if (base.layout !== "sidebar") { t.style = base.style === "formal" ? "modern" : base.style === "simple" ? "modern" : base.style; t.formality = Math.min(t.formality, 3); } }
  else t.ats = true;
  if (base.layout === "sidebar" && t.layout !== "sidebar") t.style = "modern";
  // a different default colour from the same palette, so the gallery isn't all one colour
  t.accent = base.accents[k % base.accents.length];
  const w = variantWords(base, t);
  t.blurb = w.length ? `${base.name} with ${listJoin(w)}.` : base.blurb;
  CV_TEMPLATES.push(t);
}
// Filters for the template pickers. Pick any number: a design must match one choice from each row used.
const TPL_FILTERS = [
  ["ats", "ATS-friendly", "ats"],
  ["simple", "Simple", "style"], ["modern", "Modern", "style"], ["formal", "Formal", "style"], ["creative", "Creative", "style"],
  ["one", "One column", "layout"], ["band", "Colour header", "layout"], ["two", "Two columns", "layout"],
  ["serif", "Serif type", "type"], ["sans", "Sans-serif type", "type"],
  ["timeline", "Dates down the side", "dates"]
];
const TPL_GROUP_NAMES = { ats: "", style: "Style", layout: "Layout", type: "Type", dates: "" };
const isSerifTpl = t => SERIF_FONTS.has(t.head) || SERIF_FONTS.has(t.body);
const tplFacet = (t, k) => k === "ats" ? t.ats : k === "one" ? t.layout === "single" : k === "two" ? t.layout === "sidebar" : k === "band" ? t.layout === "band" : k === "serif" ? isSerifTpl(t) : k === "sans" ? !SERIF_FONTS.has(t.body) : k === "timeline" ? t.dates === "timeline" || t.dates === "gutter" : t.style === k;
function tplMatches(t, f) {
  const sel = Array.isArray(f) ? f : f && f !== "all" ? [f] : [];
  const groups = {};
  for (const k of sel) { const g = (TPL_FILTERS.find(x => x[0] === k) || [])[2]; if (g) (groups[g] = groups[g] || []).push(k); }
  return Object.values(groups).every(ks => ks.some(k => tplFacet(t, k)));
}
const tplFilterHtml = (cur, act) => {
  const sel = Array.isArray(cur) ? cur : cur && cur !== "all" ? [cur] : [];
  const chip = ([k, l]) => `<button type="button" class="opt-chip" ${act}="${k}" aria-pressed="${sel.includes(k)}">${l}</button>`;
  const rows = ["ats", "style", "layout", "type", "dates"].map(g => TPL_FILTERS.filter(x => x[2] === g));
  return `<div class="tpl-filter" role="group" aria-label="Show designs"><button type="button" class="opt-chip" ${act}="all" aria-pressed="${!sel.length}">All</button>${rows.map(r => `<span class="tpl-frow">${TPL_GROUP_NAMES[r[0][2]] ? `<span class="tpl-flabel">${TPL_GROUP_NAMES[r[0][2]]}</span>` : ""}${r.map(chip).join("")}</span>`).join("")}<span class="tpl-count">${CV_TEMPLATES.filter(t => tplMatches(t, sel)).length} of ${CV_TEMPLATES.length} designs</span></div>`;
};
const tplByKey = k => CV_TEMPLATES.find(t => t.key === k) || CV_TEMPLATES[0];
const TITLE_SETS = {
  standard: { summary: "Profile", experience: "Experience", education: "Education", skills: "Skills", certs: "Licences & Certifications", projects: "Projects", volunteering: "Volunteering", awards: "Awards", publications: "Publications", interests: "Interests", availability: "Availability", referees: "Referees", contact: "Contact" },
  formal: { summary: "Professional Summary", experience: "Professional Experience", education: "Education", skills: "Skills", certs: "Licences & Certifications", projects: "Selected Projects", volunteering: "Community Involvement", awards: "Awards & Honours", publications: "Publications", interests: "Interests", availability: "Availability", referees: "Referees", contact: "Contact" },
  casual: { summary: "About Me", experience: "Work Experience", education: "Education", skills: "What I Bring", certs: "Certificates", projects: "Projects", volunteering: "Volunteering", awards: "Achievements", publications: "Publications", interests: "Interests", availability: "Availability", referees: "References", contact: "Contact" },
  trades: { summary: "Profile", experience: "Work History", education: "Training & Education", skills: "Skills & Equipment", certs: "Licences & Tickets", projects: "Projects", volunteering: "Volunteering", awards: "Achievements", publications: "Publications", interests: "Interests", availability: "Availability", referees: "Referees", contact: "Contact" },
  academic: { summary: "Research Profile", experience: "Professional Experience", education: "Education", skills: "Skills", certs: "Certifications", projects: "Research Projects", volunteering: "Service & Outreach", awards: "Awards & Scholarships", publications: "Publications", interests: "Interests", availability: "Availability", referees: "Referees", contact: "Contact" }
};
function sectionOrder(tpl, p) {
  const student = stageOf(p) === "student";
  const core = student ? ["education", "experience", "projects"] : ["experience", "projects", "education"];
  const tail = ["certs", "volunteering", "awards", "publications", "interests", "availability", "referees"];
  switch (tpl.order) {
    case "academic": return ["summary", "education", "publications", "projects", "experience", "awards", "skills", "certs", "volunteering", "interests", "referees"];
    case "trades": return ["summary", "certs", "experience", "skills", "education", "availability", "projects", "volunteering", "awards", "interests", "referees"];
    case "casual": return ["summary", "availability", "experience", "skills", "education", "certs", "projects", "volunteering", "awards", "interests", "referees"];
    case "skillsFirst": return ["summary", "skills", ...core, ...tail];
    case "eduFirst": return ["summary", "education", "experience", "projects", "skills", ...tail];
    default: return ["summary", ...core, "skills", ...tail];
  }
}
// The design's order, with any order the person arranged in Create or edit resume › Choose what goes on this resume put first
function orderedSections(tpl, p) {
  const base = sectionOrder(tpl, p), custom = ((p.cv && p.cv.order) || []).filter(k => base.includes(k));
  return custom.length ? [...custom, ...base.filter(k => !custom.includes(k))] : base;
}
const SIDE_KEYS = new Set(["contact", "skills", "certs", "interests", "availability", "referees"]);
// The profile as the sections a template lays out
// opts.all: leave out nothing the person chose to hide (the "Choose what goes on this resume" list needs every line)
function cvModel(p, tpl, opts = {}) {
  const T = TITLE_SETS[tpl.titles] || TITLE_SETS.standard;
  const c = p.contact, cvp = p.cv || {};
  const sec = {};
  const hideSet = opts.all ? new Set() : new Set((cvp.hideLines || []).map(s => norm(String(s))));
  const keep = a => a.filter(s => !hideSet.has(norm(String(s))));
  const clean = a => keep(a.map(s => val(s)).filter(Boolean));
  if (p.summary.trim()) sec.summary = { kind: "text", text: p.summary.trim() };
  const exp = shown(p.experience).filter(e => e.title || e.org).map(e => ({ title: e.title, org: e.org, loc: val(e.location), dates: rangeOf(e), bullets: clean(e.bullets) }));
  if (exp.length) sec.experience = { kind: "entries", items: exp };
  const edu = shown(p.education).filter(e => e.degree || e.inst).map(e => ({ title: e.degree, org: e.inst, loc: val(e.location), dates: rangeOf(e, true), bullets: keep(eduLines(e, p)) }));
  if (edu.length) sec.education = { kind: "entries", items: edu };
  const groups = [["Technical", p.skills.hard], ["Software & tools", p.skills.software], ["Languages", p.skills.languages], ["Strengths", p.skills.soft]].filter(([label]) => !hideSet.has(norm("skills:" + label))).map(([label, items]) => ({ label, items: clean(items) })).filter(g => g.items.length);
  if (groups.length) sec.skills = { kind: "groups", groups };
  if (p.skills.certs.length && clean(p.skills.certs).length) sec.certs = { kind: "list", items: clean(p.skills.certs) };
  if (p.extras.projects) { const items = shown(p.projects).filter(x => x.name).map(x => ({ title: x.name, org: x.org, loc: "", dates: rangeOf(x), bullets: keep(linesOf(x.details)) })); if (items.length) sec.projects = { kind: "entries", items }; }
  if (p.extras.volunteering) { const items = shown(p.volunteering).filter(e => e.title || e.org).map(e => ({ title: e.title, org: e.org, loc: e.location, dates: rangeOf(e), bullets: clean(e.bullets) })); if (items.length) sec.volunteering = { kind: "entries", items }; }
  if (p.extras.awards && keep(linesOf(p.awards)).length) sec.awards = { kind: "list", items: keep(linesOf(p.awards)) };
  if (p.extras.publications && keep(linesOf(p.publications)).length) sec.publications = { kind: "list", items: keep(linesOf(p.publications)) };
  if (p.extras.interests && p.interests.trim()) sec.interests = { kind: "text", text: p.interests.trim() };
  if (p.extras.availability && availabilityText(p)) sec.availability = { kind: "text", text: availabilityText(p) };
  if (p.extras.referees) {
    const list = p.referees.mode === "list" ? finished(p.referees.list).filter(r => r.name.trim()) : [];
    sec.referees = list.length ? { kind: "referees", items: list.map(r => ({ name: r.name, line: [r.role, r.org].filter(Boolean).join(", "), contact: [r.phone, r.email].filter(Boolean).join("  |  ") })) } : { kind: "text", text: "Available on request" };
  }
  const contact = [c.location, c.phone, c.email, shortUrl(c.linkedin), shortUrl(c.website)].map(s => val(s)).filter(Boolean);
  const details = [c.workRights, c.licence].map(s => String(s || "").trim()).filter(Boolean);
  if (!opts.all) for (const k of cvp.hideSections || []) delete sec[k];
  const order = orderedSections(tpl, p).filter(k => sec[k]);
  const mk = k => ({ key: k, title: T[k], ...sec[k] });
  const model = { name: c.name.trim() || "Your Name", headline: p.target.title.trim(), contact, details, main: [], side: [], sectionKeys: order };
  if (tpl.layout === "sidebar") {
    model.side.push({ key: "contact", title: T.contact, kind: "contact", items: [...contact, ...details] });
    model.side.push(...order.filter(k => SIDE_KEYS.has(k)).map(mk));
    model.main = order.filter(k => !SIDE_KEYS.has(k)).map(mk);
  } else model.main = order.map(mk);
  return model;
}
// Colour helpers: a pale tint of the accent for backgrounds
function hexRgb(h) { const m = String(h).replace("#", ""); const n = parseInt(m.length === 3 ? m.split("").map(x => x + x).join("") : m, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const rgbHex = rgb => "#" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); };
function tplColours(tpl, accent) {
  const a = accent || tpl.accent;
  const dark = tpl.layout === "sidebar" && tpl.tone === "dark";
  return {
    accent: a, ink: "#1E2533", muted: "#5B6474", rule: a,
    tint: mixHex(a, "#FFFFFF", 0.9), tint2: mixHex(a, "#FFFFFF", 0.82),
    sideBg: dark ? "#1F2430" : mixHex(a, "#FFFFFF", 0.92), sideInk: dark ? "#FFFFFF" : "#1E2533", sideMuted: dark ? "#C3C9D4" : "#5B6474",
    sideHead: dark ? mixHex(a, "#FFFFFF", 0.25) : a
  };
}

/* --- 1. The page preview (HTML) --- */
function cvHtml(model, tpl, opts = {}) {
  const C = tplColours(tpl, opts.accent);
  const px = pt => (pt * 96 / 72).toFixed(2) + "px";
  const style = [
    `--cv-accent:${C.accent}`, `--cv-tint:${C.tint}`, `--cv-tint2:${C.tint2}`, `--cv-side-bg:${C.sideBg}`, `--cv-side-ink:${C.sideInk}`,
    `--cv-side-muted:${C.sideMuted}`, `--cv-side-head:${C.sideHead}`, `--cv-side-w:${Math.round(794 * (tpl.side || 0.33))}px`,
    `--cv-body:${FONTS[tpl.body].css}`, `--cv-head:${FONTS[tpl.head].css}`, `--cv-size:${px(tpl.size)}`, `--cv-name:${px(tpl.nm.size)}`,
    `--cv-name-w:${tpl.nm.weight}`, `--cv-name-track:${tpl.nm.track}em`, `--cv-margin:${(tpl.margin * 3.7795).toFixed(1)}px`,
    `--cv-lh:${tpl.lh || 1}`, `--cv-gap:${tpl.gap || 1}`
  ].join(";");
  const cls = ["cv", "t-" + tpl.key, tpl.family ? "t-" + tpl.family : "", "l-" + tpl.layout, "h-" + tpl.heading, "d-" + tpl.dates, "b-" + tpl.bullet, "n-" + tpl.nm.align,
    tpl.nm.caps ? "n-caps" : "", tpl.nm.rule ? "n-rule" : "", tpl.headCaps ? "hc" : "", tpl.tone ? "tone-" + tpl.tone : ""].filter(Boolean).join(" ");
  const e = esc;
  const contactLine = [...model.contact, ...model.details];
  const head = withContact => `<header class="cv-head"><div class="cv-name">${e(model.name)}</div>${model.headline ? `<div class="cv-headline">${e(model.headline)}</div>` : ""}${withContact && contactLine.length ? `<div class="cv-contact">${contactLine.map(x => `<span>${e(x)}</span>`).join('<i aria-hidden="true">|</i>')}</div>` : ""}</header>`;
  const ul = items => items.length ? `<ul class="cv-ul">${items.map(b => `<li>${e(b)}</li>`).join("")}</ul>` : "";
  const entry = it => {
    const org = [it.org, it.loc].filter(Boolean).join(", ");
    if (tpl.dates === "gutter" || tpl.dates === "timeline") return `<div class="cv-entry g"><div class="cv-ed">${e(it.dates || "")}</div><div class="cv-eb"><div class="cv-et">${e(it.title || it.org)}</div>${it.title && org ? `<div class="cv-org">${e(org)}</div>` : ""}${ul(it.bullets)}</div></div>`;
    return `<div class="cv-entry"><div class="cv-eh"><span class="cv-et">${e(it.title || it.org)}</span>${it.dates ? `<span class="cv-ed">${e(it.dates)}</span>` : ""}</div>${it.title && org ? `<div class="cv-org">${e(org)}</div>` : ""}${ul(it.bullets)}</div>`;
  };
  const groups = (s, side) => {
    const as = side ? (tpl.skillsAs === "chips" ? "chips" : "list") : tpl.skillsAs === "chips" ? "chips" : "groups";
    if (as === "groups") return `<div class="cv-groups">${s.groups.map(g => `<div class="cv-g"><span class="cv-gl">${e(g.label)}:</span> ${e(g.items.join(", "))}</div>`).join("")}</div>`;
    if (as === "chips") return s.groups.map(g => `<div class="cv-gl">${e(g.label)}</div><div class="cv-chips">${g.items.map(i => `<span>${e(i)}</span>`).join("")}</div>`).join("");
    return s.groups.map(g => `<div class="cv-gl">${e(g.label)}</div><ul class="cv-plain">${g.items.map(i => `<li>${e(i)}</li>`).join("")}</ul>`).join("");
  };
  const body = (s, side) => {
    switch (s.kind) {
      case "text": return `<p class="cv-p">${e(s.text)}</p>`;
      case "list": return side ? `<ul class="cv-plain">${s.items.map(i => `<li>${e(i)}</li>`).join("")}</ul>` : ul(s.items);
      case "contact": return `<ul class="cv-plain cv-clist">${s.items.map(i => `<li>${e(i)}</li>`).join("")}</ul>`;
      case "entries": return s.items.map(entry).join("");
      case "groups": return groups(s, side);
      case "referees": return s.items.map(r => `<div class="cv-ref"><div class="cv-et">${e(r.name)}</div>${r.line ? `<div>${e(r.line)}</div>` : ""}${r.contact ? `<div class="cv-muted">${e(r.contact)}</div>` : ""}</div>`).join("");
      default: return "";
    }
  };
  const sec = (s, side) => `<section class="cv-sec cv-s-${s.key}"><h2 class="cv-h"><span>${e(s.title)}</span></h2>${body(s, side)}</section>`;
  if (tpl.layout === "sidebar") {
    const dark = tpl.tone === "dark";
    return `<div class="${cls}" style="${esc(style)}"><div class="cv-cols"><aside class="cv-side">${dark ? head(false) : ""}${model.side.map(s => sec(s, true)).join("")}</aside><div class="cv-mainc">${dark ? "" : head(false)}${model.main.map(s => sec(s)).join("")}</div></div></div>`;
  }
  if (tpl.layout === "band") return `<div class="${cls}" style="${esc(style)}"><div class="cv-band">${head(true)}</div><div class="cv-body">${model.main.map(s => sec(s)).join("")}</div></div>`;
  return `<div class="${cls}" style="${esc(style)}"><div class="cv-body">${head(true)}${model.main.map(s => sec(s)).join("")}</div></div>`;
}
// Put a scaled A4 preview in a frame, with dashed lines where pages break
// A long name shrinks until no word is split across two lines
function fitNames(root) {
  root.querySelectorAll(".cv-name").forEach(el => {
    el.style.fontSize = ""; el.style.overflowWrap = "normal"; el.style.wordBreak = "keep-all";
    let fs = parseFloat(getComputedStyle(el).fontSize) || 0; const min = fs * 0.55;
    for (let n = 0; fs > min && el.scrollWidth > el.clientWidth + 1 && n < 40; n++) { fs -= 1; el.style.fontSize = fs + "px"; }
  });
}
function mountPaper(frame, html) {
  frame.innerHTML = `<div class="paper-scale"><div class="paper-sheet">${html}</div></div>`;
  const scale = frame.firstElementChild, sheet = scale.firstElementChild;
  const fit = () => {
    fitNames(sheet);
    const w = frame.clientWidth || 794;
    const k = Math.min(1, w / 794);
    scale.style.transform = `scale(${k})`;
    const h = sheet.offsetHeight;
    frame.style.height = Math.ceil(h * k) + "px";
    sheet.querySelectorAll(".page-mark").forEach(m => m.remove());
    const pages = Math.max(1, Math.ceil((h - 4) / 1123));
    for (let i = 1; i < pages; i++) { const m = document.createElement("div"); m.className = "page-mark"; m.style.top = i * 1123 + "px"; m.innerHTML = `<span>Page ${i + 1}</span>`; sheet.appendChild(m); }
    frame.dataset.pages = pages;
    return pages;
  };
  if (!frame._ro && window.ResizeObserver) { frame._ro = new ResizeObserver(() => frame._fit && frame._fit()); frame._ro.observe(frame); }
  frame._fit = fit;
  return fit();
}

/* --- 2. Word (.docx) --- */
async function cvDocx(model, tpl, opts = {}) {
  await loadScript(JSZIP);
  const C = tplColours(tpl, opts.accent);
  const hex = h => String(h).replace("#", "").toUpperCase();
  const X = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const SZ = Math.round(tpl.size * 2);
  // line spacing and the gaps between paragraphs follow the person's page setup
  const LINE = Math.round(259 * (tpl.lh || 1)), GAP = tpl.gap || 1;
  const PAGE_W = 11906, M = Math.round(tpl.margin * 56.7), TEXT_W = PAGE_W - 2 * M;
  const muted = C.muted, ink = C.ink;
  const run = (t, o = {}) => {
    const f = o.font || tpl.body, sz = o.sz || SZ;
    return `<w:r><w:rPr><w:rFonts w:ascii="${f}" w:hAnsi="${f}" w:cs="${f}"/>${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}${o.caps ? "<w:caps/>" : ""}<w:color w:val="${hex(o.color || ink)}"/>${o.sp ? `<w:spacing w:val="${Math.round(o.sp)}"/>` : ""}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>${o.shd ? `<w:shd w:val="clear" w:color="auto" w:fill="${hex(o.shd)}"/>` : ""}</w:rPr>${String(t).split("\t").map((p, i) => (i ? "<w:tab/>" : "") + (p ? `<w:t xml:space="preserve">${X(p)}</w:t>` : "")).join("")}</w:r>`;
  };
  const para = (runs, o = {}) => {
    const b = o.bdr ? `<w:pBdr>${["top", "left", "bottom", "right"].filter(k => o.bdr[k]).map(k => `<w:${k} w:val="single" w:sz="${o.bdr[k].sz}" w:space="${o.bdr[k].space ?? 2}" w:color="${hex(o.bdr[k].color)}"/>`).join("")}</w:pBdr>` : "";
    return `<w:p><w:pPr>${o.keep ? "<w:keepNext/>" : ""}${o.num ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ""}${b}${o.tabs ? `<w:tabs>${o.tabs.map(t => `<w:tab w:val="${t.val}" w:pos="${t.pos}"/>`).join("")}</w:tabs>` : ""}<w:spacing w:before="${Math.round((o.before || 0) * GAP)}" w:after="${Math.round((o.after ?? 0) * GAP)}" w:line="${o.line || LINE}" w:lineRule="${o.exact ? "exact" : "auto"}"/>${o.ind ? `<w:ind w:left="${o.ind.left || 0}"${o.ind.right ? ` w:right="${o.ind.right}"` : ""}${o.ind.hanging ? ` w:hanging="${o.ind.hanging}"` : ""}/>` : ""}${o.jc ? `<w:jc w:val="${o.jc}"/>` : ""}</w:pPr>${runs || ""}</w:p>`;
  };
  // Content for one column. ctx: { w: text width, side: bool }
  const nameBlock = (ctx, band) => {
    const out = [], center = tpl.nm.align === "center" && !ctx.side ? "center" : null;
    const nameCol = band ? "#FFFFFF" : ctx.dark ? "#FFFFFF" : C.accent;
    const sub = band ? mixHex("#FFFFFF", C.accent, 0.2) : ctx.dark ? C.sideHead : "#3A4252";
    const small = band ? mixHex("#FFFFFF", C.accent, 0.25) : muted;
    out.push(para(run(tpl.nm.caps ? model.name.toUpperCase() : model.name, { font: tpl.head, b: tpl.nm.weight >= 600, sz: Math.round(tpl.nm.size * 2), color: nameCol, sp: tpl.nm.track * tpl.nm.size * 20 }), { jc: center, after: 40, line: 240 }));
    if (model.headline) out.push(para(run(model.headline, { sz: SZ + 3, color: sub, b: ctx.dark }), { jc: center, after: 60 }));
    const line = [...model.contact, ...model.details];
    if (!ctx.side && line.length) out.push(para(run(line.join("   |   "), { sz: SZ - 2, color: small }), { jc: center, after: tpl.nm.rule ? 0 : 120, bdr: tpl.nm.rule ? { bottom: { sz: 18, color: C.accent, space: 8 } } : null }));
    if (tpl.nm.rule) out.push(para("", { after: 120 }));
    return out.join("");
  };
  const heading = (title, ctx, first) => {
    const t = tpl.headCaps ? title.toUpperCase() : title;
    const before = first ? 0 : 220, side = ctx.side;
    const col = side ? C.sideHead : C.accent;
    const lineCol = side && ctx.dark ? mixHex(C.sideBg, "#FFFFFF", 0.3) : col;
    switch (tpl.heading) {
      case "rules": return para(run(t, { font: tpl.head, b: true, color: col, sp: 50, sz: SZ }), { keep: true, before: before + 40, after: 120, jc: side ? null : "center", bdr: { top: { sz: 4, color: lineCol, space: 3 }, bottom: { sz: 4, color: lineCol, space: 3 } } });
      case "accent": return para(run(t, { font: tpl.head, b: true, color: col, sp: tpl.headCaps ? 40 : 0, sz: SZ }), { keep: true, before, after: 100, bdr: { bottom: { sz: 4, color: side && ctx.dark ? lineCol : C.tint2, space: 2 } } });
      case "bar": return para(run(t, { font: tpl.head, b: true, color: side ? col : ink, sp: tpl.headCaps ? 20 : 0, sz: SZ + 1 }), { keep: true, before, after: 100, bdr: { left: { sz: 24, color: C.accent, space: 6 } } });
      case "pill": return para(run(`  ${t}  `, { font: tpl.head, b: true, color: C.accent, shd: C.tint2, sz: SZ + 1 }), { keep: true, before, after: 100 });
      case "quiet": return para(run(t, { font: tpl.head, b: true, color: side ? C.sideMuted : "#8A919E", sp: 50, sz: SZ - 2 }), { keep: true, before: before + 40, after: 100 });
      // the title, then a short accent bar: an empty, narrow paragraph with a thick bottom border
      case "short": return para(run(t, { font: tpl.head, b: true, color: side ? (ctx.dark ? "#FFFFFF" : col) : ink, sp: tpl.headCaps ? 30 : 0, sz: SZ + 1 }), { keep: true, before, after: 20 })
        + para("", { keep: true, after: 110, line: 60, exact: true, ind: { left: 0, right: Math.max(0, ctx.w - 560) }, bdr: { bottom: { sz: 18, color: col, space: 0 } } });
      default: return para(run(t, { font: tpl.head, b: true, color: col, sp: tpl.headCaps ? 20 : 0, sz: SZ + 1 }), { keep: true, before, after: 100, bdr: { bottom: { sz: 6, color: lineCol, space: 1 } } });
    }
  };
  const G = 1700;
  const bulletParas = (items, left) => items.map(b => para(run(b), { num: true, ind: { left: left + 300, hanging: 220 }, after: 30 })).join("");
  const entry = (it, ctx) => {
    const org = [it.org, it.loc].filter(Boolean).join(", ");
    const orgRun = run(org, { color: ["classic", "academic", "executive", "minimal"].includes(tpl.family || tpl.key) ? "#3A4252" : C.accent, i: ["classic", "academic", "executive"].includes(tpl.family || tpl.key) });
    if (tpl.dates === "gutter" || tpl.dates === "timeline") {
      // dates in their own narrow column, so long ranges wrap instead of running into the title
      const w2 = ctx.w - G, tl = tpl.dates === "timeline";
      const inner = para(run(it.title || it.org, { b: true }), { keep: true }) + (it.title && org ? para(orgRun, { keep: !!it.bullets.length }) : "") + (bulletParas(it.bullets, 0) || "");
      return table([G, w2], [cell(G, para(run(it.dates || "", { sz: SZ - 2, color: muted }), { line: 240 }), { t: 100, r: 160 }), cell(w2, inner, { t: 100, l: tl ? 200 : 0, bl: tl ? { sz: 12, color: C.tint2 } : null })]);
    }
    return para(run(it.title || it.org, { b: true }) + (it.dates ? run("\t" + it.dates, { sz: SZ - 1, color: muted, i: (tpl.family || tpl.key) === "executive" }) : ""), { keep: true, before: 100, tabs: [{ val: "right", pos: ctx.w }] })
      + (it.title && org ? para(orgRun, { keep: !!it.bullets.length }) : "")
      + bulletParas(it.bullets, 0);
  };
  const sectionBody = (s, ctx) => {
    const sideInk = ctx.side ? C.sideInk : ink, sideMuted = ctx.side ? C.sideMuted : muted;
    switch (s.kind) {
      case "text": return para(run(s.text, { color: sideInk }), { after: 60 });
      case "contact": return s.items.map(i => para(run(i, { sz: SZ - 1, color: sideInk }), { after: 50 })).join("");
      case "list": return ctx.side ? s.items.map(i => para(run(i, { sz: SZ - 1, color: sideInk }), { after: 50 })).join("") : bulletParas(s.items, 0);
      case "entries": return s.items.map(it => entry(it, ctx)).join("");
      case "referees": return s.items.map(r => para(run(r.name, { b: true, color: sideInk }), { keep: true, before: 60 }) + (r.line ? para(run(r.line, { color: sideInk }), { keep: !!r.contact }) : "") + (r.contact ? para(run(r.contact, { sz: SZ - 1, color: sideMuted })) : "")).join("");
      case "groups": {
        const as = ctx.side ? (tpl.skillsAs === "chips" ? "chips" : "list") : tpl.skillsAs === "chips" ? "chips" : "groups";
        if (as === "groups") return s.groups.map(g => para(run(g.label + ": ", { b: true }) + run(g.items.join(", ")), { after: 50 })).join("");
        if (as === "chips") {
          const chipBg = ctx.side && ctx.dark ? mixHex(C.sideBg, "#FFFFFF", 0.16) : C.tint;
          return s.groups.map(g => para(run(g.label, { b: true, sz: SZ - 1, color: sideMuted }), { keep: true, before: 60, after: 40 }) + para(g.items.map(i => run(` ${i} `, { sz: SZ - 1, shd: chipBg, color: sideInk }) + run("  ", { sz: SZ - 1 })).join(""), { after: 60, line: 300 })).join("");
        }
        return s.groups.map(g => para(run(g.label, { b: true, sz: SZ - 1, color: sideMuted }), { keep: true, before: 60, after: 30 }) + g.items.map(i => para(run(i, { sz: SZ - 1, color: sideInk }), { after: 30 })).join("")).join("");
      }
      default: return "";
    }
  };
  const column = (sections, ctx, withName, band) => (withName ? nameBlock(ctx, band) : "") + sections.map((s, i) => heading(s.title, ctx, i === 0 && !withName) + sectionBody(s, ctx)).join("");
  let bodyXml;
  const noBorders = '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>';
  const cell = (w, inner, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.bl ? `<w:tcBorders><w:left w:val="single" w:sz="${o.bl.sz}" w:space="0" w:color="${hex(o.bl.color)}"/></w:tcBorders>` : ""}${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${hex(o.fill)}"/>` : ""}<w:tcMar><w:top w:w="${o.t || 0}" w:type="dxa"/><w:left w:w="${o.l || 0}" w:type="dxa"/><w:bottom w:w="${o.b || 0}" w:type="dxa"/><w:right w:w="${o.r || 0}" w:type="dxa"/></w:tcMar></w:tcPr>${inner || "<w:p/>"}</w:tc>`;
  const table = (cols, cells, o = {}) => `<w:tbl><w:tblPr><w:tblW w:w="${cols.reduce((a, b) => a + b, 0)}" w:type="dxa"/>${noBorders}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cols.map(c => `<w:gridCol w:w="${c}"/>`).join("")}</w:tblGrid><w:tr>${o.minH ? `<w:trPr><w:trHeight w:val="${o.minH}" w:hRule="atLeast"/></w:trPr>` : ""}${cells.join("")}</w:tr></w:tbl>`;
  if (tpl.layout === "sidebar") {
    const dark = tpl.tone === "dark";
    const sideW = Math.round(TEXT_W * tpl.side), mainW = TEXT_W - sideW;
    const sp = dark ? 300 : 260, mp = 380;
    const sideCtx = { w: sideW - 2 * sp, side: true, dark };
    const mainCtx = { w: mainW - mp, side: false };
    const sideXml = column(model.side, sideCtx, dark);
    const mainXml = column(model.main, mainCtx, !dark);
    // at least a full page tall, so the sidebar colour runs to the bottom of page one
    const minH = 16838 - 2 * M - 420;
    bodyXml = table([sideW, mainW], [cell(sideW, sideXml, { fill: C.sideBg, t: 320, l: sp, r: sp, b: 320 }), cell(mainW, mainXml, { t: dark ? 320 : 0, l: mp })], { minH }) + `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr><w:r><w:rPr><w:sz w:val="2"/></w:rPr></w:r></w:p>`;
  } else if (tpl.layout === "band") {
    const pad = 360;
    const bandXml = nameBlock({ w: TEXT_W - 2 * pad, side: false }, true);
    bodyXml = table([TEXT_W], [cell(TEXT_W, bandXml, { fill: C.accent, t: 300, l: pad, r: pad, b: 200 })]) + para("", { after: 120, line: 200 }) + column(model.main, { w: TEXT_W, side: false }, false);
  } else {
    bodyXml = column(model.main, { w: TEXT_W, side: false }, true);
  }
  const W = W_NS;
  const bulletDef = tpl.bullet === "square" ? { text: "", font: "Wingdings" } : tpl.bullet === "dash" ? { text: "–", font: tpl.body } : { text: "•", font: tpl.body };
  const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="${W}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="${bulletDef.text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="300" w:hanging="220"/></w:pPr><w:rPr><w:rFonts w:ascii="${bulletDef.font}" w:hAnsi="${bulletDef.font}" w:hint="default"/><w:color w:val="${hex(C.accent)}"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${tpl.body}" w:hAnsi="${tpl.body}" w:eastAsia="${tpl.body}" w:cs="${tpl.body}"/><w:sz w:val="${SZ}"/><w:szCs w:val="${SZ}"/><w:lang w:val="en-AU" w:eastAsia="en-AU" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="${LINE}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}"><w:body>${bodyXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${tpl.layout === "band" ? Math.round(M * 0.7) : M}" w:right="${M}" w:bottom="${M}" w:left="${M}" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const zip = new window.JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
  zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`);
  zip.file("docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(model.name + (model.headline ? " - " + model.headline : ""))}</dc:title><dc:creator>${X(model.name)}</dc:creator></cp:coreProperties>`);
  zip.file("word/document.xml", docXml);
  zip.file("word/styles.xml", stylesXml);
  zip.file("word/numbering.xml", numberingXml);
  return zip.generateAsync({ type: "blob", mimeType: DOCX_MIME, compression: "DEFLATE" });
}

/* --- 3. PDF --- */
async function cvPdf(model, tpl, opts = {}) {
  await loadScript(JSPDF);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const C = tplColours(tpl, opts.accent);
  const fB = FONTS[tpl.body].pdf, fH = FONTS[tpl.head].pdf;
  const PW = 210, PH = 297, M = tpl.margin, S = tpl.size;
  const PT = 0.3528;
  const LH = size => size * PT * 1.34 * (tpl.lh || 1), GP = tpl.gap || 1;
  const safe = s => String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[•▪]/g, "-").replace(/ /g, " ").replace(/[^\x00-\xFF]/g, "");
  const setF = (fam, style, size, color) => { doc.setFont(fam, style); doc.setFontSize(size); doc.setTextColor(...hexRgb(color)); };
  const fill = c => doc.setFillColor(...hexRgb(c));
  // jsPDF measures with kerning but draws without it, so measure the way it draws
  const textW = t => doc.getStringUnitWidth(t, { kerning: {} }) * doc.internal.getFontSize() / doc.internal.scaleFactor;
  const stroke = (c, w) => { doc.setDrawColor(...hexRgb(c)); doc.setLineWidth(w); };
  const sideW = tpl.layout === "sidebar" ? PW * tpl.side : 0;
  const dark = tpl.layout === "sidebar" && tpl.tone === "dark";
  const decorate = () => { if (sideW) { fill(C.sideBg); doc.rect(0, 0, sideW, PH, "F"); } };
  decorate();
  const nextPage = col => {
    col.page += 1;
    if (col.page > doc.getNumberOfPages()) { doc.addPage(); decorate(); }
    doc.setPage(col.page);
    col.y = col.top2;
  };
  const ensure = (col, h) => { if (col.y + h > col.bottom) nextPage(col); };
  // Word-wrapped text made of styled pieces, e.g. a bold label then plain items
  function rich(col, segs, o = {}) {
    const size = o.size || S, lh = LH(size) * (o.lh || 1), indent = o.indent || 0, maxW = col.w - indent;
    const toks = [];
    for (const sg of segs) for (const w of safe(sg.t).split(/(\s+)/)) if (w) toks.push({ ...sg, t: /^\s+$/.test(w) ? " " : w });
    const lines = [[]];
    let lw = 0;
    for (const tk of toks) {
      setF(tk.font || fB, tk.style || "normal", size, tk.color || C.ink);
      const tw = textW(tk.t) + (tk.cs || 0) * tk.t.length;
      const cur = lines[lines.length - 1];
      if (tk.t === " ") { if (cur.length) { cur.push({ ...tk, w: tw }); lw += tw; } continue; }
      if (lw + tw > maxW && cur.length) { while (cur.length && cur[cur.length - 1].t === " ") cur.pop(); lines.push([]); lw = 0; }
      lines[lines.length - 1].push({ ...tk, w: tw }); lw += tw;
    }
    for (const ln of lines) {
      while (ln.length && ln[ln.length - 1].t === " ") ln.pop();
      if (!ln.length) continue;
      ensure(col, lh);
      const width = ln.reduce((a, t) => a + t.w, 0);
      let x = col.x + indent + (o.align === "center" ? (maxW - width) / 2 : o.align === "right" ? maxW - width : 0);
      const base = col.y + lh * 0.74;
      if (o.onLine) o.onLine(base, ln === lines[0]);
      for (const t of ln) { setF(t.font || fB, t.style || "normal", size, t.color || C.ink); doc.text(t.t, x, base, t.cs ? { charSpace: t.cs } : undefined); x += t.w; }
      col.y += lh;
    }
  }
  const nameBlock = (col, onDark, center, withContact) => {
    const n = tpl.nm, name = n.caps ? model.name.toUpperCase() : model.name;
    rich(col, [{ t: name, font: fH, style: n.weight >= 600 ? "bold" : "normal", color: onDark ? "#FFFFFF" : C.accent, cs: n.track * n.size * PT }], { size: n.size, lh: 0.95, align: center ? "center" : "left" });
    col.y += 1;
    if (model.headline) rich(col, [{ t: model.headline, color: onDark ? (tpl.layout === "band" ? mixHex("#FFFFFF", C.accent, 0.2) : C.sideHead) : "#3A4252", style: dark ? "bold" : "normal" }], { size: S + 1.5, align: center ? "center" : "left" });
    const line = [...model.contact, ...model.details];
    if (withContact && line.length) { col.y += 0.8; rich(col, [{ t: line.join("   |   "), color: onDark ? mixHex("#FFFFFF", C.accent, 0.25) : C.muted }], { size: S - 1, align: center ? "center" : "left" }); }
    if (n.rule) { col.y += 2; stroke(C.accent, 0.9); doc.line(col.x, col.y, col.x + col.w, col.y); col.y += 1.5; }
    col.y += 3.5;
  };
  const heading = (col, title, first) => {
    const t = tpl.headCaps ? title.toUpperCase() : title;
    const side = col.side;
    const col1 = side ? C.sideHead : C.accent;
    const size = tpl.heading === "quiet" ? S - 1 : S + 0.5, lh = LH(size);
    ensure(col, lh + LH(S) * 3 + 5);
    if (!first) col.y += 3.4 * GP;
    const cs = tpl.headCaps ? (tpl.heading === "rules" || tpl.heading === "quiet" ? 0.55 : 0.3) : 0;
    const lineCol = side && dark ? mixHex(C.sideBg, "#FFFFFF", 0.3) : col1;
    switch (tpl.heading) {
      case "rules":
        stroke(lineCol, 0.2); doc.line(col.x, col.y, col.x + col.w, col.y); col.y += 1.4;
        rich(col, [{ t, font: fH, style: "bold", color: col1, cs }], { size, align: side ? "left" : "center" });
        col.y += 0.6; doc.line(col.x, col.y, col.x + col.w, col.y); col.y += 2.6; break;
      case "accent":
        rich(col, [{ t, font: fH, style: "bold", color: col1, cs }], { size });
        col.y += 0.6; stroke(side && dark ? lineCol : C.tint2, 0.3); doc.line(col.x, col.y, col.x + col.w, col.y); col.y += 2.4; break;
      case "bar":
        fill(C.accent); doc.rect(col.x, col.y + 0.3, 1.1, lh - 0.4, "F");
        rich(col, [{ t, font: fH, style: "bold", color: side ? col1 : C.ink, cs }], { size: size + 0.5, indent: 3 }); col.y += 1.8; break;
      case "pill": {
        setF(fH, "bold", size + 0.5, C.accent);
        const tw = textW(safe(t)) + 6, h = lh + 1.2;
        fill(C.tint2); doc.roundedRect(col.x, col.y, tw, h, h / 2, h / 2, "F");
        const y0 = col.y; col.y += 0.6;
        rich(col, [{ t, font: fH, style: "bold", color: C.accent }], { size: size + 0.5, indent: 3 });
        col.y = y0 + h + 2; break;
      }
      case "quiet":
        rich(col, [{ t, font: fH, style: "bold", color: side ? C.sideMuted : "#8A919E", cs }], { size }); col.y += 1.6; break;
      case "short":
        rich(col, [{ t, font: fH, style: "bold", color: side ? (dark ? "#FFFFFF" : col1) : C.ink, cs }], { size: size + 0.3 });
        col.y += 0.7; fill(col1); doc.rect(col.x, col.y, 8.5, 0.9, "F"); col.y += 3; break;
      default:
        rich(col, [{ t, font: fH, style: "bold", color: col1, cs }], { size: size + 0.3 });
        col.y += 0.5; stroke(lineCol, 0.3); doc.line(col.x, col.y, col.x + col.w, col.y); col.y += 2.4;
    }
  };
  const bullets = (col, items, indent = 0) => {
    for (const b of items) {
      rich(col, [{ t: b }], { indent: indent + 4, onLine: (base, first) => {
        if (!first) return;
        fill(C.accent); stroke(C.accent, 0.35);
        const cy = base - S * PT * 0.33;
        if (tpl.bullet === "square") doc.rect(col.x + indent + 0.9, cy - 0.55, 1.1, 1.1, "F");
        else if (tpl.bullet === "dash") doc.line(col.x + indent + 0.6, cy, col.x + indent + 2.4, cy);
        else doc.circle(col.x + indent + 1.4, cy, 0.55, "F");
      } });
      col.y += 0.5 * GP;
    }
  };
  const fam = tpl.family || tpl.key;
  const orgStyle = ["classic", "academic", "executive"].includes(fam) ? { style: "italic", color: "#3A4252" } : fam === "minimal" ? { color: "#3A4252" } : { color: C.accent };
  const entry = (col, it) => {
    const org = [it.org, it.loc].filter(Boolean).join(", ");
    const title = it.title || it.org;
    if (tpl.dates === "gutter" || tpl.dates === "timeline") {
      const G = 30, tl = tpl.dates === "timeline", pad = tl ? 3 : 0;
      ensure(col, LH(S) * 3);
      const y0 = col.y, p0 = col.page;
      const dcol = { ...col, w: G - 3 };
      rich(dcol, [{ t: it.dates || "", color: C.muted }], { size: S - 1 });
      const dEnd = dcol.y;
      col.y = y0;
      const inner = { ...col, x: col.x + G + pad, w: col.w - G - pad };
      rich(inner, [{ t: title, style: "bold" }]);
      if (it.title && org) rich(inner, [{ t: org, ...orgStyle }]);
      bullets(inner, it.bullets);
      if (tl) {
        // a line down the left of the entry, with a dot where it starts
        const x = col.x + G - 0.5, here = inner.page;
        stroke(C.tint2, 0.5);
        if (here === p0) doc.line(x, y0 + 1.2, x, inner.y - 0.5);
        else { doc.setPage(p0); doc.line(x, y0 + 1.2, x, col.bottom); doc.setPage(here); doc.line(x, col.top2, x, inner.y - 0.5); }
        doc.setPage(p0); fill(C.accent); doc.circle(x, y0 + LH(S) * 0.45, 0.9, "F"); doc.setPage(here);
      }
      col.page = inner.page; col.y = inner.page === p0 ? Math.max(inner.y, dEnd) : inner.y;
      col.y += 2 * GP;
      return;
    }
    setF(fB, (tpl.family || tpl.key) === "executive" ? "italic" : "normal", S - 0.5, C.muted);
    const dW = it.dates ? textW(safe(it.dates)) + 3 : 0;
    ensure(col, LH(S) * 3);
    // title (wrapping clear of the dates) with the dates on its first line
    const tcol = { ...col, w: col.w - dW };
    rich(tcol, [{ t: title, style: "bold" }], { onLine: (base, first) => { if (first && it.dates) { setF(fB, (tpl.family || tpl.key) === "executive" ? "italic" : "normal", S - 0.5, col.side ? C.sideMuted : C.muted); doc.text(safe(it.dates), col.x + col.w, base, { align: "right" }); } } });
    col.page = tcol.page; col.y = tcol.y;
    if (it.title && org) rich(col, [{ t: org, ...orgStyle }]);
    bullets(col, it.bullets);
    col.y += 2 * GP;
  };
  const groups = (col, s) => {
    const as = col.side ? (tpl.skillsAs === "chips" ? "chips" : "list") : tpl.skillsAs === "chips" ? "chips" : "groups";
    const ink = col.side ? C.sideInk : C.ink, mut = col.side ? C.sideMuted : C.muted;
    for (const g of s.groups) {
      if (as === "groups") { rich(col, [{ t: g.label + ": ", style: "bold", color: ink }, { t: g.items.join(", "), color: ink }]); col.y += 0.8; continue; }
      rich(col, [{ t: g.label, style: "bold", color: mut }], { size: S - 1 });
      col.y += 0.6;
      if (as === "list") { for (const i of g.items) rich(col, [{ t: i, color: ink }], { size: S - 0.5 }); col.y += 2; continue; }
      // chips
      const size = S - 1, h = LH(size) + 1.4;
      let x = col.x;
      setF(fB, "normal", size, ink);
      ensure(col, h);
      for (const i of g.items) {
        const t = safe(i), w = Math.min(col.w, textW(t) + 4.4);
        if (x + w > col.x + col.w + 0.01) { x = col.x; col.y += h + 1.4; ensure(col, h); }
        fill(col.side && dark ? mixHex(C.sideBg, "#FFFFFF", 0.16) : C.tint); doc.roundedRect(x, col.y, w, h, h / 2, h / 2, "F");
        setF(fB, "normal", size, ink); doc.text(t, x + 2.2, col.y + h * 0.68);
        x += w + 1.6;
      }
      col.y += h + 3;
    }
  };
  const section = (col, s, first) => {
    heading(col, s.title, first);
    const ink = col.side ? C.sideInk : C.ink;
    switch (s.kind) {
      case "text": rich(col, [{ t: s.text, color: ink }]); col.y += 1; break;
      case "contact": for (const i of s.items) { rich(col, [{ t: i, color: ink }], { size: S - 0.5 }); col.y += 0.8; } break;
      case "list": if (col.side) { for (const i of s.items) { rich(col, [{ t: i, color: ink }], { size: S - 0.5 }); col.y += 0.8; } } else bullets(col, s.items); break;
      case "entries": for (const it of s.items) entry(col, it); break;
      case "groups": groups(col, s); break;
      case "referees": for (const r of s.items) { rich(col, [{ t: r.name, style: "bold", color: ink }]); if (r.line) rich(col, [{ t: r.line, color: ink }]); if (r.contact) rich(col, [{ t: r.contact, color: col.side ? C.sideMuted : C.muted }], { size: S - 1 }); col.y += 2; } break;
    }
  };
  const center = tpl.nm.align === "center";
  if (tpl.layout === "sidebar") {
    const sp = dark ? 9 : 8;
    const main = { x: sideW + 9, w: PW - sideW - 9 - M, y: M, top2: M, bottom: PH - M, page: 1, side: false };
    if (!dark) nameBlock(main, false, false, false);
    model.main.forEach((s, i) => section(main, s, i === 0 && dark));
    doc.setPage(1);
    const side = { x: sp, w: sideW - 2 * sp, y: M, top2: M, bottom: PH - M, page: 1, side: true };
    if (dark) nameBlock(side, true, false, false);
    model.side.forEach((s, i) => section(side, s, i === 0 && !dark));
  } else if (tpl.layout === "band") {
    // measure the band on a scratch column, then draw it for real
    const probe = { x: M, w: PW - 2 * M, y: 0, top2: 0, bottom: 1e9, page: 1 };
    const save = doc.text; doc.text = () => doc; nameBlock(probe, true, center, true); doc.text = save;
    const bandH = probe.y + 9;
    fill(C.accent); doc.rect(0, 0, PW, bandH, "F");
    const head = { x: M, w: PW - 2 * M, y: 10, top2: M, bottom: PH - M, page: 1 };
    nameBlock(head, true, center, true);
    const body = { x: M, w: PW - 2 * M, y: bandH + 6, top2: M, bottom: PH - M, page: 1, side: false };
    model.main.forEach((s, i) => section(body, s, i === 0));
  } else {
    const body = { x: M, w: PW - 2 * M, y: M, top2: M, bottom: PH - M, page: 1, side: false };
    nameBlock(body, false, center, true);
    model.main.forEach(s => section(body, s, false));
  }
  doc.setProperties({ title: model.name + (model.headline ? " - " + model.headline : ""), author: model.name });
  return { blob: doc.output("blob"), pages: doc.getNumberOfPages() };
}
const cvFileName = (model, kind, label) => `${model.name.replace(/[\\/:*?"<>|]+/g, "").trim() || "Resume"} - ${label || "Resume"}.${kind}`;

