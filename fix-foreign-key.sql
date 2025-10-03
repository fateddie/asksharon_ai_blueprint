-- Remove foreign key constraint from tasks table to allow demo users
-- This enables voice commands to work without authentication

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- Allow null user_id for demo tasks
ALTER TABLE public.tasks ALTER COLUMN user_id DROP NOT NULL;

-- Add a demo user identifier for voice commands
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Create index for better performance with demo tasks
CREATE INDEX IF NOT EXISTS idx_tasks_demo_user ON public.tasks(user_id, is_demo);