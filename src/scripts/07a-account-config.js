/* ===================== Accounts: settings for your own website ===================== */
// Inside Claude, everything is already saved to each person's Claude account, so this isn't used there.
// On your own website, these let people sign up and keep everything with their account: with an email and password
// (saved in your Supabase database), or with Google, Facebook or Apple. See docs/accounts.md for the setup.
// The anon key is meant to be public: what each person can read and write is enforced by the database rules
// in account/supabase.sql.
// One Supabase project runs both the accounts and the jobs, so the address and public key are written once here.
const SUPABASE_PUBLIC = {
  url: "https://ghyjrhbgxkwvogpdomcg.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeWpyaGJneGt3dm9ncGRvbWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NzUzNjgsImV4cCI6MjEwOTE1MTM2OH0.UvzNSoTtcfIEbTgLdXn6rn_SJLDFE-ByE9xi3BbQF80"
};
const ACCOUNT_CFG = {
  url: SUPABASE_PUBLIC.url,
  anonKey: SUPABASE_PUBLIC.anonKey,
  providers: ["google", "facebook", "apple"]   // the buttons offered; each one only appears once it is switched on in Supabase (Authentication › Sign In / Providers)
};

// The weekly imported jobs on Find jobs (see docs/jobs-import.md). The database lets this public key read jobs and nothing else.
const JOBS_CFG = {
  url: SUPABASE_PUBLIC.url,
  anonKey: SUPABASE_PUBLIC.anonKey
};
