-- SessionLedger migration: track which collaborator name belongs to the project owner
-- Run in Supabase SQL Editor.
--
-- The cosign flow needs to distinguish the owner from other collaborators so the
-- owner is not asked to invite (and co-sign) themselves. The owner's signature
-- is captured implicitly when they click "Review and Confirm".
--
-- New projects fill this in at creation time. Legacy projects show an inline
-- picker on the project page; owner clicks their name once and it persists here.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS owner_collaborator_name text;
