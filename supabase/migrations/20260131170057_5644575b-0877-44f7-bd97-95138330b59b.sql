-- Allow anonymous viewers to insert pings tied to a real session (prevents random poisoning)

-- 1) Ensure RLS is enabled (idempotent)
ALTER TABLE public.video_view_pings ENABLE ROW LEVEL SECURITY;

-- 2) Helper: validate that a ping references an existing session for the same video
--    SECURITY DEFINER is used so the policy can validate existence without granting SELECT on sessions.
CREATE OR REPLACE FUNCTION public.telemetry_session_valid_for_ping(_session_id uuid, _video_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_view_sessions s
    WHERE s.id = _session_id
      AND s.video_id = _video_id
  );
$$;

-- 3) INSERT policy for anonymous + authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'video_view_pings'
      AND policyname = 'Anonymous can create view pings'
  ) THEN
    CREATE POLICY "Anonymous can create view pings"
    ON public.video_view_pings
    FOR INSERT
    TO public
    WITH CHECK (
      public.telemetry_session_valid_for_ping(session_id, video_id)
      AND position_seconds >= 0
      AND position_seconds <= 60 * 60 * 6
      AND increment_seconds >= 1
      AND increment_seconds <= 60
    );
  END IF;
END $$;
