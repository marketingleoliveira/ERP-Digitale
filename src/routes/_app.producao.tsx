import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Factory } from "lucide-react";

export const Route = createFileRoute("/_app/producao")({ component: ProducaoPage });

function ProducaoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens de Produção (PCP)"
        description="Kanban em tempo real de todas as OPs — arraste, priorize e acompanhe cada etapa."
      />
      <EmptyState
        icon={<Factory className="h-5 w-5" />}
        title="Nenhuma ordem de produção"
        description="O quadro Kanban será populado assim que forem lançadas as primeiras OPs."
      />
    </div>
  );
}
