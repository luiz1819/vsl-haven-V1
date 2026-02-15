import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { SmartAutoplayConfig } from "@/components/video/config/SmartAutoplayConfig";

export function SmartAutoplayTab(props: {
  smartAutoplayEnabled: boolean;
  setSmartAutoplayEnabled: (v: boolean) => void;
  smartPromptTitle: string;
  setSmartPromptTitle: (v: string) => void;
  smartPromptSubtitle: string;
  setSmartPromptSubtitle: (v: string) => void;
  smartPromptVariant: "default" | "professional";
  setSmartPromptVariant: (v: "default" | "professional") => void;
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
}) {
  const templates = React.useMemo(() => [
    {
      id: "1",
      name: "Blue Muted",
      preview: "Seu vídeo já começou",
      backgroundColor: "#1E88E5",
      textColor: "#FFFFFF",
      iconColor: "#FFFFFF",
      opacity: 100,
      borderRadius: 12,
      variant: "default" as const,
      active: props.smartPromptVariant === "default" && props.smartAutoplayColor === "#1E88E5",
    },
    {
      id: "2",
      name: "Blue Play",
      preview: "Clique para ouvir",
      backgroundColor: "#1976D2",
      textColor: "#FFFFFF",
      iconColor: "#FFFFFF",
      opacity: 100,
      borderRadius: 8,
      variant: "professional" as const,
      active: props.smartPromptVariant === "professional" && props.smartAutoplayColor === "#1976D2",
    },
    {
      id: "3",
      name: "Dark Glass",
      preview: "Clique para ouvir",
      backgroundColor: "#000000",
      textColor: "#FFFFFF",
      iconColor: "#FFFFFF",
      opacity: 80,
      borderRadius: 12,
      variant: "default" as const,
      active: props.smartAutoplayColor === "#000000" && props.smartAutoplayOpacity === 80,
    },
    {
      id: "4",
      name: "White Clean",
      preview: "Clique para ouvir",
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      iconColor: "#000000",
      opacity: 90,
      borderRadius: 12,
      variant: "default" as const,
      active: props.smartAutoplayColor === "#FFFFFF",
    },
    {
      id: "5",
      name: "Red Alert",
      preview: "Clique para ouvir",
      backgroundColor: "#F44336",
      textColor: "#FFFFFF",
      iconColor: "#FFFFFF",
      opacity: 100,
      borderRadius: 99, // Pill shape
      variant: "default" as const,
      active: props.smartAutoplayColor === "#F44336",
    },
  ], [props.smartPromptVariant, props.smartAutoplayColor, props.smartAutoplayOpacity]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      props.setSmartAutoplayColor(template.backgroundColor);
      props.setSmartPromptTitle(template.preview);
      props.setSmartPromptVariant(template.variant);
      
      // Apply preset customizations
      props.setSmartAutoplayOpacity(template.opacity);
      props.setSmartAutoplayIconColor(template.iconColor);
      props.setSmartAutoplayTextColor(template.textColor);
      props.setSmartAutoplayBorderRadius(template.borderRadius);
    }
  };

  return (
    <TabsContent value="smartautoplay" className="mt-4 space-y-6">
      <div className="grid gap-4">
        <Card className="surface-2">
          <CardContent className="grid gap-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-0.5">
                <Label>Smart Autoplay</Label>
                <p className="text-xs text-muted-foreground">Modo profissional obrigatório: inicia mudo e pede clique para ouvir.</p>
              </div>
              <Switch
                checked={props.smartAutoplayEnabled}
                onCheckedChange={(v) => props.setSmartAutoplayEnabled(Boolean(v))}
              />
            </div>

            {props.smartAutoplayEnabled && (
              <div className="grid gap-4 rounded-lg border bg-card p-4">
                <div className="grid gap-2">
                  <Label htmlFor="smartTitle">Texto 1 (título)</Label>
                  <Input
                    id="smartTitle"
                    value={props.smartPromptTitle}
                    onChange={(e) => props.setSmartPromptTitle(e.target.value)}
                    placeholder="Ex: Seu vídeo já começou"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="smartSubtitle">Texto 2 (subtítulo)</Label>
                  <Input
                    id="smartSubtitle"
                    value={props.smartPromptSubtitle}
                    onChange={(e) => props.setSmartPromptSubtitle(e.target.value)}
                    placeholder="Ex: Clique para ouvir"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {props.smartAutoplayEnabled && (
          <SmartAutoplayConfig
            enabled={props.smartAutoplayEnabled}
            onEnabledChange={props.setSmartAutoplayEnabled}
            templates={templates}
            onTemplateSelect={handleTemplateSelect}
            // Passing all props for customization
            smartAutoplayColor={props.smartAutoplayColor}
            setSmartAutoplayColor={props.setSmartAutoplayColor}
            smartAutoplayOpacity={props.smartAutoplayOpacity}
            setSmartAutoplayOpacity={props.setSmartAutoplayOpacity}
            smartAutoplayIconColor={props.smartAutoplayIconColor}
            setSmartAutoplayIconColor={props.setSmartAutoplayIconColor}
            smartAutoplayTextColor={props.smartAutoplayTextColor}
            setSmartAutoplayTextColor={props.setSmartAutoplayTextColor}
            smartAutoplayBorderRadius={props.smartAutoplayBorderRadius}
            setSmartAutoplayBorderRadius={props.setSmartAutoplayBorderRadius}
            smartPromptTitle={props.smartPromptTitle}
            smartPromptSubtitle={props.smartPromptSubtitle}
            
            onAddTemplate={() => console.log("Add template")}
            onStartTest={() => console.log("Start test")}
          />
        )}
      </div>
    </TabsContent>
  );
}
