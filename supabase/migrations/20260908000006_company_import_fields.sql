-- Migration: 20260908000006_company_import_fields.sql
-- Description: CSV import can carry a career page URL, a personalization
-- hook (fed into AI email generation), and a sponsor status/rating — none
-- of which had a column yet.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS career_page TEXT,
  ADD COLUMN IF NOT EXISTS personalization_hook TEXT,
  ADD COLUMN IF NOT EXISTS sponsor_status TEXT;
