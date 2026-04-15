export type ProjectRow = {
  id: string;
  title: string;
  project_type: string;
  status: string;
  confirmed_at: string | null;
  description: string | null;
  collaborators: string | null;
  created_at: string;
  /** Ethereum transaction hash if this record has been anchored on-chain. */
  blockchain_tx_hash: string | null;
  /** EVM chain ID of the anchor transaction (11155111 = Sepolia testnet). */
  blockchain_chain_id: number | null;
  /** Timestamp of when the on-chain anchor was written. */
  blockchain_anchored_at: string | null;
};

export type ContributionRow = {
  id: string;
  project_id: string;
  contributor_name: string;
  contribution_type: string;
  contribution_other: string | null;
  notes: string | null;
  created_at: string;
};

export type ProjectSplitRow = {
  id: string;
  project_id: string;
  collaborator_name: string;
  /** @deprecated Legacy single-percentage field. Use composition_split and master_split. */
  split_percentage: number;
  /** (c) Publishing / composition share — must total 100 across all collaborators. */
  composition_split: number;
  /** (p) Master / sound-recording share — must total 100 across all collaborators. */
  master_split: number;
  created_at: string;
  updated_at: string;
};
