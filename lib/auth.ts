import { createSupabaseRouteClient } from "./supabase-server";

type SupabaseRouteClient = ReturnType<typeof createSupabaseRouteClient>;

/**
 * Ensures a public.users mirror row exists for an authenticated user.
 * Runs with the user's own session so RLS (auth.uid() = id) is satisfied —
 * no service-role key required. Safe to call on every login/signup.
 */
async function ensureUserRecord(
  supabase: SupabaseRouteClient,
  userId: string,
  email: string
) {
  const { error } = await supabase.from("users").insert({ id: userId, email });

  // 23505 = unique_violation — row already mirrored, not a real failure.
  if (error && error.code !== "23505") {
    console.error("ensureUserRecord: failed to mirror public.users row:", error.message);
  }
}

export async function signupUser(email: string, password: string) {
  const supabase = createSupabaseRouteClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login?verified=1`,
    },
  });

  if (error || !data.user) {
    return { user: null, session: data?.session ?? null, error };
  }

  // Only mirror immediately if a session exists (email confirmation disabled).
  // Otherwise the row is created on first successful login, once a real
  // session — and therefore auth.uid() — is available to satisfy RLS.
  if (data.session) {
    await ensureUserRecord(supabase, data.user.id, data.user.email!);
  }

  return { user: data.user, session: data.session, error: null };
}

export async function loginUser(email: string, password: string) {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (data?.user && data.session) {
    await ensureUserRecord(supabase, data.user.id, data.user.email!);
  }

  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

export async function exchangeOAuthCode(code: string) {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user) {
    return { user: null, session: null, error };
  }

  await ensureUserRecord(supabase, data.user.id, data.user.email!);

  return { user: data.user, session: data.session, error: null };
}

export async function logoutUser() {
  const supabase = createSupabaseRouteClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}
