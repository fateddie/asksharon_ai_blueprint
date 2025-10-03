-- Add missing tables for tasks and habits functionality

-- Tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  status text check (status in ('pending', 'in_progress', 'completed', 'cancelled')) default 'pending',
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  estimated_time integer, -- minutes
  actual_time integer, -- minutes
  tags text[] default '{}',

  -- Agent-related fields
  created_by_agent text,
  agent_confidence float,
  source_email_id text,
  estimated_effort_minutes integer,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;
create policy "Users can manage own tasks" on public.tasks using (auth.uid() = user_id);

-- Habits table
create table public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  category text,
  frequency text check (frequency in ('daily', 'weekly', 'monthly')) default 'daily',
  target_count integer default 1,
  is_active boolean default true,
  icon text,
  color text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.habits enable row level security;
create policy "Users can manage own habits" on public.habits using (auth.uid() = user_id);

-- Habit completions table
create table public.habit_completions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  completed_date date not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,

  -- Ensure one completion per habit per day
  unique(habit_id, completed_date)
);

alter table public.habit_completions enable row level security;
create policy "Users can manage own habit completions" on public.habit_completions using (auth.uid() = user_id);

-- Add triggers for updated_at
create trigger handle_updated_at before update on public.tasks
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.habits
  for each row execute procedure public.handle_updated_at();

-- Agent requests table (for tracking agent usage)
create table public.agent_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_type text not null,
  input_data jsonb not null,
  output_data jsonb,
  processing_time_ms integer,
  success boolean,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.agent_requests enable row level security;
create policy "Users can view own agent requests" on public.agent_requests using (auth.uid() = user_id);

-- Agent feedback table (for learning)
create table public.agent_feedback (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.agent_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  feedback_type text check (feedback_type in ('positive', 'negative', 'correction')) not null,
  feedback_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.agent_feedback enable row level security;
create policy "Users can manage own agent feedback" on public.agent_feedback using (auth.uid() = user_id);

-- Email analysis cache table
create table public.email_analysis (
  id uuid default uuid_generate_v4() primary key,
  email_id text unique not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  priority text not null,
  action_items jsonb default '[]',
  sentiment_score float,
  confidence float,
  processed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.email_analysis enable row level security;
create policy "Users can view own email analysis" on public.email_analysis using (auth.uid() = user_id);

-- Indexes for performance
create index idx_tasks_user_id_status on public.tasks(user_id, status);
create index idx_tasks_due_date on public.tasks(due_date) where due_date is not null;
create index idx_habits_user_id_active on public.habits(user_id, is_active);
create index idx_habit_completions_user_date on public.habit_completions(user_id, completed_date);
create index idx_agent_requests_user_type on public.agent_requests(user_id, agent_type);
create index idx_email_analysis_user_email on public.email_analysis(user_id, email_id);