import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cloud } from "@/lib/cloudClient";
import { useAuth } from "@/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { ExternalLink, Pencil, PlusCircle, Trash2, Video } from "lucide-react";
import { VslPreviewPlayer } from "@/components/video/VslPreviewPlayer";
import { useToast } from "@/hooks/use-toast";
import { EmbedCodeDialog } from "@/components/video/EmbedCodeDialog";

type VideoRow = {
  id: string;
  title: string;
  description: string | null;
  storage_path: string | null;
  created_at: string;
  bucket_id: string | null;

  bunny_id?: string | null;
  status?: string | null;
  thumbnail_url?: string | null;

  // Player/UI config
  layout_ratio: string | null;
  icon_style: string | null;
  cover_color: string | null;
  cover_mode: string | null;
  cover_opacity: number | null;
  cover_saturation: number | null;
  cover_gradient_from: string | null;
  cover_gradient_to: string | null;
  cover_image_url: string | null;
  progress_color: string | null;
};

type LayoutRatio = "16:9" | "9:16" | "1:1";
type IconStyle = "rounded" | "square" | "diamond";
type CoverMode = "none" | "solid" | "gradient" | "image";

function asLayoutRatio(v: string | null | undefined): LayoutRatio {
  if (v === "9:16" || v === "1:1" || v === "16:9") return v;
  return "16:9";
}

function asIconStyle(v: string | null | undefined): IconStyle {
  if (v === "square" || v === "diamond" || v === "rounded") return v;
  return "rounded";
}

function asCoverMode(v: string | null | undefined): CoverMode {
  if (v === "none" || v === "solid" || v === "gradient" || v === "image") return v;
  return "solid";
}

export default function Videos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["videos", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Array<VideoRow & { signedUrl?: string }>> => {
      const { data: rows, error: e } = await cloud
        .from("videos")
        .select(
          [
            "id",
            "title",
            "description",
            "storage_path",
            "created_at",
            "bucket_id",
            "bunny_id",
            "status",
            "thumbnail_url",
            "layout_ratio",
            "icon_style",
            "cover_color",
            "cover_mode",
            "cover_opacity",
            "cover_saturation",
            "cover_gradient_from",
            "cover_gradient_to",
            "cover_image_url",
            "progress_color",
          ].join(","),
        )
        .order("created_at", { ascending: false });

      if (e) throw e;
      const list = (rows ?? []) as unknown as VideoRow[];

      // Create signed URLs for quick preview.
      const withUrls = await Promise.all(
        list.map(async (v) => {
          // Storage-backed videos only.
          if (!v.storage_path || !v.bucket_id) return { ...v, signedUrl: undefined };

          // For stress tests (e.g. 30min), short signed URLs break playback.
          // Use a longer TTL for the inline preview.
          const { data: signed, error: se } = await cloud.storage
            .from(v.bucket_id)
            .createSignedUrl(v.storage_path, 60 * 60);
          return { ...v, signedUrl: se ? undefined : signed?.signedUrl };
        }),
      );

      return withUrls;
    },
  });

  const onDelete = React.useCallback(
    async (v: VideoRow) => {
      setDeletingId(v.id);
      try {
        // 0) delete from Bunny (if Bunny-backed)
        if (v.bunny_id) {
          const { error: be } = await cloud.functions.invoke("delete-bunny-video", {
            body: { videoId: v.id },
          });
          if (be) throw be;
        }

        // 1) remove file from storage (if Storage-backed)
        if (v.bucket_id && v.storage_path) {
          const { error: storageErr } = await cloud.storage.from(v.bucket_id).remove([v.storage_path]);
          if (storageErr) throw storageErr;
        }

        // 2) remove DB record
        const { error: dbErr } = await cloud.from("videos").delete().eq("id", v.id);
        if (dbErr) throw dbErr;

        toast({ title: "Vídeo excluído", description: "O arquivo e o registro foram removidos." });
        await refetch();
      } catch (e: any) {
        toast({
          title: "Falha ao excluir",
          description: String(e?.message ?? e),
          variant: "destructive",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [refetch, toast],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Meus Vídeos</h1>
          <p className="text-muted-foreground">Seus uploads ficam privados e organizados por usuário.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="soft" onClick={() => refetch()}>
            Atualizar
          </Button>
          <Button asChild variant="hero">
            <Link to="/videos/new">
              <PlusCircle className="h-4 w-4" />
              Novo Vídeo
            </Link>
          </Button>
        </div>
      </header>

      {error && (
        <Card className="surface-1">
          <CardHeader>
            <CardTitle>Não foi possível carregar</CardTitle>
            <CardDescription className="text-destructive">{String((error as any)?.message ?? error)}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="surface-1">
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <Card className="surface-1 shadow-elev md:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                Sua biblioteca está vazia
              </CardTitle>
              <CardDescription>Suba seu primeiro VSL para começar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="hero">
                <Link to="/videos/new">Enviar primeiro vídeo</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {data?.map((v) => (
          <Card key={v.id} className="surface-1 shadow-elev">
            <CardHeader>
              <CardTitle className="truncate">{v.title}</CardTitle>
              <CardDescription className="line-clamp-2">{v.description ?? "Sem descrição"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <VslPreviewPlayer
                signedUrl={v.signedUrl}
                bunnyId={v.bunny_id ?? null}
                posterUrl={v.thumbnail_url ?? v.cover_image_url}
                layoutRatio={asLayoutRatio(v.layout_ratio)}
                iconStyle={asIconStyle(v.icon_style)}
                coverMode={asCoverMode(v.cover_mode)}
                coverColorParts={v.cover_color}
                coverOpacity={v.cover_opacity ?? 90}
                coverSaturation={v.cover_saturation ?? 100}
                coverGradientFrom={v.cover_gradient_from}
                coverGradientTo={v.cover_gradient_to}
                coverImageUrl={v.cover_image_url}
                progressColorParts={v.progress_color}
              />

              <div className="flex flex-col gap-2">
                <div className="text-xs text-muted-foreground">
                  Código de incorporação (WordPress/Elementor ou site).
                </div>
                <EmbedCodeDialog videoId={v.id} savedLayoutRatio={v.layout_ratio}>
                  <Button variant="soft" className="w-full" aria-label="Código embed" title="Código embed">
                    Código Embed
                  </Button>
                </EmbedCodeDialog>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(v.created_at).toLocaleString()}</span>
                {v.signedUrl && (
                  <a
                    href={v.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Abrir <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                <Button asChild variant="hero" className="flex-1">
                  <Link to={`/videos/edit/${v.id}`}>
                    <Pencil className="h-4 w-4" />
                    Personalizar
                  </Link>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="soft"
                      disabled={deletingId === v.id}
                      aria-label="Excluir vídeo"
                      title="Excluir vídeo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir este vídeo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação apaga o arquivo do armazenamento e também remove o registro do vídeo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(v)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
