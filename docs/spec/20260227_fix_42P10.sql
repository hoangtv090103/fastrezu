-- Migration script: Fix 42P10 error
-- Adds a unique constraint to (user_id, section_type) on master_profiles table
-- Required for ON CONFLICT upsert operations in Vault

ALTER TABLE public.master_profiles
ADD CONSTRAINT unique_user_section UNIQUE (user_id, section_type);