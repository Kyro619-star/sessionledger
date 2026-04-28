import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "SessionLedger — A registry for music collaborators",
  description:
    "Verified provenance for the people who actually make the music. Every session you show up to, on the record. Forever.",
};

// Always render fresh so the auth-aware CTA reflects current session.
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Auth-aware CTA target. Signed in → straight to project creation.
  // Anon → sign-in. Encoded into the iframe src; landing.html reads it.
  const cta = user ? "/create-project" : "/sign-in";
  const src = `/landing.html?cta=${encodeURIComponent(cta)}`;

  return (
    <iframe
      src={src}
      title="SessionLedger"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: 0,
        margin: 0,
        padding: 0,
      }}
    />
  );
}
