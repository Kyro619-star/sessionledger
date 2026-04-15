import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CosignInviteRow, ProjectRow, ContributionRow, ProjectSplitRow } from "@/lib/types/sessionledger";

import { ConfirmButton } from "./confirm-button";

export const metadata: Metadata = {
  title: "Co-sign Record · SessionLedger",
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

export default async function CosignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();

  // Load invite by token
  const { data: inviteRaw } = await supabase
    .from("cosign_invites")
    .select("*")
    .eq("token", token)
    .single();

  if (!inviteRaw) notFound();

  const invite = inviteRaw as CosignInviteRow;

  // Load project
  const { data: projectRaw } = await supabase
    .from("projects")
    .select("*")
    .eq("id", invite.project_id)
    .single();

  if (!projectRaw) notFound();

  const project = projectRaw as ProjectRow;

  // Load contributions
  const { data: contributionsRaw } = await supabase
    .from("contributions")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const contributions = (contributionsRaw ?? []) as ContributionRow[];

  // Load splits
  const { data: splitsRaw } = await supabase
    .from("project_splits")
    .select("*")
    .eq("project_id", project.id)
    .order("collaborator_name", { ascending: true });

  const splits = (splitsRaw ?? []) as ProjectSplitRow[];

  const participants = project.collaborators
    ? Array.from(new Set(project.collaborators.split(",").map((s) => s.trim()).filter(Boolean)))
    : [];

  const alreadyConfirmed = invite.status === "confirmed";

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <Link
          href="/"
          className="mb-10 inline-block text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          ← SessionLedger
        </Link>

        {alreadyConfirmed ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
            <p className="mb-2 text-base font-semibold text-emerald-800">
              You already co-signed this record
            </p>
            <p className="text-sm leading-relaxed text-emerald-700">
              Your confirmation for <strong>{project.title}</strong> has been recorded.
            </p>
          </div>
        ) : (
          <>
            <header className="mb-8">
              <p className="mb-2 text-sm font-medium text-neutral-500">
                Co-sign request for{" "}
                <span className="font-semibold text-neutral-700">
                  {invite.collaborator_name}
                </span>
              </p>
              <h1 className="mb-3 text-3xl font-semibold tracking-tight">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-base leading-7 text-neutral-600">
                  {project.description}
                </p>
              )}
            </header>

            {/* Summary */}
            <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Contributors
                </p>
                <p className="text-sm text-neutral-800">
                  {participants.length > 0 ? participants.join(", ") : "—"}
                </p>
              </div>

              {contributions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Contributions
                  </p>
                  <ul className="space-y-1 text-sm text-neutral-700">
                    {contributions.map((c) => (
                      <li key={c.id}>
                        <span className="font-medium text-neutral-900">{c.contributor_name}</span>
                        {" — "}
                        {formatContributionType(c.contribution_type)}
                        {c.contribution_type === "other" && c.contribution_other
                          ? ` (${c.contribution_other})`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {splits.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Splits
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-700">(c)</span>
                        Composition / Publishing
                      </p>
                      <ul className="space-y-1 text-sm text-neutral-700">
                        {splits.filter((s) => participants.includes(s.collaborator_name)).map((s) => (
                          <li key={s.id} className="flex justify-between">
                            <span>{s.collaborator_name}</span>
                            <span className="tabular-nums">{Number(s.composition_split ?? 0)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700">(p)</span>
                        Master / Sound Recording
                      </p>
                      <ul className="space-y-1 text-sm text-neutral-700">
                        {splits.filter((s) => participants.includes(s.collaborator_name)).map((s) => (
                          <li key={s.id} className="flex justify-between">
                            <span>{s.collaborator_name}</span>
                            <span className="tabular-nums">{Number(s.master_split ?? 0)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="mb-1 text-base font-semibold text-neutral-900">
                Confirm your co-signature
              </p>
              <p className="mb-6 text-sm leading-relaxed text-neutral-500">
                By confirming, you agree that the information above accurately reflects your contributions and the agreed splits for <strong>{project.title}</strong>.
              </p>
              <ConfirmButton token={token} collaboratorName={invite.collaborator_name} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
