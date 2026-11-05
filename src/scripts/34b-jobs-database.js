/* ===================== Supabase connection (also used by the support page) ===================== */
const jobsDbOn = () => !!(JOBS_CFG.url && JOBS_CFG.anonKey);
const dbHeaders = () => ({ apikey: JOBS_CFG.anonKey, Authorization: "Bearer " + JOBS_CFG.anonKey, "Content-Type": "application/json" });
const dbBase = () => JOBS_CFG.url.replace(/\/+$/, "") + "/rest/v1";

// Crossing the width where a job opens beside the list (wide) or inside it (narrow): draw the list again
matchMedia("(min-width: 900px)").addEventListener("change", () => { if (currentView === "jobs") renderJobs(); });
