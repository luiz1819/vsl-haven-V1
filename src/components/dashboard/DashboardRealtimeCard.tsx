import * as React from "react";
import { cloud } from "@/lib/cloudClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Radio, Timer } from "lucide-react";

type PingRow = {
  id: string;
  video_id: string;
  session_id: string;
  position_seconds: number;
  increment_seconds: number;
  created_at: string;
};

function nowMs() {
  return Date.now();
}

function inLastMs(iso: string, ms: number) {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && nowMs() - t <= ms;
}

export function DashboardRealtimeCard() {
  const [events, setEvents] = React.useState<PingRow[]>([]);
  const [status, setStatus] = React.useState<"connecting" | "live" | "error">("connecting");

  // Initial load (last 25 pings visible to the current user via RLS)
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await cloud
          .from("video_view_pings")
          .select("id,video_id,session_id,position_seconds,increment_seconds,created_at")
          .order("created_at", { ascending: false })
          .limit(25);

        if (cancelled) return;
        if (error) {
          setStatus("error");
          return;
        }
        setEvents((data ?? []) as any);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime subscription (INSERT only)
  React.useEffect(() => {
    const channel = cloud
      .channel("video_view_pings_rt")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_view_pings",
        },
        (payload) => {
          const row = payload.new as any as PingRow;
          setEvents((prev) => [row, ...prev].slice(0, 50));
        },
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("live");
      });

    return () => {
      cloud.removeChannel(channel);
    };
  }, []);

  const last60 = React.useMemo(() => events.filter((e) => inLastMs(e.created_at, 60_000)), [events]);
  const last5m = React.useMemo(() => events.filter((e) => inLastMs(e.created_at, 5 * 60_000)), [events]);

  const pingsPerMin = last60.length;
  const activeViewers = new Set(last60.map((e) => e.session_id)).size;
  const watched5mSeconds = last5m.reduce((acc, e) => acc + Number(e.increment_seconds ?? 0), 0);

  return (
    <Card className="surface-1 shadow-elev">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Analytics Real Time</CardTitle>
          <Badge className="bg-secondary text-secondary-foreground">
            {status === "live" ? "AO VIVO" : status === "connecting" ? "Conectando" : "Erro"}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">Atualiza conforme os pings chegam (a cada ~5s por viewer)</div>
      </CardHeader>

      <CardContent className="space-y-4">
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-background/20 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Assistindo agora</div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{activeViewers}</div>
          </div>

          <div className="rounded-lg border bg-background/20 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Pings / min</div>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{pingsPerMin}</div>
          </div>

          <div className="rounded-lg border bg-background/20 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Tempo (últimos 5 min)</div>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{Math.round(watched5mSeconds / 60)} min</div>
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Feed de eventos</div>
            <div className="text-xs text-muted-foreground">Mostrando {Math.min(events.length, 50)} eventos</div>
          </div>

          <div className="max-h-[260px] overflow-auto rounded-lg border bg-background/10">
            {events.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Nenhum ping recebido ainda.</div>
            ) : (
              <ul className="divide-y">
                {events.map((e) => (
                  <li key={e.id} className="flex flex-col gap-1 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{new Date(e.created_at).toLocaleTimeString()}</span>
                      <span className="font-medium tabular-nums">+{e.increment_seconds}s</span>
                    </div>
                    <div className="text-muted-foreground">Vídeo: {e.video_id}</div>
                    <div className="text-muted-foreground">Sessão: {e.session_id}</div>
                    <div className="text-muted-foreground">Posição: {e.position_seconds}s</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
