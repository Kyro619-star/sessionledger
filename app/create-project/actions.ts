"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    redirect("/create-project?error=missing-title");
  }

  const projectType = String(formData.get("type") ?? "song");
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const collaborators =
    String(formData.get("collaborators") ?? "").trim() || null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      project_type: projectType,
      description,
      collaborators,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error(error);
    redirect("/create-project?error=save");
  }

  redirect(`/project/${data.id}`);
}
