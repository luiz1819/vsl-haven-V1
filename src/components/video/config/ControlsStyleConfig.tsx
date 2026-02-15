import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  PlaySquare,
  BarChart3,
  Clock,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  Gauge,
  Palette,
} from "lucide-react";

type PlayerControl = {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
};

type ControlsStyleConfigProps = {
  controls: PlayerControl[];
  onControlToggle: (id: string, enabled: boolean) => void;
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
};

export function ControlsStyleConfig({
  controls,
  onControlToggle,
  primaryColor,
  onPrimaryColorChange,
  backgroundColor,
  onBackgroundColorChange,
}: ControlsStyleConfigProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Controls Panel */}
      <Card className="surface-1 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Controles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {controls.map((control) => (
              <div key={control.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{control.icon}</div>
                  <Label htmlFor={control.id} className="cursor-pointer font-normal">
                    {control.label}
                  </Label>
                </div>
                <Switch
                  id={control.id}
                  checked={control.enabled}
                  onCheckedChange={(checked) => onControlToggle(control.id, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Styles Panel */}
      <Card className="surface-1 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Estilos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label>Cor Principal</Label>
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 shrink-0 cursor-pointer rounded-lg border-2 border-border shadow-sm transition-transform hover:scale-105"
                style={{ backgroundColor: primaryColor }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "color";
                  input.value = primaryColor;
                  input.onchange = (e) => onPrimaryColorChange((e.target as HTMLInputElement).value);
                  input.click();
                }}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono"
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          <Separator />

          {/* Background Color */}
          <div className="space-y-2">
            <Label>Background</Label>
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 shrink-0 cursor-pointer rounded-lg border-2 border-border shadow-sm transition-transform hover:scale-105"
                style={{ backgroundColor: backgroundColor }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "color";
                  input.value = backgroundColor;
                  input.onchange = (e) => onBackgroundColorChange((e.target as HTMLInputElement).value);
                  input.click();
                }}
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono"
                placeholder="#4CAF50"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Default controls configuration
export const defaultPlayerControls: PlayerControl[] = [
  { id: "bigPlayButton", label: "Botão de Play Grande", icon: <Play className="h-4 w-4" />, enabled: true },
  { id: "smallPlayButton", label: "Botão de Play Pequeno", icon: <PlaySquare className="h-4 w-4" />, enabled: true },
  { id: "progressBar", label: "Barra de progresso", icon: <BarChart3 className="h-4 w-4" />, enabled: true },
  { id: "timeDisplay", label: "Tempo do Vídeo", icon: <Clock className="h-4 w-4" />, enabled: true },
  { id: "rewind10s", label: "Voltar 10s", icon: <SkipBack className="h-4 w-4" />, enabled: true },
  { id: "forward10s", label: "Avançar 10s", icon: <SkipForward className="h-4 w-4" />, enabled: true },
  { id: "volume", label: "Volume", icon: <Volume2 className="h-4 w-4" />, enabled: true },
  { id: "fullscreen", label: "Fullscreen", icon: <Maximize className="h-4 w-4" />, enabled: true },
  { id: "playbackSpeed", label: "Controle de velocidade", icon: <Gauge className="h-4 w-4" />, enabled: true },
];
