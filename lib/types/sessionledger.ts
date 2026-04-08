export type ProjectRow = {
  id: string;
  title: string;
  project_type: string;
  status: string;
  confirmed_at: string | null;
  description: string | null;
  collaborators: string | null;
  created_at: string;
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
  split_percentage: number;
  created_at: string;
  updated_at: string;
};
