"use client";

import { useState, useTransition } from "react";
import type { CosignInviteRow } from "@/lib/types/sessionledger";
import { createCosignInvite } from "./invite-actions";

type Props = {
  projectId: string;
  participants: string[];
  existingInvites: CosignInviteRow[];
};

export function InviteSection({ projectId, participants, existingInvites }: Props) {
  const [isPending, startTransition] = useTransition();
  const [invites, setInvites] = useState<Record<string, string>>(
    () => Object.fromEntries(
      existingInvites
        .filter((i) => i.status === "pending")
        .map((i) => [i.collaborator_name, i.token])
    )
  );
  const [confirmedNames, setConfirmedNames] = useState<Set<string>>(
    () => new Set(existingInvites.filter((i) => i.status === "confirmed").map((i) => i.collaborator_name))
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

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
        setInvites((prev) => ({ ...prev, [name]: token }));
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

  if (participants.length === 0) return null;

  const confirmedCount = confirmedNames.size;
  const totalCount = participants.length;

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
        💡 <strong>You don't need to invite yourself.</strong> Your signature comes from clicking "Review and Confirm" at the bottom of this page.
      </p>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <ul className="divide-y divide-neutral-100">
          {participants.map((name) => {
            const token = invites[name];
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
