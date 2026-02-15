-- Allow anonymous viewers to create video view sessions safely

-- 1) Ensure RLS is enabled (should already be, but idempotent)
ALTER TABLE public.video_view_sessions ENABLE ROW LEVEL SECURITY;

-- 2) Helper function to validate video_id existence without requiring SELECT on videos
CREATE OR REPLACE FUNCTION public.video_exists(_video_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.videos v
    WHERE v.id = _video_id
  );
$$;

-- 3) Policy: allow anyone (anon/auth) to INSERT sessions when anon_id is present and video exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'video_view_sessions'
      AND policyname = 'Anonymous can create view sessions'
  ) THEN
    CREATE POLICY "Anonymous can create view sessions"
    ON public.video_view_sessions
    FOR INSERT
    TO public
    WITH CHECK (
      anon_id IS NOT NULL
      AND length(trim(anon_id)) >= 6
      AND public.video_exists(video_id)
    );
  END IF;
END $$;
