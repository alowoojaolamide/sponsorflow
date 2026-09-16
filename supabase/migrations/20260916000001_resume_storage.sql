-- Migration: 20260916000001_resume_storage.sql
-- Description: Lets a user store one resume/CV file so it can actually be
-- attached to outreach emails. Previously, the resume uploaded during
-- onboarding's AI autofill was only ever used in-memory for text
-- extraction and then discarded — there was no persistent copy anywhere,
-- so the AI-generated email body's "[CV]" placeholder was always dropped
-- and every sent email was missing the attachment it claimed to include.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS resume_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS resume_filename TEXT,
  ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Private bucket — resumes are only ever read server-side (by the send
-- flow, with the user's own session) to build the attachment, never
-- served as a public URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Files are stored under "<user_id>/<filename>" — these policies restrict
-- each user to their own folder, same ownership model as every other
-- table in this schema (auth.uid() = owning id).
CREATE POLICY "Users can upload their own resume"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own resume"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can replace their own resume"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own resume"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
