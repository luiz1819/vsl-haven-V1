-- Add cover saturation control (0-100) for solid/gradient covers
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS cover_saturation integer NOT NULL DEFAULT 100;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'videos_cover_saturation_range'
  ) THEN
    ALTER TABLE public.videos
      ADD CONSTRAINT videos_cover_saturation_range
      CHECK (cover_saturation >= 0 AND cover_saturation <= 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_videos_cover_saturation ON public.videos (cover_saturation);