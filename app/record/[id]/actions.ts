"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Persists the blockchain anchor details to the projects table
 * after the client-side transaction has been confirmed on-chain.
 */
export async function saveBlockchainAnchor(
  projectId: string,
  txHash: string,
  chainId: number,
) {
  if (!projectId || !txHash) {
    throw new Error("Missing projectId or txHash");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("projects")
    .update({
      blockchain_tx_hash: txHash,
      blockchain_chain_id: chainId,
      blockchain_anchored_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    console.error("saveBlockchainAnchor error", error);
    throw new Error("Could not save blockchain anchor");
  }

  revalidatePath(`/record/${projectId}`);
}
