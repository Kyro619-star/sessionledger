import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review and Confirm · SessionLedger",
  description:
    "Final review of project summary, contributors, and provisional splits before confirming the record.",
};

export default function ConfirmPage() {
  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link
          href="/"
          className="inline-block text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          ← Back to home
        </Link>

        <header className="mt-10 max-w-2xl">
          <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Review and Confirm
          </h1>
          <p className="text-lg leading-8 text-neutral-600">
            This step is per-project. Open a real project first, then continue
            to its confirm page.
          </p>
        </header>

        <div className="mt-10 max-w-2xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <p className="text-sm leading-relaxed text-neutral-700">
            Go to{" "}
            <span className="font-medium text-neutral-900">Create Project</span>{" "}
            to start a new record, or open an existing{" "}
            <span className="font-medium text-neutral-900">/project/[id]</span>{" "}
            page and click{" "}
            <span className="font-medium text-neutral-900">
              Review and Confirm
            </span>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
