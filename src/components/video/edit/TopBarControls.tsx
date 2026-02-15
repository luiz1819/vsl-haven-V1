import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export type TopBarConfig = {
  enabled: boolean;
  text: string;
  showTimer: boolean;
  timerDurationMinutes: number;
  bgColor: string;
  textColor: string;
  position: "fixed" | "static"; // static for now in VSL page flow
};

export const DEFAULT_TOP_BAR: TopBarConfig = {
  enabled: false,
  text: "🔥 Oferta especial por tempo limitado!",
  showTimer: true,
  timerDurationMinutes: 15,
  bgColor: "#ef4444", // red-500
  textColor: "#ffffff",
  position: "fixed",
};

export function TopBarControls({
  config,
  onChange,
}: {
  config: TopBarConfig | null;
  onChange: (c: TopBarConfig) => void;
}) {
  const c = config ?? DEFAULT_TOP_BAR;

  const update = (patch: Partial<TopBarConfig>) => onChange({ ...c, ...patch });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <Label>Barra de Topo (Scarcity)</Label>
          <p className="text-xs text-muted-foreground">Exibe uma barra fixa no topo com aviso e contador.</p>
        </div>
        <Switch checked={c.enabled} onCheckedChange={(v) => update({ enabled: v })} />
      </div>

      {c.enabled && (
        <Card className="surface-2">
          <CardContent className="grid gap-4 p-4">
            <div className="grid gap-2">
              <Label>Texto do aviso</Label>
              <Input value={c.text} onChange={(e) => update({ text: e.target.value })} placeholder="Ex: Oferta acaba em breve..." />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label>Exibir Timer</Label>
              <Switch checked={c.showTimer} onCheckedChange={(v) => update({ showTimer: v })} />
            </div>

            {c.showTimer && (
              <div className="grid gap-2">
                <Label>Duração do Timer (minutos)</Label>
                <Input
                  type="number"
                  min={1}
                  value={c.timerDurationMinutes}
                  onChange={(e) => update({ timerDurationMinutes: Math.max(1, Number(e.target.value)) })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cor de Fundo</Label>
                <Input
                  type="color"
                  value={c.bgColor}
                  onChange={(e) => update({ bgColor: e.target.value })}
                  className="h-10 w-full p-1"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cor do Texto</Label>
                <Input
                  type="color"
                  value={c.textColor}
                  onChange={(e) => update({ textColor: e.target.value })}
                  className="h-10 w-full p-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
