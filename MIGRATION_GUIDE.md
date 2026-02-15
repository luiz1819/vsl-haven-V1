# VSL Player - Complete Migration Guide

Este documento contém **TODAS** as instruções necessárias para replicar este projeto em qualquer ambiente (Supabase, GitHub, outra IA, etc).

---

## 📋 Índice

1. [Requisitos](#requisitos)
2. [Variáveis de Ambiente / Secrets](#variáveis-de-ambiente--secrets)
3. [Banco de Dados - Schema Completo](#banco-de-dados---schema-completo)
4. [Storage Buckets](#storage-buckets)
5. [Edge Functions (Deno)](#edge-functions-deno)
6. [Configuração de Auth](#configuração-de-auth)
7. [Frontend - Dependências](#frontend---dependências)

---

## Requisitos

- **Node.js 18+** ou **Bun**
- **Supabase Project** (self-hosted ou cloud)
- **Bunny Stream Account** (para streaming de vídeos HLS)

---

## Variáveis de Ambiente / Secrets

### Secrets do Supabase (Edge Functions)

Estas secrets devem ser configuradas no painel do Supabase em **Settings → Edge Functions → Secrets** ou via CLI:

| Nome da Secret | Descrição | Onde Encontrar |
|----------------|-----------|----------------|
| `SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Chave pública anon | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (⚠️ manter secreta!) | Supabase Dashboard → Settings → API → service_role |
| `BUNNY_STREAM_API_KEY` | API Key do Bunny Stream | Bunny Dashboard → Stream → API |
| `BUNNY_STREAM_LIBRARY_ID` | ID da biblioteca de vídeos | Bunny Dashboard → Stream → Library Settings |
| `BUNNY_STREAM_CDN_HOSTNAME` | Hostname do CDN (ex: `vz-xxx.b-cdn.net`) | Bunny Dashboard → Stream → Library Settings |
| `BUNNY_TOKEN_SECURITY_KEY` | Chave de autenticação de token | Bunny Dashboard → Stream → Security → Token Authentication |

### Variáveis Frontend (.env)

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_anon_key"
VITE_SUPABASE_URL="https://seu_project_id.supabase.co"
```

> ⚠️ **IMPORTANTE**: Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ou `BUNNY_STREAM_API_KEY` no frontend!

---

## Banco de Dados - Schema Completo

Execute os scripts SQL abaixo na ordem apresentada no **SQL Editor** do Supabase.

### 1. Tabela `profiles`

```sql
-- Perfis de usuário
CREATE TABLE public.profiles (
  user_id UUID NOT NULL PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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
```

### 2. Tabela `videos`

```sql
-- Tabela principal de vídeos/VSLs
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Bunny Stream
  bunny_id TEXT,
  bucket_id TEXT DEFAULT 'vsl-videos',
  storage_path TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  
  -- Layout & Aparência
  layout_ratio TEXT NOT NULL DEFAULT '16:9',
  aspect_ratio TEXT DEFAULT '16:9',
  icon_style TEXT NOT NULL DEFAULT 'rounded',
  play_button_style TEXT DEFAULT 'circular',
  primary_color TEXT DEFAULT '#00C853',
  progress_color TEXT,
  
  -- Cover (capa/thumbnail customizada)
  cover_mode TEXT NOT NULL DEFAULT 'solid',
  cover_color TEXT,
  cover_opacity INTEGER NOT NULL DEFAULT 90,
  cover_saturation INTEGER NOT NULL DEFAULT 100,
  cover_gradient_from TEXT,
  cover_gradient_to TEXT,
  cover_image_url TEXT,
  
  -- Hero Section (VSL Page)
  vsl_page_type TEXT NOT NULL DEFAULT 'embed',
  hero_headline TEXT,
  hero_headline_enabled BOOLEAN NOT NULL DEFAULT true,
  hero_headline_size INTEGER,
  hero_headline_style TEXT,
  hero_subheadline TEXT,
  hero_subheadline_enabled BOOLEAN NOT NULL DEFAULT true,
  hero_subheadline_size INTEGER,
  hero_subheadline_style TEXT,
  hero_font_family TEXT,
  hero_text_color TEXT,
  
  -- CTA (Call to Action)
  cta_enabled BOOLEAN NOT NULL DEFAULT false,
  cta_text TEXT,
  cta_url TEXT,
  cta_variant TEXT NOT NULL DEFAULT 'hero',
  cta_delay_seconds INTEGER,
  cta_bg_color TEXT,
  cta_text_color TEXT,
  
  -- Player Controls
  autoplay BOOLEAN NOT NULL DEFAULT false,
  loop BOOLEAN NOT NULL DEFAULT false,
  show_controls BOOLEAN NOT NULL DEFAULT true,
  controls_visible BOOLEAN DEFAULT true,
  player_click_toggle BOOLEAN NOT NULL DEFAULT true,
  
  -- Smart Player Features
  smart_autoplay BOOLEAN DEFAULT true,
  smart_autoplay_enabled BOOLEAN NOT NULL DEFAULT false,
  smart_prompt_title TEXT,
  smart_prompt_subtitle TEXT,
  smart_prompt_variant TEXT NOT NULL DEFAULT 'default',
  
  smart_pause_enabled BOOLEAN NOT NULL DEFAULT true,
  smart_pause_text TEXT,
  
  smart_reload_enabled BOOLEAN NOT NULL DEFAULT true,
  smart_reload_continue_text TEXT,
  smart_reload_restart_text TEXT,
  
  smart_end_enabled BOOLEAN NOT NULL DEFAULT true,
  smart_end_text TEXT,
  
  -- Features PRO
  feature_live_simulator BOOLEAN NOT NULL DEFAULT false,
  feature_domain_lock BOOLEAN NOT NULL DEFAULT false,
  fake_live_mode BOOLEAN DEFAULT false,
  domain_lock TEXT,
  
  -- CSS Customizado
  custom_css TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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
```

### 3. Tabela `video_resume_points`

```sql
-- Pontos de retomada de vídeo por usuário
CREATE TABLE public.video_resume_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL,
  user_id UUID NOT NULL,
  position_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(video_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.video_resume_points ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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
```

### 4. Tabela `video_view_sessions`

```sql
-- Sessões de visualização (analytics anônimos)
CREATE TABLE public.video_view_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL,
  anon_id TEXT NOT NULL,
  total_watched_seconds INTEGER NOT NULL DEFAULT 0,
  max_position_seconds INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(video_id, anon_id)
);

-- Habilitar RLS
ALTER TABLE public.video_view_sessions ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se vídeo existe
CREATE OR REPLACE FUNCTION public.video_exists(_video_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.videos v WHERE v.id = _video_id
  );
$$;

-- Políticas RLS
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
```

### 5. Tabela `video_view_pings`

```sql
-- Pings de telemetria (watch time)
CREATE TABLE public.video_view_pings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL,
  session_id UUID NOT NULL,
  position_seconds INTEGER NOT NULL,
  increment_seconds INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.video_view_pings ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para validar ping
CREATE OR REPLACE FUNCTION public.telemetry_session_valid_for_ping(_session_id UUID, _video_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.video_view_sessions s
    WHERE s.id = _session_id AND s.video_id = _video_id
  );
$$;

-- Políticas RLS
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
```

### 6. Funções e Triggers

```sql
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para videos
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para video_resume_points
CREATE TRIGGER update_video_resume_points_updated_at
  BEFORE UPDATE ON public.video_resume_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função de validação de status de vídeo
CREATE OR REPLACE FUNCTION public.validate_video_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS NULL OR NEW.status = '' THEN
    NEW.status := 'ready';
  END IF;

  IF NEW.status NOT IN ('uploading', 'transcoding', 'ready', 'error') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger de validação de status
CREATE TRIGGER validate_video_status_trigger
  BEFORE INSERT OR UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_video_status();
```

---

## Storage Buckets

### Criar Buckets

```sql
-- Bucket para vídeos (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vsl-videos', 'vsl-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

### Políticas de Storage para Avatars

```sql
-- Leitura pública de avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Upload de avatar (usuário só pode fazer upload no próprio folder)
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Atualização de avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Deleção de avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Políticas de Storage para Videos

```sql
-- Upload de vídeo
CREATE POLICY "Users can upload their own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vsl-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Leitura de vídeo (próprio usuário)
CREATE POLICY "Users can view their own videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vsl-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Deleção de vídeo
CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vsl-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Edge Functions (Deno)

Todas as edge functions devem ser criadas na pasta `supabase/functions/`. Cada função tem seu próprio diretório.

### Estrutura de Diretórios

```
supabase/functions/
├── bunny-hls-manifest/
│   └── index.ts
├── bunny-video-status/
│   └── index.ts
├── delete-bunny-video/
│   └── index.ts
├── public-vsl/
│   └── index.ts
├── telemetry-ping/
│   └── index.ts
└── upload-to-bunny/
    └── index.ts
```

### 1. `upload-to-bunny/index.ts`

```typescript
// Cria vídeo no Bunny Stream e retorna credenciais TUS para upload
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!supabaseUrl || !anonKey) return json({ error: "Backend misconfigured" }, 500);
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("BUNNY_STREAM_API_KEY");
    const libraryId = Deno.env.get("BUNNY_STREAM_LIBRARY_ID");
    if (!apiKey || !libraryId) return json({ error: "Bunny not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title : "Untitled Video";

    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: apiKey,
      },
      body: JSON.stringify({ title }),
    });

    if (!createRes.ok) {
      const t = await createRes.text().catch(() => "");
      console.error("upload-to-bunny create failed", createRes.status, t);
      return json({ error: "Failed to create Bunny video" }, 500);
    }

    const created = (await createRes.json()) as { guid?: string };
    const bunnyId = created?.guid ?? "";
    if (!bunnyId) return json({ error: "Invalid Bunny response" }, 500);

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60;
    const signature = await sha256Hex(`${libraryId}${apiKey}${expirationTime}${bunnyId}`);

    return json({
      bunnyId,
      libraryId,
      expirationTime,
      signature,
      tusEndpoint: "https://video.bunnycdn.com/tusupload",
    });
  } catch (err) {
    console.error("upload-to-bunny fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
```

### 2. `bunny-video-status/index.ts`

```typescript
// Verifica status de processamento do vídeo no Bunny
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mapStatus(raw: unknown): "uploading" | "transcoding" | "ready" | "error" {
  if (typeof raw === "string") {
    const s = raw.toLowerCase();
    if (s.includes("error") || s.includes("fail")) return "error";
    if (s.includes("upload")) return "uploading";
    if (s.includes("transcod") || s.includes("process")) return "transcoding";
    if (s.includes("ready") || s.includes("finished") || s.includes("done")) return "ready";
  }
  if (typeof raw === "number") {
    if (raw <= 1) return "uploading";
    if (raw === 2) return "transcoding";
    return "ready";
  }
  return "transcoding";
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!supabaseUrl || !anonKey) return json({ error: "Backend misconfigured" }, 500);
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    const userId = claims?.claims?.sub ?? null;
    if (claimsErr || !userId) return json({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("BUNNY_STREAM_API_KEY");
    const libraryId = Deno.env.get("BUNNY_STREAM_LIBRARY_ID");
    const cdnHost = Deno.env.get("BUNNY_STREAM_CDN_HOSTNAME");
    if (!apiKey || !libraryId || !cdnHost) return json({ error: "Bunny not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId : "";
    if (!videoId) return json({ error: "videoId is required" }, 400);

    const { data: row, error: rowErr } = await supabase
      .from("videos")
      .select("id,user_id,bunny_id")
      .eq("id", videoId)
      .maybeSingle();
    if (rowErr) return json({ error: "Failed to load video" }, 500);
    if (!row || (row as any).user_id !== userId) return json({ error: "Not found" }, 404);

    const bunnyId = (row as any).bunny_id as string | null;
    if (!bunnyId) return json({ status: "error", error: "Video is not Bunny-backed" }, 400);

    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyId}`, {
      method: "GET",
      headers: { Accept: "application/json", AccessKey: apiKey },
    });
    const payloadText = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("bunny-video-status failed", res.status, payloadText);
      return json({ error: "Failed to fetch Bunny status" }, 500);
    }

    let bunny: any = {};
    try {
      bunny = JSON.parse(payloadText);
    } catch {
      bunny = {};
    }

    const status = mapStatus(bunny?.status ?? bunny?.processingStatus ?? bunny?.encodeStatus);
    const thumbnailUrl = `https://${cdnHost}/${bunnyId}/thumbnail.jpg`;

    return json({ status, thumbnailUrl });
  } catch (err) {
    console.error("bunny-video-status fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
```

### 3. `bunny-hls-manifest/index.ts`

```typescript
// Proxy para manifest HLS com tokens de segurança
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function text(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function withToken(url: string, token: string, expires: number) {
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}token=${token}&expires=${expires}`;
}

function absolutizeAndTokenize(manifest: string, baseDirUrl: string, token: string, expires: number) {
  return manifest
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return line;
      if (/^https?:\/\//i.test(t)) return withToken(t, token, expires);
      const abs = `${baseDirUrl}${t.replace(/^\//, "")}`;
      return withToken(abs, token, expires);
    })
    .join("\n");
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return text("Method not allowed", 405);

    const tokenKey = Deno.env.get("BUNNY_TOKEN_SECURITY_KEY");
    const cdnHost = Deno.env.get("BUNNY_STREAM_CDN_HOSTNAME");
    if (!tokenKey || !cdnHost) return text("Backend misconfigured", 500);

    const body = await req.json().catch(() => ({}));
    const bunnyId = typeof body?.bunnyId === "string" ? body.bunnyId : "";
    const expiresIn = Number(body?.expiresIn ?? 600);
    const safeExpiresIn = Number.isFinite(expiresIn) ? Math.max(60, Math.min(3600, expiresIn)) : 600;
    if (!bunnyId) return text("bunnyId is required", 400);

    const expires = Math.floor(Date.now() / 1000) + safeExpiresIn;
    const token = await sha256Hex(`${tokenKey}${bunnyId}${expires}`);

    const playlistUrl = withToken(`https://${cdnHost}/${bunnyId}/playlist.m3u8`, token, expires);
    const res = await fetch(playlistUrl, { method: "GET" });
    const manifest = await res.text();

    if (!res.ok) {
      console.error("bunny-hls-manifest fetch failed", res.status, manifest.slice(0, 300));
      return text("Failed to fetch manifest", 502);
    }

    const baseDirUrl = `https://${cdnHost}/${bunnyId}/`;
    const rewritten = absolutizeAndTokenize(manifest, baseDirUrl, token, expires);
    return text(rewritten, 200);
  } catch (err) {
    console.error("bunny-hls-manifest fatal", err);
    return text("Unexpected error", 500);
  }
});
```

### 4. `public-vsl/index.ts`

```typescript
// Endpoint público para carregar configuração de VSL
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Backend misconfigured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId : "";
    const expiresIn = Number(body?.expiresIn ?? 600);
    const safeExpiresIn = Number.isFinite(expiresIn) ? Math.max(60, Math.min(3600, expiresIn)) : 600;
    if (!videoId) return json({ error: "videoId is required" }, 400);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: row, error: e } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .maybeSingle();

    if (e) return json({ error: "Failed to load video" }, 500);
    if (!row) return json({ error: "Not found" }, 404);

    let signedUrl: string | undefined;
    const bucketId = row.bucket_id ?? null;
    const storagePath = row.storage_path ?? null;
    if (bucketId && storagePath) {
      const { data: signed } = await supabase.storage.from(bucketId).createSignedUrl(storagePath, safeExpiresIn);
      signedUrl = signed?.signedUrl;
    }

    return json({ video: row, signedUrl });
  } catch (err) {
    console.error("public-vsl fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
```

### 5. `telemetry-ping/index.ts`

```typescript
// Endpoint público para telemetria de watch time
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clampInt(n: number, min: number, max: number) {
  const v = Math.trunc(n);
  return Math.max(min, Math.min(max, v));
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Backend misconfigured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId : "";
    const anonId = typeof body?.anonId === "string" ? body.anonId : "";
    const positionSecondsRaw = Number(body?.positionSeconds);
    const incrementSecondsRaw = Number(body?.incrementSeconds ?? 5);

    if (!videoId) return json({ error: "videoId is required" }, 400);
    if (!anonId) return json({ error: "anonId is required" }, 400);
    if (!Number.isFinite(positionSecondsRaw)) return json({ error: "positionSeconds is required" }, 400);

    const positionSeconds = clampInt(positionSecondsRaw, 0, 60 * 60 * 6);
    const incrementSeconds = clampInt(incrementSecondsRaw, 1, 60);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: sessionRow, error: sErr } = await supabase
      .from("video_view_sessions")
      .upsert(
        { video_id: videoId, anon_id: anonId, last_seen_at: new Date().toISOString() },
        { onConflict: "video_id,anon_id" }
      )
      .select("id,total_watched_seconds,max_position_seconds")
      .maybeSingle();

    if (sErr || !sessionRow?.id) {
      return json({ error: "Failed to record session" }, 500);
    }

    const sessionId = sessionRow.id;

    await supabase.from("video_view_pings").insert({
      video_id: videoId,
      session_id: sessionId,
      position_seconds: positionSeconds,
      increment_seconds: incrementSeconds,
    });

    const nextTotal = clampInt(Number(sessionRow.total_watched_seconds ?? 0) + incrementSeconds, 0, 60 * 60 * 24);
    const nextMax = Math.max(clampInt(Number(sessionRow.max_position_seconds ?? 0), 0, 60 * 60 * 24), positionSeconds);
    
    await supabase
      .from("video_view_sessions")
      .update({
        total_watched_seconds: nextTotal,
        max_position_seconds: nextMax,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return json({ ok: true, sessionId });
  } catch (err) {
    console.error("telemetry-ping fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
```

### 6. `delete-bunny-video/index.ts`

```typescript
// Deleta vídeo do Bunny Stream
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!supabaseUrl || !anonKey) return json({ error: "Backend misconfigured" }, 500);
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    const userId = claims?.claims?.sub ?? null;
    if (claimsErr || !userId) return json({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("BUNNY_STREAM_API_KEY");
    const libraryId = Deno.env.get("BUNNY_STREAM_LIBRARY_ID");
    if (!apiKey || !libraryId) return json({ error: "Bunny not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId : "";
    if (!videoId) return json({ error: "videoId is required" }, 400);

    const { data: row, error: rowErr } = await supabase
      .from("videos")
      .select("id,user_id,bunny_id")
      .eq("id", videoId)
      .maybeSingle();
    if (rowErr) return json({ error: "Failed to load video" }, 500);
    if (!row || row.user_id !== userId) return json({ error: "Not found" }, 404);

    const bunnyId = row.bunny_id as string | null;
    if (!bunnyId) return json({ ok: true, skipped: true });

    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyId}`, {
      method: "DELETE",
      headers: { Accept: "application/json", AccessKey: apiKey },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("delete-bunny-video failed", res.status, t);
      return json({ error: "Failed to delete Bunny video" }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("delete-bunny-video fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
```

---

## Configuração de Auth

### Supabase Auth Settings

No painel do Supabase, configure:

1. **Settings → Authentication → Email**
   - Habilitar "Enable Email Signup"
   - Configurar templates de email (opcional)

2. **Settings → Authentication → URL Configuration**
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs: adicione todas as URLs de callback

### Desabilitar Auto-confirm (Recomendado para Produção)

Por padrão, mantenha a verificação de email **habilitada** para produção.

---

## Frontend - Dependências

### package.json (principais dependências)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.93.3",
    "@tanstack/react-query": "^5.83.0",
    "hls.js": "^1.6.15",
    "lucide-react": "^0.462.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "recharts": "^2.15.4",
    "tus-js-client": "^4.3.1",
    "tailwindcss": "^3.x",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

### Instalar Dependências

```bash
npm install
# ou
bun install
```

### Executar Localmente

```bash
npm run dev
# ou
bun run dev
```

---

## Deploy de Edge Functions (Supabase CLI)

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref SEU_PROJECT_ID

# Configurar secrets
supabase secrets set BUNNY_STREAM_API_KEY=xxx
supabase secrets set BUNNY_STREAM_LIBRARY_ID=xxx
supabase secrets set BUNNY_STREAM_CDN_HOSTNAME=xxx
supabase secrets set BUNNY_TOKEN_SECURITY_KEY=xxx

# Deploy de todas as funções
supabase functions deploy
```

---

## Checklist Final

- [ ] Criar projeto Supabase
- [ ] Executar todos os scripts SQL do banco de dados
- [ ] Criar storage buckets
- [ ] Configurar políticas de storage
- [ ] Configurar secrets no Supabase
- [ ] Deploy das edge functions
- [ ] Configurar variáveis .env no frontend
- [ ] Criar conta Bunny Stream e biblioteca
- [ ] Obter todas as chaves do Bunny
- [ ] Testar upload de vídeo
- [ ] Testar reprodução HLS
- [ ] Testar autenticação

---

## Suporte

Para dúvidas sobre:
- **Bunny Stream**: https://docs.bunny.net/docs/stream-overview
- **Supabase**: https://supabase.com/docs
- **TUS Protocol**: https://tus.io/

---

*Documento gerado automaticamente. Última atualização: Janeiro 2026*
