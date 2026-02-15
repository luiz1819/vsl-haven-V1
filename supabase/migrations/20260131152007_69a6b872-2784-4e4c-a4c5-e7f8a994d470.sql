-- Add Bunny Stream integration fields
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS bunny_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready',
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS smart_autoplay_enabled BOOLEAN NOT NULL DEFAULT false;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_videos_bunny_id ON public.videos (bunny_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos (status);

-- Ensure valid status values (use trigger rather than CHECK to avoid immutability pitfalls)
CREATE OR REPLACE FUNCTION public.validate_video_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS NULL OR NEW.status = '' THEN
    NEW.status := 'ready';
  END IF;

  IF NEW.status NOT IN ('uploading','transcoding','ready','error') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_video_status ON public.videos;
CREATE TRIGGER trg_validate_video_status
BEFORE INSERT OR UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.validate_video_status();