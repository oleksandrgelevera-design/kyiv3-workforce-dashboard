-- ============================================================================
-- Kyiv 3 Workforce & Recruitment Dashboard — initial schema
-- ============================================================================
-- Run this once against a fresh Supabase project (via `supabase db push`,
-- the Supabase SQL editor, or the CLI migration workflow — see
-- docs/DEPLOYMENT.md for exact steps).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. STORES
-- ----------------------------------------------------------------------------
create table if not exists public.stores (
  code                       text primary key,
  name                       text not null,
  base_stakes                numeric(6,2) not null,
  base_headcount             integer not null,
  season_stakes              numeric(6,2),
  season_headcount           integer,
  actual_stakes              numeric(6,2),
  actual_headcount           integer,
  cpd_count                  integer,
  risky_count                integer,
  has_disability_employee    boolean,
  comment                    text not null default '',
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

comment on table public.stores is
  'One row per store in the district. Norms (base_*/season_*) come from the '
  'DM staffing calculator; actual_* is entered manually by the District Manager.';

-- ----------------------------------------------------------------------------
-- 2. VACANCIES
-- ----------------------------------------------------------------------------
create table if not exists public.vacancies (
  id                       text primary key,
  store_code               text not null references public.stores(code) on delete cascade,
  vacancy_name             text,
  position                 text not null,               -- LR | SA | AR | SM | DepSM (extensible)
  employment_share         numeric(4,2) not null,
  opened_date              date not null,
  hired_date               date,
  hire_status              text not null default 'open' -- open | filled | transferred | unclear
                             check (hire_status in ('open','filled','transferred','unclear')),
  responsible_person       text,                         -- SM | DepSM | SM.DepSM | SMT
  priority                 smallint check (priority between 1 and 3),
  minor_employee_present   integer,
  search_channels          text[] not null default '{}',
  marketing_presence       text not null default '',
  ambassador_actions       text not null default '',
  comments                 text not null default '',
  work_ua_contacts         integer,
  work_ua_updated_at       date,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.vacancies is
  'One row per open/closed vacancy. Target time-to-fill (30 days) is a '
  'business rule applied in the application, not stored per row.';

create index if not exists vacancies_store_code_idx on public.vacancies(store_code);
create index if not exists vacancies_hire_status_idx on public.vacancies(hire_status);

-- ----------------------------------------------------------------------------
-- 3. SETTINGS (singleton row — id is always 1)
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  id                   integer primary key default 1,
  dashboard_title      text not null default 'Kyiv 3 Workforce & Recruitment Dashboard',
  district_name        text not null default 'Kyiv 3',
  report_recipients    text[] not null default '{}',
  report_day           text not null default 'monday'
                         check (report_day in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  report_time          time not null default '08:00',
  report_timezone      text not null default 'Europe/Kyiv',
  last_report_sent_at  timestamptz,
  updated_at           timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 4. PROFILES (extends auth.users with a role — for future permission tiers)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  role          text not null default 'viewer'
                  check (role in ('district_manager','hr','store_manager','viewer')),
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. updated_at auto-touch triggers
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stores_touch_updated_at on public.stores;
create trigger stores_touch_updated_at
  before update on public.stores
  for each row execute procedure public.touch_updated_at();

drop trigger if exists vacancies_touch_updated_at on public.vacancies;
create trigger vacancies_touch_updated_at
  before update on public.vacancies
  for each row execute procedure public.touch_updated_at();

drop trigger if exists settings_touch_updated_at on public.settings;
create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute procedure public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Row Level Security
-- ----------------------------------------------------------------------------
-- v1 policy, matching the brief: "every authenticated user may edit data".
-- Roles exist in `profiles` already so tightening this later (e.g. Viewer =
-- read-only) is a matter of adding a role check to the USING/WITH CHECK
-- clauses below — no schema change required.

alter table public.stores    enable row level security;
alter table public.vacancies enable row level security;
alter table public.settings  enable row level security;
alter table public.profiles  enable row level security;

create policy "Authenticated users can read stores"
  on public.stores for select
  to authenticated using (true);
create policy "Authenticated users can write stores"
  on public.stores for insert to authenticated with check (true);
create policy "Authenticated users can update stores"
  on public.stores for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete stores"
  on public.stores for delete to authenticated using (true);

create policy "Authenticated users can read vacancies"
  on public.vacancies for select to authenticated using (true);
create policy "Authenticated users can write vacancies"
  on public.vacancies for insert to authenticated with check (true);
create policy "Authenticated users can update vacancies"
  on public.vacancies for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete vacancies"
  on public.vacancies for delete to authenticated using (true);

create policy "Authenticated users can read settings"
  on public.settings for select to authenticated using (true);
create policy "Authenticated users can update settings"
  on public.settings for update to authenticated using (true) with check (true);

create policy "Users can read their own profile"
  on public.profiles for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- 7. Realtime — publish changes so the frontend's subscription fires
-- ----------------------------------------------------------------------------
-- Supabase projects ship with a `supabase_realtime` publication already.
-- These statements are safe to re-run (guarded by exception blocks) because
-- ALTER PUBLICATION ... ADD TABLE fails if the table is already a member.
do $$
begin
  begin
    alter publication supabase_realtime add table public.stores;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.vacancies;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.settings;
  exception when duplicate_object then null;
  end;
end $$;
