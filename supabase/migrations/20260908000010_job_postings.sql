-- Migration: 20260908000010_job_postings.sql
-- Description: Stores job openings discovered at companies on the user's
-- list (via Greenhouse/Lever public APIs or career-page extraction), so
-- they can be reviewed and turned into a role-aware pitch email.

CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL, -- greenhouse, lever, career_page
  external_id TEXT, -- ATS-native job id, for dedup on re-scan
  title TEXT NOT NULL,
  url TEXT,
  location TEXT,
  description TEXT,
  status VARCHAR(50) DEFAULT 'new', -- new, pitched, applied, dismissed
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_company_posting UNIQUE (user_id, company_id, external_id)
);

CREATE TRIGGER tr_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own job postings"
  ON public.job_postings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_postings_user_id ON public.job_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON public.job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_user_status ON public.job_postings(user_id, status);
