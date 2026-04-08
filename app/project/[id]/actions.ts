"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getCanonicalParticipants(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("projects")
    .select("collaborators")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("getCanonicalParticipants error", error);
    throw new Error("Could not load project collaborators");
  }

  const raw = String(data?.collaborators ?? "");
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(list));
}

export async function addContribution(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const participantName = String(
    formData.get("participantName") ?? "",
  ).trim();
  const contributionType = String(
    formData.get("contributionType") ?? "",
  ).trim();
  const contributionOther =
    String(formData.get("contributionOther") ?? "").trim() || null;
  const notes =
    String(formData.get("notes") ?? "").trim() || null;

  if (!projectId || !participantName || !contributionType) {
    throw new Error("Missing contribution fields");
  }

  if (contributionType === "other" && !contributionOther) {
    throw new Error("Missing other contribution detail");
  }

  const supabase = createSupabaseServerClient();
  const participants = await getCanonicalParticipants(supabase, projectId);
  if (!participants.includes(participantName)) {
    throw new Error("Participant not in collaborators list");
  }
  const { error } = await supabase.from("contributions").insert({
    project_id: projectId,
    contributor_name: participantName,
    contribution_type: contributionType,
    contribution_other: contributionOther,
    notes,
  });

  if (error) {
    console.error(error);
    throw new Error("Could not save contribution");
  }

  revalidatePath(`/project/${projectId}`);
}

export async function saveSplits(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const count = Number(formData.get("count") ?? 0);

  if (!projectId || !Number.isFinite(count) || count < 0) {
    throw new Error("Missing split fields");
  }

  const supabase = createSupabaseServerClient();
  const participants = await getCanonicalParticipants(supabase, projectId);
  const participantSet = new Set(participants);

  const splitMap = new Map<string, number>();
  for (let i = 0; i < count; i += 1) {
    const name = String(formData.get(`collaborator_${i}`) ?? "").trim();
    const percentRaw = String(formData.get(`percent_${i}`) ?? "").trim();
    if (!name) continue;
    if (!participantSet.has(name)) continue;
    const percent = Number(percentRaw);
    if (!Number.isFinite(percent)) continue;
    splitMap.set(name, percent);
  }

  const splits = Array.from(splitMap.entries()).map(
    ([collaborator_name, percent]) => ({
      collaborator_name,
      split_percentage: percent,
    }),
  );

  const total = splits.reduce((sum, s) => sum + s.split_percentage, 0);
  const rounded = Math.round(total * 100) / 100;
  const isValidTotal = Math.abs(rounded - 100) < 0.001;

  const { error: deleteError } = await supabase
    .from("project_splits")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) {
    console.error("saveSplits delete error", {
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
      code: deleteError.code,
    });
    console.error("saveSplits delete full error", deleteError);
    throw new Error("Could not reset splits");
  }

  if (splits.length > 0) {
    const { error: insertError } = await supabase.from("project_splits").insert(
      splits.map((s) => ({
        project_id: projectId,
        collaborator_name: s.collaborator_name,
        split_percentage: s.split_percentage,
      })),
    );

    if (insertError) {
      console.error("saveSplits insert error", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      console.error("saveSplits insert full error", insertError);
      throw new Error("Could not save splits");
    }
  }

  revalidatePath(`/project/${projectId}`);

  if (!isValidTotal) {
    // Save anyway, but inform the user they can't confirm yet.
    // Keeping it simple: return control to the page (no redirect) and let UI show totals.
    return;
  }
}
