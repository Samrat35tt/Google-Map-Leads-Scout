-- ============================================================
-- SalesOxe — Supabase Schema Setup
-- Run this in the Supabase SQL Editor for project:
-- https://xdhvadweonrxpoknpyqf.supabase.co
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  name                text,
  plan                text not null default 'free' check (plan in ('free', 'growth', 'agency')),
  credits             integer not null default 100,
  is_admin            boolean not null default false,
  suspended           boolean not null default false,
  compliance_accepted boolean not null default false,
  settings            jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Admins can update any profile
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Auto-create profile on new user sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. CONTACTS
-- ============================================================
create table if not exists public.contacts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  name             text not null,
  address          text not null default '',
  phone            text,
  email            text,
  email_status     text check (email_status in ('verified', 'risky', 'invalid', 'unknown')),
  email_source     text check (email_source in ('apollo', 'hunter', 'manual', 'ai_inferred')),
  website          text,
  socials          jsonb,
  category         text not null default '',
  rating           numeric,
  review_count     integer,
  maps_url         text,
  pipeline_stage   text check (pipeline_stage in ('New Lead', 'Contacted', 'Interested', 'Meeting Booked', 'Closed', 'Lost')),
  outreach         jsonb,
  workflow_status  text check (workflow_status in ('idle', 'active', 'completed', 'failed')),
  current_step_id  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.contacts enable row level security;

create policy "Users can CRUD own contacts"
  on public.contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 3. WORKFLOWS
-- ============================================================
create table if not exists public.workflows (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  is_active  boolean not null default false,
  steps      jsonb not null default '[]',
  settings   jsonb not null default '{}',
  logs       jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workflows enable row level security;

create policy "Users can CRUD own workflows"
  on public.workflows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 4. WORKFLOW LEADS (junction table)
-- ============================================================
create table if not exists public.workflow_leads (
  id          uuid primary key default uuid_generate_v4(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (workflow_id, contact_id)
);

alter table public.workflow_leads enable row level security;

create policy "Users can CRUD own workflow_leads"
  on public.workflow_leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 5. CONVERSATIONS
-- ============================================================
create table if not exists public.conversations (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  contact_id        uuid not null,
  lead_name         text not null,
  lead_email        text,
  last_message      text not null default '',
  last_message_time timestamptz not null default now(),
  unread_count      integer not null default 0,
  channel           text not null check (channel in ('email', 'sms', 'linkedin')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "Users can CRUD own conversations"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 6. MESSAGES
-- ============================================================
create table if not exists public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  sender          text not null check (sender in ('user', 'lead')),
  content         text not null,
  channel         text not null check (channel in ('email', 'sms', 'linkedin')),
  timestamp       timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can CRUD own messages"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 7. KNOWLEDGE DOCUMENTS
-- ============================================================
create table if not exists public.knowledge_documents (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  content    text not null,
  type       text not null check (type in ('text', 'url', 'file')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.knowledge_documents enable row level security;

create policy "Users can CRUD own knowledge_documents"
  on public.knowledge_documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 8. MEETINGS
-- ============================================================
create table if not exists public.meetings (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  date       timestamptz not null,
  provider   text not null check (provider in ('fireflies', 'fathom', 'manual')),
  status     text not null default 'analyzing' check (status in ('analyzing', 'completed', 'failed')),
  summary    text,
  transcript text,
  proposal   text,
  contact_id uuid,
  created_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

create policy "Users can CRUD own meetings"
  on public.meetings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 9. SEARCH LOGS
-- ============================================================
create table if not exists public.search_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  industry      text not null,
  country       text not null,
  location      text not null default '',
  results_count integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.search_logs enable row level security;

create policy "Users can CRUD own search_logs"
  on public.search_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Done! All tables and RLS policies created.
-- ============================================================