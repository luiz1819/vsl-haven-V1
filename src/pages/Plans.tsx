import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Básico",
    price: "R$ 29",
    tagline: "Para começar com o essencial",
    features: [
      "Até 10 vídeos",
      "Player personalizado",
      "Sem limite de plays",
      "Análise de métricas",
      "Bloqueio de domínio",
      "Suporte via WhatsApp",
    ],
    cta: "Renovar Plano",
    highlight: false,
  },
  {
    name: "Premium",
    price: "R$ 67",
    tagline: "O melhor custo-benefício",
    features: [
      "Até 30 vídeos",
      "Player personalizado",
      "Sem limite de plays",
      "Análise de métricas",
      "Bloqueio de domínio",
      "Gráfico de Retenção (EXCLUSIVO)",
      "Simulador Live (NOVO)",
      "Comentários (NOVO)",
      "Suporte via WhatsApp",
    ],
    cta: "Assinar Plano",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "R$ 147",
    tagline: "Para operação em escala",
    features: [
      "Até 100 vídeos",
      "Player personalizado",
      "Sem limite de plays",
      "Análise de métricas avançadas",
      "Bloqueio de domínio",
      "Gráfico de Retenção (EXCLUSIVO)",
      "Simulador Live (NOVO)",
      "Comentários (NOVO)",
      "Suporte VIP via WhatsApp",
    ],
    cta: "Assinar Plano",
    highlight: false,
  },
];

export default function Plans() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Planos e Preços</h1>
        <p className="text-muted-foreground">Escolha o plano ideal para suas necessidades de hospedagem de vídeos.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={p.highlight ? "surface-1 shadow-glow" : "surface-1 shadow-elev"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{p.name}</CardTitle>
                {p.highlight && <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>}
              </div>
              <CardDescription>{p.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-semibold">{p.price}</div>
                <div className="text-sm text-muted-foreground">/mês</div>
              </div>
              <div className="text-sm font-medium">Recursos inclusos:</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant={p.highlight ? "hero" : "soft"} className="w-full">
                {p.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
