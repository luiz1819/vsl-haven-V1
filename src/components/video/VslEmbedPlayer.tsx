import * as React from "react";
import { useBunnyHlsManifest } from "@/components/video/hls/useBunnyHlsManifest";
import { useHlsAttachment } from "@/components/video/hls/useHlsAttachment";
import { Play } from "lucide-react";
import { SmartOverlayCard } from "@/components/video/player/SmartOverlayCard";
import { useVslResume } from "@/components/video/player/useVslResume";
import { SmartPlayIcon } from "@/components/video/player/SmartPlayIcon";

type PlaybackState = "playing" | "paused" | "ended";

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

export type VslEmbedPlayerProps = {
  src?: string;
  bunnyId?: string | null;
  poster?: string | null;

  // VSL look & feel
  layoutRatio?: LayoutRatio;
  iconStyle?: IconStyle;
  coverColorParts?: string | null;
  coverMode?: CoverMode;
  coverOpacity?: number;
  coverSaturation?: number;
  coverGradientFrom?: string | null;
  coverGradientTo?: string | null;
  coverImageUrl?: string | null;
  progressColorParts?: string | null;

  autoplay?: boolean;
  smartAutoplay?: boolean;
  loop?: boolean;
  controlsVisible?: boolean;
  muted?: boolean;
  ctaEnabled?: boolean;
  ctaDelaySeconds?: number | null;

  // Smart Player copy + preset
  smartPromptTitle?: string | null;
  smartPromptSubtitle?: string | null;
  smartPromptVariant?: "default" | "professional" | null;

  // Smart Player states
  smartPauseEnabled?: boolean;
  smartPauseText?: string | null;
  smartReloadEnabled?: boolean;
  smartReloadContinueText?: string | null;
  smartReloadRestartText?: string | null;
  smartEndEnabled?: boolean;
  smartEndText?: string | null;
  playerClickToggle?: boolean;

  videoId: string;
};

type VslOutboundMessage =
  | {
    type: "vsl:timeupdate";
    videoId: string;
    seconds: number;
  }
  | {
    type: "vsl:playback_state";
    videoId: string;
    state: PlaybackState;
  }
  | {
    type: "vsl:cta_visible";
    videoId: string;
    seconds: number;
    delaySeconds: number;
  };

type VslInboundMessage = {
  type: "vsl:command";
  action: "play" | "pause" | "seek";
  seconds?: number;
};

function postToParent(message: VslOutboundMessage) {
  // Use '*' so it works in WordPress/Elementor and static sites.
  // Consumers should validate event.origin on their side.
  window.parent?.postMessage(message, "*");
}

function canPlayNativeHls(video: HTMLVideoElement) {
  // Safari supports HLS natively.
  return Boolean(video.canPlayType("application/vnd.apple.mpegurl"));
}

export function VslEmbedPlayer({
  src,
  bunnyId,
  poster,
  layoutRatio = "16:9",
  iconStyle = "rounded",
  coverColorParts = null,
  coverMode = "solid",
  coverOpacity = 90,
  coverSaturation = 100,
  coverGradientFrom = null,
  coverGradientTo = null,
  coverImageUrl = null,
  progressColorParts = null,
  autoplay,
  smartAutoplay,
  loop,
  controlsVisible,
  muted,
  ctaEnabled,
  ctaDelaySeconds,
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
  videoId,
  showVolume = true,
  showFullscreen = true,
}: VslEmbedPlayerProps & { showVolume?: boolean; showFullscreen?: boolean }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const lastSecondRef = React.useRef<number>(-1);
  const ctaVisibleSentRef = React.useRef(false);

  const { manifestUrl, loading: bunnyLoading } = useBunnyHlsManifest(bunnyId, { expiresIn: 60 * 10 });

  const effectiveSrc = src ?? manifestUrl;
  const isHls = Boolean(bunnyId) || Boolean(effectiveSrc && String(effectiveSrc).includes(".m3u8"));

  useHlsAttachment({ videoRef, src: effectiveSrc, isHls });

  const [smartPromptVisible, setSmartPromptVisible] = React.useState(false);
  const [resumePromptVisible, setResumePromptVisible] = React.useState(false);
  const [pausePromptVisible, setPausePromptVisible] = React.useState(false);
  const [endPromptVisible, setEndPromptVisible] = React.useState(false);
  const pendingSeekRef = React.useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const rafRef = React.useRef<number | null>(null);
  const [progressPct, setProgressPct] = React.useState(0);

  const effectiveSmartTitle = (smartPromptTitle ?? "").trim() || "Seu vídeo já começou";
  const effectiveSmartSubtitle = (smartPromptSubtitle ?? "").trim() || "Clique para ouvir";
  const effectiveSmartVariant = (smartPromptVariant ?? "default") as "default" | "professional";

  const effectivePauseText = (smartPauseText ?? "").trim() || "Continue assistindo";
  const effectiveReloadContinueText = (smartReloadContinueText ?? "").trim() || "Continuar assistindo";
  const effectiveReloadRestartText = (smartReloadRestartText ?? "").trim() || "Voltar do começo";
  const effectiveEndText = (smartEndText ?? "").trim() || "Assistir novamente";

  const resumeEnabled = Boolean(videoId && smartReloadEnabled);
  const { initialSeconds, save: saveResume, clear: clearResume } = useVslResume({
    videoId,
    userId: null,
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
        setIsPlaying(false);
      }
    } else {
      el.pause();
      setIsPlaying(false);
      stopProgressLoop();
    }
  }, [startProgressLoop, stopProgressLoop]);

  // Reset SmartAutoplay prompt state when source changes
  React.useEffect(() => {
    setSmartPromptVisible(false);
    setIsPlaying(false);
    setHasStarted(false);
    setResumePromptVisible(false);
    setPausePromptVisible(false);
    setEndPromptVisible(false);
    pendingSeekRef.current = null;
    setProgressPct(0);
    stopProgressLoop();
  }, [effectiveSrc, bunnyId]);

  // Autoplay / SmartAutoplay
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !effectiveSrc) return;

    // Reset per-source refs
    lastSecondRef.current = -1;
    ctaVisibleSentRef.current = false;

    const wantsAutoplay = Boolean(autoplay || smartAutoplay);
    if (!wantsAutoplay) return;

    const tryPlay = async () => {
      try {
        // Smart autoplay should start muted to satisfy browser policies.
        if (smartAutoplay) el.muted = true;
        await el.play();
        if (smartAutoplay) setSmartPromptVisible(true);
        setIsPlaying(true);
        setHasStarted(true);
        startProgressLoop();
      } catch {
        // ignore gesture restriction
        setIsPlaying(false);
      }
    };

    // next tick ensures src/hls is attached
    const t = window.setTimeout(tryPlay, 0);
    return () => window.clearTimeout(t);
  }, [effectiveSrc, autoplay, smartAutoplay]);

  const showCover = Boolean(effectiveSrc) && coverMode !== "none" && !hasStarted && !Boolean(smartAutoplay);
  const saturation = Math.max(0, Math.min(100, coverSaturation));
  const baseOpacity = Math.max(0, Math.min(100, coverOpacity)) / 100;
  // Saturation low => reveal initial frame by reducing overlay opacity
  const effectiveOpacity =
    coverMode === "solid" || coverMode === "gradient" ? baseOpacity * (saturation / 100) : baseOpacity;

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

  // Commands from parent
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data as Partial<VslInboundMessage> | null;
      if (!data || data.type !== "vsl:command") return;

      if (data.action === "play") {
        el.play().catch(() => { });
        return;
      }
      if (data.action === "pause") {
        el.pause();
        return;
      }
      if (data.action === "seek") {
        const s = Number(data.seconds);
        if (Number.isFinite(s)) el.currentTime = Math.max(0, s);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="h-full w-full">
      <div
        className="relative grid h-full w-full place-items-center"
        style={{
          // If someone embeds the iframe with no aspect-ratio wrapper,
          // we still preserve an expected ratio by default.
          aspectRatio: ratioToAspect(layoutRatio),
          background: "transparent",
        }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={poster ?? undefined}
          playsInline
          preload="auto"
          controls={Boolean(controlsVisible)}
          controlsList={(!showFullscreen ? "nofullscreen" : "") + (!showVolume ? " nodownload" : "")}
          autoPlay={Boolean(autoplay)}
          muted={Boolean(muted || smartAutoplay)}
          loop={Boolean(loop)}
          onContextMenu={(e) => e.preventDefault()}
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            if (pendingSeekRef.current != null) {
              try {
                el.currentTime = Math.max(0, pendingSeekRef.current);
              } catch {
                // ignore
              }
            }
            if (el.paused) setProgressPct(0);
          }}
          onClick={() => {
            if (Boolean(controlsVisible)) return;
            if (!playerClickToggle) return;
            if (!effectiveSrc) return;
            if (smartPromptVisible) return;
            if (resumePromptVisible) return;
            togglePlay();
          }}
          onTimeUpdate={(e) => {
            const seconds = Math.max(0, Math.floor(e.currentTarget.currentTime));
            if (seconds !== lastSecondRef.current) {
              lastSecondRef.current = seconds;
              postToParent({ type: "vsl:timeupdate", videoId, seconds });

              if (resumeEnabled && seconds > 0 && seconds % 5 === 0) saveResume(seconds);
            }

            const delay = Math.max(0, Number(ctaDelaySeconds ?? 0));
            if (!ctaVisibleSentRef.current && Boolean(ctaEnabled) && seconds >= delay) {
              ctaVisibleSentRef.current = true;
              postToParent({ type: "vsl:cta_visible", videoId, seconds, delaySeconds: delay });
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            setHasStarted(true);
            setPausePromptVisible(false);
            setResumePromptVisible(false);
            setEndPromptVisible(false);
            startProgressLoop();
            postToParent({ type: "vsl:playback_state", videoId, state: "playing" });
          }}
          onPause={() => {
            setIsPlaying(false);
            stopProgressLoop();

            if (resumeEnabled) saveResume(Number(videoRef.current?.currentTime ?? 0));
            // Removed Smart Pause Card trigger to use standard play button instead.
            postToParent({ type: "vsl:playback_state", videoId, state: "paused" });
          }}
          onEnded={() => {
            setIsPlaying(false);
            stopProgressLoop();
            setProgressPct(100);

            if (Boolean(smartEndEnabled)) setEndPromptVisible(true);
            postToParent({ type: "vsl:playback_state", videoId, state: "ended" });
          }}
        />

        {/* Cover overlay (visible only before first start) */}
        {Boolean(effectiveSrc) && coverMode !== "none" && (
          <div
            className={
              "absolute inset-0 transition-opacity duration-300 " +
              (showCover ? "opacity-100" : "pointer-events-none opacity-0")
            }
            style={{
              ...coverBackground,
              opacity: showCover ? effectiveOpacity : 0,
              filter:
                coverMode === "solid" || coverMode === "gradient" ? `saturate(${saturation}%)` : undefined,
            }}
            aria-hidden
          />
        )}

        {/* VSL overlay: show only PLAY; it disappears while playing */}
        {!Boolean(controlsVisible) && !isPlaying && !resumePromptVisible && !pausePromptVisible && !endPromptVisible && (
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
            <span className={iconStyle === "diamond" ? "-rotate-45" : ""}>
              <Play className="h-6 w-6" />
            </span>
          </button>
        )}

        {/* Reload resume prompt */}
        {resumePromptVisible && Boolean(smartReloadEnabled) && !Boolean(smartAutoplay) && !Boolean(controlsVisible) && (
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
                  el.play().catch(() => { });
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
                  el.play().catch(() => { });
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
        {endPromptVisible && Boolean(smartEndEnabled) && !Boolean(controlsVisible) && (
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
              el.play().catch(() => { });
              setEndPromptVisible(false);
              setPausePromptVisible(false);
              setResumePromptVisible(false);
            }}
          >
            <SmartOverlayCard title={effectiveEndText} variant={effectiveSmartVariant} />
          </button>
        )}

        {/* Progress overlay */}
        {!Boolean(controlsVisible) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1" aria-hidden>
            <div
              className="h-full"
              style={{
                width: `${Math.max(0, Math.min(100, progressPct))}%`,
                background: progressColorParts ? `hsl(${progressColorParts})` : "hsl(var(--primary))",
              }}
            />
          </div>
        )}

        {/* SmartAutoplay overlay */}
        {Boolean(smartAutoplay) && smartPromptVisible && (
          <button
            type="button"
            className={
              "absolute inset-0 grid place-items-center text-center " +
              "backdrop-blur-sm px-4"
            }
            style={
              // When Smart Player is enabled, reuse the cover colors to style the prompt.
              coverMode === "solid" && coverColorParts
                ? ({ background: `hsl(${coverColorParts} / 0.55)` } as React.CSSProperties)
                : coverMode === "gradient"
                  ? ({
                    background: `linear-gradient(135deg, ${coverGradientFrom ? `hsl(${coverGradientFrom} / 0.55)` : "hsl(var(--background) / 0.55)"
                      }, ${coverGradientTo ? `hsl(${coverGradientTo} / 0.55)` : "hsl(var(--background) / 0.55)"})`,
                  } as React.CSSProperties)
                  : ({ background: "hsl(var(--background) / 0.60)" } as React.CSSProperties)
            }
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              // CRITICAL: when user clicks, restart from the beginning WITH audio.
              try {
                el.currentTime = 0;
              } catch {
                // ignore
              }
              el.muted = false;
              el.volume = 1;
              el.play().catch(() => { });
              setSmartPromptVisible(false);
            }}
          >
            <SmartOverlayCard 
                title={effectiveSmartTitle} 
                subtitle={effectiveSmartSubtitle} 
                variant={effectiveSmartVariant} 
                icon={<SmartPlayIcon />}
            />
          </button>
        )}

        {/* Simple loading hint for Bunny manifest */}
        {Boolean(bunnyId) && bunnyLoading && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="rounded-md border bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm">
              Carregando player…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
