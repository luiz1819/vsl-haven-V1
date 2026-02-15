import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info, Play, Volume2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type AutoplayTemplate = {
  id: string;
  name: string;
  preview: string;
  backgroundColor: string;
  textColor: string;
  iconColor?: string;
  opacity?: number;
  borderRadius?: number;
  variant: "default" | "professional";
  icon?: "play" | "muted" | "click"; // Optional, can derive from logic if needed
  active?: boolean;
};

const defaultTemplates: AutoplayTemplate[] = [
  {
    id: "template1",
    name: "Smart Autoplay 1",
    preview: "Seu vídeo já começou",
    backgroundColor: "#1E88E5",
    textColor: "#FFFFFF",
    iconColor: "#FFFFFF",
    opacity: 100,
    borderRadius: 12,
    variant: "default",
    icon: "muted",
  },
];


const templatePreviews = [
  { text: "Seu vídeo já começou", bg: "#1E88E5", icon: "muted" },
  { text: "Clique para ouvir", bg: "#1E88E5", icon: "play" },
  { text: "Clique para ouvir", bg: "#424242", icon: "play" },
  { text: "Seu vídeo já começou", bg: "#1E88E5", icon: "muted" },
  { text: "Clique para ouvir", bg: "#DC3545", icon: "click" },
];

type SmartAutoplayConfigProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  templates: AutoplayTemplate[];
  onTemplateSelect: (templateId: string) => void;
  onAddTemplate: () => void;
  onStartTest: () => void;
  // Customization Props
  smartAutoplayColor: string;
  setSmartAutoplayColor: (v: string) => void;
  smartAutoplayOpacity: number;
  setSmartAutoplayOpacity: (v: number) => void;
  smartAutoplayIconColor: string;
  setSmartAutoplayIconColor: (v: string) => void;
  smartAutoplayTextColor: string;
  setSmartAutoplayTextColor: (v: string) => void;
  smartAutoplayBorderRadius: number;
  setSmartAutoplayBorderRadius: (v: number) => void;
  // Content Props
  smartPromptTitle: string;
  smartPromptSubtitle: string;
};

export function SmartAutoplayConfig({
  enabled,
  onEnabledChange,
  templates,
  onTemplateSelect,
  onAddTemplate,
  onStartTest,
  smartAutoplayColor,
  setSmartAutoplayColor,
  smartAutoplayOpacity,
  setSmartAutoplayOpacity,
  smartAutoplayIconColor,
  setSmartAutoplayIconColor,
  smartAutoplayTextColor,
  setSmartAutoplayTextColor,
  smartAutoplayBorderRadius,
  setSmartAutoplayBorderRadius,
  smartPromptTitle,
  smartPromptSubtitle,
}: SmartAutoplayConfigProps) {
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false);

  // Helper to get active icon type for preview (default to muted if unknown)
  const activeTemplate = templates.find(t => t.active) || templates[0];
  const activeIcon = activeTemplate?.icon || "muted";

  return (
    <Card className="surface-1 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Play className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Smart Autoplay™</CardTitle>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Banner ... */}
        {/* Live Preview ... */}

        {/* Template List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Templates</h3>
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onTemplateSelect(template.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border p-3 transition-colors text-left",
                template.active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center border shadow-sm transition-all"
                  style={{ 
                      backgroundColor: template.backgroundColor, 
                      borderRadius: template.borderRadius !== undefined ? `${template.borderRadius}px` : "12px",
                      opacity: template.opacity !== undefined ? template.opacity / 100 : 1
                  }}
                >
                  {/* Default icon if not specified is Play */}
                  <Play className="h-5 w-5" style={{ color: template.iconColor || template.textColor }} />
                </div>
                <span className="font-medium">{template.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {template.active && <Badge variant="default">Ativo</Badge>}
              </div>
            </button>
          ))}

          {/* Add Template Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setTemplateDialogOpen(true)}
          >
            Adicionar outro Autoplay
          </Button>
        </div>

        {/* Manual Customization */}
        <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
          <h3 className="text-sm font-semibold">Personalização Manual</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Background Color */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Cor de Fundo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={smartAutoplayColor}
                  onChange={(e) => setSmartAutoplayColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border p-1"
                />
                <input
                  type="text"
                  value={smartAutoplayColor}
                  onChange={(e) => setSmartAutoplayColor(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Icon Color */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Cor do Ícone</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={smartAutoplayIconColor}
                  onChange={(e) => setSmartAutoplayIconColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border p-1"
                />
                <input
                  type="text"
                  value={smartAutoplayIconColor}
                  onChange={(e) => setSmartAutoplayIconColor(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Cor do Texto</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={smartAutoplayTextColor}
                  onChange={(e) => setSmartAutoplayTextColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border p-1"
                />
                <input
                  type="text"
                  value={smartAutoplayTextColor}
                  onChange={(e) => setSmartAutoplayTextColor(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-medium">Opacidade</label>
                <span className="text-xs text-muted-foreground">{smartAutoplayOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={smartAutoplayOpacity}
                onChange={(e) => setSmartAutoplayOpacity(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            
            {/* Border Radius */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-medium">Arredondamento</label>
                <span className="text-xs text-muted-foreground">{smartAutoplayBorderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={smartAutoplayBorderRadius}
                onChange={(e) => setSmartAutoplayBorderRadius(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Start Test Button */}
        <Button className="w-full" onClick={onStartTest}>
          Iniciar novo teste
        </Button>

        {/* Template Selection Dialog - Keeping existing for now but simplified interaction */}
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Escolher Template</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Escolha um template para o seu Smart Autoplay
              </p>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              {templatePreviews.map((preview, index) => (
                <button
                  key={index}
                  className="group relative aspect-video overflow-hidden rounded-lg border-2 border-transparent transition-all hover:border-primary hover:shadow-lg"
                  onClick={() => {
                    onAddTemplate();
                    setTemplateDialogOpen(false);
                  }}
                >
                  <div
                    className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
                    style={{ backgroundColor: preview.bg }}
                  >
                    {preview.icon === "muted" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="7.999 9.062 46.75 32.563"
                        className="h-8 w-8"
                        style={{ fill: "#FFFFFF" }}
                      >
                        <style>{`
                          @keyframes BLINK {
                            0% { opacity: 0; }
                            33% { opacity: 1; }
                            66% { opacity: 1; }
                            100% { opacity: 0; }
                          }
                          .blink_1 { animation: BLINK 2s infinite; opacity: 0; }
                          .blink_2 { animation: BLINK 2s infinite .3s; opacity: 0; }
                          .blink_3 { animation: BLINK 2s infinite .6s; opacity: 0; }
                        `}</style>
                        <g className="animation">
                          <path d="M53.249,39.616c-0.186,0-0.371-0.051-0.537-0.157l-43.5-27.75c-0.466-0.297-0.603-0.916-0.306-1.381c0.298-0.466,0.917-0.601,1.381-0.306l43.5,27.75c0.467,0.297,0.604,0.916,0.307,1.381C53.901,39.453,53.579,39.616,53.249,39.616z"/>
                          <path className="blink_3" d="M48.896,33.467l1.699,1.085c3.497-7.791,2.073-17.271-4.313-23.659c-0.391-0.391-1.023-0.391-1.414,0s-0.391,1.023,0,1.414C50.581,18.019,51.913,26.463,48.896,33.467z"/>
                          <path className="blink_3" d="M46.926,36.956c-0.612,0.863-1.286,1.695-2.059,2.469c-0.392,0.391-0.392,1.023,0,1.414c0.194,0.195,0.45,0.293,0.707,0.293c0.256,0,0.512-0.098,0.706-0.293c0.878-0.878,1.642-1.824,2.333-2.807L46.926,36.956z"/>
                          <path className="blink_2" d="M42.543,29.415l1.777,1.135c1.545-5.315,0.229-11.293-3.953-15.476c-0.392-0.391-1.023-0.391-1.414,0c-0.392,0.391-0.392,1.023,0,1.414C42.454,19.987,43.639,24.925,42.543,29.415z"/>
                          <path className="blink_2" d="M41,33.174c-0.563,0.94-1.235,1.837-2.047,2.646c-0.391,0.392-0.391,1.023,0,1.414c0.195,0.195,0.451,0.293,0.707,0.293s0.512-0.098,0.707-0.293c0.916-0.914,1.676-1.924,2.317-2.984L41,33.174z"/>
                          <path className="blink_1" d="M35.771,25.094l2.003,1.277c0.012-0.203,0.029-0.404,0.029-0.609c0-3.079-1.2-5.974-3.381-8.153c-0.391-0.391-1.022-0.391-1.414,0c-0.391,0.391-0.391,1.023,0,1.414C34.652,20.666,35.613,22.802,35.771,25.094z"/>
                          <path className="blink_1" d="M35.084,29.401c-0.474,1.145-1.172,2.197-2.076,3.1c-0.391,0.391-0.391,1.023,0,1.414c0.195,0.195,0.451,0.293,0.707,0.293c0.257,0,0.513-0.098,0.707-0.293c1.008-1.006,1.795-2.17,2.361-3.43L35.084,29.401z"/>
                          <polygon points="28.124,20.215 28.124,14.991 24.635,17.99"/>
                          <path d="M20.921,20.366h-6.423c-0.553,0-1,0.508-1,1.135v8.229c0,0.627,0.447,1.135,1,1.135h7.375l6.25,5.875V24.96L20.921,20.366z"/>
                        </g>
                      </svg>
                    )}
                    {preview.icon === "play" && <Play className="h-6 w-6 text-white" />}
                    {preview.icon === "click" && (
                      <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    )}
                    <span className="text-xs font-medium text-white">{preview.text}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setTemplateDialogOpen(false)}>
                Definir template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export { defaultTemplates };
export type { AutoplayTemplate };
