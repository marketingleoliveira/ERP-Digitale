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
import { Plus, Loader2, Handshake } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/crm")({ component: CrmPage });

type Lead = {
  id: string; nome: string; empresa: string | null; email: string | null; telefone: string | null;
  origem: string | null; estagio: string; valor_estimado: number | null; proxima_acao: string | null;
};
const fmt = (v: number | null) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
const stageColors: Record<string, string> = {
  novo: "bg-info/15 text-info", contato: "bg-muted",
  proposta: "bg-warning/15 text-warning", negociacao: "bg-primary/15 text-primary",
  ganho: "bg-success/15 text-success", perdido: "bg-destructive/15 text-destructive",
};

function CrmPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", empresa: "", email: "", telefone: "", origem: "", estagio: "novo", valor_estimado: "", proxima_acao: "", observacoes: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("crm_leads").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("crm_leads").insert({
      nome: form.nome, empresa: form.empresa || null, email: form.email || null, telefone: form.telefone || null,
      origem: form.origem || null, estagio: form.estagio,
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
      proxima_acao: form.proxima_acao || null, observacoes: form.observacoes || null,
      owner_id: u.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead cadastrado");
    setOpen(false);
    setForm({ nome: "", empresa: "", email: "", telefone: "", origem: "", estagio: "novo", valor_estimado: "", proxima_acao: "", observacoes: "" });
    load();
  };

  const cols: Column<Lead>[] = [
    { key: "nome", header: "Contato", sortable: true, render: (r) => <div><p className="font-medium">{r.nome}</p><p className="text-xs text-muted-foreground">{r.empresa ?? r.email ?? "—"}</p></div> },
    { key: "telefone", header: "Telefone", render: (r) => r.telefone ?? "—" },
    { key: "origem", header: "Origem", render: (r) => r.origem ?? "—" },
    { key: "estagio", header: "Estágio", render: (r) => <Badge className={stageColors[r.estagio] ?? "bg-muted"}>{r.estagio}</Badge> },
    { key: "valor_estimado", header: "Valor estim.", className: "text-right tabular-nums", render: (r) => fmt(r.valor_estimado) },
    { key: "proxima_acao", header: "Próxima ação", render: (r) => r.proxima_acao ? new Date(r.proxima_acao).toLocaleDateString("pt-BR") : "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Leads, funil de vendas, propostas, follow-up e agenda comercial."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Novo lead</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo lead</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome *</Label><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="space-y-2"><Label>Empresa</Label><Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Origem</Label><Input placeholder="Indicação, site, feira…" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} /></div>
                <div className="space-y-2"><Label>Estágio</Label>
                  <Select value={form.estagio} onValueChange={(v) => setForm({ ...form, estagio: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="contato">Em contato</SelectItem>
                      <SelectItem value="proposta">Proposta</SelectItem>
                      <SelectItem value="negociacao">Negociação</SelectItem>
                      <SelectItem value="ganho">Ganho</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Valor estimado</Label><Input type="number" step="0.01" value={form.valor_estimado} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} /></div>
                <div className="space-y-2"><Label>Próxima ação</Label><Input type="date" value={form.proxima_acao} onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })} /></div>
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
        : rows.length === 0 ? <EmptyState icon={<Handshake className="h-5 w-5" />} title="Nenhum lead cadastrado" description="Clique em “Novo lead” para começar seu funil." />
        : <DataTable data={rows} columns={cols} searchKeys={["nome","empresa","email","telefone","origem","estagio"]} />}
    </div>
  );
}
