# VSL Player - Complete Setup Guide

Este documento contém TUDO necessário para replicar o projeto em qualquer ambiente.

---

## 1. Environment Variables

### Frontend (.env)

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

### Backend Secrets (Supabase Dashboard > Settings > Secrets)

| Secret | Descrição | Onde encontrar |
|--------|-----------|----------------|
| `SUPABASE_URL` | URL do projeto | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Chave pública anon | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (SECRETA!) | Supabase Dashboard → Settings → API |
| `SUPABASE_DB_URL` | Connection string do banco | Supabase Dashboard → Settings → Database |
| `BUNNY_STREAM_API_KEY` | API Key do Bunny Stream | Bunny Dashboard → Stream → API |
| `BUNNY_STREAM_LIBRARY_ID` | ID da biblioteca de vídeos | Bunny Dashboard → Stream → Library Settings |
| `BUNNY_STREAM_CDN_HOSTNAME` | Hostname do CDN (ex: vz-xxx.b-cdn.net) | Bunny Dashboard → Stream → Library Settings |
| `BUNNY_TOKEN_SECURITY_KEY` | Chave de autenticação por token | Bunny Dashboard → Stream → Security |
| `LOVABLE_API_KEY` | Chave da API Lovable AI (opcional) | Auto-gerada pelo Lovable |

---

## 2. Database Schema - SQL Scripts

Execute estes scripts na ordem indicada no Supabase SQL Editor.

### 2.1 Functions (Execute primeiro)

```sql
-- Function: update_updated_at_column
-- Atualiza automaticamente o campo updated_at
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

-- Function: validate_video_status
-- Valida o status do vídeo
CREATE OR REPLACE FUNCTION public.validate_video_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS NULL OR NEW.status = '' THEN
    NEW.status := 'ready';
  END IF;

  IF NEW.status NOT IN ('uploading','transcoding','ready','error') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

-- Function: video_exists
-- Verifica se um vídeo existe (usado em RLS)
CREATE OR REPLACE FUNCTION public.video_exists(_video_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.videos v
    WHERE v.id = _video_id
  );
$$;

-- Function: telemetry_session_valid_for_ping
-- Valida sessão para pings de telemetria
CREATE OR REPLACE FUNCTION public.telemetry_session_valid_for_ping(_session_id uuid, _video_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_view_sessions s
    WHERE s.id = _session_id
      AND s.video_id = _video_id
  );
$$;
```

### 2.2 Table: profiles

```sql
-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

### 2.3 Table: videos

```sql
-- Tabela principal de vídeos VSL
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  
  -- Storage (legacy)
  bucket_id text DEFAULT 'vsl-videos',
  storage_path text,
  mime_type text,
  size_bytes bigint,
  
  -- Bunny Stream
  bunny_id text,
  status text NOT NULL DEFAULT 'ready',
  thumbnail_url text,
  
  -- Layout
  layout_ratio text NOT NULL DEFAULT '16:9',
  icon_style text NOT NULL DEFAULT 'rounded',
  aspect_ratio text DEFAULT '16:9',
  play_button_style text DEFAULT 'circular',
  
  -- Cover
  cover_mode text NOT NULL DEFAULT 'solid',
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
  vsl_page_type text NOT NULL DEFAULT 'embed',
  
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
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own videos"
ON public.videos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own videos"
ON public.videos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
ON public.videos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
ON public.videos FOR DELETE
USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER validate_videos_status
BEFORE INSERT OR UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.validate_video_status();
```

### 2.4 Table: video_resume_points

```sql
-- Pontos de retomada de vídeo por usuário
CREATE TABLE public.video_resume_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  position_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.video_resume_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own resume points"
ON public.video_resume_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume points"
ON public.video_resume_points FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume points"
ON public.video_resume_points FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume points"
ON public.video_resume_points FOR DELETE
USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_video_resume_points_updated_at
BEFORE UPDATE ON public.video_resume_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

### 2.5 Table: video_view_sessions

```sql
-- Sessões de visualização anônimas
CREATE TABLE public.video_view_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  anon_id text NOT NULL,
  total_watched_seconds integer NOT NULL DEFAULT 0,
  max_position_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_view_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anonymous can create view sessions"
ON public.video_view_sessions FOR INSERT
WITH CHECK (
  anon_id IS NOT NULL 
  AND length(TRIM(BOTH FROM anon_id)) >= 6 
  AND video_exists(video_id)
);

CREATE POLICY "Owners can view sessions for their videos"
ON public.video_view_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = video_view_sessions.video_id
    AND v.user_id = auth.uid()
  )
);

-- Index para performance
CREATE INDEX idx_video_view_sessions_video_id ON public.video_view_sessions(video_id);
CREATE INDEX idx_video_view_sessions_anon_id ON public.video_view_sessions(anon_id);
```

### 2.6 Table: video_view_pings

```sql
-- Pings de telemetria de watch time
CREATE TABLE public.video_view_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  session_id uuid NOT NULL,
  position_seconds integer NOT NULL,
  increment_seconds integer NOT NULL DEFAULT 5,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_view_pings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anonymous can create view pings"
ON public.video_view_pings FOR INSERT
WITH CHECK (
  telemetry_session_valid_for_ping(session_id, video_id)
  AND position_seconds >= 0
  AND position_seconds <= (60 * 60 * 6)
  AND increment_seconds >= 1
  AND increment_seconds <= 60
);

CREATE POLICY "Owners can view pings for their videos"
ON public.video_view_pings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = video_view_pings.video_id
    AND v.user_id = auth.uid()
  )
);

-- Index para performance
CREATE INDEX idx_video_view_pings_video_id ON public.video_view_pings(video_id);
CREATE INDEX idx_video_view_pings_session_id ON public.video_view_pings(session_id);
```

---

## 3. Storage Buckets

Execute no SQL Editor:

```sql
-- Bucket privado para vídeos (legacy)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vsl-videos', 'vsl-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket público para avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para avatares
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 4. Edge Functions

As Edge Functions estão em `supabase/functions/`. Para deploy manual:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref YOUR_PROJECT_ID

# Configurar secrets
supabase secrets set BUNNY_STREAM_API_KEY=your-key
supabase secrets set BUNNY_STREAM_LIBRARY_ID=your-library-id
supabase secrets set BUNNY_STREAM_CDN_HOSTNAME=vz-xxx.b-cdn.net
supabase secrets set BUNNY_TOKEN_SECURITY_KEY=your-token-key

# Deploy functions
supabase functions deploy upload-to-bunny
supabase functions deploy bunny-video-status
supabase functions deploy bunny-hls-manifest
supabase functions deploy public-vsl
supabase functions deploy telemetry-ping
supabase functions deploy delete-bunny-video
```

### Lista de Edge Functions

| Function | Propósito |
|----------|-----------|
| `upload-to-bunny` | Cria vídeo no Bunny + retorna credenciais TUS |
| `bunny-video-status` | Polling do status de transcodificação |
| `bunny-hls-manifest` | Proxy do manifest HLS com tokens assinados |
| `public-vsl` | Retorna config do VSL para páginas públicas |
| `telemetry-ping` | Registra watch time |
| `delete-bunny-video` | Deleta vídeo do Bunny |

---

## 5. Frontend Setup

```bash
# Instalar dependências
bun install

# Configurar .env com suas credenciais
cp .env.example .env

# Rodar em desenvolvimento
bun run dev

# Build para produção
bun run build
```

### Dependências Principais

- `@supabase/supabase-js` - Cliente Supabase
- `hls.js` - Player HLS para streaming
- `tus-js-client` - Upload resumível via TUS
- `@tanstack/react-query` - Cache e estado do servidor

---

## 6. Bunny.net Setup

1. Criar conta em [bunny.net](https://bunny.net)
2. Criar uma Video Library
3. Ativar Token Authentication em Security
4. Copiar as credenciais para os secrets do Supabase

---

## 7. Checklist de Verificação

- [ ] Variáveis de ambiente configuradas no frontend (.env)
- [ ] Secrets configurados no Supabase Dashboard
- [ ] Todas as tabelas criadas no banco
- [ ] Storage buckets criados
- [ ] Edge functions deployadas
- [ ] Bunny.net configurado com Token Authentication
- [ ] Autenticação funcionando (login/signup)
- [ ] Upload de vídeo funcionando
- [ ] Reprodução HLS funcionando

---

## 8. Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  React Frontend │────▶│  Edge Functions  │────▶│  Bunny Stream   │
│  (Vite + TW)    │     │  (Deno/Supabase) │     │  (HLS CDN)      │
│                 │     │                  │     │                 │
└────────┬────────┘     └────────┬─────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│                                         │
│           Supabase (Postgres)           │
│     Auth + Storage + RLS Policies       │
│                                         │
└─────────────────────────────────────────┘
```
