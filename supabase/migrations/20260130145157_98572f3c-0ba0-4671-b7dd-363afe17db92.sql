-- Profiles table (user metadata)
create table if not exists public.profiles (
  user_id uuid primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using (auth.uid() = user_id);

-- Updated-at trigger
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

-- Videos table
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  bucket_id text not null default 'vsl-videos',
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_videos_user_id_created_at on public.videos (user_id, created_at desc);

alter table public.videos enable row level security;

create policy "Users can view their own videos"
on public.videos
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own videos"
on public.videos
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own videos"
on public.videos
for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own videos"
on public.videos
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists update_videos_updated_at on public.videos;
create trigger update_videos_updated_at
before update on public.videos
for each row
execute function public.update_updated_at_column();

-- Storage bucket for VSL videos (private)
insert into storage.buckets (id, name, public)
values ('vsl-videos', 'vsl-videos', false)
on conflict (id) do nothing;

-- Storage policies: each user can manage objects under folder "{user_id}/..."
create policy "Users can read their own VSL videos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vsl-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can upload their own VSL videos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'vsl-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own VSL videos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'vsl-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own VSL videos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vsl-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
