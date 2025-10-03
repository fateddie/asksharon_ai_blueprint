-- Personal Assistant Database Schema
-- This schema is designed to support a voice-first personal assistant
-- with the ability to scale into a commercial SaaS product (Ask Sharon)

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Users table (for future multi-user support)
-- For now, we'll use Supabase's built-in auth.users table
-- But we can extend it with profile information

create table public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  preferences jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table public.user_profiles enable row level security;

-- Create policies for user_profiles
create policy "Users can view own profile" on public.user_profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.user_profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.user_profiles
  for insert with check (auth.uid() = id);

-- Goals table (high-level objectives)
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  target_date date,
  status text check (status in ('active', 'completed', 'paused', 'cancelled')) default 'active',
  progress_percentage integer default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.goals enable row level security;
create policy "Users can manage own goals" on public.goals using (auth.uid() = user_id);

-- Projects table (optional grouping for tasks)
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  goal_id uuid references public.goals(id) on delete set null,
  name text not null,
  description text,
  color text default '#3B82F6',
  is_archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;
create policy "Users can manage own projects" on public.projects using (auth.uid() = user_id);

-- Tasks table (actionable items)
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  description text,
  completed boolean default false,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;
create policy "Users can manage own tasks" on public.tasks using (auth.uid() = user_id);

-- Habits table (recurring activities to track)
create table public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  frequency text check (frequency in ('daily', 'weekly', 'monthly')) default 'daily',
  target_count integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.habits enable row level security;
create policy "Users can manage own habits" on public.habits using (auth.uid() = user_id);

-- Habit entries table (daily tracking of habit completion)
create table public.habit_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  date date not null,
  completed boolean default false,
  count integer default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one entry per habit per day
  unique(habit_id, date)
);

alter table public.habit_entries enable row level security;
create policy "Users can manage own habit entries" on public.habit_entries using (auth.uid() = user_id);

-- Notes table (quick capture and organization)
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text check (category in ('general', 'todo', 'idea', 'people', 'meeting')) default 'general',
  tags text[] default '{}',
  is_archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notes enable row level security;
create policy "Users can manage own notes" on public.notes using (auth.uid() = user_id);

-- Voice commands log (for analytics and improving AI responses)
create table public.voice_commands (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  command_text text not null,
  intent text,
  entities jsonb default '{}',
  response_text text,
  success boolean default true,
  processing_time_ms integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.voice_commands enable row level security;
create policy "Users can view own voice commands" on public.voice_commands using (auth.uid() = user_id);

-- Email accounts table (for managing multiple email connections)
create table public.email_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email_address text not null,
  provider text check (provider in ('gmail', 'outlook', 'yahoo', 'other')) default 'gmail',
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_primary boolean default false,
  is_active boolean default true,
  last_sync timestamp with time zone,
  sync_status text check (sync_status in ('pending', 'syncing', 'completed', 'error')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one account per email per user
  unique(user_id, email_address)
);

alter table public.email_accounts enable row level security;
create policy "Users can manage own email accounts" on public.email_accounts using (auth.uid() = user_id);

-- Email metadata table (for email management features)
create table public.email_metadata (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email_account_id uuid references public.email_accounts(id) on delete cascade not null,
  message_id text not null,
  thread_id text,
  subject text,
  sender text,
  recipients text[],
  body_preview text,
  received_at timestamp with time zone,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  category text check (category in ('inbox', 'important', 'social', 'promotions', 'spam')) default 'inbox',
  is_read boolean default false,
  is_archived boolean default false,
  has_attachments boolean default false,
  ai_summary text,
  suggested_actions jsonb default '{}',
  labels text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one record per email per account
  unique(email_account_id, message_id)
);

alter table public.email_metadata enable row level security;
create policy "Users can manage own email metadata" on public.email_metadata using (auth.uid() = user_id);

-- Calendar events table (for appointment management)
create table public.calendar_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email_account_id uuid references public.email_accounts(id) on delete cascade not null,
  google_event_id text,
  title text not null,
  description text,
  location text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_all_day boolean default false,
  attendees jsonb default '[]',
  organizer text,
  status text check (status in ('confirmed', 'tentative', 'cancelled')) default 'confirmed',
  visibility text check (visibility in ('default', 'public', 'private', 'confidential')) default 'default',
  recurrence text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one record per Google event per account
  unique(email_account_id, google_event_id)
);

alter table public.calendar_events enable row level security;
create policy "Users can manage own calendar events" on public.calendar_events using (auth.uid() = user_id);

-- Analytics/insights table (for weekly summaries and trends)
create table public.analytics_snapshots (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  period text check (period in ('daily', 'weekly', 'monthly')) not null,
  metrics jsonb not null, -- Store calculated metrics as JSON
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one snapshot per user per date per period
  unique(user_id, date, period)
);

alter table public.analytics_snapshots enable row level security;
create policy "Users can view own analytics" on public.analytics_snapshots using (auth.uid() = user_id);

-- Functions to automatically update timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger handle_updated_at before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.goals
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.projects
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.tasks
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.habits
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.notes
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.email_accounts
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.email_metadata
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.calendar_events
  for each row execute procedure public.handle_updated_at();

-- Function to update habit streaks
create or replace function public.update_habit_streak(habit_id uuid, entry_date date, completed boolean)
returns void as $$
declare
  current_streak integer := 0;
  longest_streak integer := 0;
begin
  -- Calculate current streak
  if completed then
    -- Count consecutive days leading up to and including entry_date
    select count(*) into current_streak
    from public.habit_entries he
    where he.habit_id = update_habit_streak.habit_id
      and he.completed = true
      and he.date <= entry_date
      and not exists (
        select 1 from public.habit_entries he2
        where he2.habit_id = update_habit_streak.habit_id
          and he2.date > he.date
          and he2.date <= entry_date
          and he2.completed = false
      );
  else
    current_streak := 0;
  end if;

  -- Get current longest streak
  select h.longest_streak into longest_streak
  from public.habits h
  where h.id = update_habit_streak.habit_id;

  -- Update habit with new streak information
  update public.habits
  set
    current_streak = update_habit_streak.current_streak,
    longest_streak = greatest(longest_streak, update_habit_streak.current_streak),
    updated_at = timezone('utc'::text, now())
  where id = update_habit_streak.habit_id;
end;
$$ language plpgsql;

-- Trigger to update habit streaks when entries are modified
create or replace function public.handle_habit_entry_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    perform public.update_habit_streak(new.habit_id, new.date, new.completed);
    return new;
  elsif tg_op = 'DELETE' then
    -- Recalculate streak for the habit
    perform public.update_habit_streak(old.habit_id, old.date, false);
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger handle_habit_entry_change
  after insert or update or delete on public.habit_entries
  for each row execute procedure public.handle_habit_entry_change();

-- Insert sample data for development (optional)
-- This would be helpful for testing the app
insert into public.user_profiles (id, email, full_name, timezone) values
  ('123e4567-e89b-12d3-a456-426614174000', 'user@example.com', 'Sample User', 'America/New_York')
on conflict (id) do nothing;

-- Sample goals
insert into public.goals (id, user_id, title, description, status, progress_percentage) values
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Get Healthier', 'Focus on physical and mental wellbeing', 'active', 25),
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Launch Side Project', 'Build and launch my app idea', 'active', 60)
on conflict do nothing;

-- Sample habits
insert into public.habits (id, user_id, name, description, frequency, current_streak, longest_streak) values
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Morning Workout', 'Exercise for 30 minutes', 'daily', 5, 12),
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Read Daily', 'Read for at least 30 minutes', 'daily', 3, 8),
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', 'Meditate', 'Practice mindfulness meditation', 'daily', 1, 5)
on conflict do nothing;