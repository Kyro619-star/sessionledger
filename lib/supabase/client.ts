import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-only Supabase client for Client Components.
 * Handles auth session automatically via localStorage + cookies.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
