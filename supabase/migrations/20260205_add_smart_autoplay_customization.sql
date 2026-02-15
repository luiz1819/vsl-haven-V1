-- Add customization columns for Smart Autoplay
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS smart_autoplay_opacity INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS smart_autoplay_icon_color TEXT DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS smart_autoplay_text_color TEXT DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS smart_autoplay_border_radius INTEGER DEFAULT 12;

-- Set defaults for existing rows
UPDATE videos SET smart_autoplay_opacity = 100 WHERE smart_autoplay_opacity IS NULL;
UPDATE videos SET smart_autoplay_icon_color = '#FFFFFF' WHERE smart_autoplay_icon_color IS NULL;
UPDATE videos SET smart_autoplay_text_color = '#FFFFFF' WHERE smart_autoplay_text_color IS NULL;
UPDATE videos SET smart_autoplay_border_radius = 12 WHERE smart_autoplay_border_radius IS NULL;

-- Descriptions
COMMENT ON COLUMN videos.smart_autoplay_opacity IS 'Opacity/Transparency of the overlay (0-100)';
COMMENT ON COLUMN videos.smart_autoplay_icon_color IS 'Color of the play/mute icon';
COMMENT ON COLUMN videos.smart_autoplay_text_color IS 'Color of the title and subtitle';
COMMENT ON COLUMN videos.smart_autoplay_border_radius IS 'Corner radius of the overlay box';
