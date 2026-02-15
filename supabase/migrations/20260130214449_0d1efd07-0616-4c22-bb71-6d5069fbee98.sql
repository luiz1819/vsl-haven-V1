-- Add CTA + page config fields to videos
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS vsl_page_type text NOT NULL DEFAULT 'embed',
ADD COLUMN IF NOT EXISTS hero_headline text NULL,
ADD COLUMN IF NOT EXISTS hero_subheadline text NULL,
ADD COLUMN IF NOT EXISTS cta_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS cta_delay_seconds integer NULL,
ADD COLUMN IF NOT EXISTS cta_text text NULL,
ADD COLUMN IF NOT EXISTS cta_url text NULL,
ADD COLUMN IF NOT EXISTS cta_variant text NOT NULL DEFAULT 'hero';

-- Basic sanity index for filtering by type (optional)
CREATE INDEX IF NOT EXISTS idx_videos_vsl_page_type ON public.videos (vsl_page_type);

-- Ensure RLS remains enabled (already is) and existing policies cover the new columns.
