import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; className: string }> = {
  aguardando: { label: "Aguardando", className: "bg-muted text-muted-foreground" },
  PENDENTE: { label: "Pendente", className: "bg-muted text-muted-foreground" },
  EM_CONFERENCIA: { label: "Em conferência", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  em_inspecao: { label: "Em inspeção", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  APROVADA: { label: "Aprovada", className: "bg-green-500/15 text-green-700 dark:text-green-300" },
  aprovada: { label: "Aprovada", className: "bg-green-500/15 text-green-700 dark:text-green-300" },
  APROVADA_COM_RESSALVA: { label: "Aprovada c/ Ressalva", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300" },
  REPROVADA: { label: "Reprovada", className: "bg-destructive/15 text-destructive" },
  reprovada: { label: "Reprovada", className: "bg-destructive/15 text-destructive" },
  REPROCESSO: { label: "Reprocesso", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  reprocesso: { label: "Reprocesso", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  PARCIALMENTE_APROVADA: { label: "Parcial", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300" },
};

export function QualidadeStatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? MAP.aguardando;
  return <Badge variant="secondary" className={cn("text-[10px] font-bold uppercase", s.className)}>{s.label}</Badge>;
}