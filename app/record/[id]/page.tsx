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
import { AnchorToBlockchain } from "./anchor-blockchain";
import type { RecordData } from "./anchor-blockchain";

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

  const compTotal = splits.reduce(
    (sum, s) => sum + Number(s.composition_split ?? 0),
    0,
  );
  const compTotalRounded = Math.round(compTotal * 100) / 100;

  const masterTotal = splits.reduce(
    (sum, s) => sum + Number(s.master_split ?? 0),
    0,
  );
  const masterTotalRounded = Math.round(masterTotal * 100) / 100;

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

  // Build the canonical record object passed to the blockchain anchor component
  const visibleSplits = splits.filter((s) =>
    participants.includes(s.collaborator_name),
  );
  const recordData: RecordData = {
    projectId: project.id,
    title: project.title,
    confirmedAt: project.confirmed_at,
    collaborators: participants,
    compositionSplits: visibleSplits.map((s) => ({
      name: s.collaborator_name,
      percent: Number(s.composition_split ?? 0),
    })),
    masterSplits: visibleSplits.map((s) => ({
      name: s.collaborator_name,
      percent: Number(s.master_split ?? 0),
    })),
  };

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
                  <dd className="mt-3 space-y-5">

                    {/* (c) Composition / Publishing */}
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                          (c)
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Composition / Publishing
                        </span>
                        <span className="ml-auto text-xs tabular-nums text-neutral-400">
                          {compTotalRounded}% total
                        </span>
                      </div>
                      <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-neutral-50 text-sm">
                        {splits
                          .filter((s) => participants.includes(s.collaborator_name))
                          .map((s) => (
                          <li
                            key={`c-${s.id}`}
                            className="flex items-center justify-between gap-4 px-4 py-2.5"
                          >
                            <span className="font-medium text-neutral-900">
                              {s.collaborator_name}
                            </span>
                            <span className="tabular-nums text-neutral-600">
                              {Number(s.composition_split ?? 0)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-xs text-neutral-400">
                        Covers PRO income (ASCAP / BMI), mechanicals, and
                        publishing sync fees.
                      </p>
                    </div>

                    {/* (p) Master / Sound Recording */}
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          (p)
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Master / Sound Recording
                        </span>
                        <span className="ml-auto text-xs tabular-nums text-neutral-400">
                          {masterTotalRounded}% total
                        </span>
                      </div>
                      <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-neutral-50 text-sm">
                        {splits
                          .filter((s) => participants.includes(s.collaborator_name))
                          .map((s) => (
                          <li
                            key={`p-${s.id}`}
                            className="flex items-center justify-between gap-4 px-4 py-2.5"
                          >
                            <span className="font-medium text-neutral-900">
                              {s.collaborator_name}
                            </span>
                            <span className="tabular-nums text-neutral-600">
                              {Number(s.master_split ?? 0)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-xs text-neutral-400">
                        Covers streaming revenue, master-use sync fees, and
                        label or distributor agreements.
                      </p>
                    </div>

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
          </div>

          <AnchorToBlockchain
            recordData={recordData}
            existingTxHash={project.blockchain_tx_hash}
          />

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
