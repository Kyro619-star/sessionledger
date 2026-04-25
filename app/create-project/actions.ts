"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function createProject(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    redirect("/create-project?error=missing-title");
  }

  const projectType = String(formData.get("type") ?? "song");
  const description =
    String(formData.get("description") ?? "").trim() || null;

  const ownerNameRaw = normalizeName(String(formData.get("ownerName") ?? ""));
  const otherCollaboratorsRaw = String(formData.get("collaborators") ?? "").trim();

  // Build the canonical, deduped participant list with the owner's name first.
  const others = otherCollaboratorsRaw
    ? otherCollaboratorsRaw
        .split(",")
        .map((s) => normalizeName(s))
        .filter(Boolean)
    : [];

  const seen = new Set<string>();
  const ordered: string[] = [];
  if (ownerNameRaw) {
    seen.add(ownerNameRaw.toLowerCase());
    ordered.push(ownerNameRaw);
  }
  for (const name of others) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(name);
  }

  const collaborators = ordered.length > 0 ? ordered.join(", ") : null;
  const ownerCollaboratorName = ownerNameRaw || null;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      project_type: projectType,
      description,
      collaborators,
      owner_collaborator_name: ownerCollaboratorName,
      user_id: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error(error);
    redirect("/create-project?error=save");
  }

  redirect(`/project/${data.id}`);
}
