-- Add per-video hero/CTA styling + custom CSS
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS hero_font_family text,
  ADD COLUMN IF NOT EXISTS hero_headline_size integer,
  ADD COLUMN IF NOT EXISTS hero_subheadline_size integer,
  ADD COLUMN IF NOT EXISTS hero_text_color text,
  ADD COLUMN IF NOT EXISTS cta_bg_color text,
  ADD COLUMN IF NOT EXISTS cta_text_color text,
  ADD COLUMN IF NOT EXISTS custom_css text;