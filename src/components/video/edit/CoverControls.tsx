import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { hexToHslParts, hslPartsToHex } from "./colorUtils";
import { ResumeOverlayConfig } from "@/components/video/config/ResumeOverlayConfig";


export type CoverMode = "none" | "solid" | "gradient" | "image";



export function CoverControls(props: {
  coverMode: CoverMode;
  setCoverMode: (v: CoverMode) => void;
  coverOpacity: number;
  setCoverOpacity: (v: number) => void;
  coverSaturation: number;
  setCoverSaturation: (v: number) => void;
  coverColorParts: string | null;
  setCoverColorParts: (v: string | null) => void;
  coverGradientFrom: string | null;
  setCoverGradientFrom: (v: string | null) => void;
  coverGradientTo: string | null;
  setCoverGradientTo: (v: string | null) => void;
  coverImageUrl: string | null;
  setCoverImageUrl: (v: string | null) => void;

  // Appearance (moved into Cover)
  progressColorParts: string | null;
  setProgressColorParts: (v: string | null) => void;

  // VSL page mode + CTA


  // Smart autoplay
  smartAutoplayEnabled: boolean;
  setSmartAutoplayEnabled: (v: boolean) => void;

  // Smart Player copy + preset
  smartPromptTitle: string;
  setSmartPromptTitle: (v: string) => void;
  smartPromptSubtitle: string;
  setSmartPromptSubtitle: (v: string) => void;
  smartPromptVariant: "default" | "professional";
  setSmartPromptVariant: (v: "default" | "professional") => void;

  // Smart Player states
  smartPauseEnabled: boolean;
  setSmartPauseEnabled: (v: boolean) => void;
  smartPauseText: string;
  setSmartPauseText: (v: string) => void;
  smartReloadEnabled: boolean;
  setSmartReloadEnabled: (v: boolean) => void;
  smartReloadContinueText: string;
  setSmartReloadContinueText: (v: string) => void;
  smartReloadRestartText: string;
  setSmartReloadRestartText: (v: string) => void;
  smartEndEnabled: boolean;
  setSmartEndEnabled: (v: boolean) => void;
  smartEndText: string;
  setSmartEndText: (v: string) => void;
  playerClickToggle: boolean;
  setPlayerClickToggle: (v: boolean) => void;
  // Standard Player Options
  showVolume: boolean;
  setShowVolume: (v: boolean) => void;
  showFullscreen: boolean;
  setShowFullscreen: (v: boolean) => void;
  
  // Smart Overlay Colors
  smartResumeColor: string;
  setSmartResumeColor: (v: string) => void;
  smartAutoplayColor: string;
  setSmartAutoplayColor: (v: string) => void;
  smartPreloadText: string;
  setSmartPreloadText: (v: string) => void;
  
  // NEW: Controlled by parent to hide legacy page controls
}) {
  const { toast } = useToast();

  const coverHex = hslPartsToHex(props.coverColorParts);
  const gradFromHex = hslPartsToHex(props.coverGradientFrom);
  const gradToHex = hslPartsToHex(props.coverGradientTo);
  const progressHex = hslPartsToHex(props.progressColorParts);
  const smartEnabled = Boolean(props.smartAutoplayEnabled);


  return (
    <TabsContent value="cover" className="mt-4 space-y-6">
      <div className="grid gap-4">
        {/* Resume Overlay Configuration */}
        <ResumeOverlayConfig
          enabled={props.smartReloadEnabled}
          onEnabledChange={props.setSmartReloadEnabled}
          message={props.smartReloadContinueText}
          onMessageChange={props.setSmartReloadContinueText}
          restartText={props.smartReloadRestartText}
          onRestartTextChange={props.setSmartReloadRestartText}
          backgroundColor={props.smartResumeColor}
          onBackgroundColorChange={props.setSmartResumeColor}
        />

        {/* Cover Mode Configuration */}
        <Card className="surface-2">
          <CardContent className="grid gap-4 p-4">

            <div className="grid gap-2">
              <Label>Modo da capa</Label>
              {smartEnabled && (
                <p className="text-xs text-muted-foreground">
                  Smart Player habilitado: a capa (landing opcional) fica desabilitada e o visual do Smart Player usa as suas cores.
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-4">
                {(
                  [
                    { v: "solid", label: "Sólido" },
                    { v: "gradient", label: "Degradê" },
                    { v: "image", label: "Imagem" },
                    { v: "none", label: "Sem" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => !smartEnabled && props.setCoverMode(o.v)}
                    disabled={smartEnabled}
                    className={
                      "rounded-lg border px-3 py-2 text-sm transition-colors " +
                      (smartEnabled
                        ? "cursor-not-allowed opacity-50"
                        : props.coverMode === o.v
                          ? "border-primary"
                          : "border-border hover:border-primary/60")
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {!smartEnabled && props.coverMode !== "none" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Transparência</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[props.coverOpacity]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) => props.setCoverOpacity(v[0] ?? 0)}
                    />
                    <div className="w-12 text-right text-xs text-muted-foreground">{props.coverOpacity}%</div>
                  </div>
                </div>

                {(props.coverMode === "solid" || props.coverMode === "gradient") && (
                  <div className="grid gap-2">
                    <Label>Saturação</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[props.coverSaturation]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(v) => props.setCoverSaturation(v[0] ?? 100)}
                      />
                      <div className="w-12 text-right text-xs text-muted-foreground">{props.coverSaturation}%</div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Saturação baixa reduz o impacto da cor e deixa aparecer o frame inicial do vídeo.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!smartEnabled && props.coverMode === "solid" && (
              <div className="grid gap-2">
                <Label htmlFor="coverSolid">Cor sólida</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="coverSolid"
                    type="color"
                    value={coverHex}
                    onChange={(e) => props.setCoverColorParts(hexToHslParts(e.target.value))}
                    className="h-10 w-16 p-1"
                    aria-label="Selecionar cor sólida da capa"
                  />
                  <div className="text-xs text-muted-foreground">Salvo como HSL no banco.</div>
                </div>
              </div>
            )}

            {!smartEnabled && props.coverMode === "gradient" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="gradFrom">De</Label>
                  <Input
                    id="gradFrom"
                    type="color"
                    value={gradFromHex}
                    onChange={(e) => props.setCoverGradientFrom(hexToHslParts(e.target.value))}
                    className="h-10 w-16 p-1"
                    aria-label="Selecionar cor inicial do degradê"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gradTo">Para</Label>
                  <Input
                    id="gradTo"
                    type="color"
                    value={gradToHex}
                    onChange={(e) => props.setCoverGradientTo(hexToHslParts(e.target.value))}
                    className="h-10 w-16 p-1"
                    aria-label="Selecionar cor final do degradê"
                  />
                </div>
              </div>
            )}

            {!smartEnabled && props.coverMode === "image" && (
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="coverImageUrl">Imagem (URL por enquanto)</Label>
                  <Input
                    id="coverImageUrl"
                    value={props.coverImageUrl ?? ""}
                    onChange={(e) => props.setCoverImageUrl(e.target.value ? e.target.value : null)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Também é usado como poster (Thumbnail Burst) para carregar uma imagem antes do play.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => toast({ title: "Upload (placeholder)", description: "Upload ainda não implementado." })}
                  >
                    Upload de imagem
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => props.setCoverImageUrl(null)}>
                    Limpar
                  </Button>
                </div>
              </div>
            )}

            <div className="my-2 h-px w-full bg-border" />

            <div className="grid gap-2">
              <Label htmlFor="progressColor">Barra de progresso</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="progressColor"
                  type="color"
                  value={progressHex}
                  onChange={(e) => props.setProgressColorParts(hexToHslParts(e.target.value))}
                  className="h-10 w-16 p-1"
                  aria-label="Selecionar cor da barra de progresso"
                />
                <div className="text-xs text-muted-foreground">Preview aplicado na barra abaixo do vídeo.</div>
              </div>
            </div>


          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
