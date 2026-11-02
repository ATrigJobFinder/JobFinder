# v21: model-sized prompts, (i) help, Ask AI chat, and accounts

Four changes. Nothing here needs a new secret. Accounts need three set-up steps in Supabase (below).

## 1. Prompts that fit the AI

Job Finder now works out whether the AI doing the writing is **small** or **large**, and asks for different things.

| | Small | Large |
|---|---|---|
| Which AIs | A model in your browser (WebLLM, Transformers.js), Chrome's built-in AI, or your own key with a small model | Claude, or your own key with a big model |
| What it's sent | A short brief, one job at a time, a worked example | The fuller instructions, a long section in one go |
| How long it may answer | A tight limit (about 1.8 times the expected answer) | Up to 2,000 tokens |

**How a key's model is judged.** Job Finder reads the model's name: `nano`, `mini`, `lite`, `small`, `instant`, `phi`, or a size of 14 billion parameters or under (`8b`, `3b`) means small. Anything else is large. If it guesses wrong, open **Connect your AI**, choose your key, and set **Model size** to Small or Large.

**Long jobs are split into short steps that build on each other.** Each step is given what the step before wrote.

- **Tailor to a job, AI suggestions:** four steps. 1) the fit, 2) which missing skills are really in your resume in other words (quotes are checked against your resume), 3) up to three bullets, one at a time, each paired with a skill found in step 2, 4) the profile, given the fit and the skills found. If one step gives an unusable answer, only that part is left out.
- **Cover letter (Tailor to a job):** one paragraph at a time. Every paragraph is shown the letter so far, so it carries on and doesn't repeat. A two-sentence paragraph is written a sentence at a time: the second sentence is asked for knowing the first.
- **Interview feedback:** three steps in one conversation: scores, then what worked and what to improve (from the scores), then a stronger answer and a follow-up (using the improvements).
- **Weaving skills into a resume, summaries, bullets, rewording:** already one short job each; unchanged except that they now also work for a small model reached through your key.

Every answer still goes through the same fact checks as before (no invented numbers, tools or employers).

Where it lives: `src/scripts/14-ai-engines.js` (size detection, `aiTier`), `17-ai-prompts.js` (`aiChain`, the cover-letter steps), `13a-ai-small-scanner.js`, `25a-interview-steps.js`.

## 2. An (i) beside every input box

Hover (or tab to) the **i** to see **What to add** and **Why**. On a phone, tap it; tap again or press Esc to close. It's added automatically to every box, including ones drawn later (resume steps, cards, dialogs).

The words are in the `HELP` list at the top of `src/scripts/36c-field-help.js`: one line per kind of box (a pattern, then what to add, then why). A box with no matching line gets a plain answer for its kind (text, long text, menu, date, link). To improve one, edit its line; to cover a new box, add a line above the generic ones.

## 3. Ask AI chat

The **Ask AI** button in the bottom-right corner opens a help chat on every page. It uses the AI you chose in Connect your AI (a small model gets a shorter brief, remembers fewer turns and answers in three sentences or fewer). It knows which page you're on and suggests questions for it.

It only advises: it can't see or change your resume, and the chat isn't saved. If no AI is connected it says so and links to Connect your AI.

Where it lives: `src/scripts/36b-ai-chat.js`.

## 4. Accounts: Google, Facebook, Apple, or email

Accounts were already in the code (email and password, saved in your Supabase database). This update switches them on for your Supabase project and adds the three sign-in buttons. A button only appears once you switch that provider on in Supabase, so you can add them one at a time with no code change.

### Set-up (once)

1. **Create the table.** Supabase: **SQL Editor** > **New query**, paste all of `supabase/migrations/003_user_docs.sql`, **Run**. Until you do, sign-up shows a notice that accounts aren't finished and everything stays in the browser.
2. **Allow your website.** Supabase: **Authentication** > **URL Configuration**. Set **Site URL** to your Netlify address (for example `https://your-site.netlify.app`) and add `https://your-site.netlify.app/**` under **Redirect URLs**. Without this, Google/Facebook/Apple sign-in sends people to the wrong place.
3. **Email sign-up.** It works now. Supabase currently asks people to confirm their email, and its built-in email sender is limited to a few emails an hour. For many users, add your own email service under **Authentication** > **SMTP**. (To try it quickly, you can turn **Confirm email** off under **Authentication** > **Sign In / Providers** > **Email**.)

### Add Google (free, about 10 minutes)

1. Google Cloud Console > create a project > **APIs & Services** > **OAuth consent screen** (External; app name, your email) > **Credentials** > **Create credentials** > **OAuth client ID** > **Web application**.
2. Under **Authorized redirect URIs** add `https://ghyjrhbgxkwvogpdomcg.supabase.co/auth/v1/callback`.
3. Copy the **Client ID** and **Client secret**.
4. Supabase > **Authentication** > **Sign In / Providers** > **Google** > turn it on, paste both, save.

### Add Facebook (free)

1. developers.facebook.com > **Create app** (use case: authenticate and request data from users with Facebook Login) > add **Facebook Login**.
2. Add `https://ghyjrhbgxkwvogpdomcg.supabase.co/auth/v1/callback` as a **Valid OAuth Redirect URI**.
3. Copy the **App ID** and **App secret** (Settings > Basic). Add a privacy policy web address, then switch the app to **Live**.
4. Supabase > **Authentication** > **Sign In / Providers** > **Facebook** > turn it on, paste both, save.

### Add Apple (needs the paid Apple Developer Program, about A$150 a year; check Apple's current price)

Apple needs a Services ID, a key and a generated secret, and the secret has to be renewed about every six months. Supabase's guide (Authentication > Providers > Apple) walks through it. Skip Apple unless you need it: Google and email cover most people.

### What gets stored

For each person: their resume profile, cover letters, applications, practice and saved answers, one row each in the `user_docs` table. Row-level rules mean a person can only read and change their own rows. Their AI key is **never** saved to their account; it stays in their browser. With Google, Facebook or Apple, Job Finder receives only a name and email, never a password. Signing up copies anything already saved in that browser into the account.

### How the social sign-in works (for reference)

It uses Supabase's PKCE flow: the browser makes a one-time secret, sends you to Supabase, and comes back to your site with `?code=…` (not in the `#` part the pages use for routing). Job Finder swaps the code plus its secret for a session and tidies the address. If anything goes wrong a notice says so, and email sign-in still works.

## Files

| Path | What it is |
|---|---|
| `src/scripts/14-ai-engines.js` | Model size, tight answer limits, key models treated as small |
| `src/scripts/13a-ai-small-scanner.js` | Tailor to a job suggestions in four steps |
| `src/scripts/25a-interview-steps.js` | Interview feedback in three steps |
| `src/scripts/36b-ai-chat.js` | Ask AI chat |
| `src/scripts/36c-field-help.js` | The (i) and its wording |
| `src/scripts/07a-account-config.js`, `07b-account.js` | Accounts and the three sign-in buttons |
| `src/styles/24-chat-help-account.css` | Styles for all of the above |
| `supabase/migrations/003_user_docs.sql` | The accounts table (same as `account/supabase.sql`) |
