import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { cloud } from "@/lib/cloudClient";
import { RichHeaderDisplay } from "@/components/video/RichHeaderDisplay";
import { TopBarDisplay } from "@/components/video/TopBarDisplay";
import type { HeaderBlock } from "@/components/video/edit/RichHeaderEditor";
import type { TopBarConfig } from "@/components/video/edit/TopBarControls";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";
import { VslPreviewPlayer } from "@/components/video/VslPreviewPlayer";
import { CoverControls, type CoverMode } from "@/components/video/edit/CoverControls";
import { ControlsTab } from "@/components/video/edit/ControlsTab";
import { SmartAutoplayTab } from "@/components/video/edit/SmartAutoplayTab";
import { clamp } from "@/components/video/edit/colorUtils";
import { EmbedCodeDialog } from "@/components/video/EmbedCodeDialog";
import { VslHeroPreview } from "@/components/video/VslHeroPreview";

type LayoutRatio = "16:9" | "9:16" | "1:1";
type IconStyle = "rounded" | "square" | "diamond";

type VideoConfigRow = {
  id: string;
  title: string;
  description: string | null;
  bucket_id: string | null;
  storage_path: string | null;
  bunny_id?: string | null;
  status?: string;
  thumbnail_url?: string | null;
  smart_autoplay_enabled?: boolean;
  smart_autoplay?: boolean | null; // Legacy field
  smart_prompt_title?: string | null;
  smart_prompt_subtitle?: string | null;
  smart_prompt_variant?: string | null;
  smart_pause_enabled?: boolean;
  smart_pause_text?: string | null;
  smart_reload_enabled?: boolean;
  smart_reload_continue_text?: string | null;
  smart_reload_restart_text?: string | null;
  smart_end_enabled?: boolean;
  smart_end_text?: string | null;
  player_click_toggle?: boolean;
  smart_resume_color?: string | null;
  smart_autoplay_color?: string | null;
  smart_preload_text?: string | null;
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
  show_volume?: boolean;
  show_fullscreen?: boolean;
};

function ratioToAspect(r: LayoutRatio) {
  if (r === "9:16") return "9 / 16";
  if (r === "1:1") return "1 / 1";
  return "16 / 9";
}

function RatioOption({
  value,
  selected,
  onSelect,
}: {
  value: LayoutRatio;
  selected: boolean;
  onSelect: (v: LayoutRatio) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={
        "group relative w-full overflow-hidden rounded-lg border p-3 text-left transition-colors " +
        (selected ? "border-primary" : "border-border hover:border-primary/60")
      }
    >
      <div className="grid gap-3">
        <div className="surface-2 rounded-md p-3">
          <div
            className="mx-auto w-full max-w-[170px] rounded-md bg-muted"
            style={{ aspectRatio: ratioToAspect(value) }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{value === "1:1" ? "square" : value}</span>
          {selected && <span className="text-xs text-primary">Selecionado</span>}
        </div>
      </div>
    </button>
  );
}

function IconStyleOption({
  value,
  selected,
  onSelect,
}: {
  value: IconStyle;
  selected: boolean;
  onSelect: (v: IconStyle) => void;
}) {
  const shapeClass =
    value === "square" ? "rounded-sm" : value === "diamond" ? "rotate-45 rounded-sm" : "rounded-full";

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={
        "w-full rounded-lg border p-4 text-center transition-colors " +
        (selected ? "border-primary" : "border-border hover:border-primary/60")
      }
    >
      <div className="grid justify-items-center gap-3">
        <div className={`h-10 w-10 bg-muted ${shapeClass}`} />
        <div className="text-sm font-medium">{value === "rounded" ? "Circular" : value === "square" ? "Quadrado" : "Diamante"}</div>
      </div>
    </button>
  );
}

export default function VideoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const videoId = id ?? "";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["video-edit", videoId],
    enabled: !!videoId,
    queryFn: async (): Promise<{ row: VideoConfigRow; signedUrl?: string }> => {
      const { data: row, error: e } = await cloud
        .from("videos")
        .select(
          "id,title,description,bucket_id,storage_path,bunny_id,status,thumbnail_url,smart_autoplay_enabled,smart_prompt_title,smart_prompt_subtitle,smart_prompt_variant,smart_pause_enabled,smart_pause_text,smart_reload_enabled,smart_reload_continue_text,smart_reload_restart_text,smart_end_enabled,smart_end_text,player_click_toggle,smart_resume_color,smart_autoplay_color,smart_preload_text,layout_ratio,icon_style,cover_color,cover_mode,cover_opacity,cover_saturation,cover_gradient_from,cover_gradient_to,cover_image_url,progress_color,show_volume,show_fullscreen",
        )
        .eq("id", videoId)
        .maybeSingle();
      if (e) throw e;
      if (!row) throw new Error("Vídeo não encontrado");

      const typed = row as unknown as VideoConfigRow;

      // Storage-backed only.
      if (!typed.bucket_id || !typed.storage_path) {
        return { row: typed, signedUrl: undefined };
      }

      // Longer TTL so long videos can be previewed without expiring mid-playback.
      const { data: signed, error: se } = await cloud.storage
        .from(typed.bucket_id)
        .createSignedUrl(typed.storage_path, 60 * 60);
      return { row: typed, signedUrl: se ? undefined : signed?.signedUrl };
    },
  });

  const [layoutRatio, setLayoutRatio] = React.useState<LayoutRatio>("16:9");
  const [iconStyle, setIconStyle] = React.useState<IconStyle>("rounded");
  const [coverColorParts, setCoverColorParts] = React.useState<string | null>(null);
  const [coverMode, setCoverMode] = React.useState<CoverMode>("solid");
  const [coverOpacity, setCoverOpacity] = React.useState<number>(90);
  const [coverSaturation, setCoverSaturation] = React.useState<number>(100);
  const [coverGradientFrom, setCoverGradientFrom] = React.useState<string | null>(null);
  const [coverGradientTo, setCoverGradientTo] = React.useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = React.useState<string | null>(null);
  const [progressColorParts, setProgressColorParts] = React.useState<string | null>(null);

  const [smartAutoplayEnabled, setSmartAutoplayEnabled] = React.useState<boolean>(false);
  const [smartPromptTitle, setSmartPromptTitle] = React.useState<string>("Seu vídeo já começou");
  const [smartPromptSubtitle, setSmartPromptSubtitle] = React.useState<string>("Clique para ouvir");
  const [smartPromptVariant, setSmartPromptVariant] = React.useState<"default" | "professional">("default");
  const [smartPauseEnabled, setSmartPauseEnabled] = React.useState<boolean>(true);
  const [smartPauseText, setSmartPauseText] = React.useState<string>("Continue assistindo");
  const [smartReloadEnabled, setSmartReloadEnabled] = React.useState<boolean>(true);
  const [smartReloadContinueText, setSmartReloadContinueText] = React.useState<string>("Continuar assistindo");
  const [smartReloadRestartText, setSmartReloadRestartText] = React.useState<string>("Voltar do começo");
  const [smartEndEnabled, setSmartEndEnabled] = React.useState<boolean>(true);
  const [smartEndText, setSmartEndText] = React.useState<string>("Assistir novamente");
  const [playerClickToggle, setPlayerClickToggle] = React.useState<boolean>(true);
  const [showVolume, setShowVolume] = React.useState<boolean>(true);
  const [showFullscreen, setShowFullscreen] = React.useState<boolean>(true);
  const [smartResumeColor, setSmartResumeColor] = React.useState<string>("#117AB2");
  const [smartAutoplayColor, setSmartAutoplayColor] = React.useState<string>("#1E88E5");
  const [smartAutoplayOpacity, setSmartAutoplayOpacity] = React.useState<number>(100);
  const [smartAutoplayIconColor, setSmartAutoplayIconColor] = React.useState<string>("#FFFFFF");
  const [smartAutoplayTextColor, setSmartAutoplayTextColor] = React.useState<string>("#FFFFFF");
  const [smartAutoplayBorderRadius, setSmartAutoplayBorderRadius] = React.useState<number>(12);
  const [smartPreloadText, setSmartPreloadText] = React.useState<string>("Seu vídeo já começou");
  const [layoutAutoPicked, setLayoutAutoPicked] = React.useState(false);




  React.useEffect(() => {
    if (!data?.row) return;
    const r = data.row;

    setLayoutRatio((r.layout_ratio as LayoutRatio) ?? "16:9");
    setIconStyle((r.icon_style as IconStyle) ?? "rounded");
    setCoverColorParts(r.cover_color ?? null);
    setCoverMode((r.cover_mode as CoverMode) ?? "solid");
    setCoverOpacity(r.cover_opacity ?? 90);
    setCoverSaturation(r.cover_saturation ?? 100);
    setCoverGradientFrom(r.cover_gradient_from ?? null);
    setCoverGradientTo(r.cover_gradient_to ?? null);
    setCoverImageUrl(r.cover_image_url ?? null);
    setProgressColorParts(r.progress_color ?? null);

    setProgressColorParts(r.progress_color ?? null);

    setSmartAutoplayEnabled(Boolean(r.smart_autoplay_enabled ?? r.smart_autoplay));
    setSmartPromptTitle(r.smart_prompt_title ?? "");
    setSmartPromptSubtitle(r.smart_prompt_subtitle ?? "");
    setSmartPromptVariant((r.smart_prompt_variant as any) ?? "default");

    setSmartPauseEnabled(Boolean(r.smart_pause_enabled));
    setSmartPauseText(r.smart_pause_text ?? "");
    setSmartReloadEnabled(Boolean(r.smart_reload_enabled));
    setSmartReloadContinueText(r.smart_reload_continue_text ?? "");
    setSmartReloadRestartText(r.smart_reload_restart_text ?? "");
    setSmartEndEnabled(Boolean(r.smart_end_enabled));
    setSmartEndText(r.smart_end_text ?? "");
    setPlayerClickToggle(r.player_click_toggle ?? true);
    
    // Default new controls to TRUE if they are null/undefined (legacy videos or defaults)
    setShowVolume(r.show_volume ?? true);
    setShowFullscreen(r.show_fullscreen ?? true);
    
    // Smart overlay colors
    setSmartResumeColor(r.smart_resume_color ?? "#117AB2");
    setSmartAutoplayColor(r.smart_autoplay_color ?? "#1E88E5");
    setSmartPreloadText(r.smart_preload_text ?? "Seu vídeo já começou");
    // New Smart Autoplay Customization
    setSmartAutoplayOpacity(r.smart_autoplay_opacity ?? 100);
    setSmartAutoplayIconColor(r.smart_autoplay_icon_color ?? "#FFFFFF");
    setSmartAutoplayTextColor(r.smart_autoplay_text_color ?? "#FFFFFF");
    setSmartAutoplayBorderRadius(r.smart_autoplay_border_radius ?? 12);

    // Allow a fresh auto-pick when switching videos.
    setLayoutAutoPicked(false);
  }, [data?.row]);

  const pickLayoutFromAspect = React.useCallback(
    (aspect: number) => {
      if (!Number.isFinite(aspect) || aspect <= 0) return;
      if (layoutAutoPicked) return;

      // If the backend already has a meaningful value, keep it.
      const saved = (data?.row?.layout_ratio as LayoutRatio | undefined) ?? "16:9";
      const hasSavedChoice = saved === "16:9" || saved === "9:16" || saved === "1:1";
      if (hasSavedChoice && saved !== "16:9") {
        setLayoutAutoPicked(true);
        return;
      }

      // Heuristic based on the actual video dimensions.
      // - very tall => 9:16
      // - near-square => 1:1
      // - otherwise => 16:9
      if (aspect < 0.82) {
        setLayoutRatio("9:16");
      } else if (aspect >= 0.9 && aspect <= 1.1) {
        setLayoutRatio("1:1");
      } else {
        setLayoutRatio("16:9");
      }

      setLayoutAutoPicked(true);
    },
    [data?.row?.layout_ratio, layoutAutoPicked],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        layout_ratio: layoutRatio,
        icon_style: iconStyle,
        cover_color: coverColorParts,
        cover_mode: coverMode,
        cover_opacity: coverOpacity,
        cover_saturation: coverSaturation,
        cover_gradient_from: coverGradientFrom,
        cover_gradient_to: coverGradientTo,
        cover_image_url: coverImageUrl,
        progress_color: progressColorParts,

        smart_autoplay_enabled: Boolean(smartAutoplayEnabled),

        smart_prompt_title: smartPromptTitle?.trim() ? smartPromptTitle.trim() : null,
        smart_prompt_subtitle: smartPromptSubtitle?.trim() ? smartPromptSubtitle.trim() : null,
        smart_prompt_variant: smartPromptVariant,

        smart_pause_enabled: Boolean(smartPauseEnabled),
        smart_pause_text: smartPauseText?.trim() ? smartPauseText.trim() : null,
        smart_reload_enabled: Boolean(smartReloadEnabled),
        smart_reload_continue_text: smartReloadContinueText?.trim() ? smartReloadContinueText.trim() : null,
        smart_reload_restart_text: smartReloadRestartText?.trim() ? smartReloadRestartText.trim() : null,
        smart_end_enabled: Boolean(smartEndEnabled),
        smart_end_text: smartEndText?.trim() ? smartEndText.trim() : null,
        player_click_toggle: Boolean(playerClickToggle),
        smart_resume_color: smartResumeColor,
        smart_autoplay_color: smartAutoplayColor,
        smart_autoplay_opacity: smartAutoplayOpacity,
        smart_autoplay_icon_color: smartAutoplayIconColor,
        smart_autoplay_text_color: smartAutoplayTextColor,
        smart_autoplay_border_radius: smartAutoplayBorderRadius,
        smart_preload_text: smartPreloadText?.trim() ? smartPreloadText.trim() : null,
        show_volume: Boolean(showVolume),
        show_fullscreen: Boolean(showFullscreen),
      };

      const { error: e } = await cloud.from("videos").update(payload).eq("id", videoId);
      if (e) throw e;
    },
    onSuccess: () => {
      toast({ title: "Alterações salvas" });
      refetch();
    },
    onError: (e: any) => {
      toast({ title: "Erro ao salvar", description: String(e?.message ?? e), variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/videos")} aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Personalizar Vídeo</h1>
            <p className="text-sm text-muted-foreground">{data?.row?.title ?? "Carregando..."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="hero" onClick={() => mutation.mutate()} disabled={mutation.isPending || !videoId}>
            <Save className="h-4 w-4" />
            Salvar Alterações
            </Button>
        </div>
      </header>

      {error && (
        <Card className="surface-1">
          <CardHeader>
            <CardTitle>Não foi possível carregar</CardTitle>
            <CardDescription className="text-destructive">{String((error as any)?.message ?? error)}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="surface-1 shadow-elev">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Preview do player (sempre visível).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <VslPreviewPlayer
              videoId={videoId}
              signedUrl={data?.signedUrl}
              bunnyId={data?.row?.bunny_id ?? null}
              posterUrl={data?.row?.thumbnail_url ?? data?.row?.cover_image_url}
              layoutRatio={layoutRatio}
              coverColorParts={coverColorParts}
              coverMode={coverMode}
              coverOpacity={coverOpacity}
              coverSaturation={coverSaturation}
              coverGradientFrom={coverGradientFrom}
              coverGradientTo={coverGradientTo}
              coverImageUrl={coverImageUrl}
              progressColorParts={progressColorParts}
              iconStyle={iconStyle}
              smartAutoplay={smartAutoplayEnabled}
              smartPromptTitle={smartPromptTitle}
              smartPromptSubtitle={smartPromptSubtitle}
              smartPromptVariant={smartPromptVariant}
              smartPauseEnabled={smartPauseEnabled}
              smartPauseText={smartPauseText}
              smartReloadEnabled={smartReloadEnabled}
              smartReloadContinueText={smartReloadContinueText}
              smartReloadRestartText={smartReloadRestartText}
              smartEndEnabled={smartEndEnabled}
              smartEndText={smartEndText}
              playerClickToggle={playerClickToggle}
              onVideoMetadata={(meta) => pickLayoutFromAspect(meta.aspect)}
              showVolume={data?.row?.show_volume}
              showFullscreen={data?.row?.show_fullscreen}
              smartAutoplayColor={smartAutoplayColor}
              smartAutoplayOpacity={smartAutoplayOpacity}
              smartAutoplayIconColor={smartAutoplayIconColor}
              smartAutoplayTextColor={smartAutoplayTextColor}
              smartAutoplayBorderRadius={smartAutoplayBorderRadius}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                Compartilhe este player em WordPress/Elementor ou no seu site.
              </div>
              <div className="w-full sm:w-auto">
                <EmbedCodeDialog videoId={videoId} savedLayoutRatio={layoutRatio}>
                  <Button variant="soft" className="w-full sm:w-auto" aria-label="Código embed" title="Código embed">
                    Código Embed
                  </Button>
                </EmbedCodeDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-1 shadow-elev">
          <CardHeader className="pb-2">
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Ajuste layout e comportamento do player.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="layout" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="cover">Capa</TabsTrigger>
                <TabsTrigger value="controls">Controles</TabsTrigger>
                <TabsTrigger value="smartautoplay">Smart Autoplay</TabsTrigger>
              </TabsList>

              <TabsContent value="layout" className="mt-4 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold">Proporção do vídeo</h2>
                  <div className="grid gap-3 md:grid-cols-3">
                    <RatioOption value="16:9" selected={layoutRatio === "16:9"} onSelect={setLayoutRatio} />
                    <RatioOption value="9:16" selected={layoutRatio === "9:16"} onSelect={setLayoutRatio} />
                    <RatioOption value="1:1" selected={layoutRatio === "1:1"} onSelect={setLayoutRatio} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-semibold">Estilo dos ícones</h2>
                  <div className="grid gap-3 md:grid-cols-3">
                    <IconStyleOption value="rounded" selected={iconStyle === "rounded"} onSelect={setIconStyle} />
                    <IconStyleOption value="square" selected={iconStyle === "square"} onSelect={setIconStyle} />
                    <IconStyleOption value="diamond" selected={iconStyle === "diamond"} onSelect={setIconStyle} />
                  </div>
                </div>
              </TabsContent>

              <CoverControls
                coverMode={coverMode}
                setCoverMode={setCoverMode}
                coverOpacity={coverOpacity}
                setCoverOpacity={setCoverOpacity}
                coverSaturation={coverSaturation}
                setCoverSaturation={setCoverSaturation}
                coverColorParts={coverColorParts}
                setCoverColorParts={setCoverColorParts}
                coverGradientFrom={coverGradientFrom}
                setCoverGradientFrom={setCoverGradientFrom}
                coverGradientTo={coverGradientTo}
                setCoverGradientTo={setCoverGradientTo}
                coverImageUrl={coverImageUrl}
                setCoverImageUrl={setCoverImageUrl}

                progressColorParts={progressColorParts}
                setProgressColorParts={setProgressColorParts}

                smartAutoplayEnabled={smartAutoplayEnabled}
                setSmartAutoplayEnabled={setSmartAutoplayEnabled}
                smartPromptTitle={smartPromptTitle}
                setSmartPromptTitle={setSmartPromptTitle}
                smartPromptSubtitle={smartPromptSubtitle}
                setSmartPromptSubtitle={setSmartPromptSubtitle}
                smartPromptVariant={smartPromptVariant}
                setSmartPromptVariant={setSmartPromptVariant}
                smartPauseEnabled={smartPauseEnabled}
                setSmartPauseEnabled={setSmartPauseEnabled}
                smartPauseText={smartPauseText}
                setSmartPauseText={setSmartPauseText}
                smartReloadEnabled={smartReloadEnabled}
                setSmartReloadEnabled={setSmartReloadEnabled}
                smartReloadContinueText={smartReloadContinueText}
                setSmartReloadContinueText={setSmartReloadContinueText}
                smartReloadRestartText={smartReloadRestartText}
                setSmartReloadRestartText={setSmartReloadRestartText}
                smartEndEnabled={smartEndEnabled}
                setSmartEndEnabled={setSmartEndEnabled}
                smartEndText={smartEndText}
                setSmartEndText={setSmartEndText}
                playerClickToggle={playerClickToggle}
                setPlayerClickToggle={setPlayerClickToggle}
                showVolume={showVolume}
                setShowVolume={setShowVolume}
                showFullscreen={showFullscreen}
                setShowFullscreen={setShowFullscreen}
                smartResumeColor={smartResumeColor}
                setSmartResumeColor={setSmartResumeColor}
                smartAutoplayColor={smartAutoplayColor}
                setSmartAutoplayColor={setSmartAutoplayColor}
                smartPreloadText={smartPreloadText}
                setSmartPreloadText={setSmartPreloadText}
              />

              <ControlsTab
                playerClickToggle={playerClickToggle}
                setPlayerClickToggle={setPlayerClickToggle}
                smartEndEnabled={smartEndEnabled}
                setSmartEndEnabled={setSmartEndEnabled}
                smartEndText={smartEndText}
                setSmartEndText={setSmartEndText}
                showVolume={showVolume}
                setShowVolume={setShowVolume}
                showFullscreen={showFullscreen}
                setShowFullscreen={setShowFullscreen}
              />

              <SmartAutoplayTab
                smartAutoplayEnabled={smartAutoplayEnabled}
                setSmartAutoplayEnabled={setSmartAutoplayEnabled}
                smartPromptTitle={smartPromptTitle}
                setSmartPromptTitle={setSmartPromptTitle}
                smartPromptSubtitle={smartPromptSubtitle}
                setSmartPromptSubtitle={setSmartPromptSubtitle}
                smartPromptVariant={smartPromptVariant}
                setSmartPromptVariant={setSmartPromptVariant}
                smartAutoplayColor={smartAutoplayColor}
                setSmartAutoplayColor={setSmartAutoplayColor}
                smartAutoplayOpacity={smartAutoplayOpacity}
                setSmartAutoplayOpacity={setSmartAutoplayOpacity}
                smartAutoplayIconColor={smartAutoplayIconColor}
                setSmartAutoplayIconColor={setSmartAutoplayIconColor}
                smartAutoplayTextColor={smartAutoplayTextColor}
                setSmartAutoplayTextColor={setSmartAutoplayTextColor}
                smartAutoplayBorderRadius={smartAutoplayBorderRadius}
                setSmartAutoplayBorderRadius={setSmartAutoplayBorderRadius}
              />
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
