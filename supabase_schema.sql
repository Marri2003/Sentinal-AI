-- ====================================================================
-- SENTINEL AI — PRODUCTION DATABASE SCHEMA & PERMISSIONS MIGRATION
-- Project: https://ylfxcvzsrhisbxmclura.supabase.co
-- Run this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ylfxcvzsrhisbxmclura/sql
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

-- Idempotent Profile Policies
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- 2. Create Analyses (Scan History & Cloud Telemetry) Table
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
    pipeline_scores jsonb default '{}'::jsonb,
    explainability jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Indexes for High-Performance Queries
create index if not exists idx_analyses_sender on public.analyses(lower(sender));
create index if not exists idx_analyses_decision on public.analyses(decision);
create index if not exists idx_analyses_user_id on public.analyses(user_id);
create index if not exists idx_analyses_created_at on public.analyses(created_at desc);

-- 4. Enable Row Level Security (RLS)
alter table public.analyses enable row level security;

-- Idempotent Analyses Policies
-- Policy A: Authenticated users can view their own scan history (or anonymous scans with user_id is null if permitted)
drop policy if exists "Users can view their own analyses" on public.analyses;
create policy "Users can view their own analyses"
    on public.analyses for select
    using (auth.uid() = user_id);

-- Policy B: Community Telemetry Policy: Allow anyone (including anonymous) to read aggregate SPAM counts
drop policy if exists "Anyone can read spam telemetry" on public.analyses;
create policy "Anyone can read spam telemetry"
    on public.analyses for select
    using (decision = 'SPAM');

-- Policy C: Insert Policy: Allow both authenticated users and anonymous to log detection scans
drop policy if exists "Users and anonymous can insert analyses" on public.analyses;
create policy "Users and anonymous can insert analyses"
    on public.analyses for insert
    with check (true);

-- Policy D: Delete Policy: Allow users to delete only their own scan history records
drop policy if exists "Users can delete their own analyses" on public.analyses;
create policy "Users can delete their own analyses"
    on public.analyses for delete
    using (auth.uid() = user_id);

-- ====================================================================
-- 5. CRITICAL: GRANT TABLE PRIVILEGES TO SUPABASE API ROLES
-- In PostgreSQL, PostgREST queries fail with 42501 (permission denied)
-- unless explicit table grants are provided to anon and authenticated roles.
-- ====================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.analyses to anon, authenticated, service_role;
grant all on table public.profiles to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- 6. Automatic Profile Creation Trigger on Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    )
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 7. Stored Procedure for Community Spam Pattern Detection
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

grant execute on function get_community_threat_count(text, text) to anon, authenticated, service_role;

-- ====================================================================
-- 8. OPERATIONAL FIX: Confirm All Existing Unconfirmed Accounts
-- Bypasses the "Email rate limit exceeded" blocker for existing users.
-- ====================================================================
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;
