-- Migration: 20260915000003_atomic_rate_limits.sql
-- Description: Two fixes prompted by a live incident report.
--
-- 1. send_limits was being checked-then-updated as two separate round trips
--    from the application (lib/rate-limit.ts), which is not atomic —
--    concurrent send requests near the cap could both read the same
--    pre-increment row and both pass the check. Replaced with a single
--    guarded UPDATE (atomic at the row level under Postgres's normal
--    read-committed locking: a second concurrent UPDATE on the same row
--    blocks until the first commits, then re-evaluates its WHERE clause
--    against the now-committed values) wrapped in a SECURITY DEFINER RPC.
--
-- 2. There was no cap at all on OpenAI-consuming operations (company
--    research web searches, the AI career-page-extraction fallback in job
--    discovery, email drafting, LinkedIn message drafting) — only Gmail
--    *sending* had a cap. The batch "Research Companies" / "Discover Jobs
--    for All" / "Draft Emails for All" actions can fire hundreds of these
--    in a loop with only a client-side concurrency cap (4-6 in flight),
--    no ceiling on total volume — reported as burning a weekly OpenAI
--    budget in a single hour. Added a parallel ai_usage_limits table with
--    the same atomic-RPC shape.

-- ---------------------------------------------------------------------------
-- 1. Atomic send-limit consume/release
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.consume_send_limit(p_user_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  daily_used INT,
  daily_limit INT,
  hourly_used INT,
  hourly_limit INT
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_hour INT := EXTRACT(HOUR FROM NOW());
  v_row public.send_limits;
BEGIN
  INSERT INTO public.send_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.send_limits s
  SET
    emails_sent_today = CASE WHEN s.last_reset_date <> v_today THEN 1 ELSE s.emails_sent_today + 1 END,
    emails_sent_this_hour = CASE
      WHEN s.last_reset_date <> v_today OR s.last_reset_hour <> v_hour THEN 1
      ELSE s.emails_sent_this_hour + 1
    END,
    last_reset_date = v_today,
    last_reset_hour = v_hour
  WHERE s.user_id = p_user_id
    AND (s.last_reset_date <> v_today OR s.emails_sent_today < s.daily_limit)
    AND (s.last_reset_date <> v_today OR s.last_reset_hour <> v_hour OR s.emails_sent_this_hour < s.hourly_limit)
  RETURNING s.* INTO v_row;

  IF v_row.user_id IS NOT NULL THEN
    RETURN QUERY SELECT true, NULL::TEXT, v_row.emails_sent_today, v_row.daily_limit, v_row.emails_sent_this_hour, v_row.hourly_limit;
    RETURN;
  END IF;

  -- Not allowed — fetch current state (post any reset that would apply) to report why.
  SELECT * INTO v_row FROM public.send_limits WHERE user_id = p_user_id;
  IF v_row.last_reset_date <> v_today THEN
    RETURN QUERY SELECT false, 'reset_pending'::TEXT, 0, v_row.daily_limit, 0, v_row.hourly_limit;
  ELSIF v_row.emails_sent_today >= v_row.daily_limit THEN
    RETURN QUERY SELECT false,
      format('Daily limit reached (%s/day). Try again tomorrow.', v_row.daily_limit),
      v_row.emails_sent_today, v_row.daily_limit, v_row.emails_sent_this_hour, v_row.hourly_limit;
  ELSE
    RETURN QUERY SELECT false,
      format('Hourly limit reached (%s/hour). Slow down and try again shortly.', v_row.hourly_limit),
      v_row.emails_sent_today, v_row.daily_limit, v_row.emails_sent_this_hour, v_row.hourly_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Compensating decrement for a reserved slot whose send then failed
-- (Gmail's send call is atomic — it either returns a sent message or throws
-- with nothing sent — so it's safe to give the slot back on failure).
CREATE OR REPLACE FUNCTION public.release_send_limit(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.send_limits
  SET
    emails_sent_today = GREATEST(emails_sent_today - 1, 0),
    emails_sent_this_hour = GREATEST(emails_sent_this_hour - 1, 0)
  WHERE user_id = p_user_id
    AND last_reset_date = CURRENT_DATE
    AND last_reset_hour = EXTRACT(HOUR FROM NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- 2. AI usage cap (research / job-discovery AI fallback / draft generation)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  daily_limit INT DEFAULT 200,
  hourly_limit INT DEFAULT 50,
  calls_today INT DEFAULT 0,
  calls_this_hour INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_reset_hour INT DEFAULT EXTRACT(HOUR FROM NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER tr_ai_usage_limits_updated_at
  BEFORE UPDATE ON public.ai_usage_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage"
  ON public.ai_usage_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_ai_call(p_user_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  daily_used INT,
  daily_limit INT,
  hourly_used INT,
  hourly_limit INT
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_hour INT := EXTRACT(HOUR FROM NOW());
  v_row public.ai_usage_limits;
BEGIN
  INSERT INTO public.ai_usage_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.ai_usage_limits a
  SET
    calls_today = CASE WHEN a.last_reset_date <> v_today THEN 1 ELSE a.calls_today + 1 END,
    calls_this_hour = CASE
      WHEN a.last_reset_date <> v_today OR a.last_reset_hour <> v_hour THEN 1
      ELSE a.calls_this_hour + 1
    END,
    last_reset_date = v_today,
    last_reset_hour = v_hour
  WHERE a.user_id = p_user_id
    AND (a.last_reset_date <> v_today OR a.calls_today < a.daily_limit)
    AND (a.last_reset_date <> v_today OR a.last_reset_hour <> v_hour OR a.calls_this_hour < a.hourly_limit)
  RETURNING a.* INTO v_row;

  IF v_row.user_id IS NOT NULL THEN
    RETURN QUERY SELECT true, NULL::TEXT, v_row.calls_today, v_row.daily_limit, v_row.calls_this_hour, v_row.hourly_limit;
    RETURN;
  END IF;

  SELECT * INTO v_row FROM public.ai_usage_limits WHERE user_id = p_user_id;
  IF v_row.last_reset_date <> v_today THEN
    RETURN QUERY SELECT false, 'reset_pending'::TEXT, 0, v_row.daily_limit, 0, v_row.hourly_limit;
  ELSIF v_row.calls_today >= v_row.daily_limit THEN
    RETURN QUERY SELECT false,
      format('AI usage daily cap reached (%s/day). This resets at midnight UTC — try again tomorrow, or ask to raise the cap.', v_row.daily_limit),
      v_row.calls_today, v_row.daily_limit, v_row.calls_this_hour, v_row.hourly_limit;
  ELSE
    RETURN QUERY SELECT false,
      format('AI usage hourly cap reached (%s/hour). Slow down and try again shortly.', v_row.hourly_limit),
      v_row.calls_today, v_row.daily_limit, v_row.calls_this_hour, v_row.hourly_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE INDEX IF NOT EXISTS idx_ai_usage_limits_user_id ON public.ai_usage_limits(user_id);
