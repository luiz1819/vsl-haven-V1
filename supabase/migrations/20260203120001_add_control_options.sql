-- Add granular control options
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS show_volume BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_fullscreen BOOLEAN DEFAULT true;

-- Ensure defaults for existing rows if needed (though DEFAULT handles new ones)
UPDATE videos SET show_volume = true WHERE show_volume IS NULL;
UPDATE videos SET show_fullscreen = true WHERE show_fullscreen IS NULL;
