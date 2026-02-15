create table "public"."landing_pages" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null default auth.uid(),
  "title" text not null,
  "slug" text, -- friendly url part
  "config" jsonb default '{"sections": []}'::jsonb,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  primary key ("id")
);

-- RLS Policies
alter table "public"."landing_pages" enable row level security;

create policy "Users can view their own pages"
on "public"."landing_pages"
for select
to authenticated
using ((auth.uid() = user_id));

create policy "Users can insert their own pages"
on "public"."landing_pages"
for insert
to authenticated
with check ((auth.uid() = user_id));

create policy "Users can update their own pages"
on "public"."landing_pages"
for update
to authenticated
using ((auth.uid() = user_id));

create policy "Users can delete their own pages"
on "public"."landing_pages"
for delete
to authenticated
using ((auth.uid() = user_id));
