import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Code2, Copy } from "lucide-react";

type Aspect = "auto" | "16:9" | "9:16" | "1:1";

function aspectToCss(aspect: Exclude<Aspect, "auto">) {
  if (aspect === "9:16") return "9 / 16";
  if (aspect === "1:1") return "1 / 1";
  return "16 / 9";
}

function aspectToPaddingTop(aspect: Exclude<Aspect, "auto">) {
  if (aspect === "9:16") return "177.7778%";
  if (aspect === "1:1") return "100%";
  return "56.25%";
}

export function EmbedCodeDialog({
  videoId,
  savedLayoutRatio,
  children,
}: {
  videoId: string;
  savedLayoutRatio?: string | null;
  children?: React.ReactNode;
}) {
  const { toast } = useToast();
  const [aspect, setAspect] = React.useState<Aspect>("auto");

  // Use the current domain (production or localhost)
  const EMBED_BASE_URL = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://seu-dominio.com'; // Fallback para SSR

  const effectiveAspect: Exclude<Aspect, "auto"> =
    aspect !== "auto"
      ? aspect
      : savedLayoutRatio === "9:16" || savedLayoutRatio === "1:1" || savedLayoutRatio === "16:9"
        ? (savedLayoutRatio as any)
        : "16:9";

  const embedUrl = `${EMBED_BASE_URL}/embed/${videoId}`;

  const standardElementTag = "makovid-player";
  const standardAspectAttr = effectiveAspect === "1:1" ? "square" : effectiveAspect;
  
  const standardCode = `<script defer>
customElements.define("${standardElementTag}", class extends HTMLElement {
  connectedCallback(){
    const root = this.attachShadow({mode:"open"});
    const t = this.getAttribute.bind(this);
    const id = t("video-id") || "";
    const base = t("base-url") || "";
    const ar = t("aspect-ratio") || "16:9";

    let cssAR = "16 / 9";
    if (ar === "square" || ar === "1:1") cssAR = "1 / 1";
    else if (ar === "9:16") cssAR = "9 / 16";
    else if (ar && ar.includes(":")) cssAR = ar.replace(":", " / ");

    root.innerHTML =
      '<style>'+
        ':host{display:block;max-width:1280px;margin-inline:auto}'+
        '.v{position:relative;width:100%;aspect-ratio:'+cssAR+';overflow:hidden;border-radius:12px;background:#000}'+
        'iframe{position:absolute;inset:0;width:100%;height:100%;border:0}'+
      '</style>'+
      '<div class="v">'+
        '<iframe '+
          'src="'+ base + '/embed/' + id +'" '+
          'loading="lazy" '+
          'allow="autoplay; fullscreen; picture-in-picture" '+
          'allowfullscreen'+
        '></iframe>'+
      '</div>';
  }
});
</script>

<${standardElementTag} video-id="${videoId}" base-url="${EMBED_BASE_URL}" aspect-ratio="${standardAspectAttr}"></${standardElementTag}>`;

  const iframeCode = `<iframe src="${embedUrl}"
  frameborder="0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
  loading="lazy"
  style="width:100%; aspect-ratio:${aspectToCss(effectiveAspect)}; border:0; border-radius:12px;">
</iframe>`;

  const scriptCode = `<!-- Container (cole onde quiser no Elementor/WordPress) -->
<div id="vsl-embed-${videoId}"></div>

<!-- Script de Injeção Inteligente (iframe responsivo 16:9) -->
<script defer>
(function(){
  var VIDEO_ID = "${videoId}";
  var BASE_URL = "${EMBED_BASE_URL}";
  var EMBED_URL = BASE_URL + "/embed/" + VIDEO_ID;

  var mount = document.getElementById("vsl-embed-${videoId}");
  if (!mount) return;

  // Wrapper responsivo (16:9 por padrão, funciona em qualquer container)
  var wrap = document.createElement("div");
  wrap.style.position = "relative";
  wrap.style.width = "100%";
  wrap.style.paddingTop = "${aspectToPaddingTop(effectiveAspect)}";
  wrap.style.overflow = "hidden";
  wrap.style.borderRadius = "12px";
  mount.appendChild(wrap);

  // Iframe do player (o /embed/:id busca as configs no backend via ID)
  var iframe = document.createElement("iframe");
  iframe.src = EMBED_URL;
  iframe.setAttribute("title", "VSL Player");
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("allowfullscreen", "true");
  iframe.allow = "autoplay; fullscreen; picture-in-picture";
  iframe.style.position = "absolute";
  iframe.style.inset = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  wrap.appendChild(iframe);

  // ===== postMessage (eventos do iframe) =====
  function onMessage(ev){
    // Dica: valide ev.origin (ex: '${EMBED_BASE_URL}') no seu site, se quiser.
    if (!ev || !ev.data || !ev.data.type) return;
    var d = ev.data;
    if (!d.videoId || d.videoId !== VIDEO_ID) return;

    // Eventos emitidos pelo player:
    // - vsl:timeupdate { seconds }
    // - vsl:cta_visible { seconds, delaySeconds }  <- use isso para mostrar o botão de delay no seu site
    // - vsl:playback_state { state: 'playing'|'paused'|'ended' }
    // console.log('[VSL]', d.type, d);
  }
  window.addEventListener("message", onMessage);

  // ===== commands_in (enviar comandos para o iframe) =====
  function cmd(action, seconds){
    try {
      iframe.contentWindow && iframe.contentWindow.postMessage({
        type: "vsl:command",
        action: action,
        seconds: seconds
      }, "*");
    } catch (e) {}
  }

  // API opcional para o site pai controlar o player:
  window.VslHavenEmbed = window.VslHavenEmbed || {};
  window.VslHavenEmbed[VIDEO_ID] = {
    play: function(){ cmd("play"); },
    pause: function(){ cmd("pause"); },
    seek: function(s){ cmd("seek", s); },
    destroy: function(){
      window.removeEventListener("message", onMessage);
      try { mount.removeChild(wrap); } catch (e) {}
      try { delete window.VslHavenEmbed[VIDEO_ID]; } catch (e) {}
    }
  };
})();
</script>`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado" });
    } catch (e: any) {
      toast({ title: "Não foi possível copiar", description: String(e?.message ?? e), variant: "destructive" });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="soft" aria-label="Código embed" title="Código embed">
            <Code2 className="h-4 w-4" />
            Código Embed
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Código de Incorporação</DialogTitle>
          <DialogDescription>Copie e cole no WordPress (Elementor) ou no seu site.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">Proporção</div>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as Aspect)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="auto">Automático</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16 (Stories)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>
          </div>

          <Tabs defaultValue="standard">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="standard">Padrão</TabsTrigger>
              <TabsTrigger value="iframe">Iframe</TabsTrigger>
              <TabsTrigger value="script">Script JS</TabsTrigger>
            </TabsList>
            
            <TabsContent value="standard" className="mt-4 grid gap-3">
              <Textarea value={standardCode} readOnly className="min-h-[260px] font-mono text-xs" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  Recomendado para WordPress. Componente web <code>&lt;makovid-player&gt;</code> moderno.
                </div>
                <Button variant="hero" onClick={() => copy(standardCode)} className="w-full sm:w-auto">
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </TabsContent>

             <TabsContent value="iframe" className="mt-4 grid gap-3">
              <Textarea value={iframeCode} readOnly className="min-h-[160px] font-mono text-xs" />
              <div className="flex justify-end">
                <Button variant="hero" onClick={() => copy(iframeCode)} className="w-full sm:w-auto">
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="script" className="mt-4 grid gap-3">
              <Textarea value={scriptCode} readOnly className="min-h-[220px] font-mono text-xs" />
              <div className="flex justify-end">
                <Button variant="hero" onClick={() => copy(scriptCode)} className="shrink-0">
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
