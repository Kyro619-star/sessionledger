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
  notes: string | null;
  created_at: string;
};
