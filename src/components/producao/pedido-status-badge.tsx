import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PedidoStatus } from "@/services/producao/pedido.functions";

const MAP: Record<string, { label: string; className: string }> = {
  rascunho:                { label: "Rascunho",                className: "bg-muted text-muted-foreground" },
  aguardando_aprovacao:    { label: "Aguardando aprovação",    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  aprovado:                { label: "Aprovado",                className: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  confirmado:              { label: "Confirmado",              className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400" },
  em_producao:             { label: "Em produção",             className: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400" },
  parcialmente_produzido:  { label: "Parcialmente produzido",  className: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400" },
  pronto_faturamento:      { label: "Pronto p/ faturamento",   className: "bg-violet-500/15 text-violet-700 dark:text-violet-400" },
  faturado:                { label: "Faturado",                className: "bg-primary/15 text-primary" },
  expedido:                { label: "Expedido",                className: "bg-teal-500/15 text-teal-700 dark:text-teal-400" },
  entregue:                { label: "Entregue",                className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  cancelado:               { label: "Cancelado",               className: "bg-destructive/15 text-destructive" },
};

export function PedidoStatusBadge({ status }: { status: PedidoStatus | string }) {
  const info = MAP[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={cn("font-medium", info.className)} variant="outline">{info.label}</Badge>;
}
