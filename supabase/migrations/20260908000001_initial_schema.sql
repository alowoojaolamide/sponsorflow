-- Migration: 20260908000001_initial_schema.sql
-- Description: Core schema for SponsorFlow Phase 1 (16 tables, triggers, helper functions)

-- Enable cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Normalize company name for reliable deduplication (strips Ltd, LLC, Inc, UK, etc.)
CREATE OR REPLACE FUNCTION public.normalize_company_name(raw_name TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF raw_name IS NULL THEN
    RETURN NULL;
  END IF;
  cleaned := lower(trim(raw_name));
  -- Strip common suffixes and terms
  cleaned := regexp_replace(cleaned, '\m(limited|ltd|llc|inc|plc|corp|corporation|group|technologies|tech|solutions|uk)\M', '', 'gi');
  -- Remove special characters except alphanumeric & spaces
  cleaned := regexp_replace(cleaned, '[^a-z0-9\s]', '', 'g');
  -- Collapse consecutive spaces
  cleaned := trim(regexp_replace(cleaned, '\s+', ' ', 'g'));
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Hash email addresses for deduplication and privacy
CREATE OR REPLACE FUNCTION public.email_hash(raw_email TEXT)
RETURNS TEXT AS $$
BEGIN
  IF raw_email IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(digest(lower(trim(raw_email)), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to maintain normalized_name on companies
CREATE OR REPLACE FUNCTION public.trigger_normalize_company_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := public.normalize_company_name(NEW.company_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to maintain email_hash on contacts
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
-- 2. USERS & SESSIONS
-- ==============================================================================

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

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. USER PROFILE, INDUSTRIES, SKILLS, PROJECTS & DOCUMENTS
-- ==============================================================================

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

CREATE TABLE IF NOT EXISTS public.user_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  industry VARCHAR(100) NOT NULL, -- fintech, healthcare, saas, etc.
  years_experience INT,
  experience_description TEXT,
  problems_solved TEXT,
  motivation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category VARCHAR(50) NOT NULL, -- design, tools, other
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- cv, portfolio, case_study, template
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 4. COMPANIES, IMPORTS & CONTACTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.company_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT,
  companies_found INT DEFAULT 0,
  companies_duplicates INT DEFAULT 0,
  companies_imported INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

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
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, replied, rejected, interview, offer
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

-- ==============================================================================
-- 5. OUTREACH EMAILS, EVENTS & REPLIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.outreach_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, approved, ready_to_send, sending, sent, delivered, failed, rejected
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status VARCHAR(50), -- sent, delivered, bounce
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

CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_email_id UUID NOT NULL REFERENCES public.outreach_emails(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- sent, delivered, opened, clicked, bounce
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clicked_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  outreach_email_id UUID REFERENCES public.outreach_emails(id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_classification VARCHAR(50), -- positive, interested, rejection, question, other
  ai_confidence INT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 6. SEND LIMITS & RATE THROTTLING
-- ==============================================================================

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

-- ==============================================================================
-- 7. ANALYTICS (DAILY & INDUSTRY)
-- ==============================================================================

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
