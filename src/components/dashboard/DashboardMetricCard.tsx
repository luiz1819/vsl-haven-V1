import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Accent = "cyan" | "green" | "blue" | "violet";

function accentVar(accent: Accent) {
  switch (accent) {
    case "cyan":
      return "--metric-cyan";
    case "green":
      return "--metric-green";
    case "blue":
      return "--metric-blue";
    case "violet":
      return "--metric-violet";
    default:
      return "--metric-cyan";
  }
}

export function DashboardMetricCard({
  title,
  value,
  icon: Icon,
  accent,
  className,
}: {
  title: string;
  value: number | string;
  icon: LucideIcon;
  accent: Accent;
  className?: string;
}) {
  const varName = accentVar(accent);
  return (
    <Card className={cn("surface-1 shadow-elev", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-xl font-semibold leading-none tabular-nums">{value}</div>
        </div>

        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            "bg-[hsl(var(--metric)/0.16)] text-[hsl(var(--metric))]",
          )}
          style={{ "--metric": `var(${varName})` } as React.CSSProperties}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
