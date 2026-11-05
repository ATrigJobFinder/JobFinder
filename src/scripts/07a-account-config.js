/* ===================== Accounts: settings for your own website ===================== */
// Inside Claude, everything is already saved to each person's Claude account, so this isn't used there.
// On your own website, these let people sign up and keep everything with their account: with an email and password
// (saved in your Supabase database), or with Google, Facebook, Apple or LinkedIn. See docs/accounts.md for the setup.
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
  providers: ["google", "linkedin_oidc", "facebook", "apple"]   // the buttons offered; each one only appears once it is switched on in Supabase (Authentication › Sign In / Providers). "linkedin_oidc" is Supabase's name for LinkedIn.
};

// Street level on the Home globe: Google Maps. Zooming right in on the globe breaks through the clouds into
// Google's own satellite map. Leave this empty to switch it off.
// Get a key in Google Cloud: create a project, switch on billing and "Maps JavaScript API", then Credentials > Create credentials > API key.
// Restrict the key to your website's address (HTTP referrers, e.g. https://yoursite.com/* and http://localhost:5173/*) so nobody else can use it.
// It is meant to be public, like the Supabase key above. It only works on a site that can reach Google, not inside Claude's preview. See docs/17-home-globe.md.
const GOOGLE_MAPS_KEY = "AIzaSyAel0CzRQwxzIHtzV9dpc37cdfJjhpJ1Uw";

// The public Supabase connection used by the support page. The database lets this public key send messages and nothing else.
const JOBS_CFG = {
  url: SUPABASE_PUBLIC.url,
  anonKey: SUPABASE_PUBLIC.anonKey
};
