-- Add page_builder_config column to videos table
alter table "public"."videos" add column "page_builder_config" jsonb default '[]'::jsonb;
