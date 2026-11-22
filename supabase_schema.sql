-- ====================================================================
-- SENTINEL AI — COMPLETE SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ====================================================================

-- 1. Create Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Profile Policies
create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- 2. Create Analyses (Scan History & Community Telemetry) Table
create table if not exists public.analyses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete set null,
    message_text text,
    sender text,
    phone text,
    detected_url text,
    risk_score float not null default 0.0,
    risk_level text not null default 'LOW', -- 'HIGH', 'MEDIUM', 'LOW'
    decision text not null default 'HAM',   -- 'SPAM', 'HAM'
    pipeline_scores jsonb,
    explainability jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Indexes for fast spam community pattern search
create index if not exists idx_analyses_sender on public.analyses(lower(sender));
create index if not exists idx_analyses_decision on public.analyses(decision);
create index if not exists idx_analyses_user_id on public.analyses(user_id);
create index if not exists idx_analyses_created_at on public.analyses(created_at desc);

-- Enable RLS for Analyses
alter table public.analyses enable row level security;

-- Analyses Policies
-- A. Logged-in users can ONLY view their own scan history (strict ownership check)
create policy "Users can view their own analyses"
    on public.analyses for select
    using (auth.uid() = user_id);

-- B. Community Telemetry Policy: Allow anyone (including anonymous) to read aggregate SPAM counts
--    This is separate from the user history policy, so user's HAM records are never exposed.
create policy "Anyone can read spam telemetry"
    on public.analyses for select
    using (decision = 'SPAM');

-- 3. Automatic Profile Creation Trigger on Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    );
    return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 4. Stored Procedure for Community Spam Detection
create or replace function get_community_threat_count(check_sender text, search_keyword text default '')
returns integer as $$
declare
    threat_count integer;
begin
    select count(*)::integer into threat_count
    from public.analyses
    where decision = 'SPAM'
      and (
        (check_sender is not null and length(trim(check_sender)) > 0 and lower(sender) = lower(trim(check_sender)))
        or
        (search_keyword is not null and length(trim(search_keyword)) > 4 and message_text ilike '%' || trim(search_keyword) || '%')
      );
    return threat_count;
end;
$$ language plpgsql security definer;
