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
