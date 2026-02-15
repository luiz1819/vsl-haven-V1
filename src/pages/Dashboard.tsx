import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardLastViewsCard } from "@/components/dashboard/DashboardLastViewsCard";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { DashboardRealtimeCard } from "@/components/dashboard/DashboardRealtimeCard";
import { Clock, Eye, LayoutGrid, RefreshCw, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cloud } from "@/lib/cloudClient";
import { subDays, startOfDay } from "date-fns";

type LastViewItem = {
  id: string;
  created_at: string;
  last_seen_at: string;
  anon_id: string;
  video_id: string;
  title: string;
  watchedSeconds: number;
};

function uniqCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

export default function Dashboard() {
  const metrics = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const now = new Date();
      const startToday = startOfDay(now);
      const start7 = startOfDay(subDays(now, 6));

      // Total videos
      const { count: totalVideos, error: videosCountErr } = await cloud
        .from("videos")
        .select("id", { count: "exact", head: true });
      if (videosCountErr) throw videosCountErr;

      // Get videos with bunny_id for Bunny statistics
      const { data: bunnyVideos, error: bunnyVideosErr } = await cloud
        .from("videos")
        .select("id,bunny_id")
        .not("bunny_id", "is", null)
        .limit(100);
      if (bunnyVideosErr) throw bunnyVideosErr;

      // Fetch Bunny statistics for each video (in parallel, but limited)
      let totalBunnyViews = 0;
      let totalBunnyWatchTime = 0;
      const bunnyStatsPromises = (bunnyVideos ?? []).slice(0, 20).map(async (v: any) => {
        try {
          const { data } = await cloud.functions.invoke("bunny-stream-statistics", {
            body: { bunnyId: v.bunny_id },
          });
          if (data && !data.error) {
            return {
              videoId: v.id,
              views: data.totalViews || 0,
              watchTime: data.totalWatchTime || 0,
            };
          }
        } catch (err) {
          console.warn(`Failed to fetch Bunny stats for ${v.bunny_id}:`, err);
        }
        return null;
      });

      const bunnyStats = (await Promise.all(bunnyStatsPromises)).filter(Boolean);
      bunnyStats.forEach((stat: any) => {
        totalBunnyViews += stat.views;
        totalBunnyWatchTime += stat.watchTime;
      });

      // Sessions (local tracking - last 7 days)
      const { data: sessions, error: sessionsErr } = await cloud
        .from("video_view_sessions")
        .select("id,video_id,anon_id,created_at,last_seen_at,total_watched_seconds")
        .gte("created_at", start7.toISOString())
        .order("last_seen_at", { ascending: false })
        .limit(1000);
      if (sessionsErr) throw sessionsErr;

      const rows = (sessions ?? []) as any[];
      const todayRows = rows.filter((r) => new Date(r.created_at) >= startToday);

      const uniqueToday = uniqCount(todayRows.map((r) => String(r.anon_id ?? "")));
      const uniqueWeek = uniqCount(rows.map((r) => String(r.anon_id ?? "")));

      const avgWatchedSeconds =
        rows.length > 0
          ? rows.reduce((acc, r) => acc + Number(r.total_watched_seconds ?? 0), 0) / rows.length
          : 0;

      // Last 7 days chart (unique sessions per day)
      const byDay = new Map<string, Set<string>>();
      for (let i = 0; i < 7; i++) {
        const d = startOfDay(subDays(now, 6 - i));
        byDay.set(d.toISOString().slice(0, 10), new Set());
      }
      for (const r of rows) {
        const dayKey = String(r.created_at).slice(0, 10);
        if (!byDay.has(dayKey)) continue;
        byDay.get(dayKey)!.add(String(r.anon_id ?? ""));
      }
      const formatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
      const last7DaysData = Array.from(byDay.entries()).map(([dayKey, set]) => ({
        day: formatter.format(new Date(dayKey)).replace(".", ""),
        views: set.size,
      }));

      // Last views list
      const lastSessions = rows.slice(0, 50);
      const videoIds = Array.from(new Set(lastSessions.map((r) => String(r.video_id ?? "")).filter(Boolean))).slice(
        0,
        100,
      );
      const { data: videoRows, error: videosErr } = await cloud
        .from("videos")
        .select("id,title")
        .in("id", videoIds);
      if (videosErr) throw videosErr;

      const titleById = new Map<string, string>((videoRows ?? []).map((v: any) => [String(v.id), String(v.title)]));

      const lastViews: LastViewItem[] = lastSessions.map((r) => ({
        id: String(r.id),
        created_at: String(r.created_at),
        last_seen_at: String(r.last_seen_at),
        anon_id: String(r.anon_id),
        video_id: String(r.video_id),
        title: titleById.get(String(r.video_id)) ?? "(Vídeo)",
        watchedSeconds: Number(r.total_watched_seconds ?? 0),
      }));

      return {
        uniqueToday,
        uniqueWeek,
        totalVideos: Number(totalVideos ?? 0),
        avgMinutes: Math.round(avgWatchedSeconds / 60),
        last7DaysData,
        lastViews,
        // Bunny.net metrics
        totalBunnyViews,
        totalBunnyWatchTimeMinutes: Math.round(totalBunnyWatchTime / 60),
        bunnyVideosCount: (bunnyVideos ?? []).length,
      };
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do desempenho das suas VSLs.</p>
        </div>

        <Button
          variant="soft"
          size="sm"
          type="button"
          aria-label="Atualizar métricas"
          onClick={() => metrics.refetch()}
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardMetricCard
          title="Visualizações Únicas Hoje"
          value={metrics.data?.uniqueToday ?? 0}
          icon={Eye}
          accent="cyan"
        />
        <DashboardMetricCard
          title="Visualizações Únicas na Semana"
          value={metrics.data?.uniqueWeek ?? 0}
          icon={TrendingUp}
          accent="green"
        />
        <DashboardMetricCard title="Total de Vídeos" value={metrics.data?.totalVideos ?? 0} icon={LayoutGrid} accent="blue" />
        <DashboardMetricCard title="Tempo Médio (min)" value={metrics.data?.avgMinutes ?? 0} icon={Clock} accent="violet" />
      </section>

      {/* Bunny.net Analytics Section */}
      {(metrics.data?.bunnyVideosCount ?? 0) > 0 && (
        <section className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="text-sm font-semibold">📊 Bunny.net Analytics</div>
            <div className="text-xs text-muted-foreground">
              ({metrics.data?.bunnyVideosCount} vídeos rastreados)
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">Total de Views (CDN)</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{metrics.data?.totalBunnyViews ?? 0}</div>
            </div>
            <div className="rounded-lg border bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">Tempo Total Assistido (CDN)</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {metrics.data?.totalBunnyWatchTimeMinutes ?? 0} min
              </div>
            </div>
          </div>
        </section>
      )}

      <DashboardLastViewsCard items={metrics.data?.lastViews ?? []} />

      <DashboardRealtimeCard />

      <DashboardCharts last7DaysData={metrics.data?.last7DaysData ?? []} />
    </div>
  );
}
