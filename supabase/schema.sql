-- SessionLedger — minimum schema (run in Supabase → SQL Editor → New query)
-- Step 1: paste this entire file and click Run.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  project_type text not null,
  status text not null default 'draft',
  confirmed_at timestamptz,
  description text,
  collaborators text,
  created_at timestamptz not null default now(),
  constraint projects_type_chk check (
    project_type in ('song', 'beat', 'demo', 'other')
  ),
  constraint projects_status_chk check (
    status in ('draft', 'confirmed')
  )
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  contributor_name text not null,
  contribution_type text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists contributions_project_id_idx
  on public.contributions (project_id);

-- Row Level Security (RLS): for a class demo we allow the publishable key to read/write.
-- Before production: replace with auth and per-user policies.
alter table public.projects enable row level security;
alter table public.contributions enable row level security;

create policy "projects_select_demo"
  on public.projects for select
  using (true);

create policy "projects_insert_demo"
  on public.projects for insert
  with check (true);

create policy "contributions_select_demo"
  on public.contributions for select
  using (true);

create policy "contributions_insert_demo"
  on public.contributions for insert
  with check (true);
