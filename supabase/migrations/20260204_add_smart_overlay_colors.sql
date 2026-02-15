-- Add color customization columns for Smart Player overlays
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS smart_resume_color TEXT DEFAULT '#117AB2',
ADD COLUMN IF NOT EXISTS smart_autoplay_color TEXT DEFAULT '#1E88E5',
ADD COLUMN IF NOT EXISTS smart_preload_text TEXT DEFAULT 'Seu vídeo já começou';

-- Add comment for documentation
COMMENT ON COLUMN videos.smart_resume_color IS 'Background color for resume/reload overlay (hex format)';
COMMENT ON COLUMN videos.smart_autoplay_color IS 'Background color for smart autoplay overlay (hex format)';
COMMENT ON COLUMN videos.smart_preload_text IS 'Custom text for preload overlay';
