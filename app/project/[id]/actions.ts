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

  type SplitEntry = {
    collaborator_name: string;
    composition_split: number;
    master_split: number;
  };

  const splitMap = new Map<string, SplitEntry>();

  for (let i = 0; i < count; i += 1) {
    const name = String(formData.get(`collaborator_${i}`) ?? "").trim();
    if (!name || !participantSet.has(name)) continue;

    const compRaw = String(formData.get(`comp_${i}`) ?? "").trim();
    const masterRaw = String(formData.get(`master_${i}`) ?? "").trim();

    const comp = Number(compRaw);
    const master = Number(masterRaw);

    splitMap.set(name, {
      collaborator_name: name,
      composition_split: Number.isFinite(comp) ? comp : 0,
      master_split: Number.isFinite(master) ? master : 0,
    });
  }

  const splits = Array.from(splitMap.values());

  const compTotal = splits.reduce((sum, s) => sum + s.composition_split, 0);
  const masterTotal = splits.reduce((sum, s) => sum + s.master_split, 0);
  const compRounded = Math.round(compTotal * 100) / 100;
  const masterRounded = Math.round(masterTotal * 100) / 100;
  const isValidTotal =
    Math.abs(compRounded - 100) < 0.001 &&
    Math.abs(masterRounded - 100) < 0.001;

  const { error: deleteError } = await supabase
    .from("project_splits")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) {
    console.error("saveSplits delete error", deleteError);
    throw new Error("Could not reset splits");
  }

  if (splits.length > 0) {
    const { error: insertError } = await supabase.from("project_splits").insert(
      splits.map((s) => ({
        project_id: projectId,
        collaborator_name: s.collaborator_name,
        composition_split: s.composition_split,
        master_split: s.master_split,
      })),
    );

    if (insertError) {
      console.error("saveSplits insert error", insertError);
      throw new Error("Could not save splits");
    }
  }

  revalidatePath(`/project/${projectId}`);

  // Save regardless of total — the UI shows whether both tracks hit 100%.
  if (!isValidTotal) {
    return;
  }
}
