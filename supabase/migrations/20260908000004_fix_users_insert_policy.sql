-- Migration: 20260908000004_fix_users_insert_policy.sql
-- Description: public.users had SELECT/UPDATE policies but no INSERT policy.
-- Under RLS, missing a policy for a command denies it entirely, so no client
-- (anon or authenticated) could ever create their own mirror row. This adds
-- the missing INSERT policy so a signed-in user can create their own record.

CREATE POLICY "Users can insert their own profile record"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
