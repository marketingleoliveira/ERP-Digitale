import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOpInspecao } from "@/services/producao/qualidade.functions";
import { QualidadeInspecaoForm } from "@/components/producao/qualidade-inspecao-form";
import { QualidadeStatusBadge } from "@/components/producao/qualidade-status-badge";

export const Route = createFileRoute("/_app/producao/qualidade/$opId")({
  head: () => ({ meta: [{ title: "Inspeção de OP" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Erro: {error.message}</div>,
  notFoundComponent: () => <div className="p-6">OP não encontrada.</div>,
  component: OpInspecaoPage,
});

function OpInspecaoPage() {
  const { opId } = Route.useParams();
  const get = useServerFn(getOpInspecao);
  const { data, isLoading } = useQuery({
    queryKey: ["qualidade", "op", opId],
    queryFn: () => get({ data: { op_id: opId } }),
  });

  if (isLoading) return <div className="p-6">Carregando...</div>;
  if (!data) return <div className="p-6">Sem dados.</div>;

  const produzido = data.apontamentos.reduce((a, x) => a + Number(x.quantidade_produzida ?? 0), 0);
  const jaInspAprov = data.inspecoes.reduce((a, x) => a + Number(x.quantidade_aprovada ?? 0), 0);
  const jaInspReprov = data.inspecoes.reduce((a, x) => a + Number(x.quantidade_reprovada ?? 0), 0);
  const jaInspRepro = data.inspecoes.reduce((a, x) => a + Number(x.quantidade_reprocesso ?? 0), 0);
  const saldoInspecao = Math.max(0, produzido - jaInspAprov - jaInspReprov - jaInspRepro);

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title={`Inspeção · OP #${data.op.numero}`}
        description={`Status atual: ${data.op.status}`}
        actions={<Button asChild variant="outline"><Link to="/producao/qualidade">Voltar</Link></Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><div className="text-xs text-muted-foreground">Produzido</div><div className="text-lg font-bold">{produzido.toFixed(3)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Aprovado</div><div className="text-lg font-bold text-green-600">{jaInspAprov.toFixed(3)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">Reprovado</div><div className="text-lg font-bold text-destructive">{jaInspReprov.toFixed(3)}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">A inspecionar</div><div className="text-lg font-bold">{saldoInspecao.toFixed(3)}</div></Card>
      </div>

      <QualidadeInspecaoForm opId={opId} quantidadeProduzida={saldoInspecao} />

      <div>
        <h3 className="text-sm font-semibold mb-2">Histórico de inspeções</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aprov.</TableHead>
                <TableHead className="text-right">Reprov.</TableHead>
                <TableHead className="text-right">Reproc.</TableHead>
                <TableHead>Defeito</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.inspecoes.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">Nenhuma inspeção.</TableCell></TableRow>}
              {data.inspecoes.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-xs">{new Date(i.data).toLocaleString("pt-BR")}</TableCell>
                  <TableCell><QualidadeStatusBadge status={i.status ?? i.resultado ?? "aguardando"} /></TableCell>
                  <TableCell className="text-right">{Number(i.quantidade_aprovada ?? 0).toFixed(3)}</TableCell>
                  <TableCell className="text-right">{Number(i.quantidade_reprovada ?? 0).toFixed(3)}</TableCell>
                  <TableCell className="text-right">{Number(i.quantidade_reprocesso ?? 0).toFixed(3)}</TableCell>
                  <TableCell className="text-xs">{i.defeito ?? "—"}</TableCell>
                  <TableCell className="text-xs">{i.observacao ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {data.lotes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Lotes gerados</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº do lote</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead>Entrada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lotes.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.numero_lote}</TableCell>
                    <TableCell className="text-right">{Number(l.quantidade).toFixed(3)}</TableCell>
                    <TableCell className="text-right">{Number(l.quantidade_disponivel).toFixed(3)}</TableCell>
                    <TableCell>{l.data_entrada}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
