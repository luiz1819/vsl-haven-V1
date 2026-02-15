import * as React from "react";
import { BuilderSection } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { cloud } from "@/lib/cloudClient";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Type, Palette, Clock, MousePointerClick, Layout } from "lucide-react";

interface SectionPropertiesProps {
  section: BuilderSection;
  onChange: (updates: Partial<BuilderSection>) => void;
}

export function SectionProperties({ section, onChange }: SectionPropertiesProps) {
    
    // Helper to safely update nested content
    const updateContent = (key: string, value: any) => {
        onChange({ content: { ...section.content, [key]: value } });
    };

    // Helper to safely update nested styles
    const updateStyle = (key: string, value: any) => {
        onChange({ styles: { ...section.styles, [key]: value } });
    };

    // Auto fetching videos if type is video
    const { data: videos = [] } = useQuery({
        queryKey: ["user-videos-list"],
        enabled: section.type === 'video',
        queryFn: async () => {
             const { data } = await cloud.from("videos").select("id, title");
             return data || [];
        }
    });

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b">
                 <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Label da Seção (Interno)</Label>
                 <Input 
                    value={section.title || ""} 
                    onChange={e => onChange({ title: e.target.value })} 
                    placeholder="Ex: Hero Header"
                    className="h-8"
                />
            </div>

            <Tabs defaultValue="content" className="flex-1 w-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b px-4 h-11 bg-muted/20">
                    <TabsTrigger value="content" className="data-[state=active]:bg-background relative top-[1px] border border-transparent data-[state=active]:border-border data-[state=active]:border-b-background">
                         Conteúdo
                    </TabsTrigger>
                    <TabsTrigger value="style" className="data-[state=active]:bg-background relative top-[1px] border border-transparent data-[state=active]:border-border data-[state=active]:border-b-background">
                         Estilo
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="data-[state=active]:bg-background relative top-[1px] border border-transparent data-[state=active]:border-border data-[state=active]:border-b-background">
                         Avanc.
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                    {/* ================== CONTENT TAB ================== */}
                    <TabsContent value="content" className="mt-0 space-y-6">
                        {section.type === 'header' && (
                             <div className="space-y-4">
                                 <div className="space-y-2">
                                     <Label>Headline (Título)</Label>
                                     <Textarea 
                                        value={section.content.headline || ""} 
                                        onChange={e => updateContent('headline', e.target.value)}
                                        placeholder="Sua promessa principal aqui..."
                                        rows={3}
                                     />
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Subheadline</Label>
                                     <Textarea 
                                        value={section.content.subheadline || ""} 
                                        onChange={e => updateContent('subheadline', e.target.value)}
                                        placeholder="Um subtítulo complementar..."
                                        rows={2}
                                     />
                                 </div>
                             </div>
                        )}

                        {section.type === 'video' && (
                            <div className="space-y-4">
                                <Label>Select VSL</Label>
                                <Select 
                                    value={section.content.videoId || ""} 
                                    onValueChange={(val) => updateContent('videoId', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a video..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {videos.map((v: any) => (
                                            <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="p-3 bg-blue-50 text-blue-800 rounded text-xs border border-blue-100">
                                    As configurações do Smart Player (autoplay, cores, thumbnails) são gerenciadas no editor de vídeo original.
                                </div>
                            </div>
                        )}

                         {section.type === 'text' && (
                             <div className="space-y-4">
                                 <div className="space-y-2">
                                     <Label>Texto Rico</Label>
                                     <Textarea 
                                        rows={8}
                                        value={section.content.text || ""} 
                                        onChange={e => updateContent('text', e.target.value)}
                                        placeholder="HTML simples é suportado..."
                                     />
                                 </div>
                             </div>
                        )}

                        {section.type === 'cta' && (
                             <div className="space-y-4">
                                 <div className="space-y-2">
                                     <Label>Texto do Botão</Label>
                                     <Input 
                                        value={section.content.buttonText || "COMPRAR AGORA"} 
                                        onChange={e => updateContent('buttonText', e.target.value)}
                                     />
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Link de Destino (URL)</Label>
                                     <Input 
                                        value={section.content.url || "#"} 
                                        onChange={e => updateContent('url', e.target.value)}
                                        placeholder="https://..."
                                     />
                                 </div>
                             </div>
                        )}
                    </TabsContent>

                    {/* ================== STYLE TAB ================== */}
                    <TabsContent value="style" className="mt-0 space-y-6">
                        {/* Common: Alignment */}
                        {(section.type === 'header' || section.type === 'text' || section.type === 'cta') && (
                             <div className="space-y-2">
                                 <Label className="flex items-center gap-2"><Layout className="h-3 w-3" /> Alinhamento</Label>
                                 <div className="flex bg-muted rounded-lg p-1 w-fit">
                                     {(['left', 'center', 'right'] as const).map((align) => (
                                         <button
                                            key={align}
                                            onClick={() => updateStyle('textAlign', align)}
                                            className={`p-2 rounded ${section.styles?.textAlign === align ? 'bg-white shadow-sm' : 'hover:bg-background/50'} transition-all`}
                                         >
                                             {align === 'left' && <AlignLeft className="h-4 w-4" />}
                                             {align === 'center' && <AlignCenter className="h-4 w-4" />}
                                             {align === 'right' && <AlignRight className="h-4 w-4" />}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                        )}

                        {/* Typography */}
                        {(section.type === 'header' || section.type === 'text') && (
                             <div className="space-y-4 border-t pt-4">
                                 <Label className="flex items-center gap-2"><Type className="h-3 w-3" /> Tipografia</Label>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                         <Label className="text-xs">Fonte</Label>
                                         <Select 
                                            value={section.styles?.fontFamily || "Inter"} 
                                            onValueChange={val => updateStyle('fontFamily', val)}
                                         >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Inter">Inter</SelectItem>
                                                <SelectItem value="Roboto">Roboto</SelectItem>
                                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                                                <SelectItem value="Oswald">Oswald</SelectItem>
                                                <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                                            </SelectContent>
                                         </Select>
                                     </div>
                                     <div className="space-y-1">
                                         <Label className="text-xs">Cor do Texto</Label>
                                         <div className="flex items-center gap-2">
                                             <Input 
                                                type="color" 
                                                className="w-8 h-8 p-0 border-none rounded-full overflow-hidden shrink-0 cursor-pointer"
                                                value={section.styles?.textColor || "#000000"}
                                                onChange={e => updateStyle('textColor', e.target.value)}
                                             />
                                             <Input 
                                                value={section.styles?.textColor || "#000000"} 
                                                onChange={e => updateStyle('textColor', e.target.value)}
                                                className="h-8 font-mono text-xs uppercase"
                                             />
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        )}

                        {/* CTA Styling */}
                        {section.type === 'cta' && (
                             <div className="space-y-4 border-t pt-4">
                                 <Label className="flex items-center gap-2"><MousePointerClick className="h-3 w-3" /> Estilo do Botão</Label>
                                 
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                         <Label className="text-xs">Cor de Fundo</Label>
                                          <div className="flex items-center gap-2">
                                             <Input 
                                                type="color" 
                                                className="w-8 h-8 p-0 border-none rounded-full overflow-hidden shrink-0 cursor-pointer"
                                                value={section.styles?.buttonColor || "#ef4444"}
                                                onChange={e => updateStyle('buttonColor', e.target.value)}
                                             />
                                             <Input 
                                                value={section.styles?.buttonColor || "#ef4444"} 
                                                onChange={e => updateStyle('buttonColor', e.target.value)}
                                                className="h-8 font-mono text-xs uppercase"
                                             />
                                         </div>
                                     </div>
                                      <div className="space-y-1">
                                         <Label className="text-xs">Cor do Texto</Label>
                                          <div className="flex items-center gap-2">
                                             <Input 
                                                type="color" 
                                                className="w-8 h-8 p-0 border-none rounded-full overflow-hidden shrink-0 cursor-pointer"
                                                value={section.styles?.buttonTextColor || "#ffffff"}
                                                onChange={e => updateStyle('buttonTextColor', e.target.value)}
                                             />
                                             <Input 
                                                value={section.styles?.buttonTextColor || "#ffffff"} 
                                                onChange={e => updateStyle('buttonTextColor', e.target.value)}
                                                className="h-8 font-mono text-xs uppercase"
                                             />
                                         </div>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                         <Label className="text-xs">Estilo</Label>
                                         <Select value={section.styles?.buttonVariant || "default"} onValueChange={val => updateStyle('buttonVariant', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Sólido (Padrão)</SelectItem>
                                                <SelectItem value="shiny">Brilhante (Shiny)</SelectItem>
                                                <SelectItem value="outline">Contorno</SelectItem>
                                                <SelectItem value="hero">Hero (Grande)</SelectItem>
                                            </SelectContent>
                                         </Select>
                                     </div>
                                      <div className="space-y-1">
                                         <Label className="text-xs">Arredondamento</Label>
                                         <Select value={section.styles?.borderRadius || "md"} onValueChange={val => updateStyle('borderRadius', val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Quadrado</SelectItem>
                                                <SelectItem value="md">Padrão</SelectItem>
                                                <SelectItem value="full">Redondo (Pill)</SelectItem>
                                            </SelectContent>
                                         </Select>
                                     </div>
                                 </div>

                                 <div className="flex items-center justify-between border p-3 rounded-lg">
                                     <Label className="cursor-pointer" htmlFor="fullWidth">Largura Total</Label>
                                     <Switch 
                                        id="fullWidth" 
                                        checked={section.styles?.fullWidth || false} 
                                        onCheckedChange={checked => updateStyle('fullWidth', checked)} 
                                     />
                                 </div>

                                 <div className="space-y-2">
                                     <Label className="text-xs">Animação</Label>
                                     <div className="flex gap-2">
                                         {['none', 'pulse', 'shake'].map(anim => (
                                             <button 
                                                key={anim}
                                                onClick={() => updateStyle('animation', anim)}
                                                className={`px-3 py-1 text-xs border rounded ${section.styles?.animation === anim ? 'bg-primary text-primary-foreground border-primary' : ''}`}
                                             >
                                                 {anim}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                        )}
                    </TabsContent>

                    {/* ================== ADVANCED TAB ================== */}
                    <TabsContent value="advanced" className="mt-0 space-y-6">
                        
                        {/* Delay Control for CTA */}
                        {section.type === 'cta' && (
                            <div className="space-y-4 border p-4 rounded-lg bg-yellow-50/50 border-yellow-200">
                                <Label className="flex items-center gap-2 text-yellow-800"><Clock className="h-4 w-4" /> Delay (Atraso)</Label>
                                <p className="text-xs text-muted-foreground">O botão ficará oculto até que o vídeo atinja este tempo (simulado no preview).</p>
                                
                                <div className="flex items-center gap-4">
                                    <Slider 
                                        value={[section.styles?.delay || 0]} 
                                        max={3600} 
                                        step={5} 
                                        onValueChange={vals => updateStyle('delay', vals[0])}
                                        className="flex-1"
                                    />
                                    <Input 
                                        type="number" 
                                        value={section.styles?.delay || 0} 
                                        onChange={e => updateStyle('delay', Number(e.target.value))}
                                        className="w-20"
                                    />
                                    <span className="text-xs text-muted-foreground">seg</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Label>Background da Seção</Label>
                            <Input 
                                 type="color" 
                                 className="w-full h-10 p-1 cursor-pointer"
                                 value={section.styles?.backgroundColor || "#ffffff"}
                                 onChange={e => updateStyle('backgroundColor', e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Espaçamento Superior (Padding Top)</Label>
                            <Slider 
                                value={[section.styles?.paddingTop || 20]} 
                                max={200} step={4} 
                                onValueChange={vals => updateStyle('paddingTop', vals[0])}
                            />
                        </div>

                         <div className="space-y-4">
                            <Label>Espaçamento Inferior (Padding Bottom)</Label>
                            <Slider 
                                value={[section.styles?.paddingBottom || 20]} 
                                max={200} step={4} 
                                onValueChange={vals => updateStyle('paddingBottom', vals[0])}
                            />
                        </div>

                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
