import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContributionRow,
  ProjectRow,
  ProjectSplitRow,
} from "@/lib/types/sessionledger";

import { CopyRecordLinkButton } from "./copy-record-link";

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

function formatConfirmedAt(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("projects")
      .select("title")
      .eq("id", id)
      .maybeSingle();
    if (data?.title) {
      return { title: `Verified Project Record · ${data.title} · SessionLedger` };
    }
  } catch {
    /* missing env */
  }
  return { title: "Verified Project Record · SessionLedger" };
}

export default async function FinalRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  if (project.status !== "confirmed") {
    redirect(`/project/${id}`);
  }

  const { data: contributionsRaw } = await supabase
    .from("contributions")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

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
        <header className="max-w-2xl border-b border-neutral-200 pb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
            Verified Project Record
          </p>
          <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {project.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wider text-neutral-700">
              Confirmed
            </span>
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
              Confirmed project record (prototype)
            </span>
            <span className="text-neutral-500">Confirmed at</span>
            <span className="font-medium tabular-nums text-neutral-900">
              {formatConfirmedAt(project.confirmed_at)}
            </span>
          </div>
        </header>

        <div className="mt-10 flex max-w-2xl flex-col gap-8">
          <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
              Summary
            </h2>
            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Contributors
                </dt>
                <dd className="mt-1 text-base text-neutral-900">
                  {participants.length > 0
                    ? participants.join(", ")
                    : "None listed"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-neutral-500">
                  Contributions
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-neutral-700">
                  {contributions.length === 0 ? (
                    <p>No contributions were logged before confirmation.</p>
                  ) : (
                    <ul className="space-y-3">
                      {contributions.map((c) => (
                        <li key={c.id} className="text-sm">
                          <span className="text-neutral-900">
                            {c.contributor_name} —{" "}
                            {formatContributionType(c.contribution_type)}
                            {c.contribution_type === "other" &&
                            c.contribution_other ? (
                              <span className="text-neutral-500">
                                {" "}
                                ({c.contribution_other})
                              </span>
                            ) : null}
                          </span>
                          {c.notes ? (
                            <span className="mt-1 block text-neutral-600">
                              {c.notes}
                            </span>
                          ) : null}
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
                {splits.filter((s) => participants.includes(s.collaborator_name))
                  .length === 0 ? (
                  <dd className="mt-1 text-sm text-neutral-600">—</dd>
                ) : (
                  <dd className="mt-2 space-y-2">
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
          </section>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled
              className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-400"
              title="Not implemented yet"
            >
              Export PDF
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-600">
                Share this record with collaborators or a future client.
              </p>
              <CopyRecordLinkButton />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-neutral-500">
              Blockchain timestamp integration coming soon.
            </p>
          </div>

          <Link
            href="/"
            className="text-center text-sm font-medium text-neutral-700 underline-offset-4 hover:underline sm:text-left"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
