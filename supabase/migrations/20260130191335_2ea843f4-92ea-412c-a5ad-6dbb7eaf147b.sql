-- Add cover overlay customization fields for VSL placeholder
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS cover_mode text NOT NULL DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS cover_opacity integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS cover_gradient_from text NULL,
  ADD COLUMN IF NOT EXISTS cover_gradient_to text NULL,
  ADD COLUMN IF NOT EXISTS cover_image_url text NULL;

-- Basic safety constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'videos_cover_opacity_range'
  ) THEN
    ALTER TABLE public.videos
      ADD CONSTRAINT videos_cover_opacity_range
      CHECK (cover_opacity >= 0 AND cover_opacity <= 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_videos_cover_mode ON public.videos (cover_mode);