import * as React from "react";
import { BuilderConfig, BuilderSection } from "../builder/types"; // Import from builder types
import { VslPreviewPlayer } from "./VslPreviewPlayer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { BuilderSection as SectionType } from "../builder/types";

interface BuilderRendererProps {
  config: BuilderConfig;
  videoData?: any; // The full video row to access player settings
  signedUrl?: string; // For the player
}

export function BuilderRenderer({ config, videoData, signedUrl }: BuilderRendererProps) {
  
  // Helper to render individual sections
  const renderSection = (section: SectionType) => {
      const { type, content, styles = {} } = section;
      const key = section.id;

      // Common Container Style
      const sectionStyle: React.CSSProperties = {
          paddingTop: styles.paddingTop ? `${styles.paddingTop}px` : undefined,
          paddingBottom: styles.paddingBottom ? `${styles.paddingBottom}px` : undefined,
          backgroundColor: styles.backgroundColor,
          textAlign: styles.textAlign,
          color: styles.textColor,
          fontFamily: styles.fontFamily,
      };

      switch(type) {
          case 'header':
              return (
                  <header key={key} style={sectionStyle} className="px-4">
                      <div className="max-w-4xl mx-auto space-y-4">
                          {content.headline && (
                              <h1 className="leading-tight font-bold" style={{ fontSize: '2.5rem' }}>{content.headline}</h1>
                          )}
                          {content.subheadline && (
                              <h2 className="text-lg opacity-90 font-normal">{content.subheadline}</h2>
                          )}
                      </div>
                  </header>
              )
          
          case 'video':
              if (!videoData) {
                  return (
                      <section key={key} style={sectionStyle} className="px-4">
                        <div className="max-w-4xl mx-auto border rounded bg-slate-50 p-10 text-center">
                          <p className="text-muted-foreground">Vídeo indisponível ou não selecionado.</p>
                        </div>
                      </section>
                  );
              }
              return (
                  <section key={key} style={sectionStyle} className="px-4">
                    <div className="max-w-4xl mx-auto">
                     <VslPreviewPlayer
                        videoId={videoData.id}
                        signedUrl={signedUrl}
                        bunnyId={videoData.bunny_id}
                        
                        layoutRatio={videoData.layout_ratio || "16:9"}
                        coverColorParts={videoData.cover_color}
                        coverMode={videoData.cover_mode || "solid"}
                        coverOpacity={Number(videoData.cover_opacity ?? 90)}
                        coverSaturation={Number(videoData.cover_saturation ?? 100)}
                        coverGradientFrom={videoData.cover_gradient_from}
                        coverGradientTo={videoData.cover_gradient_to}
                        coverImageUrl={videoData.cover_image_url}
                        progressColorParts={videoData.progress_color}
                        iconStyle={videoData.icon_style || "rounded"}
                        
                        // Smart features passed from videoData
                        smartAutoplay={videoData.smart_autoplay_enabled}
                        smartPromptTitle={videoData.smart_prompt_title}
                        smartPromptSubtitle={videoData.smart_prompt_subtitle}
                        smartPromptVariant={videoData.smart_prompt_variant}
                        smartPauseEnabled={videoData.smart_pause_enabled}
                        smartPauseText={videoData.smart_pause_text}
                        smartReloadEnabled={videoData.smart_reload_enabled}
                        smartReloadContinueText={videoData.smart_reload_continue_text}
                        smartReloadRestartText={videoData.smart_reload_restart_text}
                        smartEndEnabled={videoData.smart_end_enabled}
                        smartEndText={videoData.smart_end_text}
                        playerClickToggle={videoData.player_click_toggle}
                        
                        // Pass CTA logic if needed, but builder CTA handles its own logic mostly?
                        // Actually, smart player has Internal CTA? No, standard VSL page has CTA.
                        // We are rebuilding the page, so we don't supply CTA to the player unless it's an end card.
                        // The 'cta' section below handles the button.
                     />
                    </div>
                  </section>
              )

          case 'text':
              return (
                  <section key={key} style={sectionStyle} className="px-4">
                      <div className="max-w-3xl mx-auto prose dark:prose-invert">
                          <div dangerouslySetInnerHTML={{ __html: content.text || "" }} />
                      </div>
                  </section>
              )

          case 'cta':
             // Handle Delay Logic
             // We need a simple Delay wrapper if we are in public view.
             // Inside BuilderRenderer, we assume we ARE the view.
             // But we need 'currentTime' from the video to handle delay properly if it's sync'd.
             // That's tricky: The video is in a different sibling component.
             // The old system had 'seconds' state lifted up.
             // For now, let's implement CSS animation delay if simple, or just render it.
             // Real delay requires state lifting.
             
             // Simplification: We will rendering it visible by default in editor?
             // Or use simple CSS animation-delay if we can't sync precisely with video play time yet without massive Refactor.
             // Let's use CSS opacity transition.
             
             const ctaBtnStyle: React.CSSProperties = {
                 backgroundColor: styles.buttonColor,
                 color: styles.buttonTextColor,
                 width: styles.fullWidth ? '100%' : 'auto',
                 borderRadius: styles.borderRadius === 'full' ? '9999px' : styles.borderRadius === 'none' ? '0px' : '0.5rem',
                 boxShadow: styles.shadow && styles.shadow !== 'none' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
             };

             return (
                 <div key={key} style={sectionStyle} className="px-4 flex justify-center">
                     <div className={cn("inline-block", styles.fullWidth && "w-full max-w-4xl")}>
                        <Button 
                            size={styles.buttonSize || "lg"}
                            variant={styles.buttonVariant || "default"}
                            className={cn(
                                "text-lg px-8 py-6 transition-transform",
                                styles.animation === 'pulse' && "animate-pulse",
                                styles.animation === 'shake' && "animate-bounce" // close enough
                            )}
                            style={ctaBtnStyle}
                            asChild
                        >
                            <a href={content.url || "#"} target="_blank" rel="noreferrer">
                                {content.buttonText || "Clique Aqui"}
                            </a>
                        </Button>
                     </div>
                 </div>
             )
          
          default:
              return null;
      }
  };

  return (
    <div className="min-h-screen bg-background" style={config?.globalStyles}>
       {config?.sections?.map(section => renderSection(section))}
    </div>
  );
}
