-- Fix database constraints to allow proper UUID handling
-- Run this SQL in Supabase SQL Editor

-- Step 1: Remove foreign key constraints that are causing issues
ALTER TABLE IF EXISTS public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE IF EXISTS public.habits DROP CONSTRAINT IF EXISTS habits_user_id_fkey;
ALTER TABLE IF EXISTS public.habit_completions DROP CONSTRAINT IF EXISTS habit_completions_user_id_fkey;

-- Step 2: Ensure user_id columns are text type (not UUID) for our demo
ALTER TABLE IF EXISTS public.tasks ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS public.habits ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS public.habit_completions ALTER COLUMN user_id TYPE text;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions(user_id);

-- Step 4: Update RLS policies to work with text user_id
DROP POLICY IF EXISTS "Users can only see their own tasks" ON public.tasks;
CREATE POLICY "Users can only see their own tasks" ON public.tasks
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "Users can only see their own habits" ON public.habits;
CREATE POLICY "Users can only see their own habits" ON public.habits
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "Users can only see their own habit completions" ON public.habit_completions;
CREATE POLICY "Users can only see their own habit completions" ON public.habit_completions
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Step 5: Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;