import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, X, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_app/pcp/vinculos-artigo")({
  ssr: false,
  head: () => ({ meta: [{ title: "Vínculos Produto → Artigo" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

type SugRow = {
  product_id: string;
  product_codigo: string | null;
  product_nome: string | null;
  article_id_atual: string | null;
  sugestao_por_codigo_id: string | null;
  sugestao_por_codigo: string | null;
  sugestao_por_nome_id: string | null;
  sugestao_por_nome: string | null;
  status: "vinculado" | "sugestao_forte" | "sugestao_fraca" | "sem_sugestao";
};

function Page() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState("");
  const [pendentes, setPendentes] = useState<Record<string, string>>({}); // product_id → article_id

  const { data: sugestoes = [], isLoading } = useQuery({
    queryKey: ["produto-artigo-sug"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_produtos_sugestao_artigo" as never)
        .select("*")
        .order("status", { ascending: true })
        .order("product_codigo");
      if (error) throw error;
      return (data ?? []) as SugRow[];
    },
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["articles-vinculo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("id, codigo, nome").eq("ativo", true).order("codigo");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async ({ productId, articleId }: { productId: string; articleId: string | null }) => {
      const { error } = await supabase.from("products").update({ article_id: articleId } as never).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vínculo salvo.");
      qc.invalidateQueries({ queryKey: ["produto-artigo-sug"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const kpis = useMemo(() => ({
    total: sugestoes.length,
    vinculados: sugestoes.filter(s => s.status === "vinculado").length,
    fortes: sugestoes.filter(s => s.status === "sugestao_forte").length,
    fracas: sugestoes.filter(s => s.status === "sugestao_fraca").length,
    sem: sugestoes.filter(s => s.status === "sem_sugestao").length,
  }), [sugestoes]);

  const rows = sugestoes.filter(s => {
    if (!filtro) return true;
    const f = filtro.toLowerCase();
    return (s.product_codigo ?? "").toLowerCase().includes(f) || (s.product_nome ?? "").toLowerCase().includes(f);
  });

  const aplicarSugestoesFortes = async () => {
    const alvos = sugestoes.filter(s => s.status === "sugestao_forte" && s.sugestao_por_codigo_id);
    if (alvos.length === 0) { toast.info("Nada a aplicar."); return; }
    for (const s of alvos) {
      await save.mutateAsync({ productId: s.product_id, articleId: s.sugestao_por_codigo_id! });
    }
    toast.success(`${alvos.length} vínculos aplicados.`);
  };

  const statusBadge = (s: SugRow["status"]) => {
    if (s === "vinculado") return <Badge className="bg-green-600">Vinculado</Badge>;
    if (s === "sugestao_forte") return <Badge className="bg-blue-600">Sugestão forte</Badge>;
    if (s === "sugestao_fraca") return <Badge className="bg-yellow-500">Ambíguo</Badge>;
    return <Badge variant="destructive">Sem sugestão</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vínculos Produto → Artigo</h1>
        <p className="text-sm text-muted-foreground">
          Revise e confirme correspondências antes de ativar o MRP por ID. Nenhum vínculo é criado automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardHeader><CardTitle className="text-sm">Produtos</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpis.total}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Vinculados</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-green-600">{kpis.vinculados}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Sugestão forte</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-blue-600">{kpis.fortes}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Ambíguos</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-yellow-600">{kpis.fracas}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Sem sugestão</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-destructive">{kpis.sem}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Produtos</CardTitle>
          <div className="flex gap-2">
            <Input placeholder="Filtrar por código/nome…" value={filtro} onChange={e => setFiltro(e.target.value)} className="w-64" />
            <Button variant="secondary" onClick={aplicarSugestoesFortes} disabled={save.isPending || kpis.fortes === 0}>
              <Check className="h-4 w-4 mr-1.5" /> Aplicar {kpis.fortes} sugestões fortes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          {isLoading ? <div className="text-muted-foreground">Carregando…</div> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sugestões</TableHead>
                <TableHead>Artigo vinculado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map(r => {
                  const sel = pendentes[r.product_id] ?? r.article_id_atual ?? "";
                  return (
                    <TableRow key={r.product_id}>
                      <TableCell>
                        <div className="font-medium">{r.product_codigo ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.product_nome ?? "—"}</div>
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs space-y-0.5">
                        {r.sugestao_por_codigo && <div>por código: <b>{r.sugestao_por_codigo}</b></div>}
                        {r.sugestao_por_nome && <div>por nome: <b>{r.sugestao_por_nome}</b></div>}
                        {!r.sugestao_por_codigo && !r.sugestao_por_nome && <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Select value={sel} onValueChange={v => setPendentes({ ...pendentes, [r.product_id]: v })}>
                          <SelectTrigger className="w-64"><SelectValue placeholder="Selecionar artigo…" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {articles.map(a => <SelectItem key={a.id} value={a.id}>{a.codigo} — {a.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" disabled={!sel || sel === r.article_id_atual || save.isPending}
                          onClick={() => save.mutate({ productId: r.product_id, articleId: sel })}>
                          <Check className="h-4 w-4" />
                        </Button>
                        {r.article_id_atual && (
                          <Button size="sm" variant="outline" disabled={save.isPending}
                            onClick={() => { setPendentes({ ...pendentes, [r.product_id]: "" }); save.mutate({ productId: r.product_id, articleId: null }); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum produto.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-600" /> Como funciona</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• <b>Sugestão forte</b>: código e nome do produto batem com o mesmo artigo (case-insensitive).</p>
          <p>• <b>Ambíguo</b>: bate apenas por código ou apenas por nome — requer confirmação manual.</p>
          <p>• <b>Sem sugestão</b>: nenhuma correspondência encontrada — selecione o artigo manualmente.</p>
          <p>• O MRP prioriza <code>products.article_id</code>. Produtos sem artigo caem no matching textual legado (compatibilidade temporária).</p>
        </CardContent>
      </Card>
    </div>
  );
}
