"use client";

import { useState, useTransition } from "react";

import { setOwnerCollaboratorName } from "./actions";

type Props = {
  projectId: string;
  participants: string[];
};

export function OwnerPicker({ projectId, participants }: Props) {
  const [isPending, startTransition] = useTransition();
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handlePick(name: string) {
    setError("");
    setPendingName(name);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("ownerName", name);

    startTransition(async () => {
      try {
        await setOwnerCollaboratorName(formData);
      } catch (e) {
        console.error(e);
        setError("Could not save. Try again.");
        setPendingName(null);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-amber-900">
        Which one is you?
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-amber-800">
        Pick your name from the list below. You won&apos;t need to invite
        yourself to co-sign — your signature comes from clicking &quot;Review and
        Confirm&quot; at the bottom of this page.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {participants.map((name) => {
          const isThisPending = pendingName === name && isPending;
          return (
            <button
              key={name}
              type="button"
              onClick={() => handlePick(name)}
              disabled={isPending}
              className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isThisPending ? "Saving…" : name}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700">{error}</p>
      )}
    </section>
  );
}
