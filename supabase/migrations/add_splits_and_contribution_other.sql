-- SessionLedger migration: real splits + standardized "Other" contribution detail
-- Run in Supabase SQL Editor.

-- 1) Store split percentages per collaborator (per project)
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

alter table public.project_splits enable row level security;

drop policy if exists "project_splits_select_demo" on public.project_splits;
create policy "project_splits_select_demo"
  on public.project_splits for select
  using (true);

drop policy if exists "project_splits_upsert_demo" on public.project_splits;
create policy "project_splits_upsert_demo"
  on public.project_splits for insert
  with check (true);

drop policy if exists "project_splits_update_demo" on public.project_splits;
create policy "project_splits_update_demo"
  on public.project_splits for update
  using (true)
  with check (true);

drop policy if exists "project_splits_delete_demo" on public.project_splits;
create policy "project_splits_delete_demo"
  on public.project_splits for delete
  using (true);

-- 2) If contribution type is "Other", store extra detail
alter table public.contributions
  add column if not exists contribution_other text;

