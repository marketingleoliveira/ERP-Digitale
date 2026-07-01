import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock, User } from "lucide-react";
import { ordens, type OrdemProducao } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/producao")({
  component: ProducaoPage,
});

const stages: OrdemProducao["status"][] = ["Aguardando", "Corte", "Estampa", "Costura", "Acabamento", "Concluído"];

const prioBadge = {
  Baixa: "bg-muted text-muted-foreground",
  Média: "bg-info/15 text-info",
  Alta: "bg-warning/20 text-warning-foreground",
  Urgente: "bg-destructive/15 text-destructive",
};

function ProducaoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens de Produção (PCP)"
        description="Kanban em tempo real de todas as OPs — arraste, priorize e acompanhe cada etapa."
        actions={<Button><Plus className="h-4 w-4 mr-1.5" />Nova OP</Button>}
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-6">
        {stages.map((stage) => {
          const cards = ordens.filter((o) => o.status === stage);
          return (
            <div key={stage} className="flex flex-col rounded-lg border border-border bg-card/60 min-h-[70vh]">
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <span className="text-sm font-semibold">{stage}</span>
                <Badge variant="secondary" className="rounded-full">{cards.length}</Badge>
              </div>
              <div className="flex-1 space-y-2 p-2 overflow-y-auto">
                {cards.map((o) => {
                  const pct = Math.round((o.produzida / o.quantidade) * 100);
                  return (
                    <Card key={o.id} className="p-3 cursor-grab hover:shadow-md transition-shadow gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold">{o.id}</span>
                        <Badge className={cn("text-[10px]", prioBadge[o.prioridade])}>{o.prioridade}</Badge>
                      </div>
                      <p className="text-sm font-medium leading-tight">{o.produto}</p>
                      <p className="text-xs text-muted-foreground">{o.cliente}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{o.produzida}/{o.quantidade} un.</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{o.prazo}</span>
                        <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{o.responsavel}</span>
                      </div>
                    </Card>
                  );
                })}
                {cards.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    Nenhuma OP
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
