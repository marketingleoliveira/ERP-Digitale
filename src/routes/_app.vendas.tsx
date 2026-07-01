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
import { Plus, Loader2, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/vendas")({ component: VendasPage });

type Order = {
  id: string; numero: number; data_emissao: string; data_entrega: string | null;
  valor_total: number; status: string;
  customer: { razao_social: string } | null;
  sales_rep: { nome: string } | null;
};
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const statusColors: Record<string, string> = {
  orcamento: "bg-muted", pendente: "bg-info/15 text-info", aprovado: "bg-warning/15 text-warning",
  faturado: "bg-success/15 text-success", cancelado: "bg-destructive/15 text-destructive",
};

function VendasPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<{ id: string; razao_social: string }[]>([]);
  const [reps, setReps] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_id: "", sales_rep_id: "", data_entrega: "", valor_total: "", status: "orcamento", observacoes: "" });

  const load = async () => {
    setLoading(true);
    const [o, c, r] = await Promise.all([
      supabase.from("sales_orders").select("id, numero, data_emissao, data_entrega, valor_total, status, customer:customers(razao_social), sales_rep:sales_reps(nome)").order("created_at", { ascending: false }),
      supabase.from("customers").select("id, razao_social").eq("status", "ativo").order("razao_social"),
      supabase.from("sales_reps").select("id, nome").eq("ativo", true).order("nome"),
    ]);
    if (o.error) toast.error(o.error.message);
    setRows((o.data ?? []) as any);
    setCustomers((c.data ?? []) as any);
    setReps((r.data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) { toast.error("Selecione um cliente"); return; }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("sales_orders").insert({
      customer_id: form.customer_id,
      sales_rep_id: form.sales_rep_id || null,
      data_entrega: form.data_entrega || null,
      valor_total: form.valor_total ? Number(form.valor_total) : 0,
      status: form.status, observacoes: form.observacoes || null, owner_id: u.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido criado");
    setOpen(false);
    setForm({ customer_id: "", sales_rep_id: "", data_entrega: "", valor_total: "", status: "orcamento", observacoes: "" });
    load();
  };

  const cols: Column<Order>[] = [
    { key: "numero", header: "Nº", className: "font-mono text-xs", render: (r) => `#${String(r.numero).padStart(5, "0")}` },
    { key: "customer", header: "Cliente", sortable: true, render: (r) => <div><p className="font-medium">{r.customer?.razao_social ?? "—"}</p><p className="text-xs text-muted-foreground">{r.sales_rep?.nome ?? "Sem representante"}</p></div> },
    { key: "data_emissao", header: "Emissão", render: (r) => new Date(r.data_emissao).toLocaleDateString("pt-BR") },
    { key: "data_entrega", header: "Entrega", render: (r) => r.data_entrega ? new Date(r.data_entrega).toLocaleDateString("pt-BR") : "—" },
    { key: "valor_total", header: "Total", className: "text-right tabular-nums", render: (r) => fmt(Number(r.valor_total)) },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColors[r.status] ?? "bg-muted"}>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Orçamentos, pedidos, aprovação, faturamento e expedição."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Novo pedido</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo pedido de venda</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2"><Label>Cliente *</Label>
                  <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Representante</Label>
                  <Select value={form.sales_rep_id} onValueChange={(v) => setForm({ ...form, sales_rep_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>{reps.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Data de entrega</Label><Input type="date" value={form.data_entrega} onChange={(e) => setForm({ ...form, data_entrega: e.target.value })} /></div>
                <div className="space-y-2"><Label>Valor total</Label><Input type="number" step="0.01" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} /></div>
                <div className="space-y-2"><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orcamento">Orçamento</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="faturado">Faturado</SelectItem>
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
        : rows.length === 0 ? <EmptyState icon={<Receipt className="h-5 w-5" />} title="Nenhum pedido de venda" description="Clique em “Novo pedido” para começar." />
        : <DataTable data={rows} columns={cols} searchKeys={["status"]} />}
    </div>
  );
}
