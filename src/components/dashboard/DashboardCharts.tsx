import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DayPoint = { day: string; views: number };

const configLast7Days: ChartConfig = {
  views: { label: "Visualizações Únicas", color: "hsl(var(--metric-cyan))" },
};


function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="surface-1 shadow-elev">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

export function DashboardCharts({ last7DaysData }: { last7DaysData: DayPoint[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Visualizações Únicas nos Últimos 7 Dias">
        <ChartContainer config={configLast7Days} className="h-[260px] w-full">
          <ResponsiveContainer>
            <LineChart data={last7DaysData} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="day" tickMargin={8} />
              <YAxis width={28} tickMargin={8} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="views"
                stroke="var(--color-views)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-views)", strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Por navegador / dispositivo">
        <div className="flex h-[260px] items-center justify-center rounded-lg border bg-background/10 p-4 text-center text-sm text-muted-foreground">
          Em breve: precisamos coletar navegador/dispositivo para liberar estes gráficos.
        </div>
      </ChartCard>
    </section>
  );
}
