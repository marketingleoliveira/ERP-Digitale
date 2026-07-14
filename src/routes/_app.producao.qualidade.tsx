import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { listarFilaInspecao, indicadoresQualidade } from "@/services/producao/qualidade.functions";

export const Route = createFileRoute("/_app/producao/qualidade")({
  head: () => ({ meta: [{ title: "Controle de Qualidade" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Erro: {error.message}</div>,
  component: QualidadePage,
});

function pct(n: number) { return `${(n * 100).toFixed(1)}%`; }

function QualidadePage() {
  const listar = useServerFn(listarFilaInspecao);
  const indicadores = useServerFn(indicadoresQualidade);
  const [search, setSearch] = useState("");

  const fila = useQuery({
    queryKey: ["qualidade", "fila", search],
    queryFn: () => listar({ data: { search: search || undefined } }),
  });

  const ind = useQuery({
    queryKey: ["qualidade", "indicadores"],
    queryFn: () => indicadores({ data: { dias: 30 } }),
  });

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Controle de Qualidade"
        description="Fila de inspeção, aprovação por lote e indicadores de refugo/reprocesso."
      />

      <Tabs defaultValue="fila">
        <TabsList>
          <TabsTrigger value="fila">Fila de inspeção</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores (30d)</TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="space-y-3">
          <Input
            placeholder="Buscar por número da OP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data prevista</TableHead>
                  <TableHead className="text-right">Produzido</TableHead>
                  <TableHead className="text-right">A inspecionar</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fila.isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">Carregando...</TableCell></TableRow>}
                {!fila.isLoading && (fila.data ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Nenhuma OP aguardando inspeção.</TableCell></TableRow>
                )}
                {(fila.data ?? []).map((op) => {
                  const itens = (op as { op_itens?: Array<{ quantidade_produzida?: number; quantidade_aprovada?: number; quantidade_reprovada?: number }> }).op_itens ?? [];
                  const produzido = itens.reduce((a, i) => a + Number(i.quantidade_produzida ?? 0), 0);
                  const inspecionado = itens.reduce((a, i) => a + Number(i.quantidade_aprovada ?? 0) + Number(i.quantidade_reprovada ?? 0), 0);
                  const pendente = Math.max(0, produzido - inspecionado);
                  return (
                    <TableRow key={op.id}>
                      <TableCell className="font-mono">#{op.numero}</TableCell>
                      <TableCell><Badge variant="outline">{op.status}</Badge></TableCell>
                      <TableCell>{op.prioridade ?? "—"}</TableCell>
                      <TableCell>{op.data_prevista ?? "—"}</TableCell>
                      <TableCell className="text-right">{produzido.toFixed(3)}</TableCell>
                      <TableCell className="text-right font-semibold">{pendente.toFixed(3)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm">
                          <Link to="/producao/qualidade/$opId" params={{ opId: op.id }}>Inspecionar</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="indicadores" className="space-y-3">
          {ind.isLoading && <div className="text-muted-foreground">Carregando...</div>}
          {ind.data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Taxa de aprovação</div>
                  <div className="text-2xl font-bold text-green-600">{pct(ind.data.taxa_aprovacao)}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Refugo</div>
                  <div className="text-2xl font-bold text-destructive">{pct(ind.data.taxa_refugo)}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Reprocesso</div>
                  <div className="text-2xl font-bold text-orange-600">{pct(ind.data.taxa_reprocesso)}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Total inspecionado</div>
                  <div className="text-2xl font-bold">{ind.data.total_produzido.toFixed(1)}</div>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <TopList title="Por máquina" rows={ind.data.por_maquina} />
                <TopList title="Por artigo/produto" rows={ind.data.por_artigo} />
                <TopList title="Por defeito" rows={ind.data.por_defeito} />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: Array<{ chave: string; defeitos: number }> }) {
  return (
    <Card className="p-4">
      <div className="text-sm font-semibold mb-2">{title}</div>
      {rows.length === 0 ? <div className="text-xs text-muted-foreground">Sem dados</div> : (
        <ul className="space-y-1 text-sm">
          {rows.map(r => (
            <li key={r.chave} className="flex justify-between">
              <span className="truncate font-mono text-xs">{r.chave.slice(0, 20)}</span>
              <span className="font-semibold">{r.defeitos.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
