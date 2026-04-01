"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function addContribution(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const contributorName = String(
    formData.get("contributorName") ?? "",
  ).trim();
  const contributionType = String(
    formData.get("contributionType") ?? "",
  ).trim();
  const notes =
    String(formData.get("notes") ?? "").trim() || null;

  if (!projectId || !contributorName || !contributionType) {
    throw new Error("Missing contribution fields");
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("contributions").insert({
    project_id: projectId,
    contributor_name: contributorName,
    contribution_type: contributionType,
    notes,
  });

  if (error) {
    console.error(error);
    throw new Error("Could not save contribution");
  }

  revalidatePath(`/project/${projectId}`);
}
