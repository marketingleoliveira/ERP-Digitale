import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeMrp, type MrpLinha } from "@/lib/mrp.functions";
import { criarSolicitacaoDoMrp } from "@/lib/mrp-solicitacao.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Play, ShoppingCart } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/_app/pcp/mrp")({
  ssr: false,
  head: () => ({ meta: [{ title: "MRP — Necessidades de Materiais" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

const num = (n: number, d = 2) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

function UrgenciaBadge({ u }: { u: MrpLinha["urgencia"] }) {
  if (u === "vermelho") return <Badge variant="destructive">🔴 Urgente</Badge>;
  if (u === "amarelo") return <Badge className="bg-yellow-500">🟡 Atenção</Badge>;
  return <Badge className="bg-green-600">🟢 OK</Badge>;
}

function Page() {
  const runMrp = useServerFn(computeMrp);
  const gerarSol = useServerFn(criarSolicitacaoDoMrp);
  const navigate = useNavigate();
  const [demandas, setDemandas] = useState<{ article_id: string; quantidade_kg: number }[]>([]);
  const [seguranca, setSeguranca] = useState(0);
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [agrupar, setAgrupar] = useState(true);

  const { data: articles = [] } = useQuery({
    queryKey: ["articles-mrp"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("id, codigo, nome").eq("ativo", true).order("codigo");
      if (error) throw error;
      return data;
    },
  });

  const mrp = useMutation({
    mutationFn: (auto: boolean) =>
      runMrp({ data: { demandas: auto ? [] : demandas, estoque_seguranca_pct: seguranca } }),
    onSuccess: () => setSelecionadas(new Set()),
    onError: (e: Error) => toast.error(e.message),
  });

  const gerar = useMutation({
    mutationFn: async () => {
      const escolhidas = [...selecionadas].map(i => linhas[i]).filter(l => l && l.necessidade_liquida > 0);
      if (escolhidas.length === 0) throw new Error("Selecione ao menos uma linha com necessidade.");
      return gerarSol({ data: {
        linhas: escolhidas.map(l => ({
          ref_tipo: l.ref_tipo, ref_id: l.ref_id, descricao: l.descricao, unidade: l.unidade,
          necessidade_liquida: l.necessidade_liquida,
          fornecedor_id: l.fornecedor_id, prazo_entrega_dias: l.prazo_entrega_dias,
          urgencia: l.urgencia,
          origem_op_ids: [], origem_pedido_ids: [],
          observacao_mrp: `Origem: ${l.origem_articles.map(o => o.codigo).join(", ")}`,
        })),
        agrupar_por_fornecedor: agrupar,
      } });
    },
    onSuccess: (r) => {
      if (r.aviso) { toast.warning(r.aviso); return; }
      toast.success(`${r.criadas.length} solicitação(ões) criada(s).`);
      if (r.criadas.length === 1) navigate({ to: "/compras/solicitacoes/$id", params: { id: r.criadas[0].solicitacao_id } });
      else navigate({ to: "/compras/solicitacoes" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linhas = mrp.data?.linhas ?? [];

  const kpis = {
    itens: linhas.length,
    urgentes: linhas.filter(l => l.urgencia === "vermelho").length,
    atencao: linhas.filter(l => l.urgencia === "amarelo").length,
    liquidaTotal: linhas.reduce((a, l) => a + l.necessidade_liquida, 0),
  };

  const addDemanda = () => setDemandas([...demandas, { article_id: articles[0]?.id ?? "", quantidade_kg: 1000 }]);
  const removeDemanda = (i: number) => setDemandas(demandas.filter((_, idx) => idx !== i));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MRP — Necessidades de Materiais</h1>
        <p className="text-sm text-muted-foreground">
          Explosão da BOM · Necessidade Bruta → Estoque → Trânsito → Necessidade Líquida · Sugestão de compra.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Entrada</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label>Estoque de segurança (%)</Label>
              <Input type="number" min={0} max={100} value={seguranca}
                onChange={e => setSeguranca(Number(e.target.value))} className="w-32" />
            </div>
            <Button onClick={() => mrp.mutate(true)} disabled={mrp.isPending}>
              <Play className="h-4 w-4 mr-1.5" /> Rodar automático (OPs abertas)
            </Button>
            <Button variant="outline" onClick={() => mrp.mutate(false)} disabled={mrp.isPending || demandas.length === 0}>
              Rodar com demandas abaixo
            </Button>
          </div>

          <div className="space-y-2">
            {demandas.map((d, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Artigo</Label>
                  <Select value={d.article_id} onValueChange={v => {
                    const next = [...demandas]; next[i] = { ...d, article_id: v }; setDemandas(next);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {articles.map(a => <SelectItem key={a.id} value={a.id}>{a.codigo} — {a.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <Label>Quantidade (kg)</Label>
                  <Input type="number" value={d.quantidade_kg} onChange={e => {
                    const next = [...demandas]; next[i] = { ...d, quantidade_kg: Number(e.target.value) }; setDemandas(next);
                  }} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeDemanda(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={addDemanda} disabled={!articles.length}>
              <Plus className="h-4 w-4 mr-1.5" /> Adicionar demanda manual
            </Button>
          </div>
        </CardContent>
      </Card>

      {mrp.data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardHeader><CardTitle className="text-sm">Componentes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.itens}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">🔴 Urgentes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-destructive">{kpis.urgentes}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">🟡 Atenção</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.atencao}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Necessidade líquida</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{num(kpis.liquidaTotal, 1)}</CardContent></Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Explosão MRP</CardTitle>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={agrupar} onCheckedChange={v => setAgrupar(!!v)} /> Agrupar por fornecedor
                </label>
                <Button size="sm" onClick={() => gerar.mutate()}
                  disabled={gerar.isPending || selecionadas.size === 0}>
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  Gerar solicitação de compra ({selecionadas.size})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={selecionadas.size > 0 && selecionadas.size === linhas.filter(l => l.necessidade_liquida > 0).length}
                      onCheckedChange={v => {
                        if (v) setSelecionadas(new Set(linhas.map((l, i) => l.necessidade_liquida > 0 ? i : -1).filter(i => i >= 0)));
                        else setSelecionadas(new Set());
                      }}
                    />
                  </TableHead>
                  <TableHead>Componente</TableHead>
                  <TableHead className="text-right">Bruta</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Trânsito</TableHead>
                  <TableHead className="text-right">Segurança</TableHead>
                  <TableHead className="text-right">Líquida</TableHead>
                  <TableHead>Un.</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Prazo</TableHead>
                  <TableHead>Urgência</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {linhas.length === 0
                    ? <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground">Sem necessidades — verifique se há BOM cadastrada para os artigos.</TableCell></TableRow>
                    : linhas.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Checkbox
                            checked={selecionadas.has(i)}
                            disabled={l.necessidade_liquida <= 0}
                            onCheckedChange={v => {
                              const n = new Set(selecionadas);
                              if (v) n.add(i); else n.delete(i);
                              setSelecionadas(n);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{l.descricao}</div>
                          <div className="text-xs text-muted-foreground">
                            {l.origem_articles.map(o => `${o.codigo} (${num(o.qtd_kg, 0)}kg)`).join(", ")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{num(l.necessidade_bruta)}</TableCell>
                        <TableCell className="text-right">{num(l.estoque_disponivel)}</TableCell>
                        <TableCell className="text-right">{num(l.em_transito)}</TableCell>
                        <TableCell className="text-right">{num(l.estoque_seguranca)}</TableCell>
                        <TableCell className="text-right font-semibold">{num(l.necessidade_liquida)}</TableCell>
                        <TableCell>{l.unidade}</TableCell>
                        <TableCell>{l.fornecedor_nome ?? "—"}</TableCell>
                        <TableCell className="text-right">{l.prazo_entrega_dias ? `${l.prazo_entrega_dias}d` : "—"}</TableCell>
                        <TableCell><UrgenciaBadge u={l.urgencia} /></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
}
