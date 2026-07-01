import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clientes")({ component: ClientesPage });

type Customer = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  segmento: string | null;
  cidade: string | null;
  uf: string | null;
  email: string | null;
  telefone: string | null;
  limite_credito: number | null;
  status: string;
};

const fmtBRL = (v: number | null) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

const columns: Column<Customer>[] = [
  { key: "razao_social", header: "Razão Social / Fantasia", sortable: true, render: (r) => (
    <div>
      <p className="font-medium">{r.razao_social}</p>
      <p className="text-xs text-muted-foreground">{r.nome_fantasia ?? r.cnpj ?? ""}</p>
    </div>
  )},
  { key: "cnpj", header: "CNPJ", className: "font-mono text-xs" },
  { key: "cidade", header: "Cidade", render: (r) => r.cidade ? `${r.cidade}/${r.uf ?? ""}` : "—" },
  { key: "segmento", header: "Segmento", sortable: true },
  { key: "telefone", header: "Telefone" },
  { key: "limite_credito", header: "Limite", className: "text-right", render: (r) => fmtBRL(r.limite_credito) },
  { key: "status", header: "Status", render: (r) => (
    <Badge className={r.status === "ativo"
      ? "bg-success/15 text-success hover:bg-success/20"
      : "bg-muted text-muted-foreground"}>{r.status}</Badge>
  )},
];

function ClientesPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ razao_social: "", nome_fantasia: "", cnpj: "", segmento: "", email: "", telefone: "", cidade: "", uf: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*").order("razao_social");
    if (error) toast.error(error.message); else setRows((data ?? []) as Customer[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("customers").insert({
      ...form,
      cnpj: form.cnpj || null,
      owner_id: u.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cliente cadastrado");
    setOpen(false);
    setForm({ razao_social: "", nome_fantasia: "", cnpj: "", segmento: "", email: "", telefone: "", cidade: "", uf: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro completo de clientes PF/PJ com múltiplos contatos, endereços e histórico comercial."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Novo cliente</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Razão social *</Label>
                  <Input required value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
                </div>
                <div className="space-y-2"><Label>Nome fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /></div>
                <div className="space-y-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
                <div className="space-y-2"><Label>Segmento</Label><Input placeholder="Confecção, Estamparia…" value={form.segmento} onChange={(e) => setForm({ ...form, segmento: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
                <div className="space-y-2 col-span-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
                <div className="space-y-2"><Label>UF</Label><Input maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} /></div>
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {loading
        ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : <DataTable data={rows} columns={columns} searchKeys={["razao_social","nome_fantasia","cnpj","cidade","segmento"]} />
      }
    </div>
  );
}
