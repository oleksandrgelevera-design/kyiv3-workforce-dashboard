# Setup Guide — Supabase, Resend, and your first account

Follow this once, before your first deployment.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick any name (e.g. `kyiv3-workforce`), a strong database password (save
   it somewhere — you won't need it day-to-day, but you'll want it if you
   ever need direct `psql` access), and the region closest to your users
   (e.g. Frankfurt/`eu-central-1` for Ukraine-based users).
3. Wait ~2 minutes for provisioning.

## 2. Run the database migrations

**Option A — SQL Editor (simplest, no CLI needed):**

1. In the Supabase dashboard, open **SQL Editor**.
2. Open `supabase/migrations/0001_init.sql` from this project, copy its
   entire contents, paste into a new query, and click **Run**.
3. Repeat for `supabase/migrations/0002_seed_district_data.sql` — this
   loads the district's current 14 stores and 43 vacancies so you're not
   starting from a blank dashboard.

**Option B — Supabase CLI (if you prefer scripted/repeatable deploys):**

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase db push
```

Both migrations are written with `ON CONFLICT DO NOTHING` / idempotent
guards, so re-running them is always safe.

## 3. Collect your environment variables

In the Supabase dashboard: **Project Settings → API**.

| .env variable                     | Where to find it                          |
|-----------------------------------|--------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`         | "Project URL"                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | "Project API keys" → `anon` `public`       |
| `SUPABASE_SERVICE_ROLE_KEY`        | "Project API keys" → `service_role` `secret` — **never** expose this in the browser |

Copy `.env.example` to `.env.local` and fill these three in now; the Resend
and Cron ones can wait until step 5.

## 4. Create your first (District Manager) account

There's no public sign-up page by design — this is a private internal tool.
Create the first account directly in Supabase:

1. Supabase dashboard → **Authentication → Users → Add user**.
2. Enter your email and a password, and tick **Auto Confirm User** (so you
   don't need an email-confirmation step for an internal tool).
3. That's it — a matching row is created automatically in `public.profiles`
   (via the `handle_new_user` trigger in the migration) with the default
   role `viewer`.
4. To make yourself the District Manager, run this in the SQL Editor
   (replace the email):

   ```sql
   update public.profiles
   set role = 'district_manager'
   where email = 'you@jysk.com';
   ```

5. Add your Store Managers / HR the same way (**Add user** in the dashboard)
   whenever you're ready — no code changes needed.

## 5. Set up Resend (weekly email report)

1. Go to [resend.com](https://resend.com) → sign up → **API Keys → Create
   API Key**. Copy it into `RESEND_API_KEY`.
2. **Domains → Add Domain**, and add the DNS records Resend gives you at
   your domain registrar (SPF/DKIM). This takes a few minutes to verify.
   - While waiting, or if you don't want to verify a domain yet, you can
     test with Resend's sandbox sender `onboarding@resend.dev` — but it will
     only deliver to the email address on your own Resend account, which is
     fine for a first test, not for real recipients.
3. Once verified, set `RESEND_FROM_EMAIL` to an address on that domain, e.g.
   `"Kyiv 3 Dashboard <reports@yourdomain.com>"`.
4. Recipients themselves are **not** an env variable — set them from the
   app's **Налаштування (Settings)** page after your first deploy.

## 6. Generate a CRON_SECRET

Any long random string works — e.g. run `openssl rand -hex 32` locally, or
just mash the keyboard for 40+ characters. Put it in `CRON_SECRET`. You'll
add the same value to Vercel's environment variables in the deployment step
— see `docs/DEPLOYMENT.md`.

---

Once all of the above is done, continue with **`docs/DEPLOYMENT.md`** to put
this online.
