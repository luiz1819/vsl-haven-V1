import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";

type ResumeOverlayConfigProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  message: string;
  onMessageChange: (message: string) => void;
  restartText: string;
  onRestartTextChange: (text: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
};

export function ResumeOverlayConfig({
  enabled,
  onEnabledChange,
  message,
  onMessageChange,
  restartText,
  onRestartTextChange,
  backgroundColor,
  onBackgroundColorChange,
}: ResumeOverlayConfigProps) {
  // Parse hex to RGB for color picker display
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 23, g: 122, b: 178 }; // Default blue
  };

  const rgb = hexToRgb(backgroundColor);

  return (
    <Card className="surface-1 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <CardTitle className="text-base">Continuar assistindo</CardTitle>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info Banner */}
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-blue-900 dark:text-blue-100">
            Aprenda sobre Continuar assistindo
          </p>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Preview do Overlay</Label>
          <div
            className="relative flex min-h-[200px] w-full flex-col items-center justify-center gap-4 rounded-lg p-6 text-center"
            style={{
              background: `linear-gradient(to bottom, ${backgroundColor}, rgba(0,0,0,0.4))`,
            }}
          >
            <p className="text-lg font-medium text-white drop-shadow-lg">
              {message || "Você já começou a assistir a este vídeo"}
            </p>
            <div className="flex gap-3">
              <button className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30">
                ▶ {message || "Continuar assistindo"}
              </button>
              <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20">
                ⟲ {restartText || "Começar do começo"}
              </button>
            </div>
          </div>
        </div>

        {/* Color Picker Section */}
        <div className="space-y-3">
          <div className="relative">
            {/* Color Spectrum Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-pink-500" />
              
              {/* RGB/Hex Display */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div>
                  <div className="rounded border bg-background px-2 py-1 font-mono">{backgroundColor.toUpperCase()}</div>
                  <div className="mt-1 text-muted-foreground">Hex</div>
                </div>
                <div>
                  <div className="rounded border bg-background px-2 py-1 font-mono">{rgb.r}</div>
                  <div className="mt-1 text-muted-foreground">R</div>
                </div>
                <div>
                  <div className="rounded border bg-background px-2 py-1 font-mono">{rgb.g}</div>
                  <div className="mt-1 text-muted-foreground">G</div>
                </div>
                <div>
                  <div className="rounded border bg-background px-2 py-1 font-mono">{rgb.b}</div>
                  <div className="mt-1 text-muted-foreground">B</div>
                </div>
                <div>
                  <div className="rounded border bg-background px-2 py-1 font-mono">100</div>
                  <div className="mt-1 text-muted-foreground">A</div>
                </div>
              </div>

              {/* Color Picker and Hex Input */}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="color-picker">Seletor de Cor</Label>
                  <input
                    id="color-picker"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => onBackgroundColorChange(e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-md border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hex-input">Código Hex</Label>
                  <Input
                    id="hex-input"
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => onBackgroundColorChange(e.target.value)}
                    placeholder="#117AB2"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Button Texts */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="continue-message">Texto do botão "Continuar"</Label>
            <Input
              id="continue-message"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Continuar assistindo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restart-text">Texto do botão "Recomeçar"</Label>
            <Input
              id="restart-text"
              value={restartText}
              onChange={(e) => onRestartTextChange(e.target.value)}
              placeholder="Começar do começo"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
