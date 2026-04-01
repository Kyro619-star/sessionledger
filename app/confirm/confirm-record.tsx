"use client";

import { useState } from "react";

type Props = {
  confirmed?: boolean;
  projectId: string;
  confirmAction: (formData: FormData) => Promise<void>;
};

export function ConfirmRecordSection({
  confirmed: confirmedProp,
  projectId,
  confirmAction,
}: Props) {
  const [acknowledged, setAcknowledged] = useState(false);
  const confirmed = Boolean(confirmedProp);

  if (confirmed) {
    return (
      <div
        className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-10 text-center shadow-sm"
        role="status"
        aria-live="polite"
      >
        <p className="text-base font-medium text-neutral-900">
          Record confirmed. Ready for future verification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <label className="flex cursor-pointer gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-200"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        <span className="text-sm leading-relaxed text-neutral-700">
          I acknowledge that this summary reflects our collaboration on this
          session and that all named contributors have had a chance to review
          it.
        </span>
      </label>

      <div className="flex justify-center pt-1">
        <form action={confirmAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="submit"
            disabled={!acknowledged}
            className="rounded-full bg-black px-10 py-3 text-sm font-medium text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm Record
          </button>
        </form>
      </div>
    </div>
  );
}
