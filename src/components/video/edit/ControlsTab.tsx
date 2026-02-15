import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export function ControlsTab(props: {
  playerClickToggle: boolean;
  setPlayerClickToggle: (v: boolean) => void;
  smartEndEnabled: boolean;
  setSmartEndEnabled: (v: boolean) => void;
  smartEndText: string;
  setSmartEndText: (v: string) => void;
  showVolume: boolean;
  setShowVolume: (v: boolean) => void;
  showFullscreen: boolean;
  setShowFullscreen: (v: boolean) => void;
}) {
  return (
    <TabsContent value="controls" className="mt-4 space-y-6">
      <div className="grid gap-4">
        <Card className="surface-2">
          <CardContent className="grid gap-4 p-4">
            <div className="grid gap-1">
              <div className="text-sm font-semibold">Controles do Player</div>
              <p className="text-xs text-muted-foreground">
                Configure o comportamento e controles do player.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-0.5">
                <Label>Clique no vídeo: play/pause</Label>
                <p className="text-xs text-muted-foreground">Permite pausar/reproduzir clicando no vídeo.</p>
              </div>
              <Switch
                checked={props.playerClickToggle}
                onCheckedChange={(v) => props.setPlayerClickToggle(Boolean(v))}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-0.5">
                <Label>Prompt no final</Label>
                <p className="text-xs text-muted-foreground">Mostra um card quando o vídeo termina.</p>
              </div>
              <Switch
                checked={props.smartEndEnabled}
                onCheckedChange={(v) => props.setSmartEndEnabled(Boolean(v))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endText">Texto (final)</Label>
              <Input
                id="endText"
                value={props.smartEndText}
                onChange={(e) => props.setSmartEndText(e.target.value)}
                placeholder="Assistir novamente"
              />
            </div>

            <div className="my-2 h-px w-full bg-border" />

            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-0.5">
                <Label>Controle de Volume</Label>
                <p className="text-xs text-muted-foreground">Exibir controle de volume.</p>
              </div>
              <Switch
                checked={props.showVolume}
                onCheckedChange={(v) => props.setShowVolume(Boolean(v))}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-0.5">
                <Label>Controle de Tela Cheia</Label>
                <p className="text-xs text-muted-foreground">Exibir botão de fullscreen.</p>
              </div>
              <Switch
                checked={props.showFullscreen}
                onCheckedChange={(v) => props.setShowFullscreen(Boolean(v))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
