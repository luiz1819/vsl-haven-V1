ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS smart_prompt_title TEXT,
ADD COLUMN IF NOT EXISTS smart_prompt_subtitle TEXT,
ADD COLUMN IF NOT EXISTS smart_prompt_variant TEXT NOT NULL DEFAULT 'default';

COMMENT ON COLUMN public.videos.smart_prompt_title IS 'Smart Player overlay title text shown while autoplaying muted.';
COMMENT ON COLUMN public.videos.smart_prompt_subtitle IS 'Smart Player overlay subtitle text shown while autoplaying muted.';
COMMENT ON COLUMN public.videos.smart_prompt_variant IS 'Smart Player overlay style preset (default|professional).';

CREATE INDEX IF NOT EXISTS idx_videos_smart_prompt_variant ON public.videos (smart_prompt_variant);