// Each source's answer becomes the same shape as a row in the `jobs` table.
import { dedupeKey, sanitizeHtml, sha1, toISO, num, decodeEntities } from "./util.mjs";
import { placeParts, extractState, STATE_NAMES } from "./au.mjs";

const clip = (s, n) => String(s ?? "").slice(0, n);
const typeWords = t => { const x = String(t ?? "").toLowerCase().replace(/[_-]+/g, " "); return /full/.test(x) ? "Full time" : /part/.test(x) ? "Part time" : /casual/.test(x) ? "Casual" : /contract|temp|fixed/.test(x) ? "Contract" : /intern|graduate|apprentice|trainee/.test(x) ? "Graduate or intern" : /permanent/.test(x) ? "" : clip(String(t ?? "").trim(), 40); };

function finish(j) {
  const { city, state } = j._place || placeParts(j.location);
  const row = {
    source: j.source, source_id: String(j.source_id), title: clip(decodeEntities(j.title).replace(/\s+/g, " ").trim(), 300), company: clip(decodeEntities(j.company ?? "").trim(), 200) || null,
    location: clip(j.location, 200) || null, city: city || null, state: state || null, is_remote: !!j.is_remote,
    description: j.description ? clip(j.description, 30000) : null,
    salary_min: j.salary_min ?? null, salary_max: j.salary_max ?? null, salary_text: j.salary_text ? clip(j.salary_text, 200) : null,
    job_type: j.job_type ? clip(j.job_type, 60) : null, category: j.category ? clip(j.category, 120) : null, url: j.url, posted_at: j.posted_at ?? null
  };
  row.dedupe_key = dedupeKey({ title: row.title, company: row.company, city: row.city || row.state || "" });
  return row;
}

/* --- Adzuna: results[] --- */
export function mapAdzuna(r) {
  const area = (r.location && r.location.area) || [];
  const state = STATE_NAMES[String(area[1] || "").toLowerCase()] || extractState((r.location && r.location.display_name) || "");
  const predicted = String(r.salary_is_predicted) === "1";
  const min = predicted ? null : num(r.salary_min), max = predicted ? null : num(r.salary_max);
  const city = area.length >= 3 ? area[area.length - 1] : placeParts((r.location || {}).display_name).city;
  const time = typeWords(r.contract_time), kind = typeWords(r.contract_type);
  return finish({
    source: "adzuna", source_id: r.id, title: r.title, company: r.company && r.company.display_name, location: r.location && r.location.display_name,
    _place: { city, state }, description: sanitizeHtml(r.description), salary_min: min, salary_max: max, salary_text: predicted && num(r.salary_min) ? "Estimated salary" : "",
    job_type: kind === "Contract" ? "Contract" : time || kind, category: r.category && r.category.label, url: r.redirect_url, posted_at: toISO(r.created)
  });
}

/* --- Jooble: jobs[] --- */
export function mapJooble(r) {
  return finish({
    source: "jooble", source_id: r.id != null && r.id !== "" ? r.id : sha1(r.link), title: r.title, company: r.company, location: r.location,
    description: sanitizeHtml(r.snippet), salary_text: r.salary, job_type: typeWords(r.type), url: r.link, posted_at: toISO(r.updated)
  });
}

/* --- Employer feeds: one small adapter per hiring system (the list of employers is config/employers.yaml) --- */
// url: where the public feed is. list: the jobs in its answer. map: one raw job → the few fields we need.
export const ATS = {
  greenhouse: {
    url: t => `https://boards-api.greenhouse.io/v1/boards/${t}/jobs?content=true`,
    list: d => d.jobs || [],
    map: r => ({ id: r.id, title: r.title, location: (r.location || {}).name || "", url: r.absolute_url, posted: r.updated_at || r.first_published, html: r.content, category: (r.departments || [])[0] && r.departments[0].name, remote: /remote/i.test((r.location || {}).name || ""), country: "" })
  },
  lever: {
    url: t => `https://api.lever.co/v0/postings/${t}?mode=json`,
    list: d => (Array.isArray(d) ? d : []),
    map: r => ({ id: r.id, title: r.text, location: [(r.categories || {}).location, ...((r.categories || {}).allLocations || [])].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join("; "), url: r.hostedUrl, posted: r.createdAt, html: r.description || "", text: r.descriptionPlain, type: (r.categories || {}).commitment, category: (r.categories || {}).team || (r.categories || {}).department, remote: r.workplaceType === "remote", country: r.country || "" })
  },
  ashby: {
    url: t => `https://api.ashbyhq.com/posting-api/job-board/${t}?includeCompensation=true`,
    list: d => (d.jobs || []).filter(j => j.isListed !== false),
    map: r => ({ id: r.id, title: r.title, location: [r.location, ...(r.secondaryLocations || []).map(s => s.location || s)].filter(Boolean).join("; "), url: r.jobUrl, posted: r.publishedAt, html: r.descriptionHtml, text: r.descriptionPlain, type: r.employmentType, category: r.department || r.team, remote: !!r.isRemote, country: ((r.address || {}).postalAddress || {}).addressCountry || "", salaryText: r.compensation && r.compensation.compensationTierSummary })
  },
  workable: {
    url: t => `https://apply.workable.com/api/v1/widget/accounts/${t}?details=true`,
    list: d => d.jobs || [],
    map: r => ({ id: r.shortcode || r.id, title: r.title, location: [r.city, r.state].filter(Boolean).join(", "), url: r.url || r.shortlink, posted: r.published_on || r.created_at, html: r.description, type: r.employment_type, category: r.department, remote: !!r.telecommuting, country: r.country || "" })
  },
  smartrecruiters: {
    url: (t, offset = 0) => `https://api.smartrecruiters.com/v1/companies/${t}/postings?limit=100&offset=${offset}`,
    list: d => d.content || [],
    more: (d, offset) => (d.totalFound || 0) > offset + 100,
    map: (r, e) => ({ id: r.id, title: r.name, location: [(r.location || {}).city, (r.location || {}).region].filter(Boolean).join(", "), url: `https://jobs.smartrecruiters.com/${e.token}/${r.id}`, posted: r.releasedDate, html: "", type: (r.typeOfEmployment || {}).label, category: (r.department || {}).label || (r.function || {}).label, remote: !!(r.location || {}).remote, country: (r.location || {}).country || "" })
  },
  recruitee: {
    url: t => `https://${t}.recruitee.com/api/offers/`,
    list: d => d.offers || [],
    map: r => ({ id: r.id, title: r.title, location: r.location || [r.city, r.state_code].filter(Boolean).join(", "), url: r.careers_url, posted: r.published_at || r.created_at, html: r.description, type: r.employment_type_code, category: r.department, remote: !!r.remote, country: r.country_code || r.country || "" })
  }
};
ATS.lever_eu = { ...ATS.lever, url: t => `https://api.eu.lever.co/v0/postings/${t}?mode=json` };
export const ATS_NAMES = Object.keys(ATS);

// One raw job from an employer's feed → a row for the jobs table (and the country it says, for the Australia check)
export function mapEmployerJob(ats, raw, employer) {
  const x = ATS[ats].map(raw, employer);
  const plain = String(x.text || "").split(/\n{2,}/).map(p => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("");
  const row = finish({
    source: `employer:${ats === "lever_eu" ? "lever" : ats}`, source_id: `${employer.token}:${x.id}`, title: x.title, company: employer.name, location: x.location,
    description: x.html ? sanitizeHtml(x.html) : x.text ? sanitizeHtml(plain) : "",
    salary_text: x.salaryText, job_type: typeWords(x.type), category: x.category, is_remote: x.remote, url: x.url, posted_at: toISO(x.posted)
  });
  return { row, country: x.country || "" };
}
