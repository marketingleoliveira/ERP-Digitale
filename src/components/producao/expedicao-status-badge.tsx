import { Badge } from "@/components/ui/badge";
import type { ExpedicaoStatus } from "@/services/producao/expedicao.functions";

const MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aguardando: { label: "Aguardando", variant: "outline" },
  em_separacao: { label: "Em separação", variant: "secondary" },
  separado: { label: "Separado", variant: "secondary" },
  em_conferencia: { label: "Em conferência", variant: "secondary" },
  conferido: { label: "Conferido", variant: "default" },
  expedido: { label: "Expedido", variant: "default" },
  em_transito: { label: "Em trânsito", variant: "default" },
  entregue: { label: "Entregue", variant: "default" },
  ocorrencia: { label: "Ocorrência", variant: "destructive" },
  devolvido: { label: "Devolvido", variant: "destructive" },
};

export function ExpedicaoStatusBadge({ status }: { status: ExpedicaoStatus | string | null | undefined }) {
  const s = String(status ?? "aguardando");
  const cfg = MAP[s] ?? { label: s, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
