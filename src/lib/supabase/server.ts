import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components, Server Actions and
 * Route Handlers. Reads/writes the auth session via Next.js cookies so the
 * logged-in user's session is available on the server too (needed by
 * middleware.ts to protect /dashboard and /settings).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component with no writable cookie store —
            // safe to ignore as long as middleware.ts refreshes the session.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Same as above.
          }
        },
      },
    }
  );
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — ONLY for trusted server contexts that must bypass
 * RLS (currently: the weekly report cron job, which needs to read every
 * store/vacancy regardless of the RLS policy). NEVER import this in a
 * Client Component or expose the service-role key to the browser.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
