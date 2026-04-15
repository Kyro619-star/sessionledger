import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

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
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200/80 hover:text-neutral-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/create-project"
                  className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
                >
                  New project
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200/80 hover:text-neutral-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-in"
                  className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium text-neutral-500">
            Your verified music creation record.
          </p>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            For independent music collaborators
          </div>

          <h1 className="mb-6 text-5xl font-semibold leading-tight sm:text-6xl">
            Build a verified record of what you actually made.
          </h1>

          <p className="mb-8 max-w-2xl text-lg leading-8 text-neutral-600">
            SessionLedger helps independent music collaborators document
            contributions, align on credits, and create co-signed project
            records — building a more credible professional identity over time.
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
              See How It Works
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-lg">📝</div>
            <h2 className="mb-3 text-xl font-semibold">
              Capture Contributions
            </h2>
            <p className="text-sm leading-7 text-neutral-600">
              Document who did what while the session is still fresh — topline,
              production, lyrics, vocals, arrangement, and more.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-lg">✍️</div>
            <h2 className="mb-3 text-xl font-semibold">Co-sign the Record</h2>
            <p className="text-sm leading-7 text-neutral-600">
              Make roles, credits, and split expectations visible before the
              project moves forward. Every collaborator confirms the same
              record.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-lg">🪪</div>
            <h2 className="mb-3 text-xl font-semibold">
              Build Your Creative Profile
            </h2>
            <p className="text-sm leading-7 text-neutral-600">
              Confirmed records accumulate into a professional history — not
              just what you released, but what you actually helped create.
            </p>
          </div>
        </div>

        <div className="mt-12 max-w-2xl rounded-2xl border border-neutral-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm leading-7 text-neutral-500">
            <span className="font-semibold text-neutral-800">
              Streaming profiles show what was released.
            </span>{" "}
            SessionLedger shows what you actually contributed — and makes that
            record stronger through shared confirmation.
          </p>
        </div>
      </section>
    </main>
  );
}
