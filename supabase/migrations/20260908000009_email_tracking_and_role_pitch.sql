-- Migration: 20260908000009_email_tracking_and_role_pitch.sql
-- Description: Adds role-aware pitching (job_title/job_url on outreach_emails)
-- and open/click tracking via SECURITY DEFINER RPC functions. These functions
-- are called anonymously by the tracking pixel and click-redirect endpoints —
-- there is no logged-in user in that context (the recipient's email client is
-- calling them), so RLS can't apply. Using narrowly-scoped SECURITY DEFINER
-- functions (rather than a permissive anonymous RLS policy or the
-- service-role key) keeps the blast radius to exactly "mark this one email
-- opened/clicked", nothing else.

ALTER TABLE public.outreach_emails
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS job_url TEXT;

CREATE OR REPLACE FUNCTION public.record_email_open(p_email_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.outreach_emails
  SET opened_at = COALESCE(opened_at, NOW())
  WHERE id = p_email_id;

  INSERT INTO public.email_events (outreach_email_id, event_type)
  SELECT p_email_id, 'opened'
  WHERE EXISTS (SELECT 1 FROM public.outreach_emails WHERE id = p_email_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.record_email_click(p_email_id UUID, p_link TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.outreach_emails
  SET clicked_at = COALESCE(clicked_at, NOW())
  WHERE id = p_email_id;

  INSERT INTO public.email_events (outreach_email_id, event_type, clicked_link)
  SELECT p_email_id, 'clicked', p_link
  WHERE EXISTS (SELECT 1 FROM public.outreach_emails WHERE id = p_email_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.record_email_open(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_email_click(UUID, TEXT) TO anon, authenticated;
