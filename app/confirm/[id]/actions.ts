"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function confirmProject(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) {
    redirect("/confirm?error=missing-project");
  }

  const supabase = createSupabaseServerClient();

  const { data: splitsRaw, error: splitsError } = await supabase
    .from("project_splits")
    .select("split_percentage")
    .eq("project_id", projectId);

  if (splitsError) {
    console.error(splitsError);
    redirect(`/confirm/${projectId}?error=splits`);
  }

  const total = (splitsRaw ?? []).reduce(
    (sum, s) => sum + Number(s.split_percentage ?? 0),
    0,
  );
  const rounded = Math.round(total * 100) / 100;
  const splitsReady = Math.abs(rounded - 100) < 0.001;
  if (!splitsReady) {
    redirect(`/confirm/${projectId}?error=splits_total`);
  }

  const confirmedAt = new Date().toISOString();
  const { error } = await supabase
    .from("projects")
    .update({ status: "confirmed", confirmed_at: confirmedAt })
    .eq("id", projectId);

  if (error) {
    console.error(error);
    redirect(`/confirm/${projectId}?error=save`);
  }

  redirect(`/record/${projectId}`);
}

