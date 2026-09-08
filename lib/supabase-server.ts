import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

function realValue(...candidates: (string | undefined)[]) {
  return candidates.find((v) => v && !v.startsWith("your-") && !v.includes("YOUR-"));
}

const supabaseUrl = realValue(process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://placeholder.supabase.co";
const serviceRoleKey =
  realValue(process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  "placeholder-key";

/** True once a real (non-placeholder) service-role/secret key is configured. */
export const hasServiceRoleKey = !!realValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Server-side Supabase client with admin service role capabilities.
 * Bypasses RLS — used only in trusted server contexts (API routes, cron tasks).
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Request-scoped Supabase client for Route Handlers and Server Components.
 * Reads/writes the user's session via HTTP-only cookies, so RLS policies
 * evaluate against the actual signed-in user (auth.uid()).
 */
export function createSupabaseRouteClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — safe to ignore since
            // middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}
