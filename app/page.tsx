import Link from "next/link";

export default function Home() {
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
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/sign-in"
              className="rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200/80 hover:text-neutral-900"
            >
              Sign in
            </Link>
            <Link
              href="/create-project"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="mb-6 text-5xl font-semibold leading-tight sm:text-6xl">
            Clear records for music collaboration.
          </h1>

          <p className="mb-8 max-w-2xl text-lg leading-8 text-neutral-600">
            SessionLedger helps student creators document contributions,
            discuss provisional splits, and confirm authorship with more
            clarity before confusion happens later.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/create-project"
              className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:opacity-80"
            >
              Start a Project
            </Link>
            <Link
              href="/project-demo"
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-200"
            >
              View Demo Flow
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">Log Contributions</h2>
            <p className="text-sm leading-7 text-neutral-600">
              Track who contributed topline, lyrics, production, vocals,
              arrangement, and edits while the session is still fresh.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">Discuss Splits Early</h2>
            <p className="text-sm leading-7 text-neutral-600">
              Start provisional split conversations earlier so expectations are
              visible before the end of the project.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">Confirm Authorship</h2>
            <p className="text-sm leading-7 text-neutral-600">
              Create a stronger final record of collaboration that can support
              future proof, trust, and verification.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
