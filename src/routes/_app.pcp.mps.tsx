import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/mps")({ ssr: false, component: MpsPage });

type Periodo = { id: string; periodo: string; tipo: "mensal" | "semanal"; status: "aberto" | "fechado" };
type Previsao = { id: string; periodo_id: string; article_id: string; quantidade_prevista: number; quantidade_firme: number; origem: string };
type Article = { id: string; codigo: string; nome: string };

function MpsPage() {
  const qc = useQueryClient();
  const [novoPer, setNovoPer] = useState(false);
  const [novoPerForm, setNovoPerForm] = useState({ periodo: new Date().toISOString().slice(0, 10), tipo: "mensal" as const });
  const [selPer, setSelPer] = useState<string | null>(null);
  const [addLine, setAddLine] = useState<{ article_id: string; quantidade_prevista: number }>({ article_id: "", quantidade_prevista: 0 });

  const { data: periodos = [] } = useQuery({
    queryKey: ["mps_periodos"],
    queryFn: async (): Promise<Periodo[]> => {
      const { data, error } = await supabase.from("mps_periodos" as never).select("*").order("periodo", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Periodo[];
    },
  });

  const currentPer = useMemo(() => periodos.find((p) => p.id === selPer) ?? periodos[0] ?? null, [periodos, selPer]);

  const { data: previsoes = [], isLoading: loadingPrev } = useQuery({
    queryKey: ["mps_previsoes", currentPer?.id],
    enabled: !!currentPer,
    queryFn: async (): Promise<Previsao[]> => {
      const { data, error } = await supabase.from("mps_previsoes" as never).select("*").eq("periodo_id", currentPer!.id);
      if (error) throw error;
      return (data ?? []) as unknown as Previsao[];
    },
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["articles-min"],
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await supabase.from("articles").select("id, codigo, nome").order("codigo");
      if (error) throw error;
      return (data ?? []) as Article[];
    },
  });
  const artMap = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);

  const criarPer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mps_periodos" as never).insert(novoPerForm as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Período criado."); setNovoPer(false); qc.invalidateQueries({ queryKey: ["mps_periodos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addPrev = useMutation({
    mutationFn: async () => {
      if (!currentPer || !addLine.article_id) return;
      const { error } = await supabase.from("mps_previsoes" as never).insert({
        periodo_id: currentPer.id, article_id: addLine.article_id,
        quantidade_prevista: addLine.quantidade_prevista, origem: "manual",
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Previsão adicionada."); setAddLine({ article_id: "", quantidade_prevista: 0 }); qc.invalidateQueries({ queryKey: ["mps_previsoes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delPrev = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("mps_previsoes" as never).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mps_previsoes"] }),
  });

  const atualizarFirme = useMutation({
    mutationFn: async () => {
      if (!currentPer) return;
      // Calcula demanda firme somando pedidos confirmados dentro do período
      const inicio = currentPer.periodo;
      const dt = new Date(inicio);
      const fim = currentPer.tipo === "mensal"
        ? new Date(dt.getFullYear(), dt.getMonth() + 1, 0).toISOString().slice(0, 10)
        : new Date(dt.getTime() + 6 * 86400000).toISOString().slice(0, 10);

      const { data: pedidos } = await supabase.from("pedidos").select("id").eq("status", "confirmado").gte("prazo_entrega", inicio).lte("prazo_entrega", fim);
      const pids = (pedidos ?? []).map((p) => p.id);
      if (pids.length === 0) return;
      const { data: itens } = await supabase.from("pedido_itens").select("product_id, quantidade").in("pedido_id", pids);
      const prodIds = [...new Set((itens ?? []).map((i) => i.product_id).filter(Boolean) as string[])];
      const { data: prods } = prodIds.length ? await supabase.from("products").select("id, article_id").in("id", prodIds) : { data: [] as { id: string; article_id: string | null }[] };
      const prodArt = new Map((prods ?? []).map((p) => [p.id, p.article_id]));
      const byArt = new Map<string, number>();
      for (const it of itens ?? []) {
        const artId = it.product_id ? prodArt.get(it.product_id) : null;
        if (!artId) continue;
        byArt.set(artId, (byArt.get(artId) ?? 0) + Number(it.quantidade || 0));
      }
      for (const [article_id, qt] of byArt) {
        // upsert manual: existe?
        const existing = previsoes.find((p) => p.article_id === article_id);
        if (existing) {
          await supabase.from("mps_previsoes" as never).update({ quantidade_firme: qt } as never).eq("id", existing.id);
        } else {
          await supabase.from("mps_previsoes" as never).insert({
            periodo_id: currentPer.id, article_id, quantidade_prevista: 0, quantidade_firme: qt, origem: "pedidos",
          } as never);
        }
      }
    },
    onSuccess: () => { toast.success("Demanda firme recalculada."); qc.invalidateQueries({ queryKey: ["mps_previsoes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6">
      <PageHeader
        title="MPS — Plano Mestre de Produção"
        description="Consolida previsão manual + demanda firme (pedidos) para alimentar o MRP."
        actions={<>
          <Button variant="outline" onClick={() => atualizarFirme.mutate()} disabled={!currentPer || atualizarFirme.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${atualizarFirme.isPending ? "animate-spin" : ""}`} /> Recalcular firme
          </Button>
          <Button onClick={() => setNovoPer(true)}><Plus className="mr-2 h-4 w-4" /> Novo período</Button>
        </>}
      />

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <Label>Período:</Label>
          <Select value={currentPer?.id ?? ""} onValueChange={setSelPer}>
            <SelectTrigger className="w-80"><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.periodo} · {p.tipo} · {p.status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentPer && <Badge variant={currentPer.status === "aberto" ? "default" : "secondary"}>{currentPer.status}</Badge>}
        </div>
      </Card>

      {currentPer && (
        <Card className="p-4 mb-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Artigo</Label>
              <Select value={addLine.article_id} onValueChange={(v) => setAddLine({ ...addLine, article_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o artigo…" /></SelectTrigger>
                <SelectContent>{articles.map((a) => <SelectItem key={a.id} value={a.id}>{a.codigo} — {a.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Previsão (kg)</Label>
              <Input type="number" step="0.001" value={addLine.quantidade_prevista} onChange={(e) => setAddLine({ ...addLine, quantidade_prevista: Number(e.target.value) })} />
            </div>
            <Button onClick={() => addPrev.mutate()} disabled={addPrev.isPending || !addLine.article_id}>
              {addPrev.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Adicionar
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Artigo</TableHead><TableHead className="text-right">Previsto (kg)</TableHead>
            <TableHead className="text-right">Firme (kg)</TableHead><TableHead className="text-right">Total (kg)</TableHead>
            <TableHead>Origem</TableHead><TableHead className="w-24" />
          </TableRow></TableHeader>
          <TableBody>
            {loadingPrev && <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>}
            {!loadingPrev && previsoes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sem previsões neste período.</TableCell></TableRow>}
            {previsoes.map((p) => {
              const art = artMap.get(p.article_id);
              const total = Number(p.quantidade_prevista) + Number(p.quantidade_firme);
              return (
                <TableRow key={p.id}>
                  <TableCell><div className="font-medium">{art?.codigo ?? "?"}</div><div className="text-xs text-muted-foreground">{art?.nome ?? ""}</div></TableCell>
                  <TableCell className="text-right">{Number(p.quantidade_prevista).toFixed(3)}</TableCell>
                  <TableCell className="text-right">{Number(p.quantidade_firme).toFixed(3)}</TableCell>
                  <TableCell className="text-right font-medium">{total.toFixed(3)}</TableCell>
                  <TableCell><Badge variant="outline">{p.origem}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => delPrev.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={novoPer} onOpenChange={setNovoPer}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo período MPS</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Data-base</Label><Input type="date" value={novoPerForm.periodo} onChange={(e) => setNovoPerForm({ ...novoPerForm, periodo: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={novoPerForm.tipo} onValueChange={(v) => setNovoPerForm({ ...novoPerForm, tipo: v as "mensal" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="mensal">Mensal</SelectItem><SelectItem value="semanal">Semanal</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoPer(false)}>Cancelar</Button>
            <Button onClick={() => criarPer.mutate()} disabled={criarPer.isPending}>{criarPer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}