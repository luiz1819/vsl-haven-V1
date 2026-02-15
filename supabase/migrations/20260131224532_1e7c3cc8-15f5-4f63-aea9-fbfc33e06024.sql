-- Add independent hero controls + smart overlays
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS hero_headline_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hero_subheadline_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hero_headline_style text NULL,
  ADD COLUMN IF NOT EXISTS hero_subheadline_style text NULL,
  ADD COLUMN IF NOT EXISTS smart_pause_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS smart_pause_text text NULL,
  ADD COLUMN IF NOT EXISTS smart_reload_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS smart_reload_continue_text text NULL,
  ADD COLUMN IF NOT EXISTS smart_reload_restart_text text NULL,
  ADD COLUMN IF NOT EXISTS smart_end_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS smart_end_text text NULL,
  ADD COLUMN IF NOT EXISTS player_click_toggle boolean NOT NULL DEFAULT true;

-- Sensible defaults for new text fields (non-breaking for existing rows)
UPDATE public.videos
SET
  smart_pause_text = COALESCE(smart_pause_text, 'Continue assistindo'),
  smart_reload_continue_text = COALESCE(smart_reload_continue_text, 'Continuar assistindo'),
  smart_reload_restart_text = COALESCE(smart_reload_restart_text, 'Voltar do começo'),
  smart_end_text = COALESCE(smart_end_text, 'Assistir novamente')
WHERE true;

-- Resume points for authenticated users (hybrid with localStorage)
CREATE TABLE IF NOT EXISTS public.video_resume_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  position_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

ALTER TABLE public.video_resume_points ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'video_resume_points' AND policyname = 'Users can view their own resume points'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own resume points" ON public.video_resume_points FOR SELECT USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'video_resume_points' AND policyname = 'Users can create their own resume points'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create their own resume points" ON public.video_resume_points FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'video_resume_points' AND policyname = 'Users can update their own resume points'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own resume points" ON public.video_resume_points FOR UPDATE USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'video_resume_points' AND policyname = 'Users can delete their own resume points'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own resume points" ON public.video_resume_points FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_video_resume_points_updated_at ON public.video_resume_points;
CREATE TRIGGER update_video_resume_points_updated_at
BEFORE UPDATE ON public.video_resume_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_video_resume_points_user_id ON public.video_resume_points(user_id);
CREATE INDEX IF NOT EXISTS idx_video_resume_points_video_id ON public.video_resume_points(video_id);
