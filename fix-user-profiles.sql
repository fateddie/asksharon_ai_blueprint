-- Fix user_profiles table by adding missing columns
-- Run this in Supabase SQL Editor

-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS user_id text,
ADD COLUMN IF NOT EXISTS last_sync timestamp with time zone,
ADD COLUMN IF NOT EXISTS gmail_enabled boolean default false,
ADD COLUMN IF NOT EXISTS calendar_enabled boolean default false;

-- Update user_id to match the id for existing records
UPDATE public.user_profiles
SET user_id = id::text
WHERE user_id IS NULL;

-- Make user_id unique
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);