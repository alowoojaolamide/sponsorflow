-- Migration: 20260908000005_onboarding_profile_fields.sql
-- Description: Adds onboarding fields (Step 6 & 9) that had no backing column.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS availability VARCHAR(50),
  ADD COLUMN IF NOT EXISTS remote_preference VARCHAR(50),
  ADD COLUMN IF NOT EXISTS example_phrases TEXT;
