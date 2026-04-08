import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AddContributionForm } from "@/components/add-contribution-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContributionRow, ProjectRow } from "@/lib/types/sessionledger";

import { addContribution } from "./actions";

async function reviewAndConfirm(formData: FormData) {
  "use server";
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) {
    redirect("/confirm");
  }
  redirect(`/confirm/${projectId}`);
}

function formatProjectType(value: string) {
  const map: Record<string, string> = {
    song: "Song",
    beat: "Beat",
    demo: "Demo",
    other: "Other",
  };
  return map[value] ?? value;
}

function formatContributionType(value: string) {
  return value === "mix-edits" ? "mix edits" : value;
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
      return { title: `${data.title} · SessionLedger` };
    }
  } catch {
    /* missing env during local preview of metadata */
  }
  return { title: "Project · SessionLedger" };
}

export default async function ProjectPage({
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

  const { data: contributionsRaw } = await supabase
    .from("contributions")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const contributions = (contributionsRaw ?? []) as ContributionRow[];

  const collaboratorNames = project.collaborators
    ? project.collaborators
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const isConfirmed = project.status === "confirmed";

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link
          href="/"
          className="inline-block text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          ← Back to home
        </Link>

        <header className="mt-10 max-w-3xl border-b border-neutral-200 pb-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
              {formatProjectType(project.project_type)}
            </span>
            <span className="text-xs text-neutral-500">
              {project.status === "confirmed" ? "Confirmed" : "Draft"}
            </span>
          </div>
          <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {project.title}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-neutral-600">
            {project.description?.trim()
              ? project.description
              : "No description yet — add context from the studio when you edit this project later."}
          </p>
        </header>

        <div className="mt-12 flex max-w-3xl flex-col gap-10">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Contributors
              </h2>
              <span className="text-xs font-medium text-neutral-500">
                {collaboratorNames.length > 0
                  ? `${collaboratorNames.length} ${
                      collaboratorNames.length === 1 ? "person" : "people"
                    }`
                  : "None listed"}
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {collaboratorNames.length === 0 ? (
                <p className="px-6 py-8 text-sm text-neutral-600">
                  No collaborators were added on the create form. You can edit
                  the project later when you add an update flow.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {collaboratorNames.map((name) => (
                    <li
                      key={name}
                      className="flex items-start gap-4 px-5 py-4 sm:px-6"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-700"
                        aria-hidden
                      >
                        {name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="font-medium text-neutral-900">{name}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Contributions
              </h2>
              <span className="text-xs font-medium text-neutral-500">
                {contributions.length} logged
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {contributions.length === 0 ? (
                <p className="px-6 py-8 text-sm text-neutral-600">
                  No contributions yet. Use the form below to log the first one.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {contributions.map((c) => (
                    <li key={c.id} className="px-5 py-4 sm:px-6">
                      <p className="font-medium text-neutral-900">
                        {c.contributor_name}{" "}
                        <span className="font-normal text-neutral-500">·</span>{" "}
                        <span className="text-neutral-700">
                          {formatContributionType(c.contribution_type)}
                        </span>
                      </p>
                      {c.notes ? (
                        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                          {c.notes}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight">
              Add Contribution
            </h2>
            <AddContributionForm
              projectId={id}
              addContributionAction={addContribution}
            />
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Credits and splits
              </h2>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm leading-relaxed text-neutral-600">
                Credits and split percentages are supporting details. The core
                artifact is the{" "}
                <span className="font-medium text-neutral-800">
                  verified, co-signed record
                </span>
                . Splits aren’t stored in the database yet; you can add a
                dedicated table in the next iteration.
              </p>
            </div>
          </section>

          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 p-8 text-center">
            {isConfirmed ? (
              <>
                <p className="mb-6 text-sm text-neutral-600">
                  This project has a confirmed collaboration record.
                </p>
                <Link
                  href={`/record/${id}`}
                  className="inline-block rounded-full bg-black px-10 py-3 text-sm font-medium text-white transition hover:opacity-80"
                >
                  View Final Record
                </Link>
              </>
            ) : (
              <>
                <p className="mb-6 text-sm text-neutral-600">
                  When contributions look right, continue to review and confirm
                  the record.
                </p>
                <form action={reviewAndConfirm}>
                  <input type="hidden" name="projectId" value={id} />
                  <button
                    type="submit"
                    className="rounded-full bg-black px-10 py-3 text-sm font-medium text-white transition hover:opacity-80"
                  >
                    Review and Confirm
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
