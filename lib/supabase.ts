import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Browser-side Supabase client. Uses @supabase/ssr so the session (and the
 * OAuth PKCE code verifier) is stored in cookies rather than localStorage —
 * required so server-side Route Handlers can read/exchange the same session.
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
