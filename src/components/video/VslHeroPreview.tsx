import * as React from "react";
import { Button } from "@/components/ui/button";
import { VslPreviewPlayer } from "@/components/video/VslPreviewPlayer";
import { RichHeaderDisplay } from "./RichHeaderDisplay";
import { TopBarDisplay } from "./TopBarDisplay";
import type { HeaderBlock } from "./edit/RichHeaderEditor";
import type { TopBarConfig } from "./edit/TopBarControls";

type LayoutRatio = "16:9" | "9:16" | "1:1";
type IconStyle = "rounded" | "square" | "diamond";
type CoverMode = "none" | "solid" | "gradient" | "image";
type CtaVariant = "hero" | "secondary" | "outline" | "ghost";

export function VslHeroPreview(props: {
  signedUrl?: string;
  bunnyId?: string | null;
  posterUrl?: string | null;

  layoutRatio: LayoutRatio;
  iconStyle: IconStyle;

  coverColorParts: string | null;
  coverMode: CoverMode;
  coverOpacity: number;
  coverSaturation: number;
  coverGradientFrom: string | null;
  coverGradientTo: string | null;
  coverImageUrl: string | null;
  progressColorParts: string | null;

  smartAutoplayEnabled: boolean;

  smartPromptTitle?: string | null;
  smartPromptSubtitle?: string | null;
  smartPromptVariant?: "default" | "professional" | null;

  // Legacy
  heroHeadline: string;
  heroSubheadline: string;
  heroFontFamily: string;
  heroHeadlineSize: number | null;
  heroSubheadlineSize: number | null;
  heroTextColor: string;

  // New
  headerBlocks?: HeaderBlock[]; // Optional
  topBarConfig?: TopBarConfig | null;

  customCss: string;

  ctaEnabled: boolean;
  ctaDelaySeconds: number | null;
  ctaText: string;
  ctaUrl: string;
  ctaVariant: CtaVariant;
  ctaBgColor: string;
  ctaTextColor: string;

  // Editor mode: force relative positioning for top bar
  previewMode?: boolean; 
}) {
  const [seconds, setSeconds] = React.useState(0);

  const delay = Math.max(0, Number(props.ctaDelaySeconds ?? 0));
  
  // If previewMode is on, we might want to let the user see the CTA immediately if they want?
  // But strictly following the delay is better for accuracy.
  // However, often users want to see it while editing without waiting.
  // Let's assume if seconds > 0 it means video started.
  // If video hasn't started and we are in previewMode, maybe show it? 
  // No, let's stick to the delay logic but ensure seconds update.
  const ctaVisible = Boolean(props.ctaEnabled) && seconds >= delay;

  const heroStyle = React.useMemo<React.CSSProperties>(
    () => ({
      ...(props.heroFontFamily?.trim() ? { fontFamily: props.heroFontFamily.trim() } : null),
      ...(props.heroTextColor ? { color: props.heroTextColor } : null),
    }),
    [props.heroFontFamily, props.heroTextColor],
  );

  const h1Style = React.useMemo<React.CSSProperties>(
    () => ({
      ...(props.heroHeadlineSize ? { fontSize: `${props.heroHeadlineSize}px` } : null),
      lineHeight: 1.05,
    }),
    [props.heroHeadlineSize],
  );

  const subStyle = React.useMemo<React.CSSProperties>(
    () => ({
      ...(props.heroSubheadlineSize ? { fontSize: `${props.heroSubheadlineSize}px` } : null),
      opacity: 0.86,
    }),
    [props.heroSubheadlineSize],
  );

  const ctaStyle = React.useMemo<React.CSSProperties>(
    () => ({
      ...(props.ctaBgColor ? { backgroundColor: props.ctaBgColor } : null),
      ...(props.ctaTextColor ? { color: props.ctaTextColor } : null),
    }),
    [props.ctaBgColor, props.ctaTextColor],
  );

  const hasBlocks = props.headerBlocks && props.headerBlocks.length > 0;

  return (
    <div className="vsl-hero relative" style={heroStyle}>
       <TopBarDisplay config={props.topBarConfig || null} preview={props.previewMode} />
      
       <div className={`space-y-4 text-center ${props.topBarConfig?.enabled && props.topBarConfig.position === 'fixed' ? 'mt-12' : 'mt-4'}`}>
          {props.customCss?.trim() ? <style>{props.customCss}</style> : null}

          <header className="space-y-2">
            {hasBlocks ? (
               <RichHeaderDisplay blocks={props.headerBlocks ?? []} fontFamily={props.heroFontFamily} textColor={props.heroTextColor} />
            ) : (
                <>
                    <h1 className="text-balance font-semibold tracking-tight" style={h1Style}>
                    {props.heroHeadline}
                    </h1>
                    {props.heroSubheadline?.trim() ? (
                    <p className="mx-auto max-w-2xl text-balance" style={subStyle}>
                        {props.heroSubheadline}
                    </p>
                    ) : null}
                </>
            )}
          </header>

          <section className="space-y-3">
            <VslPreviewPlayer
              signedUrl={props.signedUrl}
              bunnyId={props.bunnyId}
              posterUrl={props.posterUrl}
              layoutRatio={props.layoutRatio}
              coverColorParts={props.coverColorParts}
              coverMode={props.coverMode}
              coverOpacity={props.coverOpacity}
              coverSaturation={props.coverSaturation}
              coverGradientFrom={props.coverGradientFrom}
              coverGradientTo={props.coverGradientTo}
              coverImageUrl={props.coverImageUrl}
              progressColorParts={props.progressColorParts}
              iconStyle={props.iconStyle}
              smartAutoplay={props.smartAutoplayEnabled}
              smartPromptTitle={props.smartPromptTitle}
              smartPromptSubtitle={props.smartPromptSubtitle}
              smartPromptVariant={props.smartPromptVariant}
              onPlaybackTimeSeconds={setSeconds}
            />

            {Boolean(props.ctaEnabled) && (ctaVisible || (props.previewMode && seconds === 0 && delay === 0)) ? (
               // Show if visible OR if in preview mode and delay is 0 (immediate) and video hasn't started yet (seconds being 0).
               // Actually if delay is 0, seconds >= delay is true even if seconds is 0. 
               // So the original logic handles delay=0 correctly. 
               // Issue might be props.ctaEnabled coming in false.
               <div className="flex justify-center transition-opacity duration-500 animate-in fade-in">
                 {props.ctaUrl ? (
                    <Button asChild size="lg" variant={props.ctaVariant as any} style={ctaStyle}>
                    <a href={props.ctaUrl} target="_blank" rel="noreferrer">
                        {props.ctaText}
                    </a>
                    </Button>
                 ) : (
                    <Button size="lg" variant={props.ctaVariant as any} style={ctaStyle} disabled>
                        {props.ctaText || "Sem Link"}
                    </Button>
                 )}
              </div>
            ) : null}
            
            {/* Debug info for Preview Mode only if needed, removed for production cleanliness */}
          </section>
      </div>
    </div>
  );
}
