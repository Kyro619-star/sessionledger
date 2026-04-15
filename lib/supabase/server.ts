import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-only Supabase client for Server Components, Server Actions, and
 * Route Handlers. Uses @supabase/ssr so auth session cookies are read
 * automatically — this is what makes auth.getUser() work on the server.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a Server Component — safe to ignore,
          // middleware handles session refresh.
        }
      },
    },
  });
}
