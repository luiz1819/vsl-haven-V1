import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BuilderSection } from "./types";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableSectionProps {
  section: BuilderSection;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function SortableSection({ section, isSelected, onClick, onDelete }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative mb-4 rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : "border-border"
      }`}
      onClick={(e) => {
          e.stopPropagation();
          onClick();
      }}
    >
      <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move p-2 text-muted-foreground opacity-20 hover:opacity-100" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="pl-10 pr-10">
          <div className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2 flex items-center justify-between">
              {section.type}
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
              }}>
                  <Trash2 className="h-4 w-4" />
              </Button>
          </div>
          
          {/* Preview Content */}
          <div className="min-h-[50px] border-l-2 pl-4 py-2 text-sm">
             {section.title || "Untitled Section"}
             {/* We could render a mini preview here later */}
          </div>
      </div>
    </div>
  );
}
