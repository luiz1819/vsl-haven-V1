// Lovable Cloud Function: public-vsl
// Public endpoint (no JWT) that returns VSL config + a signed video URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type VideoRow = {
  id: string;
  title: string;
  description: string | null;
  bucket_id: string | null;
  storage_path: string | null;
  bunny_id: string | null;
  status: string;
  thumbnail_url: string | null;
  smart_autoplay_enabled: boolean;
  smart_prompt_title: string | null;
  smart_prompt_subtitle: string | null;
  smart_prompt_variant: string;
  smart_pause_enabled: boolean;
  smart_pause_text: string | null;
  smart_reload_enabled: boolean;
  smart_reload_continue_text: string | null;
  smart_reload_restart_text: string | null;
  smart_end_enabled: boolean;
  smart_end_text: string | null;
  player_click_toggle: boolean;
  layout_ratio: string;
  icon_style: string;
  cover_color: string | null;
  cover_mode: string;
  cover_opacity: number;
  cover_saturation: number;
  cover_gradient_from: string | null;
  cover_gradient_to: string | null;
  cover_image_url: string | null;
  progress_color: string | null;
  vsl_page_type: string;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_font_family: string | null;
  hero_headline_size: number | null;
  hero_subheadline_size: number | null;
  hero_text_color: string | null;
  hero_headline_enabled: boolean;
  hero_subheadline_enabled: boolean;
  hero_headline_style: string | null;
  hero_subheadline_style: string | null;
  cta_bg_color: string | null;
  cta_text_color: string | null;
  custom_css: string | null;
  cta_enabled: boolean;
  cta_delay_seconds: number | null;
  cta_text: string | null;
  cta_url: string | null;
  cta_variant: string;
  autoplay: boolean;
  smart_autoplay: boolean | null;
  loop: boolean;
  controls_visible: boolean | null;
  header_blocks: any; // JSONB
  top_bar_config: any; // JSONB
  page_builder_config: any; // JSONB
};

type PublicVslResponse = {
  video: {
    id: string;
    title: string;
    description: string | null;
    layout_ratio: string;
    icon_style: string;
    cover_color: string | null;
    cover_mode: string;
    cover_opacity: number;
    cover_saturation: number;
    cover_gradient_from: string | null;
    cover_gradient_to: string | null;
    cover_image_url: string | null;
    progress_color: string | null;

    vsl_page_type: string;
    hero_headline: string | null;
    hero_subheadline: string | null;
    hero_font_family: string | null;
    hero_headline_size: number | null;
    hero_subheadline_size: number | null;
    hero_text_color: string | null;
    hero_headline_enabled: boolean;
    hero_subheadline_enabled: boolean;
    hero_headline_style: string | null;
    hero_subheadline_style: string | null;
    cta_bg_color: string | null;
    cta_text_color: string | null;
    custom_css: string | null;
    cta_enabled: boolean;
    cta_delay_seconds: number | null;
    cta_text: string | null;
    cta_url: string | null;
    cta_variant: string;
    header_blocks?: any;
    top_bar_config?: any;
    page_builder_config?: any;

    autoplay: boolean;
    smart_autoplay: boolean | null;
    smart_autoplay_enabled: boolean;
    smart_prompt_title: string | null;
    smart_prompt_subtitle: string | null;
    smart_prompt_variant: string;

    smart_pause_enabled: boolean;
    smart_pause_text: string | null;
    smart_reload_enabled: boolean;
    smart_reload_continue_text: string | null;
    smart_reload_restart_text: string | null;
    smart_end_enabled: boolean;
    smart_end_text: string | null;
    player_click_toggle: boolean;
    loop: boolean;
    controls_visible: boolean | null;

    bunny_id: string | null;
    status: string;
    thumbnail_url: string | null;
  };
  signedUrl?: string;
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
      console.error("Missing backend env vars");
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
      .select(
        "id,title,description,bucket_id,storage_path,bunny_id,status,thumbnail_url,smart_autoplay_enabled,smart_prompt_title,smart_prompt_subtitle,smart_prompt_variant,smart_pause_enabled,smart_pause_text,smart_reload_enabled,smart_reload_continue_text,smart_reload_restart_text,smart_end_enabled,smart_end_text,player_click_toggle,layout_ratio,icon_style,cover_color,cover_mode,cover_opacity,cover_saturation,cover_gradient_from,cover_gradient_to,cover_image_url,progress_color,vsl_page_type,hero_headline,hero_subheadline,hero_font_family,hero_headline_size,hero_subheadline_size,hero_text_color,hero_headline_enabled,hero_subheadline_enabled,hero_headline_style,hero_subheadline_style,cta_bg_color,cta_text_color,custom_css,cta_enabled,cta_delay_seconds,cta_text,cta_url,cta_variant,autoplay,smart_autoplay,loop,controls_visible,header_blocks,top_bar_config,page_builder_config",
      )
      .eq("id", videoId)
      .maybeSingle() as { data: VideoRow | null; error: unknown };

    if (e) {
      console.error("public-vsl select error", e);
      return json({ error: "Failed to load video" }, 500);
    }
    if (!row) return json({ error: "Not found" }, 404);

    let signedUrl: string | undefined;
    const bucketId = row.bucket_id ?? null;
    const storagePath = row.storage_path ?? null;
    if (bucketId && storagePath) {
      const { data: signed, error: se } = await supabase.storage.from(bucketId).createSignedUrl(storagePath, safeExpiresIn);
      if (se) {
        console.error("public-vsl signedUrl error", se);
      } else {
        signedUrl = signed?.signedUrl;
      }
    }

    const resp: PublicVslResponse = {
      video: {
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        layout_ratio: row.layout_ratio,
        icon_style: row.icon_style,
        cover_color: row.cover_color ?? null,
        cover_mode: row.cover_mode,
        cover_opacity: Number(row.cover_opacity ?? 90),
        cover_saturation: Number(row.cover_saturation ?? 100),
        cover_gradient_from: row.cover_gradient_from ?? null,
        cover_gradient_to: row.cover_gradient_to ?? null,
        cover_image_url: row.cover_image_url ?? null,
        progress_color: row.progress_color ?? null,

        vsl_page_type: row.vsl_page_type,
        hero_headline: row.hero_headline ?? null,
        hero_subheadline: row.hero_subheadline ?? null,
        hero_font_family: row.hero_font_family ?? null,
        hero_headline_size: row.hero_headline_size ?? null,
        hero_subheadline_size: row.hero_subheadline_size ?? null,
        hero_text_color: row.hero_text_color ?? null,
        hero_headline_enabled: Boolean(row.hero_headline_enabled ?? true),
        hero_subheadline_enabled: Boolean(row.hero_subheadline_enabled ?? true),
        hero_headline_style: row.hero_headline_style ?? null,
        hero_subheadline_style: row.hero_subheadline_style ?? null,
        cta_bg_color: row.cta_bg_color ?? null,
        cta_text_color: row.cta_text_color ?? null,
        custom_css: row.custom_css ?? null,
        cta_enabled: Boolean(row.cta_enabled),
        cta_delay_seconds: row.cta_delay_seconds ?? null,
        cta_text: row.cta_text ?? null,
        cta_url: row.cta_url ?? null,
        cta_variant: row.cta_variant,
        header_blocks: row.header_blocks,
        top_bar_config: row.top_bar_config,
        page_builder_config: row.page_builder_config,

        autoplay: Boolean(row.autoplay),
        smart_autoplay: row.smart_autoplay ?? null,
        smart_autoplay_enabled: Boolean(row.smart_autoplay_enabled ?? false),
        smart_prompt_title: row.smart_prompt_title ?? null,
        smart_prompt_subtitle: row.smart_prompt_subtitle ?? null,
        smart_prompt_variant: row.smart_prompt_variant ?? "default",

        smart_pause_enabled: Boolean(row.smart_pause_enabled ?? true),
        smart_pause_text: row.smart_pause_text ?? "Continue assistindo",
        smart_reload_enabled: Boolean(row.smart_reload_enabled ?? true),
        smart_reload_continue_text: row.smart_reload_continue_text ?? "Continuar assistindo",
        smart_reload_restart_text: row.smart_reload_restart_text ?? "Voltar do começo",
        smart_end_enabled: Boolean(row.smart_end_enabled ?? true),
        smart_end_text: row.smart_end_text ?? "Assistir novamente",
        player_click_toggle: Boolean(row.player_click_toggle ?? true),
        loop: Boolean(row.loop),
        controls_visible: row.controls_visible ?? null,

        bunny_id: row.bunny_id ?? null,
        status: row.status ?? "ready",
        thumbnail_url: row.thumbnail_url ?? null,
      },
      signedUrl,
    };

    console.log("public-vsl ok", { videoId, signed: Boolean(signedUrl) });
    return json(resp);
  } catch (err) {
    console.error("public-vsl fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
