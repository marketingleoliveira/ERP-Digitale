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
import { RecordDetailDialog } from "@/components/record-detail-dialog";

export const Route = createFileRoute("/_app/fornecedores")({ component: FornecedoresPage });

type Supplier = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  categoria: string | null;
  contato_principal: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  status: string;
};

const columns: Column<Supplier>[] = [
  { key: "razao_social", header: "Fornecedor", sortable: true, render: (r) => (
    <div><p className="font-medium">{r.razao_social}</p><p className="text-xs text-muted-foreground">{r.nome_fantasia ?? r.cnpj ?? ""}</p></div>
  )},
  { key: "categoria", header: "Categoria", sortable: true, render: (r) => r.categoria ? <Badge variant="outline">{r.categoria}</Badge> : "—" },
  { key: "contato_principal", header: "Contato" },
  { key: "telefone", header: "Telefone" },
  { key: "cidade", header: "Cidade", render: (r) => r.cidade ? `${r.cidade}/${r.uf ?? ""}` : "—" },
  { key: "status", header: "Status", render: (r) => (
    <Badge className={r.status === "ativo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>{r.status}</Badge>
  )},
];

function FornecedoresPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ razao_social: "", nome_fantasia: "", cnpj: "", categoria: "", contato_principal: "", telefone: "", cidade: "", uf: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("razao_social");
    if (error) toast.error(error.message); else setRows((data ?? []) as Supplier[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("suppliers").insert({ ...form, cnpj: form.cnpj || null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Fornecedor cadastrado");
    setOpen(false);
    setForm({ razao_social: "", nome_fantasia: "", cnpj: "", categoria: "", contato_principal: "", telefone: "", cidade: "", uf: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Cadastro de fornecedores com documentação, contatos, categorias e histórico de compras."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Novo fornecedor</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo fornecedor</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2"><Label>Razão social *</Label><Input required value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /></div>
                <div className="space-y-2"><Label>Nome fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /></div>
                <div className="space-y-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
                <div className="space-y-2"><Label>Categoria</Label><Input placeholder="Tecidos, Aviamentos, Tintas…" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></div>
                <div className="space-y-2"><Label>Contato principal</Label><Input value={form.contato_principal} onChange={(e) => setForm({ ...form, contato_principal: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
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
        : <DataTable data={rows} columns={columns} searchKeys={["razao_social","nome_fantasia","cnpj","categoria","cidade"]}
            onRowClick={(r) => setSelected(r as unknown as Record<string, unknown>)} />
      }
      <RecordDetailDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        title={(selected?.razao_social as string) ?? "Fornecedor"}
        tableName="suppliers"
        record={selected}
        onSaved={load}
      />
    </div>
  );
}
