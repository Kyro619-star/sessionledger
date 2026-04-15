-- SessionLedger migration: co-sign token invites
-- Run in Supabase SQL Editor.
--
-- Each row represents one collaborator's invitation to co-sign a project.
-- The owner generates a token; the collaborator opens /cosign/<token> and confirms.

CREATE TABLE IF NOT EXISTS public.cosign_invites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  collaborator_name text NOT NULL,          -- must match a name in projects.collaborators
  token          uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  confirmed_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cosign_invites_project_id_idx ON public.cosign_invites (project_id);
CREATE INDEX IF NOT EXISTS cosign_invites_token_idx      ON public.cosign_invites (token);

-- RLS
ALTER TABLE public.cosign_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can read an invite by token (needed for the public /cosign/[token] page)
CREATE POLICY "cosign_invites_select_by_token"
  ON public.cosign_invites FOR SELECT
  USING (true);

-- Only the project owner (authenticated) can create invites
CREATE POLICY "cosign_invites_insert_owner"
  ON public.cosign_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Anyone can confirm an invite (update status) — gated by knowing the token
CREATE POLICY "cosign_invites_update_confirm"
  ON public.cosign_invites FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (status = 'confirmed');
