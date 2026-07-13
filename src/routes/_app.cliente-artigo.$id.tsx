import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { ClienteArtigoFormDialog } from "@/components/comercial/cliente-artigo-form-dialog";
import { getClienteArtigo } from "@/services/comercial/cliente-artigo.functions";

export const Route = createFileRoute("/_app/cliente-artigo/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Regra Cliente × Artigo" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Erro: {error.message}</div>,
  notFoundComponent: () => <div className="p-6">Regra não encontrada</div>,
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/_app/cliente-artigo/$id" });
  const get = useServerFn(getClienteArtigo);
  const { data, isLoading } = useQuery({
    queryKey: ["cliente-artigo", id],
    queryFn: () => get({ data: { id } }),
  });

  if (isLoading) return <div className="p-6">Carregando...</div>;
  if (!data) return null;

  const r = data.regra as Record<string, unknown>;
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Regra Cliente × Artigo"
        description={`Preço negociado: ${Number(r.preco_negociado).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 })}`}
        actions={
          <div className="flex gap-2">
            <Link to="/cliente-artigo"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button></Link>
            <ClienteArtigoFormDialog
              regraId={id}
              initial={r as never}
              trigger={<Button>Editar</Button>}
            />
          </div>
        }
      />

      <Tabs defaultValue="cadastro">
        <TabsList>
          <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({data.historico.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro">
          <Card className="p-6 grid grid-cols-2 gap-4 text-sm">
            <Info label="Preço negociado" value={Number(r.preco_negociado).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 })} />
            <Info label="Unidade" value={String(r.unidade ?? "-")} />
            <Info label="Quantidade mínima" value={String(r.quantidade_minima ?? "0")} />
            <Info label="Desconto máx." value={`${Number(r.desconto_maximo_pct ?? 0).toFixed(2)}%`} />
            <Info label="Prazo entrega" value={r.prazo_entrega_dias ? `${r.prazo_entrega_dias} dias` : "-"} />
            <Info label="Cond. pagamento" value={String(r.condicao_pagamento ?? "-")} />
            <Info label="Vigência início" value={new Date(r.vigencia_inicio as string).toLocaleDateString("pt-BR")} />
            <Info label="Vigência fim" value={r.vigencia_fim ? new Date(r.vigencia_fim as string).toLocaleDateString("pt-BR") : "Sem prazo"} />
            <Info label="Código no cliente" value={String(r.codigo_cliente ?? "-")} />
            <Info label="Status" value={<Badge variant={r.ativo ? "default" : "outline"}>{r.ativo ? "Ativo" : "Inativo"}</Badge>} />
            {r.observacoes ? (
              <div className="col-span-2"><Info label="Observações" value={String(r.observacoes)} /></div>
            ) : null}
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.historico.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sem alterações registradas.</TableCell></TableRow>
                ) : data.historico.map(h => {
                  const hr = h as Record<string, unknown> & { id: string };
                  return (
                    <TableRow key={hr.id}>
                      <TableCell className="text-xs">{new Date(hr.alterado_em as string).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="font-mono text-xs">{hr.campo as string}</TableCell>
                      <TableCell className="text-muted-foreground">{(hr.valor_anterior as string) ?? "-"}</TableCell>
                      <TableCell className="font-medium">{(hr.valor_novo as string) ?? "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}
