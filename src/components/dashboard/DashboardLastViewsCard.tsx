import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

type Item = {
  id: string;
  created_at: string;
  last_seen_at: string;
  anon_id: string;
  video_id: string;
  title: string;
  watchedSeconds: number;
};

export function DashboardLastViewsCard({ items }: { items: Item[] }) {
  const top = items.slice(0, 5);
  return (
    <Card className="surface-1 shadow-elev">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4 text-primary" />
          Últimas Visualizações
          <span className="text-sm font-normal text-muted-foreground">({items.length} total)</span>
        </CardTitle>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrar:</span>
           <div className="inline-flex h-8 min-w-14 items-center justify-center rounded-md border bg-background/40 px-2 text-foreground">5</div>
        </div>
      </CardHeader>

      <CardContent className="pb-8">
        {top.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border bg-background/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
              <Eye className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium">Nenhuma visualização ainda</div>
            <div className="max-w-md text-center text-xs text-muted-foreground">
              As visualizações únicas dos seus vídeos aparecerão aqui.
            </div>
          </div>
        ) : (
          <ul className="divide-y rounded-lg border bg-background/10">
            {top.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{it.title}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    Último ping: {new Date(it.last_seen_at).toLocaleString()}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular-nums">{Math.round(it.watchedSeconds / 60)} min</div>
                  <div className="text-xs text-muted-foreground">{it.anon_id.slice(0, 6)}…</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
