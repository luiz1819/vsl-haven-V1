import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, UploadCloud, Wand2, Code2, Palette, Sparkles } from "lucide-react";

export default function Tutorial() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Tutorial</h1>
        <p className="text-muted-foreground">Aprenda a usar todas as funcionalidades do MakoVid.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="surface-1 shadow-elev">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-primary" />
              1) Envie seu VSL
            </CardTitle>
            <CardDescription>Upload direto para Bunny.net</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Use "Novo Vídeo" para fazer upload. Suporta Bunny.net (HLS) ou Supabase Storage.
            </div>
          </CardContent>
        </Card>

        <Card className="surface-1 shadow-elev">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              2) Personalize
            </CardTitle>
            <CardDescription>Smart Player e layout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Configure Smart Autoplay, Pause, Reload, End. Escolha proporção (16:9, 9:16, 1:1) e cores.
            </div>
          </CardContent>
        </Card>

        <Card className="surface-1 shadow-elev">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              3) Página com CTA
            </CardTitle>
            <CardDescription>VSL completo com botão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Ative CTA com delay, personalize headline/subheadline, e compartilhe a página pública.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recursos Avançados</h2>
        
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="surface-1 shadow-elev">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                CSS Personalizado
                <Badge className="ml-2 bg-primary/10 text-primary">Avançado</Badge>
              </CardTitle>
              <CardDescription>Estilize seu VSL com CSS customizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <strong>Onde usar:</strong> Vá em "Personalizar Vídeo" → Aba "Capa" → Role até "CSS Personalizado"
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Exemplos:</div>
                <div className="rounded-md bg-muted p-3 font-mono text-xs">
                  {`/* Customizar botão CTA */
.cta-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/* Animação no headline */
.hero-headline {
  animation: fadeInUp 1s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}`}
                </div>
              </div>

              <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                <div className="text-xs font-medium text-primary mb-1">💡 Dica</div>
                <div className="text-xs text-muted-foreground">
                  Use classes como <code className="bg-background px-1 rounded">.cta-button</code>, <code className="bg-background px-1 rounded">.hero-headline</code>, <code className="bg-background px-1 rounded">.video-container</code> para estilizar elementos específicos.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-1 shadow-elev">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Smart Player
              </CardTitle>
              <CardDescription>Recursos inteligentes de engajamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <strong>Smart Autoplay:</strong> Inicia mudo, mostra prompt para ativar som
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <strong>Smart Pause:</strong> Overlay customizado ao pausar
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <strong>Smart Reload:</strong> Opção de continuar ou recomeçar ao recarregar
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <strong>Smart End:</strong> Botão para assistir novamente ao finalizar
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
