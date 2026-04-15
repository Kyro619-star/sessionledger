"use client";

import { useState, useTransition } from "react";
import { confirmCosign } from "./actions";

type Props = {
  token: string;
  collaboratorName: string;
};

export function ConfirmButton({ token, collaboratorName }: Props) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await confirmCosign(token);
        setDone(true);
      } catch (e) {
        setError("Something went wrong. Please try again.");
        console.error(e);
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <p className="text-sm font-semibold text-emerald-800">
          ✓ Co-signed successfully
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          Your confirmation as <strong>{collaboratorName}</strong> has been recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="w-full rounded-full bg-black py-3 text-sm font-medium text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Confirming…" : `Confirm as ${collaboratorName}`}
      </button>
    </div>
  );
}
