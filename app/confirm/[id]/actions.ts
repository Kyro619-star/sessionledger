"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function confirmProject(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) {
    redirect("/confirm?error=missing-project");
  }

  const supabase = createSupabaseServerClient();
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

