import * as React from "react";
import { useParams } from "react-router-dom";
import { cloud } from "@/lib/cloudClient";
import { VslEmbedPlayer } from "@/components/video/VslEmbedPlayer";

type PublicVslPayload = {
  video: {
    id: string;
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

    custom_css: string | null;

    autoplay: boolean;
    smart_autoplay: boolean | null;
    smart_autoplay_enabled: boolean;
    loop: boolean;
    controls_visible: boolean | null;
    cta_enabled: boolean;
    cta_delay_seconds: number | null;

    bunny_id: string | null;
    thumbnail_url: string | null;
    status: string;
  };
  signedUrl?: string;
};

export default function Embed() {
  const { id } = useParams();
  const videoId = id ?? "";

  const [payload, setPayload] = React.useState<PublicVslPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Lazy load: only fetch heavy data once the embed is mounted.
  React.useEffect(() => {
    if (!videoId) return;
    setError(null);
    setPayload(null);

    cloud.functions
      .invoke("public-vsl", { body: { videoId, expiresIn: 60 * 60 } })
      .then(({ data, error: e }) => {
        if (e) throw e;
        setPayload(data as PublicVslPayload);
      })
      .catch((e) => setError(String(e?.message ?? e)));
  }, [videoId]);

  // Ensure iframe route is truly "clean": no margins, transparent background.
  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.background;
    const prevBodyBg = body.style.background;
    const prevBodyMargin = body.style.margin;
    const prevBodyOverflow = body.style.overflow;

    html.style.background = "transparent";
    body.style.background = "transparent";
    body.style.margin = "0";
    body.style.overflow = "hidden";

    return () => {
      html.style.background = prevHtmlBg;
      body.style.background = prevBodyBg;
      body.style.margin = prevBodyMargin;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  if (!videoId) return null;
  if (error) return null;

  const v = payload?.video;

  return (
    <main className="h-dvh w-dvw bg-transparent">
      {v?.custom_css?.trim() ? <style>{v.custom_css}</style> : null}
      <VslEmbedPlayer
        videoId={videoId}
        src={payload?.signedUrl}
        bunnyId={v?.bunny_id ?? null}
        poster={v?.thumbnail_url ?? null}
        layoutRatio={((v?.layout_ratio as any) ?? "16:9") as any}
        iconStyle={(v?.icon_style as any) ?? "rounded"}
        coverColorParts={v?.cover_color ?? null}
        coverMode={(v?.cover_mode as any) ?? "solid"}
        coverOpacity={Number(v?.cover_opacity ?? 90)}
        coverSaturation={Number(v?.cover_saturation ?? 100)}
        coverGradientFrom={v?.cover_gradient_from ?? null}
        coverGradientTo={v?.cover_gradient_to ?? null}
        coverImageUrl={v?.cover_image_url ?? null}
        progressColorParts={v?.progress_color ?? null}
        autoplay={Boolean(v?.autoplay)}
        smartAutoplay={Boolean(v?.smart_autoplay_enabled ?? v?.smart_autoplay)}
        smartPromptTitle={v?.smart_prompt_title ?? null}
        smartPromptSubtitle={v?.smart_prompt_subtitle ?? null}
        smartPromptVariant={(v?.smart_prompt_variant as any) ?? "default"}
        smartPauseEnabled={Boolean(v?.smart_pause_enabled)}
        smartPauseText={v?.smart_pause_text ?? null}
        smartReloadEnabled={Boolean(v?.smart_reload_enabled)}
        smartReloadContinueText={v?.smart_reload_continue_text ?? null}
        smartReloadRestartText={v?.smart_reload_restart_text ?? null}
        smartEndEnabled={Boolean(v?.smart_end_enabled)}
        smartEndText={v?.smart_end_text ?? null}
        playerClickToggle={Boolean(v?.player_click_toggle)}
        loop={Boolean(v?.loop)}
        // Embed precisa sempre ser “profissional” (sem controles nativos do browser)
        // e com UI/overlays do player.
        controlsVisible={false}
        ctaEnabled={Boolean(v?.cta_enabled)}
        ctaDelaySeconds={v?.cta_delay_seconds ?? null}
      />
    </main>
  );
}
