-- Add VSL player customization columns (non-breaking; keeps existing columns too)
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#00C853',
  ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT '16:9',
  ADD COLUMN IF NOT EXISTS play_button_style text DEFAULT 'circular',
  ADD COLUMN IF NOT EXISTS controls_visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS smart_autoplay boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS fake_live_mode boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS domain_lock text;