-- ============================================================================
-- Personal Assistant - Complete Database Schema
-- ============================================================================
-- This schema supports a voice-first personal assistant application
-- Designed to scale from single-user to commercial SaaS ("Ask Sharon")
--
-- Version: 1.0
-- Last Updated: 2025-10-03
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',

  -- Google OAuth integration fields
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expires_at TIMESTAMP WITH TIME ZONE,
  gmail_enabled BOOLEAN DEFAULT false,
  calendar_enabled BOOLEAN DEFAULT false,
  last_sync TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- PRODUCTIVITY TABLES (Tasks, Habits, Goals, Projects, Notes)
-- ============================================================================

-- Goals table (high-level objectives)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Projects table (optional grouping for tasks)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks table (actionable items)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habits table (recurring activities to track)
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
  target_count INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habit entries table (daily tracking of habit completion)
CREATE TABLE IF NOT EXISTS public.habit_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one entry per habit per day
  UNIQUE(habit_id, date)
);

-- Notes table (quick capture and organization)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('general', 'todo', 'idea', 'people', 'meeting')) DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- VOICE COMMAND TABLES
-- ============================================================================

-- Voice commands log (for analytics and improving AI responses)
CREATE TABLE IF NOT EXISTS public.voice_commands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  command_text TEXT NOT NULL,
  intent TEXT,
  entities JSONB DEFAULT '{}',
  response_text TEXT,
  success BOOLEAN DEFAULT true,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- EMAIL INTEGRATION TABLES
-- ============================================================================

-- Email accounts table (for managing multiple email connections)
CREATE TABLE IF NOT EXISTS public.email_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_address TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('gmail', 'outlook', 'yahoo', 'other')) DEFAULT 'gmail',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status TEXT CHECK (sync_status IN ('pending', 'syncing', 'completed', 'error')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one account per email per user
  UNIQUE(user_id, email_address)
);

-- Email metadata table (for email management features)
CREATE TABLE IF NOT EXISTS public.email_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_account_id UUID REFERENCES public.email_accounts(id) ON DELETE CASCADE NOT NULL,
  message_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT,
  sender TEXT,
  recipients TEXT[],
  body_preview TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  category TEXT CHECK (category IN ('inbox', 'important', 'social', 'promotions', 'spam')) DEFAULT 'inbox',
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  ai_summary TEXT,
  suggested_actions JSONB DEFAULT '{}',
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one record per email per account
  UNIQUE(email_account_id, message_id)
);

-- User emails table (simplified Gmail sync - duplicates email_metadata functionality)
-- Note: Consider merging with email_metadata in future migration
CREATE TABLE IF NOT EXISTS public.user_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT,
  sender TEXT,
  recipients TEXT[],
  date_received TIMESTAMP WITH TIME ZONE,
  snippet TEXT,
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  labels TEXT[] DEFAULT '{}',
  has_attachments BOOLEAN DEFAULT false,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one record per email per user
  UNIQUE(user_id, email_id)
);

-- User email stats table (aggregated Gmail statistics)
CREATE TABLE IF NOT EXISTS public.user_email_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_emails INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  important_count INTEGER DEFAULT 0,
  today_count INTEGER DEFAULT 0,
  week_count INTEGER DEFAULT 0,
  top_senders JSONB DEFAULT '[]',
  last_sync TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- CALENDAR INTEGRATION TABLES
-- ============================================================================

-- Calendar events table (primary calendar events storage)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_account_id UUID REFERENCES public.email_accounts(id) ON DELETE CASCADE NOT NULL,
  google_event_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  attendees JSONB DEFAULT '[]',
  organizer TEXT,
  status TEXT CHECK (status IN ('confirmed', 'tentative', 'cancelled')) DEFAULT 'confirmed',
  visibility TEXT CHECK (visibility IN ('default', 'public', 'private', 'confidential')) DEFAULT 'default',
  recurrence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one record per Google event per account
  UNIQUE(email_account_id, google_event_id)
);

-- User calendar events table (alternative calendar events storage)
-- Note: Consider merging with calendar_events in future migration
CREATE TABLE IF NOT EXISTS public.user_calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id TEXT NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]',
  is_all_day BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('confirmed', 'tentative', 'cancelled')) DEFAULT 'confirmed',
  visibility TEXT CHECK (visibility IN ('default', 'public', 'private', 'confidential')) DEFAULT 'default',
  recurrence TEXT[],
  meeting_link TEXT,
  organizer JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one event per user per event_id
  UNIQUE(user_id, event_id)
);

-- User calendar stats table (aggregated Calendar statistics)
CREATE TABLE IF NOT EXISTS public.user_calendar_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_events INTEGER DEFAULT 0,
  today_events INTEGER DEFAULT 0,
  week_events INTEGER DEFAULT 0,
  month_events INTEGER DEFAULT 0,
  upcoming_events INTEGER DEFAULT 0,
  busy_hours NUMERIC(4,1) DEFAULT 0,
  free_hours NUMERIC(4,1) DEFAULT 8,
  most_busy_day TEXT,
  average_events_per_day NUMERIC(4,1) DEFAULT 0,
  last_sync TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Analytics/insights table (for weekly summaries and trends)
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly')) NOT NULL,
  metrics JSONB NOT NULL, -- Store calculated metrics as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one snapshot per user per date per period
  UNIQUE(user_id, date, period)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_email_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Productivity tables policies
CREATE POLICY "Users can manage own goals" ON public.goals USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own projects" ON public.projects USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON public.tasks USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habits" ON public.habits USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habit entries" ON public.habit_entries USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notes" ON public.notes USING (auth.uid() = user_id);

-- Voice commands policies
CREATE POLICY "Users can view own voice commands" ON public.voice_commands USING (auth.uid() = user_id);

-- Email policies
CREATE POLICY "Users can manage own email accounts" ON public.email_accounts USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own email metadata" ON public.email_metadata USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own emails" ON public.user_emails USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own email stats" ON public.user_email_stats USING (auth.uid() = user_id);

-- Calendar policies
CREATE POLICY "Users can manage own calendar events" ON public.calendar_events USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own user calendar events" ON public.user_calendar_events USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own calendar stats" ON public.user_calendar_stats USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON public.analytics_snapshots USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_emails_user_date ON public.user_emails(user_id, date_received);
CREATE INDEX IF NOT EXISTS idx_user_emails_unread ON public.user_emails(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_start ON public.user_calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_today ON public.user_calendar_events(user_id, start_time)
  WHERE start_time >= CURRENT_DATE AND start_time < CURRENT_DATE + INTERVAL '1 day';

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.email_accounts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.email_metadata
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_user_email_stats BEFORE UPDATE ON public.user_email_stats
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_user_calendar_stats BEFORE UPDATE ON public.user_calendar_stats
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to update habit streaks
CREATE OR REPLACE FUNCTION public.update_habit_streak(habit_id UUID, entry_date DATE, completed BOOLEAN)
RETURNS VOID AS $$
DECLARE
  current_streak INTEGER := 0;
  longest_streak INTEGER := 0;
BEGIN
  -- Calculate current streak
  IF completed THEN
    -- Count consecutive days leading up to and including entry_date
    SELECT count(*) INTO current_streak
    FROM public.habit_entries he
    WHERE he.habit_id = update_habit_streak.habit_id
      AND he.completed = true
      AND he.date <= entry_date
      AND NOT EXISTS (
        SELECT 1 FROM public.habit_entries he2
        WHERE he2.habit_id = update_habit_streak.habit_id
          AND he2.date > he.date
          AND he2.date <= entry_date
          AND he2.completed = false
      );
  ELSE
    current_streak := 0;
  END IF;

  -- Get current longest streak
  SELECT h.longest_streak INTO longest_streak
  FROM public.habits h
  WHERE h.id = update_habit_streak.habit_id;

  -- Update habit with new streak information
  UPDATE public.habits
  SET
    current_streak = update_habit_streak.current_streak,
    longest_streak = GREATEST(longest_streak, update_habit_streak.current_streak),
    updated_at = timezone('utc'::text, now())
  WHERE id = update_habit_streak.habit_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update habit streaks when entries are modified
CREATE OR REPLACE FUNCTION public.handle_habit_entry_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.update_habit_streak(NEW.habit_id, NEW.date, NEW.completed);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Recalculate streak for the habit
    PERFORM public.update_habit_streak(OLD.habit_id, OLD.date, false);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_habit_entry_change
  AFTER INSERT OR UPDATE OR DELETE ON public.habit_entries
  FOR EACH ROW EXECUTE PROCEDURE public.handle_habit_entry_change();

-- Function to sync user profile with session data
CREATE OR REPLACE FUNCTION public.sync_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_access_token TEXT DEFAULT NULL,
  p_refresh_token TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    google_access_token,
    google_refresh_token,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_name,
    p_access_token,
    p_refresh_token,
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    google_access_token = COALESCE(EXCLUDED.google_access_token, public.user_profiles.google_access_token),
    google_refresh_token = COALESCE(EXCLUDED.google_refresh_token, public.user_profiles.google_refresh_token),
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- ============================================================================

-- Sample user profile
INSERT INTO public.user_profiles (id, email, full_name, timezone) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'user@example.com', 'Sample User', 'America/New_York')
ON CONFLICT (id) DO NOTHING;

-- Sample goals
INSERT INTO public.goals (id, user_id, title, description, status, progress_percentage) VALUES
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Get Healthier', 'Focus on physical and mental wellbeing', 'active', 25),
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Launch Side Project', 'Build and launch my app idea', 'active', 60)
ON CONFLICT DO NOTHING;

-- Sample habits
INSERT INTO public.habits (id, user_id, name, description, frequency, current_streak, longest_streak) VALUES
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Morning Workout', 'Exercise for 30 minutes', 'daily', 5, 12),
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Read Daily', 'Read for at least 30 minutes', 'daily', 3, 8),
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Meditate', 'Practice mindfulness meditation', 'daily', 1, 5)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTES FOR FUTURE MIGRATIONS
-- ============================================================================
-- 1. Consider merging user_emails with email_metadata (duplicate functionality)
-- 2. Consider merging user_calendar_events with calendar_events (duplicate functionality)
-- 3. Add foreign key indexes for better join performance
-- 4. Consider partitioning voice_commands table by date for scalability
-- ============================================================================
