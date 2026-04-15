import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AddContributionForm } from "@/components/add-contribution-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContributionRow,
  CosignInviteRow,
  ProjectRow,
  ProjectSplitRow,
} from "@/lib/types/sessionledger";

import { addContribution, saveSplits } from "./actions";
import { InviteSection } from "./invite-section";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  const { data: splitsRaw } = await supabase
    .from("project_splits")
    .select("*")
    .eq("project_id", id)
    .order("collaborator_name", { ascending: true });

  const splits = (splitsRaw ?? []) as ProjectSplitRow[];

  const { data: invitesRaw } = await supabase
    .from("cosign_invites")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const invites = (invitesRaw ?? []) as CosignInviteRow[];

  const isOwner = !!user && user.id === project.user_id;

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

  const isConfirmed = project.status === "confirmed";

  // (c) Composition / Publishing — who wrote the song
  const compTotal = splits.reduce(
    (sum, s) => sum + Number(s.composition_split ?? 0),
    0,
  );
  const compTotalRounded = Math.round(compTotal * 100) / 100;
  const compReady = Math.abs(compTotalRounded - 100) < 0.001;

  // (p) Master / Sound Recording — who owns the recording
  const masterTotal = splits.reduce(
    (sum, s) => sum + Number(s.master_split ?? 0),
    0,
  );
  const masterTotalRounded = Math.round(masterTotal * 100) / 100;
  const masterReady = Math.abs(masterTotalRounded - 100) < 0.001;

  // Both tracks must total 100% before the record can be confirmed
  const splitsReady = compReady && masterReady;

  // Co-sign gate: all generated invites must be confirmed before owner can finalize
  const pendingInvites = invites.filter((i) => i.status === "pending");
  const confirmedInvites = invites.filter((i) => i.status === "confirmed");
  const allCosigned = pendingInvites.length === 0 && confirmedInvites.length > 0;
  // Also allow confirm if no invites have been generated at all (solo project or owner skipped invites)
  const noInvitesGenerated = invites.length === 0;
  const cosignReady = noInvitesGenerated || allCosigned;

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link
          href={isOwner ? "/dashboard" : "/"}
          className="inline-block text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          {isOwner ? "← Dashboard" : "← SessionLedger"}
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
                {participants.length > 0
                  ? `${participants.length} ${
                      participants.length === 1 ? "participant" : "participants"
                    }`
                  : "None listed"}
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {participants.length === 0 ? (
                <p className="px-6 py-8 text-sm text-neutral-600">
                  No collaborators were added on the create form. You can edit
                  the project later when you add an update flow.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {participants.map((name) => (
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
                          {c.contribution_type === "other" &&
                          c.contribution_other ? (
                            <span className="text-neutral-500">
                              {" "}
                              ({c.contribution_other})
                            </span>
                          ) : null}
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

          {isOwner ? (
            <section>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">
                Add Contribution
              </h2>
              <AddContributionForm
                projectId={id}
                addContributionAction={addContribution}
                participants={participants}
              />
            </section>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-4">
              <p className="text-sm text-neutral-500">
                You are viewing this project as a collaborator. Only the project owner can edit contributions and splits.
              </p>
            </div>
          )}

          {isOwner && <section>
            <h2 className="mb-1 text-lg font-semibold tracking-tight">
              Credits and splits
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-neutral-500">
              Music copyright has two distinct ownership tracks. Set each
              independently — they don&apos;t have to match.
            </p>

            {participants.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-sm leading-relaxed text-neutral-600">
                  Add collaborators first to assign split percentages.
                </p>
              </div>
            ) : (
              <form action={saveSplits} className="space-y-8">
                <input type="hidden" name="projectId" value={id} />
                <input type="hidden" name="count" value={participants.length} />
                {participants.map((name, i) => (
                  <input
                    key={name}
                    type="hidden"
                    name={`collaborator_${i}`}
                    value={name}
                  />
                ))}

                {/* ── (c) Composition / Publishing ── */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-violet-700">
                      (c)
                    </span>
                    <h3 className="text-base font-semibold text-neutral-900">
                      Composition / Publishing
                    </h3>
                  </div>
                  <p className="mb-5 text-xs leading-relaxed text-neutral-500">
                    Covers the underlying song — melody and lyrics. Generates
                    PRO income (ASCAP / BMI), mechanical royalties, and the
                    publishing portion of sync licensing fees.
                  </p>

                  <div className="grid gap-3">
                    {participants.map((name, i) => {
                      const existing = splits.find(
                        (s) => s.collaborator_name === name,
                      );
                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
                        >
                          <p className="text-sm font-medium text-neutral-900">
                            {name}
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              name={`comp_${i}`}
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              max={100}
                              defaultValue={
                                typeof existing?.composition_split === "number"
                                  ? String(existing.composition_split)
                                  : ""
                              }
                              className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                              placeholder="0"
                            />
                            <span className="text-sm text-neutral-500">%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p
                      className={`text-xs font-medium ${
                        compReady
                          ? "text-emerald-600"
                          : compTotalRounded > 0
                            ? "text-amber-600"
                            : "text-neutral-400"
                      }`}
                    >
                      {compReady
                        ? "✓ Totals 100%"
                        : `Total: ${compTotalRounded}% — must reach 100%`}
                    </p>
                  </div>
                </div>

                {/* ── (p) Master / Sound Recording ── */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-sky-700">
                      (p)
                    </span>
                    <h3 className="text-base font-semibold text-neutral-900">
                      Master / Sound Recording
                    </h3>
                  </div>
                  <p className="mb-5 text-xs leading-relaxed text-neutral-500">
                    Covers the specific recorded performance. Generates
                    streaming revenue, master-use fees in sync deals, and is
                    the asset typically signed to a label or distributor.
                  </p>

                  <div className="grid gap-3">
                    {participants.map((name, i) => {
                      const existing = splits.find(
                        (s) => s.collaborator_name === name,
                      );
                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
                        >
                          <p className="text-sm font-medium text-neutral-900">
                            {name}
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              name={`master_${i}`}
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              max={100}
                              defaultValue={
                                typeof existing?.master_split === "number"
                                  ? String(existing.master_split)
                                  : ""
                              }
                              className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                              placeholder="0"
                            />
                            <span className="text-sm text-neutral-500">%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p
                      className={`text-xs font-medium ${
                        masterReady
                          ? "text-emerald-600"
                          : masterTotalRounded > 0
                            ? "text-amber-600"
                            : "text-neutral-400"
                      }`}
                    >
                      {masterReady
                        ? "✓ Totals 100%"
                        : `Total: ${masterTotalRounded}% — must reach 100%`}
                    </p>
                  </div>
                </div>

                {/* Status + save */}
                {!splitsReady && (compTotalRounded > 0 || masterTotalRounded > 0) ? (
                  <p className="text-sm text-neutral-600">
                    Both (c) and (p) tracks must each total{" "}
                    <span className="font-medium text-neutral-900">100%</span>{" "}
                    before you can confirm this record.
                  </p>
                ) : splitsReady ? (
                  <p className="text-sm text-emerald-700">
                    Both tracks total 100%. You’re ready to review and confirm.
                  </p>
                ) : null}

                <div className="pt-1">
                  <button
                    type="submit"
                    className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
                  >
                    Save splits
                  </button>
                </div>
              </form>
            )}
          </section>}

          {isOwner && (
            <InviteSection
              projectId={id}
              participants={participants}
              existingInvites={invites}
            />
          )}

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
            ) : isOwner ? (
              <>
                {!splitsReady && (
                  <p className="mb-3 text-sm text-neutral-500">
                    Both (c) and (p) splits must total 100%.
                  </p>
                )}
                {splitsReady && !cosignReady && (
                  <p className="mb-3 text-sm text-amber-700">
                    Waiting for collaborators to co-sign —{" "}
                    {confirmedInvites.length} of {invites.length} confirmed.
                  </p>
                )}
                {splitsReady && cosignReady && (
                  <p className="mb-3 text-sm text-emerald-700">
                    {noInvitesGenerated
                      ? "Splits are set. Ready to review and confirm."
                      : `All ${confirmedInvites.length} collaborators have co-signed. Ready to confirm.`}
                  </p>
                )}
                <form action={reviewAndConfirm}>
                  <input type="hidden" name="projectId" value={id} />
                  <button
                    type="submit"
                    disabled={!splitsReady || !cosignReady}
                    className="rounded-full bg-black px-10 py-3 text-sm font-medium text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Review and Confirm
                  </button>
                </form>
              </>
            ) : (
              <p className="text-sm text-neutral-500">
                Waiting for the project owner to finalize and confirm this record.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
