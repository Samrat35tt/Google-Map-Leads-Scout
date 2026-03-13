
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// 🔌 CONNECT TO SERVER (DATABASE)
// ------------------------------------------------------------------
// 1. Create a free project at https://database.new (Supabase)
// 2. Go to Project Settings -> API
// 3. Copy "Project URL" and "anon public" Key
// 4. Paste them below:

export const SUPABASE_URL = 'https://xdhvadweonrxpoknpyqf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaHZhZHdlb25yeHBva25weXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxOTAyMDQsImV4cCI6MjA4MTc2NjIwNH0.YZjLG145p5vO2dXj30xiI1RNLba-Ob3aCsR6sXzzHtk';

// ------------------------------------------------------------------
// 🛠️ DATABASE SETUP (SQL)
// ------------------------------------------------------------------
/*
  Copy and run this script in your Supabase SQL Editor to create the tables.
  If you see "relation already exists", it means your database is already set up!

  -- 1. Create Profiles Table (Safe Mode)
  create table if not exists profiles (
    id uuid references auth.users not null primary key,
    email text,
    plan text default 'free',
    credits int default 50,
    suspended boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now())
  );

  -- 2. Create Data Tables (Safe Mode)
  create table if not exists contacts ( id text primary key, user_id uuid references auth.users, data jsonb );
  create table if not exists workflows ( id text primary key, user_id uuid references auth.users, data jsonb );
  create table if not exists voice_agents ( id text primary key, user_id uuid references auth.users, data jsonb );
  create table if not exists phone_numbers ( id text primary key, user_id uuid references auth.users, data jsonb );
  create table if not exists search_history ( id text primary key, user_id uuid references auth.users, data jsonb );
  create table if not exists conversations ( id text primary key, user_id uuid references auth.users, data jsonb );

  -- 3. Enable Security (Row Level Security)
  -- Note: If you get "policy already exists", you can ignore it.
  alter table profiles enable row level security;
  create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
  create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
  create policy "Users can delete own profile" on profiles for delete using (auth.uid() = id);
  
  alter table contacts enable row level security;
  create policy "Users manage contacts" on contacts for all using (auth.uid() = user_id);

  alter table workflows enable row level security;
  create policy "Users manage workflows" on workflows for all using (auth.uid() = user_id);

  alter table voice_agents enable row level security;
  create policy "Users manage agents" on voice_agents for all using (auth.uid() = user_id);

  alter table phone_numbers enable row level security;
  create policy "Users manage numbers" on phone_numbers for all using (auth.uid() = user_id);

  alter table search_history enable row level security;
  create policy "Users manage history" on search_history for all using (auth.uid() = user_id);

  alter table conversations enable row level security;
  create policy "Users manage conversations" on conversations for all using (auth.uid() = user_id);

  -- 4. Account Deletion Helper (Allows user to self-delete from auth.users)
  create or replace function delete_own_account()
  returns void as $$
  begin
    delete from auth.users where id = auth.uid();
  end;
  $$ language plpgsql security definer;

  -- 5. Admin Helper (Optional)
  create or replace function delete_user_by_admin(user_id uuid)
  returns void as $$
  begin
    delete from auth.users where id = user_id;
  end;
  $$ language plpgsql security definer;
*/

// ------------------------------------------------------------------

export const isSupabaseConfigured = () => {
  return false; // Force local storage mode since we removed authentication
  // return SUPABASE_URL.includes('supabase.co') && SUPABASE_ANON_KEY.length > 20;
};

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);
