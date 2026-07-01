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
import { Plus, Loader2, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/compras")({ component: ComprasPage });

type PO = {
  id: string; numero: number; descricao: string;
  data_emissao: string; data_prevista: string | null;
  valor_total: number; status: string;
  supplier: { razao_social: string } | null;
};
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const statusColors: Record<string, string> = {
  aberto: "bg-info/15 text-info", aprovado: "bg-warning/15 text-warning",
  recebido: "bg-success/15 text-success", cancelado: "bg-destructive/15 text-destructive",
};

function ComprasPage() {
  const [rows, setRows] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; razao_social: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplier_id: "", descricao: "", data_prevista: "", valor_total: "", status: "aberto", observacoes: "" });

  const load = async () => {
    setLoading(true);
    const [p, s] = await Promise.all([
      supabase.from("purchase_orders").select("id, numero, descricao, data_emissao, data_prevista, valor_total, status, supplier:suppliers(razao_social)").order("created_at", { ascending: false }),
      supabase.from("suppliers").select("id, razao_social").order("razao_social"),
    ]);
    if (p.error) toast.error(p.error.message);
    setRows((p.data ?? []) as any);
    setSuppliers((s.data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("purchase_orders").insert({
      supplier_id: form.supplier_id || null, descricao: form.descricao,
      data_prevista: form.data_prevista || null,
      valor_total: form.valor_total ? Number(form.valor_total) : 0,
      status: form.status, observacoes: form.observacoes || null, owner_id: u.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido de compra criado");
    setOpen(false);
    setForm({ supplier_id: "", descricao: "", data_prevista: "", valor_total: "", status: "aberto", observacoes: "" });
    load();
  };

  const cols: Column<PO>[] = [
    { key: "numero", header: "Nº", className: "font-mono text-xs", render: (r) => `#${String(r.numero).padStart(5, "0")}` },
    { key: "descricao", header: "Descrição", sortable: true, render: (r) => <div><p className="font-medium">{r.descricao}</p><p className="text-xs text-muted-foreground">{r.supplier?.razao_social ?? "—"}</p></div> },
    { key: "data_emissao", header: "Emissão", render: (r) => new Date(r.data_emissao).toLocaleDateString("pt-BR") },
    { key: "data_prevista", header: "Prevista", render: (r) => r.data_prevista ? new Date(r.data_prevista).toLocaleDateString("pt-BR") : "—" },
    { key: "valor_total", header: "Total", className: "text-right tabular-nums", render: (r) => fmt(Number(r.valor_total)) },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColors[r.status] ?? "bg-muted"}>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras"
        description="Pedidos de compra, fornecedores, recebimento e integração com estoque e financeiro."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Novo pedido</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo pedido de compra</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2"><Label>Fornecedor</Label>
                  <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.razao_social}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2"><Label>Descrição *</Label><Input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="space-y-2"><Label>Data prevista</Label><Input type="date" value={form.data_prevista} onChange={(e) => setForm({ ...form, data_prevista: e.target.value })} /></div>
                <div className="space-y-2"><Label>Valor total</Label><Input type="number" step="0.01" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} /></div>
                <div className="space-y-2"><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="recebido">Recebido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2"><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : rows.length === 0 ? <EmptyState icon={<ShoppingCart className="h-5 w-5" />} title="Nenhum pedido de compra" description="Clique em “Novo pedido” para começar." />
        : <DataTable data={rows} columns={cols} searchKeys={["descricao","status"]} />}
    </div>
  );
}
