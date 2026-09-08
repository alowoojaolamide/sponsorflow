-- Migration: 20260908000003_indexes.sql
-- Description: Performance and deduplication indexes for SponsorFlow

-- Users & Auth
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(token);

-- Profiles & Relations
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_industries_profile_id ON public.user_industries(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_profile_id ON public.user_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_profile_id ON public.user_projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);

-- Companies, Imports & Contacts (Deduplication & Pipeline)
CREATE INDEX IF NOT EXISTS idx_companies_user_normalized ON public.companies(user_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_companies_user_status ON public.companies(user_id, status);
CREATE INDEX IF NOT EXISTS idx_companies_import_id ON public.companies(import_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_email_hash ON public.contacts(user_id, email_hash);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);

-- Outreach Emails, Events & Replies (Dashboard queries & event logs)
CREATE INDEX IF NOT EXISTS idx_outreach_emails_user_sent_at ON public.outreach_emails(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_user_status ON public.outreach_emails(user_id, status);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_company_id ON public.outreach_emails(company_id);
CREATE INDEX IF NOT EXISTS idx_email_events_outreach_email_id ON public.email_events(outreach_email_id, event_type);
CREATE INDEX IF NOT EXISTS idx_email_replies_user_received_at ON public.email_replies(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_replies_outreach_email_id ON public.email_replies(outreach_email_id);

-- Analytics & Throttle Tracking
CREATE INDEX IF NOT EXISTS idx_analytics_daily_user_date ON public.analytics_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_by_industry_user ON public.analytics_by_industry(user_id, industry);
CREATE INDEX IF NOT EXISTS idx_send_limits_user_id ON public.send_limits(user_id);
