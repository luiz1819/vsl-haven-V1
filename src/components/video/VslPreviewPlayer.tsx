import * as React from "react";
import { Play } from "lucide-react";
import { useBunnyHlsManifest } from "@/components/video/hls/useBunnyHlsManifest";
import { useHlsAttachment } from "@/components/video/hls/useHlsAttachment";
import { useAuth } from "@/auth/useAuth";
import { SmartOverlayCard } from "@/components/video/player/SmartOverlayCard";
import { useVslResume } from "@/components/video/player/useVslResume";
import { SmartPlayIcon } from "@/components/video/player/SmartPlayIcon";

type IconStyle = "rounded" | "square" | "diamond";
type LayoutRatio = "16:9" | "9:16" | "1:1";
type CoverMode = "none" | "solid" | "gradient" | "image";

function ratioToAspect(r: LayoutRatio) {
  if (r === "9:16") return "9 / 16";
  if (r === "1:1") return "1 / 1";
  return "16 / 9";
}

function iconShapeClass(style: IconStyle) {
  if (style === "square") return "rounded-md";
  if (style === "diamond") return "rotate-45 rounded-md";
  return "rounded-full";
}

export function VslPreviewPlayer({
  videoId,
  signedUrl,
  bunnyId,
  posterUrl,
  layoutRatio,
  coverColorParts,
  coverMode,
  coverOpacity,
  coverSaturation,
  coverGradientFrom,
  coverGradientTo,
  coverImageUrl,
  progressColorParts,
  iconStyle,
  autoplay,
  smartAutoplay,
  smartPromptTitle,
  smartPromptSubtitle,
  smartPromptVariant,
  smartPauseEnabled,
  smartPauseText,
  smartReloadEnabled,
  smartReloadContinueText,
  smartReloadRestartText,
  smartEndEnabled,
  smartEndText,
  playerClickToggle,
  onVideoMetadata,
  onPlaybackTimeSeconds,
  showVolume,
  showFullscreen,
  smartAutoplayColor,
  smartAutoplayOpacity,
  smartAutoplayIconColor,
  smartAutoplayTextColor,
  smartAutoplayBorderRadius,
}: {
  videoId?: string;
  signedUrl?: string;
  bunnyId?: string | null;
  posterUrl?: string | null;
  layoutRatio: LayoutRatio;
  coverColorParts: string | null;
  coverMode: CoverMode;
  coverOpacity: number;
  coverSaturation: number;
  coverGradientFrom: string | null;
  coverGradientTo: string | null;
  coverImageUrl: string | null;
  progressColorParts: string | null;
  iconStyle: IconStyle;
  autoplay?: boolean;
  smartAutoplay?: boolean;
  smartPromptTitle?: string | null;
  smartPromptSubtitle?: string | null;
  smartPromptVariant?: "default" | "professional" | null;
  smartPauseEnabled?: boolean;
  smartPauseText?: string | null;
  smartReloadEnabled?: boolean;
  smartReloadContinueText?: string | null;
  smartReloadRestartText?: string | null;
  smartEndEnabled?: boolean;
  smartEndText?: string | null;
  playerClickToggle?: boolean;
  onVideoMetadata?: (meta: { width: number; height: number; aspect: number; duration: number }) => void;
  onPlaybackTimeSeconds?: (seconds: number) => void;
  showVolume?: boolean;
  showVolume,
  showFullscreen,
  smartAutoplayColor,
  smartAutoplayOpacity,
  smartAutoplayIconColor,
  smartAutoplayTextColor,
  smartAutoplayBorderRadius,
}: {
  const { user } = useAuth();

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const { manifestUrl, isProcessing, loading: bunnyLoading } = useBunnyHlsManifest(bunnyId, { expiresIn: 60 * 10 });
  const effectiveSrc = signedUrl ?? manifestUrl;
  const isHls = Boolean(bunnyId) || Boolean(effectiveSrc && String(effectiveSrc).includes(".m3u8"));

  useHlsAttachment({ videoRef, src: effectiveSrc, isHls });

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [smartPromptVisible, setSmartPromptVisible] = React.useState(false);
  const [resumePromptVisible, setResumePromptVisible] = React.useState(false);
  const [pausePromptVisible, setPausePromptVisible] = React.useState(false);
  const [endPromptVisible, setEndPromptVisible] = React.useState(false);
  const rafRef = React.useRef<number | null>(null);
  const [progressPct, setProgressPct] = React.useState(0);
  const lastEmittedSecondRef = React.useRef<number>(-1);
  const pendingSeekRef = React.useRef<number | null>(null);

  // Reset play state when video source changes
  React.useEffect(() => {
    setIsPlaying(false);
    setHasStarted(false);
    setSmartPromptVisible(false);
    setResumePromptVisible(false);
    setPausePromptVisible(false);
    setEndPromptVisible(false);
    setProgressPct(0);
    lastEmittedSecondRef.current = -1;
    pendingSeekRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [signedUrl, bunnyId]);

  const resumeEnabled = Boolean(videoId && smartReloadEnabled);
  const { initialSeconds, save: saveResume, clear: clearResume } = useVslResume({
    videoId: videoId ?? "",
    userId: user?.id ?? null,
    enabled: resumeEnabled,
  });

  React.useEffect(() => {
    if (!resumeEnabled) return;
    if (!effectiveSrc) return;
    const s = Math.max(0, Math.floor(initialSeconds));
    if (s > 0) {
      pendingSeekRef.current = s;
      setResumePromptVisible(true);
    }
  }, [resumeEnabled, initialSeconds, effectiveSrc]);


  const emitPlaybackTime = React.useCallback(
    (seconds: number) => {
      if (!onPlaybackTimeSeconds) return;
      const s = Math.max(0, Math.floor(seconds));
      if (s === lastEmittedSecondRef.current) return;
      lastEmittedSecondRef.current = s;
      onPlaybackTimeSeconds(s);

      // Hybrid resume persistence: store every 5s.
      if (resumeEnabled && s > 0 && s % 5 === 0) saveResume(s);
    },
    [onPlaybackTimeSeconds, resumeEnabled, saveResume],
  );

  // Progress animation synced to duration (fast at start, slower near the end)
  const easeOutCubic = React.useCallback((t: number) => 1 - Math.pow(1 - t, 3), []);
  const startProgressLoop = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const el = videoRef.current;
      if (!el) return;

      const d = Number(el.duration);
      if (!Number.isFinite(d) || d <= 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const t = Math.max(0, Math.min(1, el.currentTime / d));
      const eased = easeOutCubic(t);
      setProgressPct(eased * 100);

      if (t >= 1) {
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [easeOutCubic]);

  const stopProgressLoop = React.useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Autoplay / SmartAutoplay (preview + public page)
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !effectiveSrc) return;

    const wantsAutoplay = Boolean(autoplay || smartAutoplay);
    if (!wantsAutoplay) return;

    const tryPlay = async () => {
      try {
        if (smartAutoplay) el.muted = true;
        await el.play();
        if (smartAutoplay) setSmartPromptVisible(true);
        setIsPlaying(true);
        setHasStarted(true);
        startProgressLoop();
      } catch {
        setIsPlaying(false);
      }
    };

    const t = window.setTimeout(tryPlay, 0);
    return () => window.clearTimeout(t);
  }, [effectiveSrc, autoplay, smartAutoplay, startProgressLoop]);

  const togglePlay = React.useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      try {
        await el.play();
        setIsPlaying(true);
        setHasStarted(true);
        setPausePromptVisible(false);
        setResumePromptVisible(false);
        setEndPromptVisible(false);
        startProgressLoop();
      } catch {
        // Autoplay/gesture restrictions can block play; keep UI in paused state.
        setIsPlaying(false);
      }
    } else {
      el.pause();
      setIsPlaying(false);
      stopProgressLoop();
    }
  }, [startProgressLoop, stopProgressLoop]);

  const showCover = !!effectiveSrc && coverMode !== "none" && !hasStarted && !Boolean(smartAutoplay);
  const saturation = Math.max(0, Math.min(100, coverSaturation));
  const baseOpacity = Math.max(0, Math.min(100, coverOpacity)) / 100;
  // Saturation low => reveal initial frame by reducing overlay opacity
  const effectiveOpacity = (coverMode === "solid" || coverMode === "gradient") ? baseOpacity * (saturation / 100) : baseOpacity;

  const coverBackground = React.useMemo<React.CSSProperties>(() => {
    if (coverMode === "solid") {
      return {
        background: coverColorParts ? `hsl(${coverColorParts})` : "hsl(var(--muted))",
      };
    }
    if (coverMode === "gradient") {
      const from = coverGradientFrom ? `hsl(${coverGradientFrom})` : "hsl(var(--muted))";
      const to = coverGradientTo ? `hsl(${coverGradientTo})` : "hsl(var(--muted))";
      return { background: `linear-gradient(135deg, ${from}, ${to})` };
    }
    if (coverMode === "image") {
      return coverImageUrl
        ? {
            backgroundImage: `url(${coverImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
        : { background: "hsl(var(--muted))" };
    }
    return { background: "transparent" };
  }, [coverMode, coverColorParts, coverGradientFrom, coverGradientTo, coverImageUrl]);

  const effectiveSmartTitle = (smartPromptTitle ?? "").trim() || "Seu vídeo já começou";
  const effectiveSmartSubtitle = (smartPromptSubtitle ?? "").trim() || "Clique para ouvir";
  const effectiveSmartVariant = (smartPromptVariant ?? "default") as "default" | "professional";

  const effectivePauseText = (smartPauseText ?? "").trim() || "Continue assistindo";
  const effectiveReloadContinueText = (smartReloadContinueText ?? "").trim() || "Continuar assistindo";
  const effectiveReloadRestartText = (smartReloadRestartText ?? "").trim() || "Voltar do começo";
  const effectiveEndText = (smartEndText ?? "").trim() || "Assistir novamente";

  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        className="relative grid place-items-center"
        style={{
          background: "hsl(var(--muted))",
          aspectRatio: ratioToAspect(layoutRatio),
        }}
      >
        {effectiveSrc ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            controls={false}
            preload="auto"
            playsInline
            controlsList={(!showFullscreen ? "nofullscreen" : "") + (!showVolume ? " nodownload" : "")}
            onContextMenu={(e) => e.preventDefault()}
            poster={posterUrl ?? undefined}
            muted={Boolean(smartAutoplay)}
            onClick={() => {
              if (!playerClickToggle) return;
              if (!effectiveSrc) return;
              // Don’t interfere while SmartAutoplay prompt is visible.
              if (smartPromptVisible) return;
              // If resume prompt is visible, clicks should be explicit on buttons.
              if (resumePromptVisible) return;
              togglePlay();
            }}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              const width = el.videoWidth || 0;
              const height = el.videoHeight || 0;
              const aspect = height > 0 ? width / height : 0;
              const duration = Number(el.duration) || 0;

              // Emit metadata to parent (used to auto-pick layout)
              onVideoMetadata?.({ width, height, aspect, duration });

              // Apply pending seek (reload resume)
              if (pendingSeekRef.current != null) {
                try {
                  el.currentTime = Math.max(0, pendingSeekRef.current);
                } catch {
                  // ignore
                }
              }

              // If metadata becomes available while paused, keep progress reset.
              if (el.paused) setProgressPct(0);
            }}
            onTimeUpdate={(e) => {
              emitPlaybackTime(e.currentTarget.currentTime);
            }}
            onPlay={() => {
              setIsPlaying(true);
              setHasStarted(true);
              setPausePromptVisible(false);
              setResumePromptVisible(false);
              setEndPromptVisible(false);
              startProgressLoop();
            }}
            onPause={() => {
              setIsPlaying(false);
              stopProgressLoop();


              // Save on pause.
              if (resumeEnabled) saveResume(Number(videoRef.current?.currentTime ?? 0));
            }}
            onEnded={() => {
              setIsPlaying(false);
              stopProgressLoop();
              setProgressPct(100);
              emitPlaybackTime(Number(videoRef.current?.duration ?? 0));

              // End prompt
              if (Boolean(smartEndEnabled)) setEndPromptVisible(true);
            }}
            onSeeked={() => {
              // Snap progress immediately after seeking
              const el = videoRef.current;
              if (!el) return;
              const d = Number(el.duration);
              if (!Number.isFinite(d) || d <= 0) return;
              const t = Math.max(0, Math.min(1, el.currentTime / d));
              setProgressPct(easeOutCubic(t) * 100);
              emitPlaybackTime(el.currentTime);

              if (resumeEnabled) saveResume(el.currentTime);
            }}
          />
        ) : bunnyId && (bunnyLoading || isProcessing) ? (
          <div className="grid place-items-center gap-3 p-6 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="space-y-1">
              <div className="text-sm font-medium">Processando vídeo...</div>
              <div className="text-xs text-muted-foreground">
                O vídeo está sendo otimizado. Isso pode levar alguns minutos.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Prévia indisponível</div>
        )}

        {/* Cover overlay (placeholder) - visible only before first start */}
        {effectiveSrc && coverMode !== "none" && (
          <div
            className={
              "absolute inset-0 transition-opacity duration-300 " +
              (showCover ? "opacity-100" : "pointer-events-none opacity-0")
            }
            style={{
              ...coverBackground,
              opacity: showCover ? effectiveOpacity : 0,
              filter: coverMode === "solid" || coverMode === "gradient" ? `saturate(${saturation}%)` : undefined,
            }}
            aria-hidden
          />
        )}

        {/* VSL overlay: show only the PLAY button; it disappears while playing */
        /* Also hide if the Smart Pause overlay is visible to avoid double icons */
        !isPlaying && !pausePromptVisible && !endPromptVisible && (
          <button
            type="button"
            onClick={togglePlay}
            disabled={!effectiveSrc}
            className={
              "absolute grid place-items-center border bg-background/80 text-foreground shadow-sm backdrop-blur transition " +
              "hover:bg-background/90 active:scale-[0.98] disabled:opacity-50 " +
              iconShapeClass(iconStyle) +
              " h-14 w-14"
            }
            aria-label="Reproduzir"
          >
            {/* Keep the icon upright even for diamond */}
            <span className={iconStyle === "diamond" ? "-rotate-45" : ""}>
              <Play className="h-6 w-6" />
            </span>
          </button>
        )}

        {/* Reload resume prompt */}
        {resumePromptVisible && Boolean(smartReloadEnabled) && !Boolean(smartAutoplay) && (
          <div className="absolute inset-0 grid place-items-center px-4">
            <div className="grid gap-3">
              <button
                type="button"
                className="vsl-smart-overlay"
                onClick={() => {
                  const el = videoRef.current;
                  if (!el) return;
                  const s = pendingSeekRef.current ?? 0;
                  try {
                    el.currentTime = Math.max(0, s);
                  } catch {
                    // ignore
                  }
                  el.play().catch(() => {});
                  setResumePromptVisible(false);
                  setPausePromptVisible(false);
                }}
              >
                <SmartOverlayCard title={effectiveReloadContinueText} variant={effectiveSmartVariant} />
              </button>

              <button
                type="button"
                className="vsl-smart-overlay"
                onClick={() => {
                  const el = videoRef.current;
                  if (!el) return;
                  pendingSeekRef.current = 0;
                  clearResume();
                  try {
                    el.currentTime = 0;
                  } catch {
                    // ignore
                  }
                  el.play().catch(() => {});
                  setResumePromptVisible(false);
                  setPausePromptVisible(false);
                }}
              >
                <SmartOverlayCard title={effectiveReloadRestartText} variant={effectiveSmartVariant} />
              </button>
            </div>
          </div>
        )}



        {/* End prompt */}
        {endPromptVisible && Boolean(smartEndEnabled) && (
          <button
            type="button"
            className="absolute inset-0 grid place-items-center px-4"
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              clearResume();
              try {
                el.currentTime = 0;
              } catch {
                // ignore
              }
              el.play().catch(() => {});
              setEndPromptVisible(false);
              setPausePromptVisible(false);
              setResumePromptVisible(false);
            }}
          >
            <SmartOverlayCard title={effectiveEndText} variant={effectiveSmartVariant} />
          </button>
        )}


        {/* SmartAutoplay overlay */}
        {Boolean(smartAutoplay) && smartPromptVisible && (
          <button
            type="button"
            className={
              "absolute inset-0 grid place-items-center text-center " +
              "bg-background/60 backdrop-blur-sm px-4"
            }
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              try {
                el.currentTime = 0;
              } catch {
                // ignore
              }
              el.muted = false;
              el.volume = 1;
              el.play().catch(() => {});
              setSmartPromptVisible(false);
            }}
          >
            <SmartOverlayCard 
                title={effectiveSmartTitle} 
                subtitle={effectiveSmartSubtitle} 
                variant={effectiveSmartVariant} 
                icon={<SmartPlayIcon color={smartAutoplayIconColor} />}
                backgroundColor={smartAutoplayColor}
                opacity={smartAutoplayOpacity}
                textColor={smartAutoplayTextColor}
                borderRadius={smartAutoplayBorderRadius}
            />
          </button>
        )}

        {/* Progress overlay (placeholder) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1" aria-hidden>
          <div
            className="h-full"
            style={{
              width: `${Math.max(0, Math.min(100, progressPct))}%`,
              background: progressColorParts ? `hsl(${progressColorParts})` : "hsl(var(--primary))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
