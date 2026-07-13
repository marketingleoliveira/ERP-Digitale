import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, PlayCircle, Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { PedidoStatusBadge } from "@/components/producao/pedido-status-badge";
import {
  getPedido, gerarOpsPedido, atualizarStatusPedido, derivarStatusPedido,
  type PedidoStatus,
} from "@/services/producao/pedido.functions";
import { useState } from "react";

export const Route = createFileRoute("/_app/producao/pedidos/$id")({
  head: () => ({ meta: [{ title: "Detalhe do Pedido" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Erro: {error.message}</div>,
  notFoundComponent: () => <div className="p-6">Pedido não encontrado.</div>,
  component: PedidoDetail,
});

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function PedidoDetail() {
  const { id } = useParams({ from: "/_app/producao/pedidos/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const carregar = useServerFn(getPedido);
  const gerarOps = useServerFn(gerarOpsPedido);
  const atualizar = useServerFn(atualizarStatusPedido);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["pedido", id],
    queryFn: () => carregar({ data: { id } }),
  });

  if (isLoading) return <div className="p-6">Carregando...</div>;
  if (!data) return <div className="p-6">Pedido não encontrado.</div>;

  const { pedido, cliente, vendedor, itens, ops, notas, contas, expedicoes, historico } = data;
  const pedRow = pedido as unknown as {
    id: string; numero: string; status: PedidoStatus;
    data_pedido: string; prazo_entrega: string | null;
    condicao_pagamento: string | null; observacao: string | null;
    valor_total: number;
  };

  const statusDerivado = derivarStatusPedido({
    atual: pedRow.status,
    ops: (ops as { status: string }[]) ?? [],
    notas: (notas as { status_sefaz?: string | null }[]) ?? [],
    expedicoes: (expedicoes as { status?: string | null }[]) ?? [],
  });

  const podeGerarOps = ["rascunho","aguardando_aprovacao","aprovado","confirmado"].includes(pedRow.status)
    && (ops as { id: string }[]).length === 0;
  const podeCancelar = pedRow.status !== "cancelado" && pedRow.status !== "entregue";

  const runGerar = async () => {
    setBusy(true);
    try {
      const r = await gerarOps({ data: { pedidoId: id } });
      toast.success(`${r.ops.length} OP(s) gerada(s).`);
      if (r.faltas.length) toast.warning(`${r.faltas.length} item(ns) com pendências (BOM/artigo).`);
      qc.invalidateQueries({ queryKey: ["pedido", id] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); } finally { setBusy(false); }
  };
  const runCancelar = async () => {
    if (!confirm("Cancelar este pedido?")) return;
    setBusy(true);
    try {
      await atualizar({ data: { id, status: "cancelado" } });
      toast.success("Pedido cancelado.");
      qc.invalidateQueries({ queryKey: ["pedido", id] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); } finally { setBusy(false); }
  };
  const runTransicao = async (novo: PedidoStatus) => {
    setBusy(true);
    try {
      await atualizar({ data: { id, status: novo } });
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["pedido", id] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); } finally { setBusy(false); }
  };

  const clienteRow = cliente as unknown as { razao_social?: string; nome_fantasia?: string; email?: string; telefone?: string; endereco?: string; cidade?: string; uf?: string } | null;
  const vendedorRow = vendedor as unknown as { nome?: string; email?: string } | null;

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/producao/pedidos" })}>
        <ArrowLeft className="h-4 w-4 mr-1" />Voltar
      </Button>

      <PageHeader
        title={`Pedido ${pedRow.numero}`}
        description={clienteRow?.nome_fantasia || clienteRow?.razao_social || ""}
        actions={
          <div className="flex items-center gap-2">
            <PedidoStatusBadge status={pedRow.status} />
            {statusDerivado !== pedRow.status && (
              <Badge variant="outline" className="text-muted-foreground">Derivado: {statusDerivado}</Badge>
            )}
            {pedRow.status === "rascunho" && (
              <Button size="sm" variant="outline" onClick={() => runTransicao("aguardando_aprovacao")} disabled={busy}>
                Enviar p/ aprovação
              </Button>
            )}
            {pedRow.status === "aguardando_aprovacao" && (
              <Button size="sm" variant="outline" onClick={() => runTransicao("aprovado")} disabled={busy}>
                Aprovar
              </Button>
            )}
            {podeGerarOps && (
              <Button size="sm" onClick={runGerar} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : <PlayCircle className="h-4 w-4 mr-1"/>}
                Gerar OPs
              </Button>
            )}
            {podeCancelar && (
              <Button size="sm" variant="outline" onClick={runCancelar} disabled={busy}>
                <Ban className="h-4 w-4 mr-1"/>Cancelar
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="itens">Itens ({itens.length})</TabsTrigger>
          <TabsTrigger value="ops">OPs ({ops.length})</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal ({notas.length})</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro ({contas.length})</TabsTrigger>
          <TabsTrigger value="expedicao">Expedição ({expedicoes.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({historico.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <Card>
            <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Data: </span>{new Date(pedRow.data_pedido).toLocaleDateString("pt-BR")}</div>
              <div><span className="text-muted-foreground">Prazo: </span>{pedRow.prazo_entrega ? new Date(pedRow.prazo_entrega).toLocaleDateString("pt-BR") : "—"}</div>
              <div><span className="text-muted-foreground">Cliente: </span>{clienteRow?.razao_social ?? "—"}</div>
              <div><span className="text-muted-foreground">Contato: </span>{clienteRow?.email ?? clienteRow?.telefone ?? "—"}</div>
              <div><span className="text-muted-foreground">Endereço: </span>{[clienteRow?.endereco, clienteRow?.cidade, clienteRow?.uf].filter(Boolean).join(", ") || "—"}</div>
              <div><span className="text-muted-foreground">Representante: </span>{vendedorRow?.nome ?? "—"}</div>
              <div><span className="text-muted-foreground">Condição: </span>{pedRow.condicao_pagamento ?? "—"}</div>
              <div><span className="text-muted-foreground">Total: </span><span className="font-semibold">{fmtBRL(Number(pedRow.valor_total ?? 0))}</span></div>
              {pedRow.observacao && <div className="md:col-span-2"><span className="text-muted-foreground">Observação: </span>{pedRow.observacao}</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itens">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Descrição</TableHead><TableHead className="text-right">Qtd</TableHead>
                <TableHead>Un</TableHead><TableHead className="text-right">Vl Unit</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(itens as Array<Record<string, unknown>>).map(it => (
                  <TableRow key={it.id as string}>
                    <TableCell>{(it.descricao as string) ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{Number(it.quantidade)}</TableCell>
                    <TableCell>{it.unidade as string}</TableCell>
                    <TableCell className="text-right font-mono">{fmtBRL(Number(it.valor_unitario ?? 0))}</TableCell>
                    <TableCell className="text-right font-mono">{fmtBRL(Number(it.valor_total ?? Number(it.quantidade)*Number(it.valor_unitario)))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="ops">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>OP</TableHead><TableHead>Status</TableHead>
                <TableHead>Abertura</TableHead><TableHead>Previsto</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {ops.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhuma OP gerada ainda.</TableCell></TableRow> :
                (ops as Array<Record<string, unknown>>).map(op => (
                  <TableRow key={op.id as string}>
                    <TableCell><Link to="/producao/op/$id" params={{ id: op.id as string }} className="font-mono font-semibold hover:underline">#{op.numero as number}</Link></TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{(op.status as string).replace(/_/g," ")}</Badge></TableCell>
                    <TableCell>{op.data_abertura ? new Date(op.data_abertura as string).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell>{op.data_prevista ? new Date(op.data_prevista as string).toLocaleDateString("pt-BR") : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>NF</TableHead><TableHead>Série</TableHead><TableHead>Emissão</TableHead>
                <TableHead>Status SEFAZ</TableHead><TableHead className="text-right">Valor</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {notas.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhuma NF-e vinculada.</TableCell></TableRow> :
                (notas as Array<Record<string, unknown>>).map(n => (
                  <TableRow key={n.id as string}>
                    <TableCell className="font-mono">{n.numero as string}</TableCell>
                    <TableCell>{n.serie as string}</TableCell>
                    <TableCell>{n.data_emissao ? new Date(n.data_emissao as string).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{(n.status_sefaz as string) ?? "—"}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{fmtBRL(Number(n.valor_total ?? 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Descrição</TableHead><TableHead>Parcela</TableHead>
                <TableHead>Vencimento</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Pago</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {contas.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhum título gerado.</TableCell></TableRow> :
                (contas as Array<Record<string, unknown>>).map(c => (
                  <TableRow key={c.id as string}>
                    <TableCell>{(c.descricao as string) ?? "—"}</TableCell>
                    <TableCell>{c.parcela as number}/{c.total_parcelas as number}</TableCell>
                    <TableCell>{c.vencimento ? new Date(c.vencimento as string).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{c.status as string}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{fmtBRL(Number(c.valor ?? 0))}</TableCell>
                    <TableCell className="text-right font-mono">{fmtBRL(Number(c.valor_pago ?? 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="expedicao">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>OP</TableHead><TableHead>Status</TableHead>
                <TableHead>Saída</TableHead><TableHead>Entrega</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {expedicoes.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sem expedições.</TableCell></TableRow> :
                (expedicoes as Array<Record<string, unknown>>).map(e => (
                  <TableRow key={e.id as string}>
                    <TableCell className="font-mono">{(e.op_id as string)?.slice(0,8)}</TableCell>
                    <TableCell><Badge variant="outline">{e.status as string}</Badge></TableCell>
                    <TableCell>{e.data_saida ? new Date(e.data_saida as string).toLocaleString("pt-BR") : "-"}</TableCell>
                    <TableCell>{e.data_entrega ? new Date(e.data_entrega as string).toLocaleString("pt-BR") : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Ação</TableHead>
                <TableHead>De</TableHead><TableHead>Para</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {historico.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sem eventos.</TableCell></TableRow> :
                (historico as Array<Record<string, unknown>>).map(h => (
                  <TableRow key={h.id as string}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(h.created_at as string).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{h.acao as string}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{(h.de_status as string) ?? "—"}</TableCell>
                    <TableCell className="text-xs">{(h.para_status as string) ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
