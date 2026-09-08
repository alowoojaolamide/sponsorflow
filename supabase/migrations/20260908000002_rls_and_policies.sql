-- Migration: 20260908000002_rls_and_policies.sql
-- Description: Row-Level Security (RLS) and multi-tenant isolation policies for all tables

-- ==============================================================================
-- 1. ENABLE ROW-LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.send_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_by_industry ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. POLICIES: USERS & SESSIONS
-- ==============================================================================

CREATE POLICY "Users can view their own profile record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile record"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 3. POLICIES: PROFILES, INDUSTRIES, SKILLS, PROJECTS & DOCUMENTS
-- ==============================================================================

CREATE POLICY "Users can view their profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their profile"
  ON public.user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- user_industries
CREATE POLICY "Users can view their industries"
  ON public.user_industries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_industries.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their industries"
  ON public.user_industries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_industries.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their industries"
  ON public.user_industries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_industries.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their industries"
  ON public.user_industries FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_industries.profile_id AND p.user_id = auth.uid()
  ));

-- user_skills
CREATE POLICY "Users can view their skills"
  ON public.user_skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_skills.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their skills"
  ON public.user_skills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_skills.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their skills"
  ON public.user_skills FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_skills.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their skills"
  ON public.user_skills FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_skills.profile_id AND p.user_id = auth.uid()
  ));

-- user_projects
CREATE POLICY "Users can view their projects"
  ON public.user_projects FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_projects.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their projects"
  ON public.user_projects FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_projects.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their projects"
  ON public.user_projects FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_projects.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their projects"
  ON public.user_projects FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_projects.profile_id AND p.user_id = auth.uid()
  ));

-- user_documents
CREATE POLICY "Users can manage their documents"
  ON public.user_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 4. POLICIES: COMPANIES, IMPORTS & CONTACTS
-- ==============================================================================

CREATE POLICY "Users can manage their company imports"
  ON public.company_imports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their companies"
  ON public.companies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their contacts"
  ON public.contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 5. POLICIES: OUTREACH EMAILS, EVENTS & REPLIES
-- ==============================================================================

CREATE POLICY "Users can manage their outreach emails"
  ON public.outreach_emails FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view email events"
  ON public.email_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.outreach_emails e
    WHERE e.id = email_events.outreach_email_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Service and users can record email events"
  ON public.email_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.outreach_emails e
    WHERE e.id = email_events.outreach_email_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage email replies"
  ON public.email_replies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 6. POLICIES: SEND LIMITS & ANALYTICS
-- ==============================================================================

CREATE POLICY "Users can manage their send limits"
  ON public.send_limits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage daily analytics"
  ON public.analytics_daily FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage industry analytics"
  ON public.analytics_by_industry FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
