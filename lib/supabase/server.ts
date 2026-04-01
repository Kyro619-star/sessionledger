import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client (Server Actions, Route Handlers, Server Components).
 * Uses the publishable key + RLS. Safe to expose NEXT_PUBLIC_* in the browser;
 * this file still runs only on the server in our current setup.
 */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy env.example to .env.local.",
    );
  }
  return createClient(url, publishableKey);
}
