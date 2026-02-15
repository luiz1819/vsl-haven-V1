import * as React from "react";
import { useParams } from "react-router-dom";
import { cloud } from "@/lib/cloudClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VslPreviewPlayer } from "@/components/video/VslPreviewPlayer";
import { parseInlineStyle } from "@/lib/parseInlineStyle";
import { RichHeaderDisplay } from "@/components/video/RichHeaderDisplay";
import { TopBarDisplay } from "@/components/video/TopBarDisplay";
import { BuilderRenderer } from "@/components/video/BuilderRenderer";
import type { HeaderBlock } from "@/components/video/edit/RichHeaderEditor";
import type { TopBarConfig } from "@/components/video/edit/TopBarControls";

type LayoutRatio = "16:9" | "9:16" | "1:1";
type IconStyle = "rounded" | "square" | "diamond";
type CoverMode = "none" | "solid" | "gradient" | "image";

type PublicVslPayload = {
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

    bunny_id: string | null;
    thumbnail_url: string | null;
    status: string;

    hero_headline_enabled: boolean;
    hero_subheadline_enabled: boolean;
    hero_headline_style: string | null;
    hero_subheadline_style: string | null;

    // New
    header_blocks?: any; // JSONB
    top_bar_config?: any; // JSONB
    page_builder_config?: any; // JSONB
  };
  signedUrl?: string;
};

// ... [rest of file]
// I will split this into chunks to be safe and cleaner, but replace_file_content is full file replacement-ish if I range it well.
// Actually, I'll use multi_replace for safer partial application.

export default function PublicVsl() {
  const { id } = useParams();
  const [searchParams] = React.useState(new URLSearchParams(window.location.search));
  
  // Display toggles from URL (default to true if not specified)
  const showH = searchParams.get("h") !== "0";
  const showS = searchParams.get("s") !== "0";
  const showC = searchParams.get("c") !== "0";

  const videoId = id ?? "";

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [payload, setPayload] = React.useState<PublicVslPayload | null>(null);
  const [ctaVisible, setCtaVisible] = React.useState(false);

  const anonIdRef = React.useRef<string | null>(null);
  const lastPingBucketRef = React.useRef<number>(-1);

  React.useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    setError(null);

    cloud.functions
      .invoke("public-vsl", { body: { videoId, expiresIn: 600 } })
      .then(({ data, error: e }) => {
        if (e) throw e;
        setPayload(data as PublicVslPayload);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [videoId]);

  const onPlaybackTimeSeconds = React.useCallback(
    (seconds: number) => {
      const v = payload?.video;
      if (!v) return;

      // CTA reveal by playback time
      const delay = Math.max(0, Number(v.cta_delay_seconds ?? 0));
      const shouldShow = Boolean(v.cta_enabled) && v.vsl_page_type === "page_with_cta" && seconds >= delay;
      if (shouldShow) setCtaVisible(true);

      // Telemetry ping every 5s watched
      if (!anonIdRef.current) anonIdRef.current = getOrCreateAnonId();
      const bucket = Math.floor(seconds / 5);
      if (bucket <= lastPingBucketRef.current) return;
      lastPingBucketRef.current = bucket;

      cloud.functions
        .invoke("telemetry-ping", {
          body: {
            videoId: v.id,
            anonId: anonIdRef.current,
            positionSeconds: Math.floor(seconds),
            incrementSeconds: 5,
          },
        })
        .then(() => { })
        .catch(() => { });
    },
    [payload?.video],
  );

  function getOrCreateAnonId() {
    const key = "vsl_anon_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID();
    localStorage.setItem(key, next);
    return next;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Card className="surface-1 shadow-elev">
          <CardContent className="p-6 text-sm text-muted-foreground">Carregando…</CardContent>
        </Card>
      </div>
    );
  }

  if (error || !payload?.video) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Card className="surface-1 shadow-elev">
          <CardContent className="p-6">
            <div className="text-sm font-medium">Não foi possível carregar a VSL</div>
            <div className="mt-2 text-xs text-muted-foreground">{error ?? "Vídeo não encontrado"}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const v = payload.video;
  const showHero = v.vsl_page_type === "page_with_cta";
  const ctaText = v.cta_text ?? "Quero comprar agora";
  const ctaUrl = v.cta_url ?? "";

  const heroStyle = {
    ...(v.hero_font_family?.trim() ? { fontFamily: v.hero_font_family.trim() } : null),
    ...(v.hero_text_color ? { color: v.hero_text_color } : null),
  } as React.CSSProperties;

  const h1Style = {
    ...(v.hero_headline_size ? { fontSize: `${v.hero_headline_size}px` } : null),
    lineHeight: 1.05,
    ...parseInlineStyle(v.hero_headline_style),
  } as React.CSSProperties;

  const subStyle = {
    ...(v.hero_subheadline_size ? { fontSize: `${v.hero_subheadline_size}px` } : null),
    opacity: 0.86,
    ...parseInlineStyle(v.hero_subheadline_style),
  } as React.CSSProperties;

  const ctaStyle = {
    ...(v.cta_bg_color ? { backgroundColor: v.cta_bg_color } : null),
    ...(v.cta_text_color ? { color: v.cta_text_color } : null),
  } as React.CSSProperties;

  const hasBlocks = v.header_blocks && (v.header_blocks as HeaderBlock[]).length > 0;

  // Render Builder Mode if enabled
  if (v.vsl_page_type === "builder" && v.page_builder_config) {
      const builderConfig = v.page_builder_config as any; // Cast to BuilderConfig
      return (
         <BuilderRenderer 
            config={builderConfig} 
            videoData={v} 
            signedUrl={payload.signedUrl} 
         />
      );
  }

  return (
    <>
      <TopBarDisplay config={(v.top_bar_config as TopBarConfig | null)} />

      <main className="mx-auto max-w-4xl space-y-6 p-4 text-center md:p-10" style={heroStyle}>
        {v.custom_css?.trim() ? <style>{v.custom_css}</style> : null}
        
        {showHero && (
          <header className="space-y-3">
             {hasBlocks ? (
                 <RichHeaderDisplay blocks={(v.header_blocks as HeaderBlock[])} fontFamily={v.hero_font_family} textColor={v.hero_text_color} />
             ) : (
                <>
                  {showH && Boolean(v.hero_headline_enabled) && (
                    <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl" style={h1Style}>
                      {v.hero_headline ?? v.title}
                    </h1>
                  )}
                  {showS && Boolean(v.hero_subheadline_enabled) && Boolean(v.hero_subheadline) && (
                    <p className="mx-auto max-w-2xl" style={subStyle}>
                      {v.hero_subheadline}
                    </p>
                  )}
                </>
             )}
          </header>
        )}

        <section className="space-y-4">
          <VslPreviewPlayer
            videoId={v.id}
            signedUrl={payload.signedUrl}
            bunnyId={v.bunny_id}
            layoutRatio={(v.layout_ratio as LayoutRatio) ?? "16:9"}
            coverColorParts={v.cover_color}
            coverMode={(v.cover_mode as CoverMode) ?? "solid"}
            coverOpacity={Number(v.cover_opacity ?? 90)}
            coverSaturation={Number(v.cover_saturation ?? 100)}
            coverGradientFrom={v.cover_gradient_from}
            coverGradientTo={v.cover_gradient_to}
            coverImageUrl={v.cover_image_url}
            progressColorParts={v.progress_color}
            iconStyle={(v.icon_style as IconStyle) ?? "rounded"}
            posterUrl={v.thumbnail_url ?? v.cover_image_url}
            autoplay={Boolean(v.autoplay)}
            smartAutoplay={Boolean(v.smart_autoplay_enabled ?? v.smart_autoplay)}
            smartPromptTitle={v.smart_prompt_title}
            smartPromptSubtitle={v.smart_prompt_subtitle}
            smartPromptVariant={(v.smart_prompt_variant as any) ?? "default"}
            smartPauseEnabled={v.smart_pause_enabled}
            smartPauseText={v.smart_pause_text}
            smartReloadEnabled={v.smart_reload_enabled}
            smartReloadContinueText={v.smart_reload_continue_text}
            smartReloadRestartText={v.smart_reload_restart_text}
            smartEndEnabled={v.smart_end_enabled}
            smartEndText={v.smart_end_text}
            playerClickToggle={v.player_click_toggle}
            onPlaybackTimeSeconds={onPlaybackTimeSeconds}
          />

          {showHero && showC && Boolean(v.cta_enabled) && ctaVisible && ctaUrl && (
            <div className="flex justify-center">
              <Button asChild variant={(v.cta_variant as any) ?? "hero"} size="lg" style={ctaStyle}>
                <a href={ctaUrl} target="_blank" rel="noreferrer">
                  {ctaText}
                </a>
              </Button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
