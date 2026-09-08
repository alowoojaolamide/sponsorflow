-- ==============================================================================
-- SponsorFlow: Complete Database Schema (Phase 1)
-- Consolidated SQL for direct execution in Supabase SQL Editor
-- Tables: 16 | RLS: Enabled | Triggers: Deduplication + Updated_At | Indexes: Included
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.normalize_company_name(raw_name TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF raw_name IS NULL THEN
    RETURN NULL;
  END IF;
  cleaned := lower(trim(raw_name));
  cleaned := regexp_replace(cleaned, '\m(limited|ltd|llc|inc|plc|corp|corporation|group|technologies|tech|solutions|uk)\M', '', 'gi');
  cleaned := regexp_replace(cleaned, '[^a-z0-9\s]', '', 'g');
  cleaned := trim(regexp_replace(cleaned, '\s+', ' ', 'g'));
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.email_hash(raw_email TEXT)
RETURNS TEXT AS $$
BEGIN
  IF raw_email IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(digest(lower(trim(raw_email)), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.trigger_normalize_company_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := public.normalize_company_name(NEW.company_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_hash_contact_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email_hash := public.email_hash(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. CORE TABLES DDL
-- ==============================================================================

-- 1. users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  google_email TEXT,
  first_name TEXT,
  last_name TEXT,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. user_sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  location TEXT,
  years_experience INT,
  target_job_title TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  professional_summary TEXT,
  design_philosophy TEXT,
  unique_thing TEXT,
  writing_tone VARCHAR(50) DEFAULT 'Professional and Warm',
  requires_sponsorship BOOLEAN DEFAULT true,
  target_salary_gbp INT,
  onboarding_complete BOOLEAN DEFAULT false,
  profile_complete_percent INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER tr_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. user_industries
CREATE TABLE IF NOT EXISTS public.user_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  industry VARCHAR(100) NOT NULL,
  years_experience INT,
  experience_description TEXT,
  problems_solved TEXT,
  motivation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. user_skills
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. user_projects
CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  company_name TEXT,
  year INT,
  description TEXT,
  role TEXT,
  industry VARCHAR(100),
  impact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. user_documents
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. company_imports
CREATE TABLE IF NOT EXISTS public.company_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT,
  companies_found INT DEFAULT 0,
  companies_duplicates INT DEFAULT 0,
  companies_imported INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'processing',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 9. companies
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  import_id UUID REFERENCES public.company_imports(id) ON DELETE SET NULL,
  campaign_tag TEXT,
  normalized_name TEXT,
  external_id TEXT,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_company UNIQUE (user_id, normalized_name)
);

CREATE TRIGGER tr_companies_normalize
  BEFORE INSERT OR UPDATE OF company_name ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.trigger_normalize_company_name();

CREATE TRIGGER tr_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  linkedin_url TEXT,
  job_title TEXT,
  email_hash TEXT,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_contact_email UNIQUE (user_id, email_hash)
);

CREATE TRIGGER tr_contacts_email_hash
  BEFORE INSERT OR UPDATE OF email ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_hash_contact_email();

CREATE TRIGGER tr_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11. outreach_emails
CREATE TABLE IF NOT EXISTS public.outreach_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status VARCHAR(50),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  ai_model TEXT,
  ai_positioning_angle TEXT,
  ai_confidence INT,
  approved_by_user BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  user_edits TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER tr_outreach_emails_updated_at
  BEFORE UPDATE ON public.outreach_emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 12. email_events
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_email_id UUID NOT NULL REFERENCES public.outreach_emails(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clicked_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. email_replies
CREATE TABLE IF NOT EXISTS public.email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  outreach_email_id UUID REFERENCES public.outreach_emails(id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_classification VARCHAR(50),
  ai_confidence INT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. send_limits
CREATE TABLE IF NOT EXISTS public.send_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  daily_limit INT DEFAULT 20,
  hourly_limit INT DEFAULT 5,
  emails_sent_today INT DEFAULT 0,
  emails_sent_this_hour INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_reset_hour INT DEFAULT EXTRACT(HOUR FROM NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER tr_send_limits_updated_at
  BEFORE UPDATE ON public.send_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 15. analytics_daily
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emails_sent INT DEFAULT 0,
  emails_delivered INT DEFAULT 0,
  emails_bounced INT DEFAULT 0,
  emails_opened INT DEFAULT 0,
  open_rate FLOAT DEFAULT 0.0,
  emails_clicked INT DEFAULT 0,
  click_rate FLOAT DEFAULT 0.0,
  emails_replied INT DEFAULT 0,
  reply_rate FLOAT DEFAULT 0.0,
  positive_replies INT DEFAULT 0,
  rejection_replies INT DEFAULT 0,
  interviews_scheduled INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_daily_analytics UNIQUE (user_id, date)
);

-- 16. analytics_by_industry
CREATE TABLE IF NOT EXISTS public.analytics_by_industry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  companies_targeted INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  replies INT DEFAULT 0,
  reply_rate FLOAT DEFAULT 0.0,
  positive_replies INT DEFAULT 0,
  interviews INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_industry_analytics UNIQUE (user_id, industry)
);

-- ==============================================================================
-- 3. INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(token);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_industries_profile_id ON public.user_industries(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_profile_id ON public.user_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_profile_id ON public.user_projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_companies_user_normalized ON public.companies(user_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_companies_user_status ON public.companies(user_id, status);
CREATE INDEX IF NOT EXISTS idx_companies_import_id ON public.companies(import_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_email_hash ON public.contacts(user_id, email_hash);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);

CREATE INDEX IF NOT EXISTS idx_outreach_emails_user_sent_at ON public.outreach_emails(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_user_status ON public.outreach_emails(user_id, status);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_company_id ON public.outreach_emails(company_id);
CREATE INDEX IF NOT EXISTS idx_email_events_outreach_email_id ON public.email_events(outreach_email_id, event_type);
CREATE INDEX IF NOT EXISTS idx_email_replies_user_received_at ON public.email_replies(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_replies_outreach_email_id ON public.email_replies(outreach_email_id);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_user_date ON public.analytics_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_by_industry_user ON public.analytics_by_industry(user_id, industry);
CREATE INDEX IF NOT EXISTS idx_send_limits_user_id ON public.send_limits(user_id);

-- ==============================================================================
-- 4. ROW-LEVEL SECURITY & POLICIES
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

-- users
CREATE POLICY "Users can view their own profile record"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile record"
  ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE USING (auth.uid() = user_id);

-- user_profiles
CREATE POLICY "Users can view their profile"
  ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their profile"
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their profile"
  ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their profile"
  ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- user_industries
CREATE POLICY "Users can view their industries"
  ON public.user_industries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_industries.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can insert their industries"
  ON public.user_industries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_industries.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can update their industries"
  ON public.user_industries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_industries.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete their industries"
  ON public.user_industries FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_industries.profile_id AND p.user_id = auth.uid()));

-- user_skills
CREATE POLICY "Users can view their skills"
  ON public.user_skills FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_skills.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can insert their skills"
  ON public.user_skills FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_skills.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can update their skills"
  ON public.user_skills FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_skills.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete their skills"
  ON public.user_skills FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_skills.profile_id AND p.user_id = auth.uid()));

-- user_projects
CREATE POLICY "Users can view their projects"
  ON public.user_projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_projects.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can insert their projects"
  ON public.user_projects FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_projects.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can update their projects"
  ON public.user_projects FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_projects.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete their projects"
  ON public.user_projects FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = user_projects.profile_id AND p.user_id = auth.uid()));

-- user_documents
CREATE POLICY "Users can manage their documents"
  ON public.user_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- company_imports
CREATE POLICY "Users can manage their company imports"
  ON public.company_imports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- companies
CREATE POLICY "Users can manage their companies"
  ON public.companies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contacts
CREATE POLICY "Users can manage their contacts"
  ON public.contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- outreach_emails
CREATE POLICY "Users can manage their outreach emails"
  ON public.outreach_emails FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- email_events
CREATE POLICY "Users can view email events"
  ON public.email_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.outreach_emails e WHERE e.id = email_events.outreach_email_id AND e.user_id = auth.uid()));

CREATE POLICY "Users can insert email events"
  ON public.email_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.outreach_emails e WHERE e.id = email_events.outreach_email_id AND e.user_id = auth.uid()));

-- email_replies
CREATE POLICY "Users can manage email replies"
  ON public.email_replies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- send_limits
CREATE POLICY "Users can manage their send limits"
  ON public.send_limits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- analytics_daily
CREATE POLICY "Users can manage daily analytics"
  ON public.analytics_daily FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- analytics_by_industry
CREATE POLICY "Users can manage industry analytics"
  ON public.analytics_by_industry FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
