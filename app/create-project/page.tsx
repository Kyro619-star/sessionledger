import Link from "next/link";
import type { Metadata } from "next";

import { CreateProjectForm } from "./create-project-form";

export const metadata: Metadata = {
  title: "Start a new project record · SessionLedger",
  description:
    "Start a verified project record for independent music collaborators.",
};

export default async function CreateProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link
          href="/"
          className="inline-block text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          ← Back to home
        </Link>

        <div className="mt-10 max-w-2xl">
          <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Start a new project record
          </h1>
          <p className="text-lg leading-8 text-neutral-600">
            Start a professional record of what you&rsquo;re building together — who
            contributed, what was created, and what everyone confirmed.
          </p>
        </div>

        {error ? (
          <div
            className="mt-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {error === "missing-title"
              ? "Please enter a project title."
              : error === "save"
                ? "Could not save the project. Check Supabase keys, RLS policies, and try again."
                : "Something went wrong. Try again."}
          </div>
        ) : null}

        <div className="mt-10 max-w-2xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <CreateProjectForm />
        </div>
      </div>
    </main>
  );
}
