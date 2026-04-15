-- SessionLedger migration: user authentication
-- Run in Supabase SQL Editor.
--
-- 1. Add user_id to projects so each project belongs to a creator.
-- 2. Update RLS so only authenticated users can create projects.
--    Confirmed records remain publicly readable (for sharing).

-- Add user_id column (nullable so existing demo records don't break)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id);

COMMENT ON COLUMN public.projects.user_id IS
  'The authenticated user who created this project. Null for pre-auth demo records.';

-- ── RLS: insert ──────────────────────────────────────────────────────────────
-- Replace the old open demo policy with one that requires auth.
DROP POLICY IF EXISTS "projects_insert_demo" ON public.projects;

CREATE POLICY "projects_insert_auth"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── RLS: select ──────────────────────────────────────────────────────────────
-- Keep the existing open select policy so confirmed records remain shareable.
-- (Already exists as "projects_select_demo".)

-- ── RLS: update (confirm) ────────────────────────────────────────────────────
-- Allow authenticated project owners to update their own projects.
DROP POLICY IF EXISTS "projects_update_demo" ON public.projects;

CREATE POLICY "projects_update_owner"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
