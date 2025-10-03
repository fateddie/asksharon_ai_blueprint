-- Complete Personal Assistant Database Schema
-- Includes original schema + additional tables for Gmail/Calendar integration

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Users table (for future multi-user support)
-- For now, we'll use Supabase's built-in auth.users table
-- But we can extend it with profile information

create table public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  user_id text unique not null,
  email text unique not null,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  preferences jsonb default '{}',
  last_sync timestamp with time zone,
  gmail_enabled boolean default false,
  calendar_enabled boolean default false,
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

-- User emails table (for Gmail sync) - matches current code expectations
create table public.user_emails (
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

alter table public.user_emails enable row level security;
create policy "Users can manage own emails" on public.user_emails using (auth.uid() = user_id);

-- User email stats table (for dashboard) - matches current code expectations
create table public.user_email_stats (
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

alter table public.user_email_stats enable row level security;
create policy "Users can manage own email stats" on public.user_email_stats using (auth.uid() = user_id);

-- User calendar events table (for Calendar sync) - matches current code expectations
create table public.user_calendar_events (
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

alter table public.user_calendar_events enable row level security;
create policy "Users can manage own calendar events" on public.user_calendar_events using (auth.uid() = user_id);

-- User calendar stats table (for dashboard) - matches current code expectations
create table public.user_calendar_stats (
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

alter table public.user_calendar_stats enable row level security;
create policy "Users can manage own calendar stats" on public.user_calendar_stats using (auth.uid() = user_id);

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
create trigger handle_updated_at before update on public.email_accounts
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.user_email_stats
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.user_calendar_stats
  for each row execute procedure public.handle_updated_at();