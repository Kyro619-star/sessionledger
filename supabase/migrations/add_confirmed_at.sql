-- Run once in Supabase SQL Editor if your projects table was created before confirmed_at existed.

alter table public.projects
  add column if not exists confirmed_at timestamptz;

comment on column public.projects.confirmed_at is
  'Set when status becomes confirmed; used on the final record page.';
