-- Fix: this Postgres version doesn't support CREATE POLICY IF NOT EXISTS

-- Video telemetry (retention) tables
CREATE TABLE IF NOT EXISTS public.video_view_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  anon_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  total_watched_seconds integer NOT NULL DEFAULT 0,
  max_position_seconds integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_video_view_sessions_video_id ON public.video_view_sessions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_view_sessions_last_seen_at ON public.video_view_sessions(last_seen_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_view_sessions_video_anon_unique ON public.video_view_sessions(video_id, anon_id);

ALTER TABLE public.video_view_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view sessions for their videos" ON public.video_view_sessions;
CREATE POLICY "Owners can view sessions for their videos"
ON public.video_view_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.videos v
    WHERE v.id = video_view_sessions.video_id
      AND v.user_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.video_view_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  session_id uuid NOT NULL,
  position_seconds integer NOT NULL,
  increment_seconds integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_view_pings_video_id_created_at ON public.video_view_pings(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_view_pings_session_id_created_at ON public.video_view_pings(session_id, created_at DESC);

ALTER TABLE public.video_view_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view pings for their videos" ON public.video_view_pings;
CREATE POLICY "Owners can view pings for their videos"
ON public.video_view_pings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.videos v
    WHERE v.id = video_view_pings.video_id
      AND v.user_id = auth.uid()
  )
);

-- Enable realtime for pings
DO $$
BEGIN
  -- Avoid error if already added
  ALTER PUBLICATION supabase_realtime ADD TABLE public.video_view_pings;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;