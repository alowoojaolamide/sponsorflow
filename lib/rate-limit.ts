import type { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/types/database";

type DB = SupabaseClient<Database>;

export type RateLimitState = {
  daily_limit: number;
  daily_used: number;
  hourly_limit: number;
  hourly_used: number;
};

function currentHour(): number {
  return new Date().getUTCHours();
}

function currentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function ensureSendLimitRow(supabase: DB, userId: string): Promise<Tables<"send_limits">> {
  const { data } = await supabase.from("send_limits").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data;

  const { data: created, error } = await supabase
    .from("send_limits")
    .insert({ user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return created;
}

/** Resets daily/hourly counters if the clock has rolled over since the last reset. */
async function resetIfNeeded(supabase: DB, row: Tables<"send_limits">): Promise<Tables<"send_limits">> {
  const today = currentDate();
  const hour = currentHour();

  const needsDailyReset = row.last_reset_date !== today;
  const needsHourlyReset = needsDailyReset || row.last_reset_hour !== hour;

  if (!needsDailyReset && !needsHourlyReset) return row;

  const { data, error } = await supabase
    .from("send_limits")
    .update({
      emails_sent_today: needsDailyReset ? 0 : row.emails_sent_today,
      emails_sent_this_hour: needsHourlyReset ? 0 : row.emails_sent_this_hour,
      last_reset_date: today,
      last_reset_hour: hour,
    })
    .eq("id", row.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getRateLimitState(supabase: DB, userId: string): Promise<RateLimitState> {
  const row = await resetIfNeeded(supabase, await ensureSendLimitRow(supabase, userId));
  return {
    daily_limit: row.daily_limit,
    daily_used: row.emails_sent_today,
    hourly_limit: row.hourly_limit,
    hourly_used: row.emails_sent_this_hour,
  };
}

/**
 * Atomically checks the user's send limits and, if allowed, increments both
 * counters. Returns { allowed: false, reason } without incrementing when a
 * limit is hit.
 */
export async function checkAndConsumeSendLimit(
  supabase: DB,
  userId: string
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const row = await resetIfNeeded(supabase, await ensureSendLimitRow(supabase, userId));

  if (row.emails_sent_today >= row.daily_limit) {
    return { allowed: false, reason: `Daily limit reached (${row.daily_limit}/day). Try again tomorrow.` };
  }
  if (row.emails_sent_this_hour >= row.hourly_limit) {
    return { allowed: false, reason: `Hourly limit reached (${row.hourly_limit}/hour). Slow down and try again shortly.` };
  }

  const { error } = await supabase
    .from("send_limits")
    .update({
      emails_sent_today: row.emails_sent_today + 1,
      emails_sent_this_hour: row.emails_sent_this_hour + 1,
    })
    .eq("id", row.id);

  if (error) throw error;
  return { allowed: true };
}
