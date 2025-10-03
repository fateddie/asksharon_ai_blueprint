-- Temporarily remove foreign key constraints for demo purposes
-- This allows the app to work without requiring real auth.users entries

-- Remove foreign key constraints
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_user_id_fkey;
ALTER TABLE public.habit_completions DROP CONSTRAINT IF EXISTS habit_completions_user_id_fkey;

-- Keep the user_id field but make it just a text field for demo
-- This allows the app to work with our generated UUIDs