import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectRow } from "@/lib/types/sessionledger";

export const metadata: Metadata = {
  title: "Dashboard · SessionLedger",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Get logged-in user — redirect if not authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Fetch this user's projects, newest first
  const { data: projectsRaw } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const projects = (projectsRaw ?? []) as ProjectRow[];

  async function handleSignOut() {
    "use server";
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="border-b border-neutral-200/80 bg-neutral-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-tight text-neutral-900"
          >
            SessionLedger
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-neutral-500 sm:block">
              {user.email}
            </span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200/80 hover:text-neutral-900"
              >
                Sign out
              </button>
            </form>
            <Link
              href="/create-project"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
            >
              New project
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Your projects
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {projects.length === 0
                ? "No projects yet."
                : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="mb-4 text-sm text-neutral-600">
              You haven&apos;t started any projects yet.
            </p>
            <Link
              href="/create-project"
              className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:opacity-80"
            >
              Start your first project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={
                  project.status === "confirmed"
                    ? `/record/${project.id}`
                    : `/project/${project.id}`
                }
                className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    {project.project_type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      project.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {project.status === "confirmed" ? "Confirmed" : "Draft"}
                  </span>
                  {project.blockchain_tx_hash && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                      On-chain
                    </span>
                  )}
                </div>

                <h2 className="mb-2 text-base font-semibold leading-snug text-neutral-900 group-hover:text-black">
                  {project.title}
                </h2>

                {project.description ? (
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-neutral-500">
                    {project.description}
                  </p>
                ) : (
                  <div className="mb-4 flex-1" />
                )}

                <p className="mt-auto text-xs text-neutral-400">
                  Created {formatDate(project.created_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
