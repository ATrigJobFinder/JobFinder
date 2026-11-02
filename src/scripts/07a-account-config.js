/* ===================== Accounts: settings for your own website ===================== */
// Inside Claude, everything is already saved to each person's Claude account, so this isn't used there.
// On your own website, fill these in to let people sign up and keep everything with their account
// (see the README, "Accounts"). Leave them empty and Job Finder saves in each person's browser only.
// The anon key is meant to be public: what each person can read and write is enforced by the database rules
// in account/supabase.sql.
const ACCOUNT_CFG = {
  url: "",       // your Supabase project URL, like "https://abcdefghijkl.supabase.co"
  anonKey: ""    // Project Settings › API › the "anon" public key
};

// The weekly imported jobs on Find jobs (see docs/jobs-import.md). This is a separate setting from accounts above, so you can
// use one without the other. The anon key is public by design: the database lets it read jobs and nothing else.
const JOBS_CFG = {
  url: "https://ghyjrhbgxkwvogpdomcg.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeWpyaGJneGt3dm9ncGRvbWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NzUzNjgsImV4cCI6MjEwOTE1MTM2OH0.UvzNSoTtcfIEbTgLdXn6rn_SJLDFE-ByE9xi3BbQF80"
};
