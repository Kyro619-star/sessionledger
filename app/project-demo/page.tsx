import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AddContributionForm } from "@/components/add-contribution-form";

async function reviewAndConfirm() {
  "use server";
  redirect("/confirm");
}

export const metadata: Metadata = {
  title: "From session to verified record · SessionLedger",
  description:
    "A quick walkthrough of how a session becomes a co-signed, timestamped verified record.",
};

const contributors = [
  { name: "Kyro", roles: "topline, lyrics" },
  { name: "Alex", roles: "production, arrangement" },
  { name: "Maya", roles: "vocals" },
] as const;

const splits = [
  { name: "Kyro", percent: 40, barClass: "bg-neutral-900" },
  { name: "Alex", percent: 35, barClass: "bg-neutral-500" },
  { name: "Maya", percent: 25, barClass: "bg-neutral-400" },
] as const;

export default function ProjectDemoPage() {
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
              Song
            </span>
            <span className="text-xs text-neutral-500">Walkthrough</span>
          </div>
          <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            From session to verified record
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-neutral-600">
            A simple demo flow showing how independent music collaborators turn
            a working session into a co-signed record that supports verification
            and becomes part of a long-term creative profile.
          </p>
        </header>

        <div className="mt-12 flex max-w-3xl flex-col gap-10">
          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight">
              Demo steps
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Step 1
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  Start a project
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Step 2
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  Add collaborators and contributions
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Step 3
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  Align on credits and splits
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Step 4
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  All collaborators confirm the record
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Step 5
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  The confirmed record becomes part of your creative profile
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Contributors
              </h2>
              <span className="text-xs font-medium text-neutral-500">
                3 collaborators
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <ul className="divide-y divide-neutral-100">
                {contributors.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-start gap-4 px-5 py-4 sm:px-6"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-700"
                      aria-hidden
                    >
                      {c.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="font-medium text-neutral-900">{c.name}</p>
                      <p className="mt-0.5 text-sm text-neutral-600">{c.roles}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight">
              Add Contribution
            </h2>
            <AddContributionForm participants={contributors.map((c) => c.name)} />
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Credits and splits
              </h2>
              <span className="text-xs font-medium text-neutral-500">
                Totals 100%
              </span>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="flex h-full w-full">
                  <div
                    className="h-full bg-neutral-900"
                    style={{ width: "40%" }}
                    title="Kyro 40%"
                  />
                  <div
                    className="h-full bg-neutral-500"
                    style={{ width: "35%" }}
                    title="Alex 35%"
                  />
                  <div
                    className="h-full bg-neutral-400"
                    style={{ width: "25%" }}
                    title="Maya 25%"
                  />
                </div>
              </div>

              <ul className="space-y-5">
                {splits.map((s) => (
                  <li key={s.name}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-neutral-900">
                        {s.name}
                      </span>
                      <span className="tabular-nums text-neutral-600">
                        {s.percent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full rounded-full ${s.barClass}`}
                        style={{ width: `${s.percent}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-xs leading-relaxed text-neutral-500">
                Splits support verification, but the co-signed record is the
                main artifact. Confirm when everyone is aligned.
              </p>
            </div>
          </section>

          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 p-8 text-center">
            <p className="mb-6 text-sm text-neutral-600">
              When everything looks right, co-sign the same record and create a
              verified project record.
            </p>
            <form action={reviewAndConfirm}>
              <button
                type="submit"
                className="rounded-full bg-black px-10 py-3 text-sm font-medium text-white transition hover:opacity-80"
              >
                Review and sign
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
