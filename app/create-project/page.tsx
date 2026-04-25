import Link from "next/link";
import type { Metadata } from "next";

import { createProject } from "./actions";
import { CollaboratorsTagsInput } from "./collaborators-tags";

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
            Start a professional record of what you’re building together — who
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
          <form className="space-y-6" action={createProject}>
            <div>
              <label
                htmlFor="project-title"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Project Title
              </label>
              <input
                id="project-title"
                name="title"
                type="text"
                autoComplete="off"
                placeholder="e.g. Summer demo sketch"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            <div>
              <label
                htmlFor="project-type"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Project Type
              </label>
              <select
                id="project-type"
                name="type"
                defaultValue="song"
                className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              >
                <option value="song">Song</option>
                <option value="beat">Beat</option>
                <option value="demo">Demo</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="What are you building together?"
                className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            <div>
              <label
                htmlFor="owner-name"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Your name
              </label>
              <input
                id="owner-name"
                name="ownerName"
                type="text"
                autoComplete="off"
                placeholder="The name to credit you under"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
              <p className="mt-2 text-sm text-neutral-500">
                You&apos;ll be added to the record automatically — no need to list
                yourself below.
              </p>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Other collaborators
              </label>
              <CollaboratorsTagsInput />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition hover:opacity-80"
              >
                Start record
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
