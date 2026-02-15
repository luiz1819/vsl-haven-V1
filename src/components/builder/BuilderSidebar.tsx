import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { BuilderSectionType } from "./types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LayoutTemplate, Video, Type, MousePointerClick, Copyright, HelpCircle, Box } from "lucide-react";

const ESSENTIALS = [
    { type: 'video', icon: Video, label: 'Vídeo Smart', desc: 'Seu VSL' },
    { type: 'cta', icon: MousePointerClick, label: 'Botão de Ação', desc: 'Compra / Ação' },
    { type: 'header', icon: LayoutTemplate, label: 'Headline', desc: 'Título Principal' },
    { type: 'text', icon: Type, label: 'Texto', desc: 'Parágrafos' },
];

const LAYOUT = [
    { type: 'features', icon: Box, label: 'Features', desc: 'Grid de Ícones' },
    { type: 'faq', icon: HelpCircle, label: 'FAQ', desc: 'Perguntas' },
    { type: 'footer', icon: Copyright, label: 'Footer', desc: 'Rodapé' },
];

interface BuilderSidebarProps {
  onAdd: (type: BuilderSectionType) => void;
  isDraggable?: boolean;
}

// Draggable wrapper
function DraggableSidebarItem({ tool, onAdd }: { tool: any, onAdd: any }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `sidebar-${tool.type}`,
        data: {
            type: tool.type,
            isSidebarEntry: true
        }
    });

    return (
        <button
            ref={setNodeRef}
            {...listeners} // Listeners on the button
            {...attributes}
            onClick={() => onAdd(tool.type)}
            className={`flex flex-col items-center justify-center p-3 bg-white border rounded-lg shadow-sm hover:border-primary hover:shadow-md transition-all group text-center h-24 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 ring-2 ring-primary' : ''}`}
        >
            <tool.icon className="h-6 w-6 text-slate-500 group-hover:text-primary mb-2" />
            <span className="text-xs font-medium text-slate-700">{tool.label}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 scale-90">{tool.desc}</span>
        </button>
    )
}

function DraggableSidebarListItem({ tool, onAdd }: { tool: any, onAdd: any }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `sidebar-${tool.type}`,
        data: {
            type: tool.type,
            isSidebarEntry: true
        }
    });

    return (
         <button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={() => onAdd(tool.type)}
            className={`flex items-center gap-3 w-full p-3 bg-white border rounded-lg hover:border-primary hover:bg-slate-50 transition-all text-left cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
         >
            <tool.icon className="h-5 w-5 text-slate-500" />
            <div>
                <div className="text-sm font-medium text-slate-700">{tool.label}</div>
                <div className="text-[10px] text-muted-foreground">{tool.desc}</div>
            </div>
        </button>
    )
}

export function BuilderSidebar({ onAdd }: BuilderSidebarProps) {
  return (
    <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-white">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Componentes</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
             <Accordion type="single" collapsible defaultValue="essentials" className="w-full">
                
                <AccordionItem value="essentials" className="border-b-0">
                    <AccordionTrigger className="px-2 py-3 hover:no-underline hover:bg-muted/50 rounded-md">
                        <span className="font-semibold text-sm">Essenciais (Arraste)</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 px-1 grid grid-cols-2 gap-2">
                        {ESSENTIALS.map((tool) => (
                            <DraggableSidebarItem key={tool.type} tool={tool} onAdd={onAdd} />
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="layout" className="border-b-0">
                    <AccordionTrigger className="px-2 py-3 hover:no-underline hover:bg-muted/50 rounded-md">
                        <span className="font-semibold text-sm">Layout & Extra</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 px-1 space-y-2">
                        {LAYOUT.map((tool) => (
                             <DraggableSidebarListItem key={tool.type} tool={tool} onAdd={onAdd} />
                        ))}
                    </AccordionContent>
                </AccordionItem>

             </Accordion>
        </div>
    </div>
  );
}
