import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

type DB = SupabaseClient<Database>;

export type RateLimitState = {
  daily_limit: number;
  daily_used: number;
  hourly_limit: number;
  hourly_used: number;
};

/** Read-only state, safe to poll for display (does not consume a slot). */
export async function getRateLimitState(supabase: DB, userId: string): Promise<RateLimitState> {
  const { data } = await supabase.from("send_limits").select("*").eq("user_id", userId).maybeSingle();
  if (!data) {
    return { daily_limit: 20, daily_used: 0, hourly_limit: 5, hourly_used: 0 };
  }
  const today = new Date().toISOString().slice(0, 10);
  const hour = new Date().getUTCHours();
  const staleDay = data.last_reset_date !== today;
  const staleHour = staleDay || data.last_reset_hour !== hour;
  return {
    daily_limit: data.daily_limit,
    daily_used: staleDay ? 0 : data.emails_sent_today,
    hourly_limit: data.hourly_limit,
    hourly_used: staleHour ? 0 : data.emails_sent_this_hour,
  };
}

/**
 * Atomically checks the user's send limits and, if allowed, increments both
 * counters — via a single guarded UPDATE in the consume_send_limit Postgres
 * function (supabase/migrations/20260915000003_atomic_rate_limits.sql), so
 * concurrent requests can't both read the same pre-increment count and both
 * pass. Returns { allowed: false, reason } without incrementing when a
 * limit is hit.
 */
export async function checkAndConsumeSendLimit(
  supabase: DB,
  userId: string
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const { data, error } = await supabase.rpc("consume_send_limit", { p_user_id: userId });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("consume_send_limit returned no row");
  if (!row.allowed) return { allowed: false, reason: row.reason ?? "Send limit reached." };
  return { allowed: true };
}

/** Gives back a reserved send-limit slot after a send that turned out to fail. */
export async function releaseSendLimit(supabase: DB, userId: string): Promise<void> {
  const { error } = await supabase.rpc("release_send_limit", { p_user_id: userId });
  if (error) throw error;
}

export type AiUsageState = {
  daily_limit: number;
  daily_used: number;
  hourly_limit: number;
  hourly_used: number;
};

/** Read-only AI usage state, safe to poll for display. */
export async function getAiUsageState(supabase: DB, userId: string): Promise<AiUsageState> {
  const { data } = await supabase.from("ai_usage_limits").select("*").eq("user_id", userId).maybeSingle();
  if (!data) {
    return { daily_limit: 200, daily_used: 0, hourly_limit: 50, hourly_used: 0 };
  }
  const today = new Date().toISOString().slice(0, 10);
  const hour = new Date().getUTCHours();
  const staleDay = data.last_reset_date !== today;
  const staleHour = staleDay || data.last_reset_hour !== hour;
  return {
    daily_limit: data.daily_limit,
    daily_used: staleDay ? 0 : data.calls_today,
    hourly_limit: data.hourly_limit,
    hourly_used: staleHour ? 0 : data.calls_this_hour,
  };
}

/**
 * Atomically checks and consumes one unit of the user's OpenAI-call budget
 * (company research, the AI career-page-extraction fallback in job
 * discovery, email/LinkedIn draft generation). Every route that calls
 * OpenAI on a per-item basis from a batch action MUST call this first and
 * bail out on `allowed: false` — this is what caps a runaway "Research
 * Companies" / "Discover Jobs for All" / "Draft Emails for All" batch loop
 * from burning through a real OpenAI budget in one sitting.
 */
export async function checkAndConsumeAiCall(
  supabase: DB,
  userId: string
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const { data, error } = await supabase.rpc("consume_ai_call", { p_user_id: userId });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("consume_ai_call returned no row");
  if (!row.allowed) return { allowed: false, reason: row.reason ?? "AI usage cap reached." };
  return { allowed: true };
}
