import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { cloud } from "@/lib/cloudClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, Globe, Play, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

type VideoStats = {
  id: string;
  title: string;
  bunnyId: string | null;
  views: number;
  watchTime: number;
  avgWatchTime: number;
};

export default function Analytics() {
  const navigate = useNavigate();

  const analyticsData = useQuery({
    queryKey: ["advanced-analytics"],
    queryFn: async () => {
      // Fetch all videos
      const { data: videos, error: videosErr } = await cloud
        .from("videos")
        .select("id,title,bunny_id")
        .order("created_at", { ascending: false })
        .limit(100);
      if (videosErr) throw videosErr;

      const allVideos = videos ?? [];
      const bunnyVideos = allVideos.filter((v: any) => v.bunny_id);

      // Fetch Bunny statistics for each video
      const videoStatsPromises = bunnyVideos.slice(0, 50).map(async (v: any) => {
        try {
          const { data } = await cloud.functions.invoke("bunny-stream-statistics", {
            body: { bunnyId: v.bunny_id },
          });
          
          if (data && !data.error) {
            const totalViews = data.totalViews || 0;
            const totalWatchTime = data.totalWatchTime || 0;
            
            return {
              id: v.id,
              title: v.title || "Sem título",
              bunnyId: v.bunny_id,
              views: totalViews,
              watchTime: totalWatchTime,
              avgWatchTime: totalViews > 0 ? Math.round(totalWatchTime / totalViews) : 0,
            };
          }
        } catch (err) {
          console.warn(`Failed to fetch stats for ${v.bunny_id}:`, err);
        }
        
        return {
          id: v.id,
          title: v.title || "Sem título",
          bunnyId: v.bunny_id,
          views: 0,
          watchTime: 0,
          avgWatchTime: 0,
        };
      });

      const videoStats = await Promise.all(videoStatsPromises);

      // Sort by views descending
      videoStats.sort((a, b) => b.views - a.views);

      // Calculate totals
      const totalViews = videoStats.reduce((sum, v) => sum + v.views, 0);
      const totalWatchTime = videoStats.reduce((sum, v) => sum + v.watchTime, 0);

      return {
        videoStats,
        totalViews,
        totalWatchTime,
        videosTracked: bunnyVideos.length,
      };
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Analytics Avançado</h1>
          <p className="text-sm text-muted-foreground">
            Estatísticas detalhadas dos seus vídeos com dados do Bunny.net CDN
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => navigate("/")}
          >
            Voltar ao Dashboard
          </Button>
          <Button
            variant="soft"
            size="sm"
            type="button"
            onClick={() => analyticsData.refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="surface-1 shadow-elev">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Total de Views (CDN)</div>
              <div className="text-2xl font-semibold tabular-nums">
                {analyticsData.data?.totalViews.toLocaleString() ?? 0}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Play className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-1 shadow-elev">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Tempo Total Assistido</div>
              <div className="text-2xl font-semibold tabular-nums">
                {Math.round((analyticsData.data?.totalWatchTime ?? 0) / 60).toLocaleString()} min
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-1 shadow-elev">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Vídeos Rastreados</div>
              <div className="text-2xl font-semibold tabular-nums">
                {analyticsData.data?.videosTracked ?? 0}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Video Performance Table */}
      <Card className="surface-1 shadow-elev">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Desempenho por Vídeo
          </CardTitle>
          <CardDescription>
            Ordenado por número de visualizações (dados do Bunny.net CDN)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (analyticsData.data?.videoStats.length ?? 0) === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border bg-background/20">
              <Globe className="h-12 w-12 text-muted-foreground/40" />
              <div className="text-sm font-medium">Nenhum dado disponível</div>
              <div className="text-xs text-muted-foreground">
                Envie vídeos para o Bunny.net para ver estatísticas aqui
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">#</th>
                    <th className="pb-3 pr-4 font-medium">Vídeo</th>
                    <th className="pb-3 pr-4 text-right font-medium">Views</th>
                    <th className="pb-3 pr-4 text-right font-medium">Tempo Total</th>
                    <th className="pb-3 text-right font-medium">Tempo Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.data?.videoStats.map((video: VideoStats, index: number) => (
                    <tr key={video.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="max-w-md truncate text-sm font-medium">{video.title}</div>
                        <div className="text-xs text-muted-foreground">{video.id}</div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Badge variant="secondary" className="tabular-nums">
                          {video.views.toLocaleString()}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right text-sm tabular-nums">
                        {Math.round(video.watchTime / 60)} min
                      </td>
                      <td className="py-3 text-right text-sm tabular-nums">
                        {video.avgWatchTime}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Features Placeholder */}
      <Card className="surface-1 shadow-elev">
         <CardHeader>
          <CardTitle>Recursos Futuros</CardTitle>
          <CardDescription>Visualizações avançadas em desenvolvimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-background/20 p-4">
              <div className="mb-2 text-sm font-medium">📍 Mapa Geográfico</div>
              <div className="text-xs text-muted-foreground">
                Visualize de onde seus espectadores estão assistindo
              </div>
            </div>
            <div className="rounded-lg border bg-background/20 p-4">
              <div className="mb-2 text-sm font-medium">📱 Dispositivos & Navegadores</div>
              <div className="text-xs text-muted-foreground">
                Análise de dispositivos e navegadores dos seus usuários
              </div>
            </div>
            <div className="rounded-lg border bg-background/20 p-4">
              <div className="mb-2 text-sm font-medium">📊 Curva de Retenção</div>
              <div className="text-xs text-muted-foreground">
                Veja em quais momentos os espectadores param de assistir
              </div>
            </div>
            <div className="rounded-lg border bg-background/20 p-4">
              <div className="mb-2 text-sm font-medium">⏱️ Análise Temporal</div>
              <div className="text-xs text-muted-foreground">
                Horários de pico e tendências ao longo do tempo
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
