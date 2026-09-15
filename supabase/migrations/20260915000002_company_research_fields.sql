-- Migration: 20260915000002_company_research_fields.sql
-- Description: Tracks when a company was last AI-researched (web search
-- for its official website + a personalization hook), so companies
-- imported with only a name (no website) can be enriched in a resumable
-- batch pass, same pattern as jobs_scanned_at for job discovery.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS researched_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_companies_user_researched_at
  ON public.companies(user_id, researched_at);
