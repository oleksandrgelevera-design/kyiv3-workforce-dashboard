# Migration notes: local app → cloud app

This documents exactly what changed, so nothing here is a surprise.

## Unchanged (as required)

- Every visible screen, tab, KPI card, color, icon, and label.
- Every calculation: staffing gap math, the people-shortage color priority
  (yellow at −1/−2 headcount, red beyond −3), vacancy status logic
  (open/filled/transferred/unclear), the 30-day time-to-fill target, the
  "Залити факт"/"Додати ще магазини" one-time import helpers.
- The component tree: `StoreTag`, `VacancyRow`, `DistrictView`,
  `VacanciesView`, `AddStoreCard`, `AddVacancyForm`, `ChannelTags`,
  `NumberField`, `TextCommitField`, `EditableTitle`, `StatCard`,
  `StyleBlock` — copied verbatim into `src/components/WorkforceApp.tsx`.
  None of their internal JSX or CSS was touched.

## Changed (required for online, multi-user operation)

1. **Data storage**: `window.storage` (a localStorage wrapper) → Supabase
   Postgres. Every `stores`/`vacancies`/`settings` read or write now goes
   through `src/lib/data/*.ts`, which just converts field names
   (camelCase ↔ snake_case) — the React components still call
   `updateStore(code, field, value)` exactly like before; only what happens
   *inside* that function changed.

2. **Sync**: the old app had a single browser tab as the only source of
   truth. The cloud app subscribes to Supabase Realtime
   (`postgres_changes`) on mount; any insert/update/delete from any
   connected user is merged into local state immediately, which is what
   makes "Manager A edits, Manager B sees it instantly" work.

3. **Removed**: the "Автозбереження може не працювати" warning banner and
   the `file://` localStorage-reliability probe. Those existed specifically
   because the old app lived in one file on one disk; a real Postgres
   database doesn't have that failure mode, so the check (and the banner)
   were dropped rather than ported. The **Export/Import JSON** buttons were
   *kept* — Export is still a handy point-in-time backup, and Import now
   bulk-writes into Supabase (visible to everyone) instead of just the
   local tab.

4. **Added, not modified**: authentication (`/login`, `middleware.ts`), the
   Settings page, and the weekly email report. These are additive — they
   don't change how Staffing or Vacancies work, they sit alongside them.

## Why the weekly report cron "polls" hourly instead of rescheduling itself

Vercel Cron schedules are static (defined in `vercel.json`, deployed with
the app). The report's day/time/timezone, however, are meant to be editable
from the Settings page *without* a redeploy. Reconciling those two facts:
`vercel.json` schedules the route to run every hour; the route itself reads
the current settings, computes "is it currently the configured day and
hour, in the configured timezone, and have I not already sent today's
email?", and only sends if so. This means changing the report time in
Settings takes effect on the very next hourly check — no redeploy, no
Vercel API calls, no extra moving parts.

## Why per-field updates instead of whole-array writes

The original app wrote the *entire* stores array (or vacancies array) to
one localStorage key on every edit, debounced. With a shared Postgres
table, doing the same thing (upsert-the-whole-table on every keystroke)
would be wasteful and would create bigger race conditions between
simultaneous editors. Instead, each field edit (`Фактично`, a store
comment, a vacancy's status, ...) is written as a single-column `UPDATE`
scoped to that one row, still debounced (300ms) exactly like the original,
so typing still feels the same — it just writes less data per keystroke.

## Security model (v1)

Every authenticated user can read and write every table (per the brief:
"For version 1, every authenticated user may edit data"). `profiles.role`
already exists (`district_manager` / `hr` / `store_manager` / `viewer`) so
a future permission tier — e.g. Viewer = read-only — is a matter of adding
a role check inside the existing RLS policies in
`supabase/migrations/0001_init.sql`, not a rewrite.
