-- SessionLedger migration: blockchain anchor fields on projects
-- Run in Supabase SQL Editor.
--
-- When a confirmed project record is anchored to a blockchain, we store:
--   blockchain_tx_hash      — the transaction hash (proof of anchoring)
--   blockchain_chain_id     — the EVM chain ID (11155111 = Ethereum Sepolia testnet)
--   blockchain_anchored_at  — timestamp of when the anchor was written

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS blockchain_tx_hash      text,
  ADD COLUMN IF NOT EXISTS blockchain_chain_id     integer,
  ADD COLUMN IF NOT EXISTS blockchain_anchored_at  timestamptz;

COMMENT ON COLUMN public.projects.blockchain_tx_hash IS
  'Ethereum transaction hash of the on-chain record anchor (null = not yet anchored).';

COMMENT ON COLUMN public.projects.blockchain_chain_id IS
  'EVM chain ID where the anchor transaction was submitted (11155111 = Sepolia testnet).';

COMMENT ON COLUMN public.projects.blockchain_anchored_at IS
  'Timestamp when the blockchain anchor was written.';
