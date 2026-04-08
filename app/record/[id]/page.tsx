import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContributionRow, ProjectRow } from "@/lib/types/sessionledger";

import { CopyRecordLinkButton } from "./copy-record-link";

function formatContributionType(value: string) {
  return value === "mix-edits" ? "mix edits" : value;
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

  const contributorNames = project.collaborators
    ? project.collaborators
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
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
              Co-signed by all collaborators
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
                  {contributorNames.length > 0
                    ? contributorNames.join(", ")
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
                  Credits and splits (demo)
                </dt>
                <dd className="mt-1 text-base tabular-nums text-neutral-900">
                  Kyro 40% · Alex 35% · Maya 25%
                </dd>
                <dd className="mt-2 text-xs leading-relaxed text-neutral-500">
                  Split percentages support verification, but they’re not the
                  core value — the co-signed record is.
                </dd>
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
