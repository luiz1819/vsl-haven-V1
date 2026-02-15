import * as React from "react";
import { SmartPlayIcon } from "./SmartPlayIcon";

export function SmartOverlayCard({
  title,
  subtitle,
  variant,
  icon,
  backgroundColor,
  textColor,
  opacity,
  borderRadius,
}: {
  title: string;
  subtitle?: string | null;
  variant: "default" | "professional";
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  opacity?: number;
  borderRadius?: number;
}) {
  const hasSubtitle = Boolean((subtitle ?? "").trim());

  // Defaults based on variant if no custom props provided
  const defaultBg = variant === "professional" ? "hsl(258 36% 48% / 0.62)" : "hsl(var(--background) / 0.8)";
  const defaultBorder = variant === "professional" ? "7.12px" : "8px";
  
  const effectiveBg = backgroundColor || defaultBg;
  const effectiveOpacity = opacity !== undefined ? opacity / 100 : 1;
  const effectiveRadius = borderRadius !== undefined ? `${borderRadius}px` : defaultBorder;
  const effectiveColor = textColor || "inherit";

  return (
    <div
      className={
        "max-w-sm border p-4 shadow-sm transition-all " +
        (variant === "professional" ? "" : "")
      }
      style={{
        backgroundColor: effectiveBg,
        borderColor: "transparent", // Simplified for custom looks
        borderRadius: effectiveRadius,
        opacity: effectiveOpacity,
        color: effectiveColor,
      }}
    >
      <div className="text-sm font-semibold mb-2">{title}</div>
      {icon}
      {hasSubtitle ? <div className="mt-2 text-xs opacity-90">{subtitle}</div> : null}
    </div>
  );
}
