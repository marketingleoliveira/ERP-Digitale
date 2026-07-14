import { Badge } from "@/components/ui/badge";
import type { QualidadeStatus } from "@/services/producao/qualidade.functions";

const MAP: Record<QualidadeStatus, { label: string; className: string }> = {
  aguardando: { label: "Aguardando", className: "bg-muted text-muted-foreground" },
  em_inspecao: { label: "Em inspeção", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  aprovada: { label: "Aprovada", className: "bg-green-500/15 text-green-700 dark:text-green-300" },
  aprovada_parcial: { label: "Aprovada parcial", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300" },
  reprovada: { label: "Reprovada", className: "bg-destructive/15 text-destructive" },
  reprocesso: { label: "Reprocesso", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
};

export function QualidadeStatusBadge({ status }: { status: string }) {
  const s = MAP[(status as QualidadeStatus) ?? "aguardando"] ?? MAP.aguardando;
  return <Badge variant="secondary" className={s.className}>{s.label}</Badge>;
}
