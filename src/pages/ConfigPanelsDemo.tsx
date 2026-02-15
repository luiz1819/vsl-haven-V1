import * as React from "react";
import { ResumeOverlayConfig } from "@/components/video/config/ResumeOverlayConfig";
import { ControlsStyleConfig, defaultPlayerControls } from "@/components/video/config/ControlsStyleConfig";
import { SmartAutoplayConfig, defaultTemplates } from "@/components/video/config/SmartAutoplayConfig";
import type { AutoplayTemplate } from "@/components/video/config/SmartAutoplayConfig";

export default function ConfigPanelsDemo() {
  // Resume Overlay State
  const [resumeEnabled, setResumeEnabled] = React.useState(true);
  const [resumeMessage, setResumeMessage] = React.useState("Você já começou a assistir a este vídeo");
  const [resumeColor, setResumeColor] = React.useState("#117AB2");

  // Controls & Styles State
  const [controls, setControls] = React.useState(defaultPlayerControls);
  const [primaryColor, setPrimaryColor] = React.useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = React.useState("#4CAF50");

  // Smart Autoplay State
  const [autoplayEnabled, setAutoplayEnabled] = React.useState(true);
  const [templates, setTemplates] = React.useState<AutoplayTemplate[]>([
    { ...defaultTemplates[0], active: true },
    defaultTemplates[1],
    defaultTemplates[2],
  ]);

  const handleControlToggle = (id: string, enabled: boolean) => {
    setControls((prev) =>
      prev.map((control) => (control.id === id ? { ...control, enabled } : control))
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    setTemplates((prev) =>
      prev.map((t) => ({ ...t, active: t.id === templateId }))
    );
  };

  const handleAddTemplate = () => {
    const newTemplate: AutoplayTemplate = {
      id: `template${templates.length + 1}`,
      name: `Smart Autoplay ${templates.length + 1}`,
      preview: "Novo template",
      backgroundColor: "#1E88E5",
      textColor: "#FFFFFF",
      icon: "play",
    };
    setTemplates((prev) => [...prev, newTemplate]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Configuração do Smart Player</h1>
          <p className="text-muted-foreground">
            Personalize os overlays, controles e estilos do seu player de vídeo
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resume Overlay Config */}
          <ResumeOverlayConfig
            enabled={resumeEnabled}
            onEnabledChange={setResumeEnabled}
            message={resumeMessage}
            onMessageChange={setResumeMessage}
            backgroundColor={resumeColor}
            onBackgroundColorChange={setResumeColor}
          />

          {/* Smart Autoplay Config */}
          <SmartAutoplayConfig
            enabled={autoplayEnabled}
            onEnabledChange={setAutoplayEnabled}
            templates={templates}
            onTemplateSelect={handleTemplateSelect}
            onAddTemplate={handleAddTemplate}
            onStartTest={() => console.log("Starting test...")}
          />
        </div>

        {/* Controls & Styles Config */}
        <ControlsStyleConfig
          controls={controls}
          onControlToggle={handleControlToggle}
          primaryColor={primaryColor}
          onPrimaryColorChange={setPrimaryColor}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={setBackgroundColor}
        />

        {/* Preview Section */}
        <div className="rounded-lg border bg-muted/30 p-6">
          <h2 className="mb-4 text-lg font-semibold">Preview do Overlay</h2>
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <div
              className="flex h-full w-full items-center justify-center text-white"
              style={{
                background: `linear-gradient(135deg, ${resumeColor}, rgba(0,0,0,0.5))`,
              }}
            >
              <div className="text-center">
                <p className="mb-4 text-xl font-semibold">{resumeMessage}</p>
                <div className="flex items-center justify-center gap-4">
                  <button className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-white/30">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Continuar assistindo?
                  </button>
                  <button className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-white/30">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    Começar do começo?
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
