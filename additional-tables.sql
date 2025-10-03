-- Additional tables for Gmail and Calendar integration
-- These complement the existing schema for real-time data sync

-- User emails table (for Gmail sync)
create table if not exists public.user_emails (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email_id text not null,
  thread_id text,
  subject text,
  sender text,
  recipients text[],
  date_received timestamp with time zone,
  snippet text,
  is_read boolean default false,
  is_important boolean default false,
  labels text[] default '{}',
  has_attachments boolean default false,
  synced_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one email per user per email_id
  unique(user_id, email_id)
);

-- User email stats table (for dashboard)
create table if not exists public.user_email_stats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  total_emails integer default 0,
  unread_count integer default 0,
  important_count integer default 0,
  today_count integer default 0,
  week_count integer default 0,
  top_senders jsonb default '[]',
  last_sync timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- One stats record per user
  unique(user_id)
);

-- User calendar events table (for Calendar sync)
create table if not exists public.user_calendar_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id text not null,
  calendar_id text default 'primary',
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  attendees jsonb default '[]',
  is_all_day boolean default false,
  status text check (status in ('confirmed', 'tentative', 'cancelled')) default 'confirmed',
  visibility text check (visibility in ('default', 'public', 'private', 'confidential')) default 'default',
  recurrence text[],
  meeting_link text,
  organizer jsonb,
  synced_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one event per user per event_id
  unique(user_id, event_id)
);

-- User calendar stats table (for dashboard)
create table if not exists public.user_calendar_stats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  total_events integer default 0,
  today_events integer default 0,
  week_events integer default 0,
  month_events integer default 0,
  upcoming_events integer default 0,
  busy_hours numeric default 0,
  free_hours numeric default 0,
  most_busy_day text,
  average_events_per_day numeric default 0,
  last_sync timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- One stats record per user
  unique(user_id)
);

-- Enable Row Level Security
alter table public.user_emails enable row level security;
alter table public.user_email_stats enable row level security;
alter table public.user_calendar_events enable row level security;
alter table public.user_calendar_stats enable row level security;

-- RLS Policies
create policy "Users can manage own emails" on public.user_emails using (auth.uid() = user_id);
create policy "Users can manage own email stats" on public.user_email_stats using (auth.uid() = user_id);
create policy "Users can manage own calendar events" on public.user_calendar_events using (auth.uid() = user_id);
create policy "Users can manage own calendar stats" on public.user_calendar_stats using (auth.uid() = user_id);

-- Updated at triggers
create trigger handle_updated_at before update on public.user_email_stats
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.user_calendar_stats
  for each row execute procedure public.handle_updated_at();