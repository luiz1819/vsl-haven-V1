# Database Schema

This document describes the database structure for the VSL Player application.

## Tables

### videos

Main table storing all VSL configurations.

```sql
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  
  -- Storage (legacy, optional)
  bucket_id text DEFAULT 'vsl-videos',
  storage_path text,
  mime_type text,
  size_bytes bigint,
  
  -- Bunny Stream
  bunny_id text,
  status text NOT NULL DEFAULT 'ready', -- uploading, transcoding, ready, error
  thumbnail_url text,
  
  -- Layout
  layout_ratio text NOT NULL DEFAULT '16:9', -- 16:9, 9:16, 1:1
  icon_style text NOT NULL DEFAULT 'rounded', -- rounded, square, diamond
  aspect_ratio text DEFAULT '16:9',
  
  -- Cover
  cover_mode text NOT NULL DEFAULT 'solid', -- none, solid, gradient, image
  cover_color text,
  cover_opacity integer NOT NULL DEFAULT 90,
  cover_saturation integer NOT NULL DEFAULT 100,
  cover_gradient_from text,
  cover_gradient_to text,
  cover_image_url text,
  
  -- Progress bar
  progress_color text,
  primary_color text DEFAULT '#00C853',
  
  -- Playback
  autoplay boolean NOT NULL DEFAULT false,
  loop boolean NOT NULL DEFAULT false,
  show_controls boolean NOT NULL DEFAULT true,
  controls_visible boolean DEFAULT true,
  player_click_toggle boolean NOT NULL DEFAULT true,
  
  -- Smart Autoplay
  smart_autoplay boolean DEFAULT true,
  smart_autoplay_enabled boolean NOT NULL DEFAULT false,
  smart_prompt_title text,
  smart_prompt_subtitle text,
  smart_prompt_variant text NOT NULL DEFAULT 'default',
  
  -- Smart Player States
  smart_pause_enabled boolean NOT NULL DEFAULT true,
  smart_pause_text text,
  smart_reload_enabled boolean NOT NULL DEFAULT true,
  smart_reload_continue_text text,
  smart_reload_restart_text text,
  smart_end_enabled boolean NOT NULL DEFAULT true,
  smart_end_text text,
  
  -- VSL Page
  vsl_page_type text NOT NULL DEFAULT 'embed', -- embed, page_with_cta
  
  -- Hero Section
  hero_headline text,
  hero_subheadline text,
  hero_font_family text,
  hero_headline_size integer,
  hero_subheadline_size integer,
  hero_text_color text,
  hero_headline_enabled boolean NOT NULL DEFAULT true,
  hero_subheadline_enabled boolean NOT NULL DEFAULT true,
  hero_headline_style text,
  hero_subheadline_style text,
  
  -- CTA
  cta_enabled boolean NOT NULL DEFAULT false,
  cta_delay_seconds integer,
  cta_text text,
  cta_url text,
  cta_variant text NOT NULL DEFAULT 'hero',
  cta_bg_color text,
  cta_text_color text,
  
  -- Custom CSS
  custom_css text,
  
  -- Features
  feature_live_simulator boolean NOT NULL DEFAULT false,
  feature_domain_lock boolean NOT NULL DEFAULT false,
  domain_lock text,
  fake_live_mode boolean DEFAULT false,
  play_button_style text DEFAULT 'circular',
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own videos" ON public.videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own videos" ON public.videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON public.videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON public.videos
  FOR DELETE USING (auth.uid() = user_id);
```

### profiles

User profile information.

```sql
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);
```

### video_resume_points

Stores playback progress for authenticated users.

```sql
CREATE TABLE public.video_resume_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  position_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

-- RLS Policies
ALTER TABLE public.video_resume_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume points" ON public.video_resume_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume points" ON public.video_resume_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume points" ON public.video_resume_points
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume points" ON public.video_resume_points
  FOR DELETE USING (auth.uid() = user_id);
```

### video_view_sessions

Anonymous view session tracking.

```sql
CREATE TABLE public.video_view_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  anon_id text NOT NULL,
  total_watched_seconds integer NOT NULL DEFAULT 0,
  max_position_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- RLS allows insert for anyone (validated via function)
-- Select only for video owners
```

### video_view_pings

Watch time telemetry pings.

```sql
CREATE TABLE public.video_view_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  session_id uuid NOT NULL,
  position_seconds integer NOT NULL,
  increment_seconds integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Functions

### update_updated_at_column

Trigger function to auto-update `updated_at` timestamps.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### video_exists

Checks if a video exists (used in RLS).

```sql
CREATE OR REPLACE FUNCTION public.video_exists(_video_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.videos v WHERE v.id = _video_id
  );
$$;
```

### telemetry_session_valid_for_ping

Validates session for telemetry pings.

```sql

CREATE OR REPLACE FUNCTION public.telemetry_session_valid_for_ping(_session_id uuid, _video_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.video_view_sessions s
    WHERE s.id = _session_id AND s.video_id = _video_id
  );
$$;
```

## Storage Buckets

### vsl-videos

Private bucket for legacy video storage (before Bunny integration).

```sql

INSERT INTO storage.buckets (id, name, public)
VALUES ('vsl-videos', 'vsl-videos', false);
```

### avatars

Public bucket for user avatars.

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Migration Notes

When migrating to a new Supabase project:

1. Run all migrations in order
2. Configure storage buckets
3. Set up environment variables (see SETUP.md)
4. Test RLS policies with different user contexts
