/**
 * OpRastreabilidade — trilha ↓ do documento (Pedido → OP → Lote → NF-e → CR → Expedição).
 * Cada card leva ao documento relacionado.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown } from "lucide-react";
import { getRastreabilidadeOp } from "@/services/producao/rastreabilidade.functions";

interface Props { opId: string; }

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n));

export function OpRastreabilidade({ opId }: Props) {
  const fn = useServerFn(getRastreabilidadeOp);
  const { data, isLoading } = useQuery({
    queryKey: ["op-rastreabilidade", opId],
    queryFn: () => fn({ data: { opId } }),
  });

  if (isLoading || !data) return <Skeleton className="h-64 w-full" />;

  type EventoRow = { id: string; created_at: string; tipo: string; para_status: string | null };
  type NotaRow = { id: string; numero: string; serie: string; status_sefaz: string | null; valor_total: number };
  type ContaRow = { id: string; valor: number; vencimento: string | null; status: string };
  type LoteRow = { id: string; numero_lote: string | null; quantidade_disponivel: number };
  type ExpRow = { id: string; created_at: string; transportadora?: string | null };

  const Step = ({ title, count, children }: { title: string; count: number; children?: React.ReactNode }) => (
    <>
      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge variant="outline">{count}</Badge>
        </CardHeader>
        {children && <CardContent className="pt-0 text-sm space-y-1">{children}</CardContent>}
      </Card>
      <div className="flex justify-center text-muted-foreground"><ArrowDown className="h-4 w-4" /></div>
    </>
  );

  return (
    <div className="space-y-2">
      <Step title="OP" count={1}>
        <div>#{data.op?.numero} — {data.op?.status}</div>
      </Step>
      <Step title="Apontamentos" count={data.apontamentos.length} />
      <Step title="Consumos de matéria-prima" count={data.consumos.length} />
      <Step title="Qualidade" count={data.qualidade.length} />
      <Step title="Lotes gerados" count={data.lotes.length}>
        {(data.lotes as LoteRow[]).map((l) => (
          <div key={l.id}>Lote {l.numero_lote} — disp: {l.quantidade_disponivel}</div>
        ))}
      </Step>
      <Step title="Notas Fiscais" count={data.notas.length}>
        {(data.notas as NotaRow[]).map((n) => (
          <div key={n.id} className="flex justify-between">
            <Link to="/fiscal" search={{ nf: n.id } as never} className="underline">
              NF {n.numero}/{n.serie}
            </Link>
            <span>{fmt(n.valor_total)} · <Badge variant="secondary">{n.status_sefaz ?? "—"}</Badge></span>
          </div>
        ))}
      </Step>
      <Step title="Contas a Receber" count={data.contas.length}>
        {(data.contas as ContaRow[]).map((c) => (
          <div key={c.id} className="flex justify-between">
            <span>Venc. {c.vencimento ?? "—"}</span>
            <span>{fmt(c.valor)} · <Badge>{c.status}</Badge></span>
          </div>
        ))}
      </Step>
      <Step title="Expedições" count={data.expedicoes.length} />
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Auditoria / Eventos</CardTitle></CardHeader>
        <CardContent className="text-xs space-y-1 max-h-64 overflow-y-auto">
          {(data.eventos as EventoRow[]).map((e) => (
            <div key={e.id} className="flex justify-between border-b py-1">
              <span>{e.tipo}{e.para_status ? ` → ${e.para_status}` : ""}</span>
              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
