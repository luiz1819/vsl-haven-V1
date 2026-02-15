import * as React from "react";
import type { TopBarConfig } from "./edit/TopBarControls";

export function TopBarDisplay({ config, preview }: { config: TopBarConfig | null; preview?: boolean }) {
  if (!config || !config.enabled) return null;

  // If preview mode, force relative or absolute within container to prevent escaping.
  // "fixed" in preview should behave like "absolute" to the top of the container.
  const positionClass = preview 
      ? "absolute top-0 left-0" 
      : (config.position === "fixed" ? "fixed top-0 left-0" : "relative");

  return (
    <div 
      className={`w-full py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 z-50 ${positionClass}`}
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
    >
      <span>{config.text}</span>
      {config.showTimer && (
         <span className="font-bold opacity-90">
            {String(config.timerDurationMinutes).padStart(2, '0')}:00
         </span>
      )}
    </div>
  );
}
