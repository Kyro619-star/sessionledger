"use client";

import { useMemo, useState, useTransition } from "react";
import type { CosignInviteRow } from "@/lib/types/sessionledger";
import { createCosignInvite } from "./invite-actions";

type Props = {
  projectId: string;
  /** Collaborators who need to co-sign — this should already exclude the owner. */
  cosigners: string[];
  existingInvites: CosignInviteRow[];
};

export function InviteSection({ projectId, cosigners, existingInvites }: Props) {
  const [isPending, startTransition] = useTransition();
  // Optimistic tokens we just generated client-side; merged on top of server state.
  const [optimisticTokens, setOptimisticTokens] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  // Derive directly from server props so the UI follows the latest revalidation.
  const tokensFromServer = useMemo(() => {
    return Object.fromEntries(
      existingInvites
        .filter((i) => i.status === "pending")
        .map((i) => [i.collaborator_name, i.token]),
    );
  }, [existingInvites]);

  const confirmedNames = useMemo(() => {
    return new Set(
      existingInvites
        .filter((i) => i.status === "confirmed")
        .map((i) => i.collaborator_name),
    );
  }, [existingInvites]);

  // Optimistic tokens win for newly generated links; otherwise fall back to server state.
  const tokens: Record<string, string> = { ...tokensFromServer, ...optimisticTokens };

  function getLink(token: string) {
    return `${window.location.origin}/cosign/${token}`;
  }

  async function handleGenerate(name: string) {
    setGenerating(name);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("collaboratorName", name);

    startTransition(async () => {
      try {
        const token = await createCosignInvite(formData);
        setOptimisticTokens((prev) => ({ ...prev, [name]: token }));
      } catch (e) {
        console.error(e);
      } finally {
        setGenerating(null);
      }
    });
  }

  async function handleCopy(name: string, token: string) {
    try {
      await navigator.clipboard.writeText(getLink(token));
      setCopied(name);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
    }
  }

  if (cosigners.length === 0) {
    return (
      <section>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">
          Collaborator co-signatures
        </h2>
        <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-600 shadow-sm">
          No other collaborators on this record. You can confirm whenever
          splits are ready.
        </p>
      </section>
    );
  }

  const confirmedCount = cosigners.filter((n) => confirmedNames.has(n)).length;
  const totalCount = cosigners.length;

  return (
    <section>
      <div className="mb-1 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Collaborator co-signatures
        </h2>
        <span className={`text-xs font-medium ${confirmedCount === totalCount ? "text-emerald-600" : "text-neutral-500"}`}>
          {confirmedCount} / {totalCount} signed
        </span>
      </div>
      <p className="mb-2 text-sm leading-relaxed text-neutral-500">
        Each collaborator needs to co-sign before you can confirm the final record.
        Generate a unique link for each person and send it to them directly.
      </p>
      <p className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
        💡 <strong>You don&apos;t need to invite yourself.</strong> Your signature
        comes from clicking &quot;Review and Confirm&quot; at the bottom of this page.
      </p>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <ul className="divide-y divide-neutral-100">
          {cosigners.map((name) => {
            const token = tokens[name];
            const isConfirmed = confirmedNames.has(name);
            const isGenerating = generating === name && isPending;

            return (
              <li key={name} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-700">
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{name}</p>
                    {isConfirmed && (
                      <p className="text-xs font-medium text-emerald-600">✓ Co-signed</p>
                    )}
                    {!isConfirmed && token && (
                      <p className="text-xs text-neutral-400">Link sent — waiting for confirmation</p>
                    )}
                    {!isConfirmed && !token && (
                      <p className="text-xs text-neutral-400">No invite generated yet</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-12 sm:pl-0">
                  {isConfirmed ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      ✓ Confirmed
                    </span>
                  ) : token ? (
                    <>
                      <button
                        onClick={() => handleCopy(name, token)}
                        className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                      >
                        {copied === name ? "✓ Copied!" : "Copy link"}
                      </button>
                      <button
                        onClick={() => handleGenerate(name)}
                        disabled={isGenerating}
                        className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-400 transition hover:text-neutral-700 disabled:opacity-40"
                      >
                        Regenerate
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleGenerate(name)}
                      disabled={isGenerating}
                      className="rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-80 disabled:opacity-40"
                    >
                      {isGenerating ? "Generating…" : "Generate link"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
