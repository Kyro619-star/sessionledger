"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function confirmCosign(token: string) {
  const supabase = await createSupabaseServerClient();

  const { data: invite, error: fetchError } = await supabase
    .from("cosign_invites")
    .select("id, status, project_id")
    .eq("token", token)
    .single();

  if (fetchError || !invite) {
    throw new Error("Invite not found");
  }

  if (invite.status === "confirmed") {
    return { alreadyConfirmed: true };
  }

  const { error } = await supabase
    .from("cosign_invites")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("token", token)
    .eq("status", "pending");

  if (error) {
    console.error(error);
    throw new Error("Could not confirm co-sign");
  }

  // Bust the project page cache so the owner sees the updated state.
  revalidatePath(`/project/${invite.project_id}`);
  revalidatePath(`/cosign/${token}`);

  return { alreadyConfirmed: false };
}
