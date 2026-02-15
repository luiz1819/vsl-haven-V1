import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cloud } from "@/lib/cloudClient";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

import { BuilderSection, BuilderConfig } from "@/components/builder/types";
import { SortableSection } from "@/components/builder/SortableSection";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { SectionProperties } from "@/components/builder/SectionProperties";

export default function PageBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const pageId = id ?? "";

  const [sections, setSections] = React.useState<BuilderSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);

  // Load Page Data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["landing-page", pageId],
    enabled: !!pageId,
    queryFn: async () => {
       const { data: row, error } = await cloud
        .from("landing_pages")
        .select("*")
        .eq("id", pageId)
        .single();
       
       if (error) throw error;
       return row;
    }
  });

  React.useEffect(() => {
    if (data?.config) {
        const config = data.config as any as BuilderConfig;
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

  const [activeDragItem, setActiveDragItem] = React.useState<any>(null);

  const handleDragStart = (event: any) => {
      setActiveDragItem(event.active.data.current?.type ? event.active.data.current : null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    // Drop from Sidebar (Video, Text, etc)
    if (active.data.current?.isSidebarEntry) {
        const type = active.data.current.type;
        addSection(type); 
        return;
    }

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
      const { error } = await cloud.from("landing_pages").update({
          config: config as any,
          // We could update title if we added an input for it
      }).eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
       toast({ title: "Landing Page salva com sucesso!" });
       refetch();
    },
    onError: (e) => {
        toast({ title: "Erro ao salvar", description: String(e), variant: "destructive" });
    }
  });

  if (isLoading) return <div className="p-8">Carregando Builder...</div>;

  const selectedSection = sections.find(s => s.id === selectedSectionId);



  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3 bg-white z-20 shadow-sm relative">
          {/* ... Header Content ... */}
          <div className="flex items-center gap-4">
               <Button variant="ghost" onClick={() => navigate("/pages")}>
                   <ArrowLeft className="mr-2 h-4 w-4" /> 
                   Voltar
               </Button>
               <div className="flex flex-col">
                  <h1 className="text-lg font-bold">{data?.title}</h1>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Page Builder</span>
               </div>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => {
                  const url = `${window.location.origin}/p/${pageId}`;
                  const embedCode = `<iframe src="${url}" style="width:100%;height:100vh;border:none;" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
                  navigator.clipboard.writeText(embedCode);
                  toast({ title: "Código copiado!", description: "Cole no seu site (HTML/Elementor)." });
              }}>
                  Copiar Embed
              </Button>
              <Button variant="hero" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Página
              </Button>
          </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
         {/* Sidebar Tools */}
         <aside className="w-64 border-r bg-white p-4 overflow-y-auto hidden md:block z-10">
             <BuilderSidebar onAdd={addSection} isDraggable={true} />
         </aside>

         {/* Canvas Area */}
         <main className="flex-1 overflow-hidden bg-slate-100/80 relative flex flex-col items-center">
            <div className="w-full flex-1 overflow-y-auto p-8 scroll-smooth">
                 <div className="mx-auto max-w-[800px] min-h-[800px] bg-white shadow-2xl border border-slate-200 rounded-sm relative transition-all">
                     
                     <div className="p-0 pb-20 pt-8 px-8 min-h-[800px]">
                        <SortableContext 
                            items={sections.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {sections.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 border-2 border-dashed border-slate-200 rounded-xl m-8">
                                    <span className="text-muted-foreground text-sm">Arraste seus componentes aqui</span>
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
                    </div>
                </div>
            </div>
         </main>

         {/* Properties Panel */}
         <aside className="w-80 border-l bg-background p-4 overflow-y-auto z-10">
             {selectedSection ? (
                 <SectionProperties 
                    section={selectedSection} 
                    onChange={(updates) => updateSection(selectedSection.id, updates)} 
                 />
             ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50 space-y-2">
                     <div className="text-4xl">👆</div>
                     <div className="text-sm">Selecione uma seção para editar</div>
                 </div>
             )}
         </aside>
      </div>

      <DragOverlay>
         {activeDragItem ? (
             <div className="opacity-80 p-3 bg-white border border-primary rounded shadow-xl w-32 text-center text-sm font-bold">
                 {activeDragItem.type}
             </div>
         ) : null}
      </DragOverlay>
      </DndContext>
    </div>
  );
}
