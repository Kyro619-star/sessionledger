"use client";

import { useState, useTransition } from "react";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200";

const labelClass = "mb-2 block text-sm font-medium text-neutral-700";

type Props = {
  /** When set with addContributionAction, submissions are saved via Server Action. */
  projectId?: string;
  addContributionAction?: (formData: FormData) => Promise<void>;
};

export function AddContributionForm({
  projectId,
  addContributionAction,
}: Props) {
  const persist = Boolean(projectId && addContributionAction);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      {success ? (
        <p
          className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-900"
          role="status"
          aria-live="polite"
        >
          Contribution added
        </p>
      ) : null}
      {error ? (
        <p
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const form = e.currentTarget;

          if (!persist) {
            form.reset();
            setSuccess(true);
            return;
          }

          const fd = new FormData(form);
          fd.set("projectId", projectId!);

          startTransition(async () => {
            try {
              await addContributionAction!(fd);
              form.reset();
              setSuccess(true);
            } catch {
              setError(
                "Could not save this contribution. Check your Supabase setup and try again.",
              );
            }
          });
        }}
      >
        <div>
          <label htmlFor="contributor-name" className={labelClass}>
            Contributor Name
          </label>
          <input
            id="contributor-name"
            name="contributorName"
            type="text"
            autoComplete="off"
            required={persist}
            placeholder="Name as it should appear on the record"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contribution-type" className={labelClass}>
            Contribution Type
          </label>
          <select
            id="contribution-type"
            name="contributionType"
            defaultValue="topline"
            required={persist}
            className={`${inputClass} appearance-none`}
          >
            <option value="topline">topline</option>
            <option value="lyrics">lyrics</option>
            <option value="production">production</option>
            <option value="vocals">vocals</option>
            <option value="arrangement">arrangement</option>
            <option value="mix-edits">mix edits</option>
          </select>
        </div>

        <div>
          <label htmlFor="contribution-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="contribution-notes"
            name="notes"
            rows={4}
            placeholder="Session details, revisions, or context for this entry."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Adding…" : "Add Contribution"}
          </button>
        </div>
      </form>
    </div>
  );
}
