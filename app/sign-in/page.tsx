"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupDone, setSignupDone] = useState(false);

  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // Email confirmation is off — already logged in, go straight to dashboard
        router.push("/dashboard");
        router.refresh();
      } else {
        // Email confirmation is on — ask them to check their inbox
        setSignupDone(true);
      }
    }

    setLoading(false);
  }

  if (signupDone) {
    return (
      <main className="min-h-screen bg-neutral-100 text-neutral-900">
        <div className="mx-auto max-w-lg px-6 py-24">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
            <p className="mb-2 text-base font-semibold text-emerald-800">
              Check your email
            </p>
            <p className="text-sm leading-relaxed text-emerald-700">
              We sent a confirmation link to <strong>{email}</strong>. Click it
              to activate your account, then sign in.
            </p>
            <button
              onClick={() => { setSignupDone(false); setMode("signin"); }}
              className="mt-5 text-sm font-medium text-emerald-800 underline underline-offset-4"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-lg px-6 py-24">
        <Link
          href="/"
          className="mb-10 inline-block text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          ← SessionLedger
        </Link>

        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mb-8 text-sm text-neutral-500">
          {mode === "signin"
            ? "Welcome back. Sign in to access your projects."
            : "Start documenting your music collaborations."}
        </p>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-black py-3 text-sm font-medium text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? mode === "signin" ? "Signing in…" : "Creating account…"
              : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => { setMode("signup"); setError(""); }}
                className="font-medium text-neutral-900 underline underline-offset-4"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setMode("signin"); setError(""); }}
                className="font-medium text-neutral-900 underline underline-offset-4"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
