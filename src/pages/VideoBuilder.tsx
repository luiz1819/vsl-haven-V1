import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cloud } from "@/lib/cloudClient";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { BuilderSection, BuilderConfig } from "@/components/builder/types";
import { SortableSection } from "@/components/builder/SortableSection";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { SectionProperties } from "@/components/builder/SectionProperties";

export default function VideoBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoId = id ?? "";

  const [sections, setSections] = React.useState<BuilderSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);

  // Load Video Data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["video-builder", videoId],
    enabled: !!videoId,
    queryFn: async () => {
       const { data: row, error } = await cloud
        .from("videos")
        .select("id, title, page_builder_config, vsl_page_type")
        .eq("id", videoId)
        .single();
       
       if (error) throw error;
       return row;
    }
  });

  React.useEffect(() => {
    if (data?.page_builder_config) {
        // cast JSONB to config
        console.log("Loaded config", data.page_builder_config);
        const config = data.page_builder_config as any as BuilderConfig;
        if (config && Array.isArray(config.sections)) {
            setSections(config.sections);
        }
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addSection = (type: BuilderSection["type"]) => {
      const newSection: BuilderSection = {
          id: crypto.randomUUID(),
          type,
          title: `New ${type}`,
          content: {},
          styles: {}
      };
      setSections([...sections, newSection]);
      setSelectedSectionId(newSection.id);
  };

  const removeSection = (id: string) => {
      setSections(sections.filter(s => s.id !== id));
      if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const updateSection = (id: string, updates: Partial<BuilderSection>) => {
      setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config: BuilderConfig = { sections };
      const { error } = await cloud.from("videos").update({
          page_builder_config: config as any,
          vsl_page_type: 'builder' // Ensure we switch mode if saving here
      }).eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
       toast({ title: "Page Saved" });
       refetch();
    },
    onError: (e) => {
        toast({ title: "Error saving", description: String(e), variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-8">Loading Builder...</div>;

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-4">
               <Button variant="ghost" onClick={() => navigate("/videos")}>Back</Button>
               <h1 className="text-lg font-bold">{data?.title} <span className="text-xs font-normal text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted">Builder Mode</span></h1>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/videos/edit/${videoId}`)}>Switch to Classic Editor</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save Page</Button>
          </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
         {/* Sidebar Tools */}
         <aside className="w-64 border-r bg-muted/10 p-4 overflow-y-auto">
             <BuilderSidebar onAdd={addSection} />
         </aside>

         {/* Canvas */}
         <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
            <div className="mx-auto max-w-4xl min-h-[500px] bg-white shadow-sm border rounded-lg p-8">
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={sections.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {sections.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                                Drag or Click items from sidebar to add sections
                            </div>
                        ) : (
                            sections.map((section) => (
                                <SortableSection 
                                    key={section.id} 
                                    section={section} 
                                    isSelected={section.id === selectedSectionId}
                                    onClick={() => setSelectedSectionId(section.id)}
                                    onDelete={() => removeSection(section.id)}
                                />
                            ))
                        )}
                    </SortableContext>
                </DndContext>
            </div>
         </main>

         {/* Properties Panel */}
         <aside className="w-80 border-l bg-background p-4 overflow-y-auto">
             {selectedSection ? (
                 <SectionProperties 
                    section={selectedSection} 
                    onChange={(updates) => updateSection(selectedSection.id, updates)} 
                 />
             ) : (
                 <div className="text-sm text-muted-foreground text-center py-10">
                     Select a section to edit properties
                 </div>
             )}
         </aside>
      </div>
    </div>
  );
}
