-- Migration: 20260908000008_gmail_thread_tracking.sql
-- Description: Correlates inbound Gmail replies back to the outreach email
-- that started the thread (Prompt 11 reply monitoring).

ALTER TABLE public.outreach_emails
  ADD COLUMN IF NOT EXISTS gmail_message_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;

CREATE INDEX IF NOT EXISTS idx_outreach_emails_gmail_thread_id
  ON public.outreach_emails(gmail_thread_id) WHERE gmail_thread_id IS NOT NULL;
