-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Update links table to include is_original_content
alter table public.links add column if not exists is_original_content boolean default false;

-- Tables principales
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  avatar_url text,
  bio text,
  location text,
  website text,
  created_at timestamp with time zone default now()
);

create table if not exists public.links (
  id uuid default uuid_generate_v4() primary key,
  url text not null,
  title text not null,
  description text,
  thumbnail_url text,
  emoji_tags text[] default array[]::text[],
  topic_ids text[] default array[]::text[],
  is_original_content boolean default false,
  created_by uuid references public.users(id) not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  link_id uuid references public.links(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(link_id, user_id)
);

create table if not exists public.topics (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text not null,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.links enable row level security;
alter table public.likes enable row level security;
alter table public.topics enable row level security;

-- RLS Policies
-- Users policies
create policy "Users can view other users profiles"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Links policies
create policy "Anyone can view links"
  on public.links for select
  using (true);

create policy "Users can create links"
  on public.links for insert
  with check (auth.uid() = created_by);

create policy "Users can update own links"
  on public.links for update
  using (auth.uid() = created_by);

create policy "Users can delete own links"
  on public.links for delete
  using (auth.uid() = created_by);

-- Likes policies
create policy "Anyone can view likes"
  on public.likes for select
  using (true);

create policy "Users can manage their likes"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- Topics policies
create policy "Anyone can view topics"
  on public.topics for select
  using (true);

create policy "Users can create topics"
  on public.topics for insert
  with check (auth.uid() = created_by);