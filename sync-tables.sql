-- Additional tables for Gmail and Calendar sync functionality
-- These extend the existing schema to support automatic data synchronization

-- Update user_profiles to support Google OAuth tokens and sync settings
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS gmail_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS calendar_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE;

-- User emails table (for Gmail sync data)
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

ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own emails" ON public.user_emails USING (auth.uid() = user_id);

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

ALTER TABLE public.user_email_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own email stats" ON public.user_email_stats USING (auth.uid() = user_id);

-- User calendar events table (for Calendar sync data)
CREATE TABLE IF NOT EXISTS public.user_calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id TEXT NOT NULL,
  calendar_id TEXT,
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

  -- Ensure one record per event per user
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own calendar events" ON public.user_calendar_events USING (auth.uid() = user_id);

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

ALTER TABLE public.user_calendar_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own calendar stats" ON public.user_calendar_stats USING (auth.uid() = user_id);

-- Add updated_at triggers for the new tables
CREATE TRIGGER handle_updated_at_user_email_stats
  BEFORE UPDATE ON public.user_email_stats
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_calendar_stats
  BEFORE UPDATE ON public.user_calendar_stats
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_emails_user_date ON public.user_emails(user_id, date_received);
CREATE INDEX IF NOT EXISTS idx_user_emails_unread ON public.user_emails(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_start ON public.user_calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_today ON public.user_calendar_events(user_id, start_time)
  WHERE start_time >= CURRENT_DATE AND start_time < CURRENT_DATE + INTERVAL '1 day';

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