"use client";

import { useState, useTransition } from "react";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200";

const labelClass = "mb-2 block text-sm font-medium text-neutral-700";

type Props = {
  /** When set with addContributionAction, submissions are saved via Server Action. */
  projectId?: string;
  addContributionAction?: (formData: FormData) => Promise<void>;
  participants?: string[];
};

export function AddContributionForm({
  projectId,
  addContributionAction,
  participants,
}: Props) {
  const persist = Boolean(projectId && addContributionAction);
  const canChooseParticipant = Boolean(participants && participants.length > 0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<string>("production");
  const [participant, setParticipant] = useState<string>(
    participants?.[0] ?? "",
  );

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
            setType("production");
            setParticipant(participants?.[0] ?? "");
            setSuccess(true);
            return;
          }

          const fd = new FormData(form);
          fd.set("projectId", projectId!);

          startTransition(async () => {
            try {
              await addContributionAction!(fd);
              form.reset();
              setType("production");
              setParticipant(participants?.[0] ?? "");
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
          <label htmlFor="participant" className={labelClass}>
            Participant
          </label>
          <select
            id="participant"
            name="participantName"
            value={participant}
            onChange={(e) => setParticipant(e.target.value)}
            required={persist}
            disabled={persist && !canChooseParticipant}
            className={`${inputClass} appearance-none disabled:cursor-not-allowed disabled:bg-neutral-50`}
          >
            {canChooseParticipant ? (
              participants!.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))
            ) : (
              <option value="">
                Add collaborators first to select a participant
              </option>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="contribution-type" className={labelClass}>
            Contribution Type
          </label>
          <select
            id="contribution-type"
            name="contributionType"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required={persist}
            className={`${inputClass} appearance-none`}
          >
            <option value="production">Production / Beat</option>
            <option value="topline">Topline / Melody</option>
            <option value="lyrics">Lyrics / Songwriting</option>
            <option value="vocals">Vocals / Performance</option>
            <option value="arrangement">Arrangement</option>
            <option value="mixing">Mixing</option>
            <option value="mastering">Mastering</option>
            <option value="session-instrument">Session Instrument</option>
            <option value="other">Other</option>
          </select>
        </div>

        {type === "other" ? (
          <div>
            <label htmlFor="contribution-other" className={labelClass}>
              Specify contribution
            </label>
            <input
              id="contribution-other"
              name="contributionOther"
              type="text"
              autoComplete="off"
              required={persist}
              placeholder="e.g. Sound design, editing, coaching..."
              className={inputClass}
            />
          </div>
        ) : null}

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
