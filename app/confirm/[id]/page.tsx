import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContributionRow,
  ProjectRow,
  ProjectSplitRow,
} from "@/lib/types/sessionledger";

import { ConfirmRecordSection } from "../confirm-record";
import { confirmProject } from "./actions";

export const metadata: Metadata = {
  title: "Review and Confirm · SessionLedger",
  description:
    "Final review of project summary before confirming the collaboration record.",
};

function formatContributionType(value: string) {
  const map: Record<string, string> = {
    production: "Production / Beat",
    topline: "Topline / Melody",
    lyrics: "Lyrics / Songwriting",
    vocals: "Vocals / Performance",
    arrangement: "Arrangement",
    mixing: "Mixing",
    mastering: "Mastering",
    "session-instrument": "Session Instrument",
    other: "Other",
  };
  return map[value] ?? value;
}

export default async function ConfirmProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const error = sp.error;

  const supabase = createSupabaseServerClient();

  const { data: projectRaw, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError || !projectRaw) {
    notFound();
  }

  const project = projectRaw as ProjectRow;

  if (project.status === "confirmed") {
    redirect(`/record/${id}`);
  }

  const { data: contributionsRaw } = await supabase
    .from("contributions")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(12);

  const contributions = (contributionsRaw ?? []) as ContributionRow[];

  const { data: splitsRaw } = await supabase
    .from("project_splits")
    .select("*")
    .eq("project_id", id)
    .order("collaborator_name", { ascending: true });

  const splits = (splitsRaw ?? []) as ProjectSplitRow[];
  const splitTotal = splits.reduce(
    (sum, s) => sum + Number(s.split_percentage ?? 0),
    0,
  );
  const splitTotalRounded = Math.round(splitTotal * 100) / 100;
  const splitsReady = Math.abs(splitTotalRounded - 100) < 0.001;

  const participants = project.collaborators
    ? Array.from(
        new Set(
          project.collaborators
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      )
    : [];

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link
          href={`/project/${id}`}
          className="inline-block text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          ← Back to project
        </Link>

        <header className="mt-10 max-w-2xl">
          <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Review and sign this record
          </h1>
          <p className="text-lg leading-8 text-neutral-600">
            Take one last look at the roles, credits, and splits. When everyone
            confirms the same record, it becomes a verified project record that
            supports verification over time.
          </p>
        </header>

        {error ? (
          <div
            className="mt-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {error === "splits_total"
              ? "Splits must total 100% before you can confirm."
              : "Could not confirm this record. Please try again."}
          </div>
        ) : null}

        <div className="mt-10 flex max-w-2xl flex-col gap-10">
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
              Summary
            </h2>

            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Project title
                </dt>
                <dd className="mt-1 text-base font-semibold text-neutral-900">
                  {project.title}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-neutral-500">Status</dt>
                <dd className="mt-1 text-base text-neutral-900">
                  {project.status === "confirmed" ? "Confirmed" : "Draft"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Contributors
                </dt>
                <dd className="mt-1 text-base text-neutral-900">
                  {participants.length > 0
                    ? participants.join(", ")
                    : "None listed yet"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Contributions summary
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-neutral-700">
                  {contributions.length === 0 ? (
                    <p>No contributions logged yet.</p>
                  ) : (
                    <ul className="list-inside list-disc space-y-1.5">
                      {contributions.map((c) => (
                        <li key={c.id}>
                          {c.contributor_name} —{" "}
                          {formatContributionType(c.contribution_type)}
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Credits and splits
                </dt>
                {splits.length === 0 ? (
                  <dd className="mt-1 text-sm text-neutral-600">
                    No splits saved yet. Go back and set splits to total 100%.
                  </dd>
                ) : (
                  <dd className="mt-1 space-y-2">
                    <div className="text-sm font-medium text-neutral-900">
                      Total {splitTotalRounded}%
                    </div>
                    <ul className="space-y-1.5 text-sm text-neutral-700">
                      {splits
                        .filter((s) => participants.includes(s.collaborator_name))
                        .map((s) => (
                        <li key={s.id} className="flex justify-between gap-4">
                          <span className="font-medium text-neutral-900">
                            {s.collaborator_name}
                          </span>
                          <span className="tabular-nums text-neutral-600">
                            {Number(s.split_percentage)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                )}
              </div>
            </dl>
          </div>

          <ConfirmRecordSection
            confirmed={project.status === "confirmed"}
            confirmAction={confirmProject}
            projectId={id}
            canConfirm={splitsReady}
          />
        </div>
      </div>
    </main>
  );
}

