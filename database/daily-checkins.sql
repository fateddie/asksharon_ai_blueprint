-- Daily Check-ins Table
-- Tracks daily habits, sleep times, and day ratings

create table if not exists public.daily_checkins (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  date date not null,
  wake_time time,
  sleep_time time,
  day_rating integer check (day_rating >= 1 and day_rating <= 10),
  mood text,
  notes text,
  habits_completed text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure one check-in per user per day
  unique(user_id, date)
);

-- Enable RLS
alter table public.daily_checkins enable row level security;

-- Create policy for user access
create policy "Users can manage own check-ins" on public.daily_checkins
  for all using (user_id = current_setting('app.current_user_id', true)::text);

-- Create trigger for updated_at
create trigger handle_daily_checkins_updated_at
  before update on public.daily_checkins
  for each row execute procedure public.handle_updated_at();

-- Create index for faster queries
create index idx_daily_checkins_user_date on public.daily_checkins(user_id, date desc);
