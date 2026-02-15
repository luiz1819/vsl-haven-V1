-- Add missing columns causing Edge Function crash
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS hero_headline_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hero_subheadline_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hero_headline_style TEXT,
ADD COLUMN IF NOT EXISTS hero_subheadline_style TEXT,
ADD COLUMN IF NOT EXISTS header_blocks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS top_bar_config JSONB DEFAULT '{}'::jsonb;

-- Comment on columns
COMMENT ON COLUMN videos.header_blocks IS 'Rich text blocks for the hero header';
COMMENT ON COLUMN videos.top_bar_config IS 'Configuration for the scarcity top bar';
