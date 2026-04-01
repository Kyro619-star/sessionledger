import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-lg px-6 py-24">
        <h1 className="mb-3 text-2xl font-semibold">Sign in</h1>
        <p className="mb-8 text-sm leading-relaxed text-neutral-600">
          Authentication is not connected yet. This page is a placeholder for
          future account access.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
