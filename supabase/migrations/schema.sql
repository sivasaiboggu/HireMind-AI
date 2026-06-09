-- ====================================================================
-- HIREMIND AI - DATABASE SCHEMA MIGRATION
-- Run this script in your Supabase SQL Editor (https://supabase.com)
-- ====================================================================

-- 1. PROFILES TABLE (Extends Auth.Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  target_role text,
  credits integer default 100,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Drop existing policies if they exist to prevent conflicts
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- Create Policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);


-- 2. TRIGGER FOR NEW AUTH USERS
-- Automatically creates a profile record when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, credits)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', 'Professional Candidate'), 
    100
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. RESUME ANALYSES TABLE
create table if not exists public.saved_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  timestamp bigint not null,
  job_role text not null,
  experience_level text not null,
  ats_score integer not null,
  content_score integer not null,
  format_score integer not null,
  overall_score integer not null,
  data jsonb not null
);

-- Enable RLS
alter table public.saved_resumes enable row level security;

-- Policies
drop policy if exists "Users can manage their own resumes" on public.saved_resumes;
create policy "Users can manage their own resumes" on public.saved_resumes
  for all using (auth.uid() = user_id);


-- 4. INTERVIEW SESSIONS TABLE
create table if not exists public.saved_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  timestamp bigint not null,
  config jsonb not null,
  answers jsonb not null,
  overall_score numeric not null
);

-- Enable RLS
alter table public.saved_interviews enable row level security;

-- Policies
drop policy if exists "Users can manage their own interviews" on public.saved_interviews;
create policy "Users can manage their own interviews" on public.saved_interviews
  for all using (auth.uid() = user_id);


-- 5. LEARNING ROADMAPS TABLE
create table if not exists public.saved_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  timestamp bigint not null,
  role text not null,
  total_weeks integer not null,
  phases jsonb not null,
  skill_gaps jsonb not null,
  completed_phases jsonb default '[]'::jsonb
);

-- Enable RLS
alter table public.saved_roadmaps enable row level security;

-- Policies
drop policy if exists "Users can manage their own roadmaps" on public.saved_roadmaps;
create policy "Users can manage their own roadmaps" on public.saved_roadmaps
  for all using (auth.uid() = user_id);
