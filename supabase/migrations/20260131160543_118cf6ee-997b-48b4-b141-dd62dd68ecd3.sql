-- Allow Bunny-backed videos (no Storage object)
ALTER TABLE public.videos
ALTER COLUMN storage_path DROP NOT NULL,
ALTER COLUMN bucket_id DROP NOT NULL;

-- Keep existing defaults; just relax for Bunny rows
ALTER TABLE public.videos
ALTER COLUMN bucket_id SET DEFAULT 'vsl-videos';

-- Optional: set a clearer default for mime_type
ALTER TABLE public.videos
ALTER COLUMN mime_type SET DEFAULT NULL;