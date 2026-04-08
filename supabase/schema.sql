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
  contribution_other text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists contributions_project_id_idx
  on public.contributions (project_id);

create table if not exists public.project_splits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  collaborator_name text not null,
  percent numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_splits_percent_chk check (percent >= 0 and percent <= 100),
  constraint project_splits_unique_collaborator unique (project_id, collaborator_name)
);

create index if not exists project_splits_project_id_idx
  on public.project_splits (project_id);

-- Row Level Security (RLS): for a class demo we allow the publishable key to read/write.
-- Before production: replace with auth and per-user policies.
alter table public.projects enable row level security;
alter table public.contributions enable row level security;
alter table public.project_splits enable row level security;

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

create policy "project_splits_select_demo"
  on public.project_splits for select
  using (true);

create policy "project_splits_insert_demo"
  on public.project_splits for insert
  with check (true);

create policy "project_splits_update_demo"
  on public.project_splits for update
  using (true)
  with check (true);

create policy "project_splits_delete_demo"
  on public.project_splits for delete
  using (true);
