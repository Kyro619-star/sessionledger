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
    .select("composition_split, master_split")
    .eq("project_id", projectId);

  if (splitsError) {
    console.error(splitsError);
    redirect(`/confirm/${projectId}?error=splits`);
  }

  const rows = splitsRaw ?? [];

  const compTotal = rows.reduce(
    (sum, s) => sum + Number(s.composition_split ?? 0),
    0,
  );
  const masterTotal = rows.reduce(
    (sum, s) => sum + Number(s.master_split ?? 0),
    0,
  );

  const splitsReady =
    Math.abs(Math.round(compTotal * 100) / 100 - 100) < 0.001 &&
    Math.abs(Math.round(masterTotal * 100) / 100 - 100) < 0.001;

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

