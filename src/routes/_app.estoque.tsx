import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Loader2, Warehouse, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/estoque")({ component: EstoquePage });

type Row = {
  id: string; sku: string; product_nome: string; product_codigo: string;
  cor: string | null; tamanho: string | null; estoque: number; estoque_minimo: number; localizacao: string | null;
};
type Mov = {
  id: string; tipo: string; quantidade: number; documento: string | null;
  origem: string | null; destino: string | null; created_at: string;
  product: { nome: string; codigo: string } | null;
};

function EstoquePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [movs, setMovs] = useState<Mov[]>([]);
  const [products, setProducts] = useState<{ id: string; codigo: string; nome: string }[]>([]);
  const [variants, setVariants] = useState<{ id: string; sku: string; product_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tipo: "entrada", product_id: "", variant_id: "", quantidade: "", documento: "", origem: "", destino: "", observacoes: "" });

  const load = async () => {
    setLoading(true);
    const [v, m, p] = await Promise.all([
      supabase.from("product_variants").select("id, sku, cor, tamanho, estoque, estoque_minimo, localizacao, product_id, products(codigo, nome)").order("sku"),
      supabase.from("stock_movements").select("id, tipo, quantidade, documento, origem, destino, created_at, product:products(nome, codigo)").order("created_at", { ascending: false }).limit(200),
      supabase.from("products").select("id, codigo, nome").eq("ativo", true).order("nome"),
    ]);
    if (v.error) toast.error(v.error.message);
    setRows(((v.data ?? []) as any[]).map((r) => ({ ...r, product_nome: r.products?.nome ?? "—", product_codigo: r.products?.codigo ?? "—" })));
    setMovs((m.data ?? []) as any);
    setProducts((p.data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!form.product_id) { setVariants([]); return; }
    supabase.from("product_variants").select("id, sku, product_id").eq("product_id", form.product_id).then(({ data }) => setVariants((data ?? []) as any));
  }, [form.product_id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const qtd = Number(form.quantidade);
    const { error } = await supabase.from("stock_movements").insert({
      tipo: form.tipo, product_id: form.product_id || null, variant_id: form.variant_id || null,
      quantidade: qtd, documento: form.documento || null, origem: form.origem || null, destino: form.destino || null,
      observacoes: form.observacoes || null, created_by: u.user?.id,
    });
    if (error) { setSaving(false); toast.error(error.message); return; }
    // Update variant stock
    if (form.variant_id) {
      const v = variants.find((x) => x.id === form.variant_id);
      const cur = rows.find((r) => r.id === form.variant_id);
      const delta = form.tipo === "entrada" ? qtd : form.tipo === "saida" ? -qtd : (form.tipo === "ajuste" ? qtd - (cur?.estoque ?? 0) : 0);
      if (v && delta !== 0 && cur) {
        await supabase.from("product_variants").update({ estoque: Math.max(0, cur.estoque + delta) }).eq("id", form.variant_id);
      }
    }
    setSaving(false);
    toast.success("Movimentação registrada");
    setOpen(false);
    setForm({ tipo: "entrada", product_id: "", variant_id: "", quantidade: "", documento: "", origem: "", destino: "", observacoes: "" });
    load();
  };

  const stockCols: Column<Row>[] = [
    { key: "sku", header: "SKU", className: "font-mono text-xs" },
    { key: "product_nome", header: "Produto", sortable: true, render: (r) => <div><p className="font-medium">{r.product_nome}</p><p className="text-xs text-muted-foreground">{r.product_codigo}</p></div> },
    { key: "cor", header: "Cor", render: (r) => r.cor ?? "—" },
    { key: "tamanho", header: "Tam.", render: (r) => r.tamanho ?? "—" },
    { key: "localizacao", header: "Localização", render: (r) => r.localizacao ?? "—" },
    { key: "estoque", header: "Estoque", className: "text-right tabular-nums", sortable: true, render: (r) => (
      <Badge className={r.estoque <= r.estoque_minimo ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}>{r.estoque}</Badge>
    )},
    { key: "estoque_minimo", header: "Mín.", className: "text-right tabular-nums" },
  ];
  const movCols: Column<Mov>[] = [
    { key: "created_at", header: "Data", render: (r) => new Date(r.created_at).toLocaleString("pt-BR") },
    { key: "tipo", header: "Tipo", render: (r) => (
      <Badge className={r.tipo === "entrada" ? "bg-success/15 text-success" : r.tipo === "saida" ? "bg-destructive/15 text-destructive" : "bg-muted"}>
        {r.tipo === "entrada" ? <ArrowDownCircle className="h-3 w-3 mr-1 inline" /> : r.tipo === "saida" ? <ArrowUpCircle className="h-3 w-3 mr-1 inline" /> : null}
        {r.tipo}
      </Badge>
    )},
    { key: "product", header: "Produto", render: (r) => r.product?.nome ?? "—" },
    { key: "quantidade", header: "Qtd.", className: "text-right tabular-nums" },
    { key: "documento", header: "Documento", render: (r) => r.documento ?? "—" },
    { key: "origem", header: "Origem/Destino", render: (r) => r.origem ?? r.destino ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Saldo por SKU, movimentações, entradas, saídas, ajustes e transferências."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova movimentação</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Registrar movimentação de estoque</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Quantidade *</Label><Input required type="number" step="0.01" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} /></div>
                <div className="space-y-2"><Label>Produto</Label>
                  <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v, variant_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.codigo} — {p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>SKU / Variante</Label>
                  <Select value={form.variant_id} onValueChange={(v) => setForm({ ...form, variant_id: v })} disabled={!form.product_id}>
                    <SelectTrigger><SelectValue placeholder={form.product_id ? "Selecione…" : "Escolha um produto"} /></SelectTrigger>
                    <SelectContent>{variants.map((v) => <SelectItem key={v.id} value={v.id}>{v.sku}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Documento</Label><Input placeholder="NF, OP, pedido…" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} /></div>
                <div className="space-y-2"><Label>Origem / Destino</Label><Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} /></div>
                <div className="col-span-2 space-y-2"><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Registrar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="saldos">
          <TabsList><TabsTrigger value="saldos">Saldos</TabsTrigger><TabsTrigger value="movs">Movimentações</TabsTrigger></TabsList>
          <TabsContent value="saldos" className="mt-4">
            {rows.length === 0
              ? <EmptyState icon={<Warehouse className="h-5 w-5" />} title="Nenhum SKU cadastrado" description="Cadastre variantes (SKU) nos produtos para acompanhar saldos." />
              : <DataTable data={rows} columns={stockCols} searchKeys={["sku","product_nome","product_codigo","cor","tamanho","localizacao"]} />}
          </TabsContent>
          <TabsContent value="movs" className="mt-4">
            {movs.length === 0
              ? <EmptyState icon={<Warehouse className="h-5 w-5" />} title="Sem movimentações" description="Registre entradas, saídas ou ajustes." />
              : <DataTable data={movs} columns={movCols} searchKeys={["tipo","documento","origem","destino"]} />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
