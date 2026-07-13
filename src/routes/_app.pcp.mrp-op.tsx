import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { computeOpSuggestions, gerarOpDaSugestao, type OpSugestao } from "@/lib/mrp-op.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Play, CheckCircle2, Factory } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pcp/mrp-op")({
  ssr: false,
  head: () => ({ meta: [{ title: "MRP → Sugestão de Ordens de Produção" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

const num = (n: number, d = 2) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

function RiscoBadge({ r }: { r: OpSugestao["risco_atraso"] }) {
  if (r === "vermelho") return <Badge variant="destructive">🔴 Alto</Badge>;
  if (r === "amarelo") return <Badge className="bg-yellow-500">🟡 Médio</Badge>;
  return <Badge className="bg-green-600">🟢 Baixo</Badge>;
}

function Page() {
  const run = useServerFn(computeOpSuggestions);
  const gerar = useServerFn(gerarOpDaSugestao);
  const navigate = useNavigate();
  const [aberta, setAberta] = useState<OpSugestao | null>(null);
  const [qtd, setQtd] = useState(0);
  const [prio, setPrio] = useState(5);
  const [maq, setMaq] = useState<string>("");
  const [data, setData] = useState<string>("");
  const [reservar, setReservar] = useState(true);

  const calc = useMutation({
    mutationFn: () => run({ data: {} }),
    onError: (e: Error) => toast.error(e.message),
  });

  const criar = useMutation({
    mutationFn: async () => {
      if (!aberta) throw new Error("Nenhuma sugestão selecionada");
      return gerar({ data: {
        article_id: aberta.article_id,
        product_id: aberta.product_id,
        variante_id: aberta.variante_id,
        quantidade_kg: qtd,
        prioridade: prio,
        maquina_id: maq || null,
        data_prevista: data || null,
        pedido_ids: aberta.pedidos.map(p => p.pedido_id),
        descricao: `${aberta.article_codigo} — ${aberta.product_nome ?? ""}`.trim(),
        reservar_materiais: reservar,
      } });
    },
    onSuccess: (r) => {
      toast.success(`OP #${r.numero} criada${reservar ? " (materiais reservados)" : ""}.`);
      setAberta(null);
      navigate({ to: "/pcp/ordens-producao" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sugs = calc.data?.sugestoes ?? [];
  const kpis = {
    total: sugs.length,
    urgentes: sugs.filter(s => s.risco_atraso === "vermelho").length,
    faltamMp: sugs.filter(s => s.materiais_faltantes.length > 0).length,
    semRoteiro: sugs.filter(s => !s.roteiro_id).length,
  };

  function abrirRevisao(s: OpSugestao) {
    setAberta(s); setQtd(s.quantidade_kg); setPrio(s.prioridade);
    setMaq(s.maquinas_elegiveis[0]?.id ?? "");
    setData(s.data_necessaria ?? "");
    setReservar(s.materiais_faltantes.length === 0);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MRP → Sugestão de Ordens de Produção</h1>
        <p className="text-sm text-muted-foreground">
          Consolida pedidos confirmados por artigo, valida BOM/roteiro/capacidade e sugere OPs. Aprovação manual gera a OP e reserva materiais.
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => calc.mutate()} disabled={calc.isPending}>
          <Play className="h-4 w-4 mr-1.5" /> Calcular sugestões
        </Button>
      </div>

      {calc.data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardHeader><CardTitle className="text-sm">Sugestões</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.total}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">🔴 Risco alto</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-destructive">{kpis.urgentes}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Falta MP</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.faltamMp}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Sem roteiro</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.semRoteiro}</CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Sugestões</CardTitle></CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Artigo / Produto</TableHead>
                  <TableHead className="text-right">Qtd (kg)</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="text-right">Prioridade</TableHead>
                  <TableHead>Roteiro</TableHead>
                  <TableHead>Máquinas</TableHead>
                  <TableHead className="text-right">Duração (h)</TableHead>
                  <TableHead>Materiais</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sugs.length === 0
                    ? <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground">Nenhuma sugestão. Confirme pedidos e cadastre vínculos Produto→Artigo.</TableCell></TableRow>
                    : sugs.map(s => (
                      <TableRow key={s.key}>
                        <TableCell>
                          <div className="font-medium">{s.article_codigo}</div>
                          <div className="text-xs text-muted-foreground">{s.product_nome ?? s.article_nome}</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{num(s.quantidade_kg, 1)}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            {s.pedidos.slice(0, 3).map(p => <div key={p.pedido_id}>#{p.numero} {p.cliente ? `· ${p.cliente}` : ""}</div>)}
                            {s.pedidos.length > 3 && <div className="text-muted-foreground">+{s.pedidos.length - 3}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{s.data_necessaria ?? "—"}</TableCell>
                        <TableCell className="text-right">{s.prioridade}</TableCell>
                        <TableCell>{s.roteiro_codigo ?? <span className="text-destructive">—</span>}</TableCell>
                        <TableCell className="text-xs">
                          {s.maquinas_elegiveis.length === 0 ? "—" : s.maquinas_elegiveis.map(m => m.nome).join(", ")}
                        </TableCell>
                        <TableCell className="text-right">{s.duracao_estimada_horas !== null ? num(s.duracao_estimada_horas, 1) : "—"}</TableCell>
                        <TableCell>
                          {s.materiais_faltantes.length === 0
                            ? <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>
                            : <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />{s.materiais_faltantes.length} falta(s)</Badge>}
                        </TableCell>
                        <TableCell><RiscoBadge r={s.risco_atraso} /></TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => abrirRevisao(s)}>
                            <Factory className="h-3 w-3 mr-1" /> Revisar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!aberta} onOpenChange={o => !o && setAberta(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar e gerar OP — {aberta?.article_codigo}</DialogTitle>
          </DialogHeader>
          {aberta && (
            <div className="space-y-4">
              {aberta.alertas.length > 0 && (
                <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm space-y-1">
                  <div className="font-semibold flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Alertas</div>
                  <ul className="list-disc pl-5">
                    {aberta.alertas.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quantidade (kg)</Label>
                  <Input type="number" value={qtd} onChange={e => setQtd(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Prioridade (1-10)</Label>
                  <Input type="number" min={1} max={10} value={prio} onChange={e => setPrio(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Máquina</Label>
                  <Select value={maq} onValueChange={setMaq}>
                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {aberta.maquinas_elegiveis.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.nome} ({num(m.kg_por_hora, 1)} kg/h)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data prevista</Label>
                  <Input type="date" value={data} onChange={e => setData(e.target.value)} />
                </div>
              </div>

              {aberta.materiais_faltantes.length > 0 && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
                  <div className="font-semibold mb-1">Materiais faltantes</div>
                  <ul className="text-xs space-y-0.5">
                    {aberta.materiais_faltantes.map((m, i) => (
                      <li key={i}>{m.descricao}: necessário {num(m.necessario)} · disponível {num(m.disponivel)} · <span className="text-destructive font-semibold">déficit {num(m.deficit)}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={reservar} onCheckedChange={v => setReservar(!!v)} />
                Reservar materiais automaticamente após criar
              </label>

              <div className="text-xs text-muted-foreground">
                Pedidos vinculados: {aberta.pedidos.map(p => `#${p.numero}`).join(", ")}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberta(null)}>Cancelar</Button>
            <Button onClick={() => criar.mutate()} disabled={criar.isPending || qtd <= 0}>
              Aprovar e gerar OP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
