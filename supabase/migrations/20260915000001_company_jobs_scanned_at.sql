-- Migration: 20260915000001_company_jobs_scanned_at.sql
-- Description: Tracks when a company was last scanned for open roles (via
-- "Find Roles" or the batch "Discover Jobs for All" action), so a batch
-- re-run can skip already-scanned companies and resume from where it left
-- off instead of starting over on large (100k+) company lists.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS jobs_scanned_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_companies_user_jobs_scanned_at
  ON public.companies(user_id, jobs_scanned_at);
