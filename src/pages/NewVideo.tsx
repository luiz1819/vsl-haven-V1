import * as React from "react";
import { z } from "zod";
import { cloud } from "@/lib/cloudClient";
import { useAuth } from "@/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as tus from "tus-js-client";

const schema = z.object({
  title: z.string().min(2, "Título muito curto"),
  description: z.string().max(500).optional(),
});

type VslType = "embed" | "page_with_cta";

function getExt(filename: string) {
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m?.[1] ?? "mp4";
}

export default function NewVideo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [vslType, setVslType] = React.useState<VslType>("embed");
  const [busy, setBusy] = React.useState(false);
  const [phase, setPhase] = React.useState<"idle" | "uploading" | "transcoding">("idle");
  const [progressPct, setProgressPct] = React.useState<number>(0);

  const onUpload = async () => {
    if (!user) return;
    if (!file) {
      toast({ title: "Selecione um vídeo", description: "Envie um arquivo .mp4, .mov, etc.", variant: "destructive" });
      return;
    }

    const parsed = schema.safeParse({ title, description });
    if (!parsed.success) {
      toast({ title: "Verifique os campos", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }

    setBusy(true);
    setPhase("uploading");
    setProgressPct(0);
    try {
      // 1) Create Bunny video object + get TUS credentials
      const { data: bunnyCreds, error: bunnyErr } = await cloud.functions.invoke("upload-to-bunny", {
        body: { title: parsed.data.title },
      });
      if (bunnyErr) throw bunnyErr;

      const bunnyId = String((bunnyCreds as any)?.bunnyId ?? "");
      const libraryId = String((bunnyCreds as any)?.libraryId ?? "");
      const expirationTime = Number((bunnyCreds as any)?.expirationTime ?? 0);
      const signature = String((bunnyCreds as any)?.signature ?? "");
      const tusEndpoint = String((bunnyCreds as any)?.tusEndpoint ?? "");
      if (!bunnyId || !libraryId || !expirationTime || !signature || !tusEndpoint) {
        throw new Error("Resposta inválida do Bunny");
      }

      // 2) Create DB record immediately (hybrid mode; Bunny rows have no storage_path)
      const { data: inserted, error: insertErr } = await cloud
        .from("videos")
        .insert({
          user_id: user.id,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          bucket_id: null,
          storage_path: null,
          mime_type: file.type,
          size_bytes: file.size,

          bunny_id: bunnyId,
          status: "uploading",
          thumbnail_url: null,
          smart_autoplay_enabled: false,

          // Tipo de VSL + defaults automáticos
          vsl_page_type: vslType,
          cta_enabled: vslType === "page_with_cta",
          cta_delay_seconds: vslType === "page_with_cta" ? 30 : null,
          cta_text: vslType === "page_with_cta" ? "Comprar agora" : null,
          cta_url: null,
          cta_variant: "hero",
          hero_headline: vslType === "page_with_cta" ? parsed.data.title : null,
          hero_subheadline: null,
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      const videoRowId = String((inserted as any)?.id ?? "");

      // 3) Upload via TUS directly from the browser
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: tusEndpoint,
          retryDelays: [0, 1000, 3000, 5000, 10000],
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: String(expirationTime),
            VideoId: bunnyId,
            LibraryId: libraryId,
          },
          metadata: {
            filename: file.name,
            filetype: file.type,
            title: parsed.data.title,
          },
          onError: (err) => reject(err),
          onProgress: (bytesUploaded, bytesTotal) => {
            const pct = bytesTotal > 0 ? (bytesUploaded / bytesTotal) * 100 : 0;
            setProgressPct(Math.max(0, Math.min(100, pct)));
          },
          onSuccess: () => resolve(),
        });
        upload.start();
      });

      // 4) Mark as transcoding + poll until ready
      setPhase("transcoding");
      await cloud.from("videos").update({ status: "transcoding" }).eq("id", videoRowId);

      const start = Date.now();
      const timeoutMs = 5 * 60 * 1000;
      while (Date.now() - start < timeoutMs) {
        const { data: st, error: stErr } = await cloud.functions.invoke("bunny-video-status", {
          body: { videoId: videoRowId },
        });
        if (stErr) throw stErr;
        const status = String((st as any)?.status ?? "transcoding");
        const thumbnailUrl = (st as any)?.thumbnailUrl ? String((st as any)?.thumbnailUrl) : null;

        if (status === "ready") {
          await cloud
            .from("videos")
            .update({ status: "ready", thumbnail_url: thumbnailUrl })
            .eq("id", videoRowId);
          toast({ title: "Upload concluído", description: "Seu VSL foi otimizado e está pronto." });
          navigate("/videos", { replace: true });
          return;
        }

        await new Promise((r) => setTimeout(r, 3000));
      }

      throw new Error("Tempo limite de processamento. Tente novamente em instantes.");
    } catch (e: any) {
      toast({ title: "Falha no upload", description: String(e?.message ?? e), variant: "destructive" });
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Novo Vídeo</h1>
        <p className="text-muted-foreground">Upload otimizado (HLS) com segurança via backend functions.</p>
      </header>

      <Card className="surface-1 shadow-elev">
        <CardHeader>
          <CardTitle>Detalhes do VSL</CardTitle>
          <CardDescription>Você poderá editar o player depois (assim que anexar as telas do editor).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: VSL - Produto X" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vslType">Tipo de VSL</Label>
            <select
              id="vslType"
              value={vslType}
              onChange={(e) => setVslType(e.target.value as VslType)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="embed">Normal (Embed)</option>
              <option value="page_with_cta">VSL com CTA (Landing)</option>
            </select>
            <div className="text-xs text-muted-foreground">
              Ao escolher “VSL com CTA”, criamos defaults (CTA habilitado + delay) que você pode ajustar no editor.
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file">Arquivo de vídeo</Label>
            <Input
              id="file"
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="text-xs text-muted-foreground">O upload é feito direto no provedor de vídeo (sem passar pelo seu servidor).</div>
          </div>

          {phase === "transcoding" && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="font-medium">Otimizando vídeo para carregamento instantâneo...</div>
              <div className="mt-1 text-xs text-muted-foreground">
                O vídeo está sendo processado em HLS. Isso pode levar alguns segundos.
              </div>
            </div>
          )}

          <Button variant="hero" onClick={onUpload} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {phase === "uploading" ? `Enviando... ${Math.round(progressPct)}%` : phase === "transcoding" ? "Processando..." : "Enviar vídeo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
