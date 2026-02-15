import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cloud } from "@/lib/cloudClient";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, LayoutTemplate } from "lucide-react";
import { Card, CardFooter, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  created_at: string;
}

export default function PagesGallery() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: pages = [], isLoading, refetch } = useQuery({
    queryKey: ["landing-pages"],
    queryFn: async () => {
      const { data, error } = await cloud
        .from("landing_pages")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LandingPage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await cloud
        .from("landing_pages")
        .insert({
          title: "Nova Página",
          config: { sections: [] }
          // slug auto-generated or null for now
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newPage) => {
      toast({ title: "Página criada!" });
      navigate(`/pages/builder/${newPage.id}`);
    },
    onError: (err) => {
      toast({ title: "Erro ao criar", description: String(err), variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex bg-muted/10 h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Landing Pages</h1>
          <p className="text-muted-foreground mt-2">
            Crie páginas de alta conversão independentes.
          </p>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
           {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
           Nova Página
        </Button>
      </header>

      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-16 text-center">
            <LayoutTemplate className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Nenhuma página encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">Comece criando sua primeira landing page.</p>
            <Button variant="outline" onClick={() => createMutation.mutate()}>Criar Agora</Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pages.map((page) => (
                <Card key={page.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="truncate text-base">{page.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-4 text-xs text-muted-foreground">
                        Criado em {new Date(page.created_at).toLocaleDateString()}
                    </CardContent>
                    <CardFooter className="flex gap-2 justify-end bg-muted/10 p-3">
                        <Button variant="ghost" size="sm" asChild>
                            <a href={`/p/${page.id}`} target="_blank">Ver</a>
                        </Button>
                        <Button size="sm" onClick={() => navigate(`/pages/builder/${page.id}`)}>
                            Editar
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
