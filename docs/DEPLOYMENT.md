# Deployment Guide — Vercel

Assumes you've already completed `docs/SETUP.md` (Supabase project +
migrations + Resend + your first account).

## 1. Push this project to a git repository

Vercel deploys from GitHub, GitLab, or Bitbucket.

```bash
git init
git add .
git commit -m "Kyiv 3 Workforce & Recruitment Dashboard — cloud edition"
git branch -M main
git remote add origin <your-empty-repo-url>
git push -u origin main
```

`.env.local` is already in `.gitignore` — real secrets never get committed.

## 2. Import the project into Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → pick your repo.
2. Framework preset: Vercel auto-detects **Next.js** — leave the build
   command (`next build`) and output settings as default.
3. Before clicking **Deploy**, open **Environment Variables** and add every
   variable from `.env.example` with your real values:

   | Variable                       | Value                                    |
   |---------------------------------|-------------------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`       | from Supabase                             |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | from Supabase                             |
   | `SUPABASE_SERVICE_ROLE_KEY`      | from Supabase (mark as **Sensitive**)     |
   | `RESEND_API_KEY`                 | from Resend (mark as **Sensitive**)       |
   | `RESEND_FROM_EMAIL`              | your verified sender                      |
   | `CRON_SECRET`                    | the string you generated (mark **Sensitive**) |
   | `NEXT_PUBLIC_APP_URL`            | leave blank for now — see step 4          |

4. Click **Deploy**. First build takes 1–2 minutes.

## 3. Confirm the cron job registered

Vercel reads `vercel.json` automatically. After deploying, go to your
project → **Settings → Cron Jobs** and confirm you see:

```
/api/cron/weekly-report    5 * * * *    (hourly, at :05)
```

This route wakes up hourly but only actually sends an email once, on the
day/hour you configured in **Налаштування (Settings)** — see
`docs/MIGRATION_NOTES.md` for why it's built this way instead of a
dynamically-changing cron schedule.

> Cron Jobs require a Vercel **Pro** plan (or the Hobby plan's limited free
> cron allowance, depending on your account — check your current plan's
> cron limits). If crons aren't available on your plan, the rest of the app
> works identically; only the automatic weekly email won't fire until cron
> is enabled.

## 4. Set your real production URL

1. After the first deploy, Vercel gives you a URL like
   `https://kyiv3-workforce.vercel.app` (or your custom domain if you
   attached one under **Settings → Domains**).
2. Go back to **Settings → Environment Variables**, set
   `NEXT_PUBLIC_APP_URL` to that exact URL, and **Redeploy** (Deployments →
   ⋯ → Redeploy) so the weekly email's "Open dashboard" link points to the
   right place.

## 5. Smoke-test

1. Open the production URL → you should land on `/login`.
2. Sign in with the account you created in `docs/SETUP.md`.
3. Confirm the Dashboard loads with the 14 seeded stores and 43 vacancies.
4. Open the same URL in a second browser (or incognito window), sign in
   with a second test account, edit a "Фактично" value in the first window
   — confirm it updates in the second window within a second or two, with
   no refresh. That's Realtime working.
5. Go to **Налаштування**, add your own email as a report recipient, set
   the day/time to a few minutes from now (in your timezone), save, and
   wait — you should get the test email once the hourly cron tick passes
   that time. (Manually hitting
   `https://your-app.vercel.app/api/cron/weekly-report` with the
   `Authorization: Bearer <CRON_SECRET>` header also works for testing
   without waiting for the schedule — e.g. via `curl`.)

## Redeploying after future changes

Any `git push` to the connected branch triggers an automatic redeploy —
that's the whole workflow going forward.
