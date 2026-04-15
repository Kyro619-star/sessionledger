-- SessionLedger migration: split (c) composition and (p) master rights separately
-- Run in Supabase SQL Editor.
--
-- Background:
--   In music copyright there are two distinct ownership tracks:
--     (c) Composition / Publishing — the underlying song (melody + lyrics).
--         Generates PRO income (ASCAP / BMI), mechanical royalties, and
--         the publishing portion of sync fees.
--     (p) Master / Sound Recording — the specific recorded performance.
--         Generates streaming revenue, master-use sync fees, and label advances.
--   These are legally independent and often held by different parties.
--   A producer may own 0% of (c) but 50% of (p); a pure songwriter the reverse.
--
-- This migration adds dedicated columns for each split type so SessionLedger
-- can capture the real ownership picture instead of collapsing both into one %.

DO $$
BEGIN
  -- composition_split: the (c) publishing / songwriting share
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'project_splits'
      AND column_name  = 'composition_split'
  ) THEN
    ALTER TABLE public.project_splits
      ADD COLUMN composition_split numeric NOT NULL DEFAULT 0;

    ALTER TABLE public.project_splits
      ADD CONSTRAINT project_splits_comp_split_chk
        CHECK (composition_split >= 0 AND composition_split <= 100);
  END IF;

  -- master_split: the (p) sound recording / master share
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'project_splits'
      AND column_name  = 'master_split'
  ) THEN
    ALTER TABLE public.project_splits
      ADD COLUMN master_split numeric NOT NULL DEFAULT 0;

    ALTER TABLE public.project_splits
      ADD CONSTRAINT project_splits_master_split_chk
        CHECK (master_split >= 0 AND master_split <= 100);
  END IF;
END $$;

COMMENT ON COLUMN public.project_splits.composition_split IS
  '(c) Publishing / composition share (0–100). Must total 100 across all collaborators before a project can be confirmed.';

COMMENT ON COLUMN public.project_splits.master_split IS
  '(p) Master / sound-recording share (0–100). Must total 100 across all collaborators before a project can be confirmed.';
