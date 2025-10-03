-- ============================================================================
-- Personal Assistant - Development Seed Data
-- ============================================================================
-- This file contains sample data for development and testing
-- Run this AFTER schema.sql to populate your development database
--
-- Usage: Copy and paste into Supabase SQL Editor or run via psql
-- ============================================================================

-- ============================================================================
-- SAMPLE USER PROFILES
-- ============================================================================

-- Note: User ID must match an existing auth.users entry
-- Replace with your actual Supabase user ID for testing

INSERT INTO public.user_profiles (id, email, full_name, timezone, preferences) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'demo@personalassistant.com', 'Demo User', 'America/New_York', '{"theme": "light", "notifications": true}')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  timezone = EXCLUDED.timezone,
  preferences = EXCLUDED.preferences;

-- ============================================================================
-- SAMPLE GOALS
-- ============================================================================

INSERT INTO public.goals (user_id, title, description, status, progress_percentage, category, target_date) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'Get Healthier', 'Focus on physical and mental wellbeing through consistent habits', 'active', 35, 'health', CURRENT_DATE + INTERVAL '90 days'),
  ('123e4567-e89b-12d3-a456-426614174000', 'Launch Personal Assistant SaaS', 'Build and launch "Ask Sharon" as a commercial product', 'active', 60, 'business', CURRENT_DATE + INTERVAL '180 days'),
  ('123e4567-e89b-12d3-a456-426614174000', 'Learn AI/ML Fundamentals', 'Complete online courses and build 3 ML projects', 'active', 20, 'learning', CURRENT_DATE + INTERVAL '120 days'),
  ('123e4567-e89b-12d3-a456-426614174000', 'Write a Book', 'Complete first draft of productivity guidebook', 'paused', 15, 'creative', CURRENT_DATE + INTERVAL '365 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE PROJECTS
-- ============================================================================

INSERT INTO public.projects (user_id, goal_id, name, description, color, is_archived) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.goals WHERE title = 'Launch Personal Assistant SaaS' LIMIT 1), 'MVP Development', 'Core features for Personal Assistant v1.0', '#3B82F6', false),
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.goals WHERE title = 'Launch Personal Assistant SaaS' LIMIT 1), 'Marketing Website', 'Landing page and marketing materials', '#10B981', false),
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.goals WHERE title = 'Learn AI/ML Fundamentals' LIMIT 1), 'ML Course Projects', 'Hands-on projects from online courses', '#8B5CF6', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE TASKS
-- ============================================================================

INSERT INTO public.tasks (user_id, project_id, title, description, completed, priority, due_date, tags) VALUES
  -- High priority tasks
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.projects WHERE name = 'MVP Development' LIMIT 1), 'Fix dashboard performance issues', 'Re-enable real data fetching with proper loading states', false, 'high', CURRENT_DATE + INTERVAL '2 days', ARRAY['bug', 'performance']),
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.projects WHERE name = 'MVP Development' LIMIT 1), 'Implement OpenAI voice command processing', 'Integrate GPT for natural language understanding', false, 'high', CURRENT_DATE + INTERVAL '5 days', ARRAY['feature', 'ai']),
  ('123e4567-e89b-12d3-a456-426614174000', NULL, 'Review and respond to important emails', 'Check inbox for urgent client communications', false, 'high', CURRENT_DATE, ARRAY['email', 'urgent']),

  -- Medium priority tasks
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.projects WHERE name = 'MVP Development' LIMIT 1), 'Add Playwright end-to-end tests', 'Test critical user flows for auth and task management', false, 'medium', CURRENT_DATE + INTERVAL '7 days', ARRAY['testing', 'quality']),
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.projects WHERE name = 'Marketing Website' LIMIT 1), 'Design landing page mockups', 'Create Figma designs for homepage and pricing page', false, 'medium', CURRENT_DATE + INTERVAL '10 days', ARRAY['design', 'marketing']),
  ('123e4567-e89b-12d3-a456-426614174000', NULL, 'Schedule dentist appointment', 'Annual checkup and cleaning', false, 'medium', CURRENT_DATE + INTERVAL '14 days', ARRAY['health', 'personal']),

  -- Low priority tasks
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.projects WHERE name = 'ML Course Projects' LIMIT 1), 'Watch ML course videos (Week 3)', 'Complete neural networks module', false, 'low', CURRENT_DATE + INTERVAL '21 days', ARRAY['learning', 'ai']),
  ('123e4567-e89b-12d3-a456-426614174000', NULL, 'Organize digital photos from last year', 'Sort and backup photos to cloud storage', false, 'low', CURRENT_DATE + INTERVAL '30 days', ARRAY['personal', 'organization']),

  -- Completed tasks
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.projects WHERE name = 'MVP Development' LIMIT 1), 'Set up Supabase database', 'Create all tables and RLS policies', true, 'high', CURRENT_DATE - INTERVAL '5 days', ARRAY['setup', 'database']),
  ('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM public.projects WHERE name = 'MVP Development' LIMIT 1), 'Integrate Google Calendar OAuth', 'Complete OAuth flow for calendar access', true, 'high', CURRENT_DATE - INTERVAL '3 days', ARRAY['feature', 'integration']),
  ('123e4567-e89b-12d3-a456-426614174000', NULL, 'Buy groceries for the week', 'Fresh vegetables, fruits, and proteins', true, 'medium', CURRENT_DATE - INTERVAL '1 day', ARRAY['personal', 'shopping'])
ON CONFLICT DO NOTHING;

-- Update completed_at for completed tasks
UPDATE public.tasks
SET completed_at = created_at + INTERVAL '2 hours'
WHERE completed = true AND completed_at IS NULL;

-- ============================================================================
-- SAMPLE HABITS
-- ============================================================================

INSERT INTO public.habits (user_id, name, description, frequency, target_count, current_streak, longest_streak, is_active) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'Morning Workout', 'Exercise for 30 minutes (cardio or strength training)', 'daily', 1, 7, 21, true),
  ('123e4567-e89b-12d3-a456-426614174000', 'Read for 30 Minutes', 'Read books, articles, or technical documentation', 'daily', 1, 5, 14, true),
  ('123e4567-e89b-12d3-a456-426614174000', 'Meditation', 'Practice mindfulness meditation for 10 minutes', 'daily', 1, 3, 12, true),
  ('123e4567-e89b-12d3-a456-426614174000', 'Drink 8 Glasses of Water', 'Stay hydrated throughout the day', 'daily', 8, 10, 18, true),
  ('123e4567-e89b-12d3-a456-426614174000', 'Journal', 'Write down thoughts, reflections, or gratitude', 'daily', 1, 2, 9, true),
  ('123e4567-e89b-12d3-a456-426614174000', 'Code Review', 'Review pull requests and provide feedback', 'daily', 1, 15, 25, true),
  ('123e4567-e89b-12d3-a456-426614174000', 'Learn Something New', 'Study new technology, technique, or concept', 'daily', 1, 4, 11, true),
  ('123e4567-e89b-12d3-a456-426614174000', 'Weekly Planning', 'Review week and plan priorities for next week', 'weekly', 1, 2, 8, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE HABIT ENTRIES (Last 7 days)
-- ============================================================================

DO $$
DECLARE
  habit_record RECORD;
  day_offset INTEGER;
BEGIN
  FOR habit_record IN SELECT id, name FROM public.habits WHERE user_id = '123e4567-e89b-12d3-a456-426614174000' AND frequency = 'daily' LOOP
    FOR day_offset IN 0..6 LOOP
      INSERT INTO public.habit_entries (user_id, habit_id, date, completed, count)
      VALUES (
        '123e4567-e89b-12d3-a456-426614174000',
        habit_record.id,
        CURRENT_DATE - day_offset,
        CASE
          -- Simulate realistic completion patterns
          WHEN day_offset < 3 THEN true  -- Last 3 days completed
          WHEN day_offset < 5 THEN (random() > 0.3)  -- 70% completion rate
          ELSE (random() > 0.5)  -- 50% completion rate for older days
        END,
        1
      )
      ON CONFLICT (habit_id, date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- SAMPLE NOTES
-- ============================================================================

INSERT INTO public.notes (user_id, title, content, category, tags, is_archived) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'Project Ideas for Q2', 'List of potential features:\n- Voice command customization\n- Team collaboration mode\n- Smart scheduling assistant\n- Email auto-categorization', 'idea', ARRAY['product', 'planning'], false),
  ('123e4567-e89b-12d3-a456-426614174000', 'Meeting Notes: Investor Call', 'Key points discussed:\n- Product-market fit validation\n- Revenue projections for next 12 months\n- Technical architecture scaling plan\n\nAction items:\n- Prepare pitch deck\n- Schedule follow-up meeting', 'meeting', ARRAY['business', 'fundraising'], false),
  ('123e4567-e89b-12d3-a456-426614174000', 'Reading List', 'Books to read:\n1. Atomic Habits - James Clear\n2. Deep Work - Cal Newport\n3. The Mom Test - Rob Fitzpatrick\n4. Shape Up - Ryan Singer', 'todo', ARRAY['learning', 'books'], false),
  ('123e4567-e89b-12d3-a456-426614174000', 'Contact: Sarah Chen - Product Designer', 'Email: sarah.chen@example.com\nLinkedIn: linkedin.com/in/sarahchen\nExpertise: UX/UI, Design Systems\nMet at: Tech Conference 2024\nNotes: Interested in freelance collaboration', 'people', ARRAY['networking', 'design'], false),
  ('123e4567-e89b-12d3-a456-426614174000', 'Grocery List for Party', 'Items needed:\n- Fresh vegetables for appetizers\n- 3 bottles of wine\n- Cheese platter ingredients\n- Dessert items\n- Paper plates and napkins', 'general', ARRAY['shopping', 'personal'], true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE VOICE COMMANDS (Recent usage)
-- ============================================================================

INSERT INTO public.voice_commands (user_id, command_text, intent, entities, response_text, success, processing_time_ms) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'Add task review pull requests', 'create_task', '{"task_title": "review pull requests"}', 'Task created: review pull requests', true, 245),
  ('123e4567-e89b-12d3-a456-426614174000', 'What are my high priority tasks?', 'query_tasks', '{"filter": "priority", "value": "high"}', 'You have 3 high priority tasks', true, 189),
  ('123e4567-e89b-12d3-a456-426614174000', 'Mark workout as done', 'complete_habit', '{"habit_name": "workout"}', 'Great job! Workout marked complete', true, 156),
  ('123e4567-e89b-12d3-a456-426614174000', 'Show my habit streaks', 'query_habits', '{"type": "streaks"}', 'Your longest streak is 21 days for Morning Workout', true, 198),
  ('123e4567-e89b-12d3-a456-426614174000', 'What meetings do I have today?', 'query_calendar', '{"timeframe": "today"}', 'You have 2 meetings scheduled today', true, 312)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify your seed data loaded correctly

-- SELECT 'User Profiles' as table_name, count(*) as row_count FROM public.user_profiles
-- UNION ALL
-- SELECT 'Goals', count(*) FROM public.goals
-- UNION ALL
-- SELECT 'Projects', count(*) FROM public.projects
-- UNION ALL
-- SELECT 'Tasks', count(*) FROM public.tasks
-- UNION ALL
-- SELECT 'Habits', count(*) FROM public.habits
-- UNION ALL
-- SELECT 'Habit Entries', count(*) FROM public.habit_entries
-- UNION ALL
-- SELECT 'Notes', count(*) FROM public.notes
-- UNION ALL
-- SELECT 'Voice Commands', count(*) FROM public.voice_commands;
