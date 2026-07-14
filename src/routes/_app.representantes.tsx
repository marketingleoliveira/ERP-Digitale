import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { maskPhone } from "@/lib/masks";
import { RecordDetailDialog } from "@/components/record-detail-dialog";

export const Route = createFileRoute("/_app/representantes")({ component: RepresentantesPage });

type Rep = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  regiao: string | null;
  comissao_pct: number | null;
  meta_mensal: number | null;
  ativo: boolean;
};

const fmtBRL = (v: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

const columns: Column<Rep>[] = [
  {
    key: "nome", header: "Representante", sortable: true,
    render: (r) => (
      <div>
        <p className="font-medium">{r.nome}</p>
        <p className="text-xs text-muted-foreground">{r.email ?? "—"}</p>
      </div>
    ),
  },
  { key: "telefone", header: "Telefone" },
  { key: "regiao", header: "Região", sortable: true },
  {
    key: "comissao_pct", header: "Comissão", className: "text-right tabular-nums",
    render: (r) => r.comissao_pct != null ? `${Number(r.comissao_pct).toFixed(2)}%` : "—",
  },
  {
    key: "meta_mensal", header: "Meta mensal", className: "text-right tabular-nums",
    render: (r) => fmtBRL(r.meta_mensal),
  },
  {
    key: "ativo", header: "Status",
    render: (r) => (
      <Badge className={r.ativo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
        {r.ativo ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
];

const emptyForm = { nome: "", email: "", telefone: "", regiao: "", comissao_pct: "", meta_mensal: "" };

function RepresentantesPage() {
  const [rows, setRows] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("sales_reps").select("*").order("nome");
    if (error) toast.error(error.message); else setRows((data ?? []) as Rep[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      email: form.email || null,
      telefone: form.telefone || null,
      regiao: form.regiao || null,
      comissao_pct: form.comissao_pct ? Number(form.comissao_pct) : null,
      meta_mensal: form.meta_mensal ? Number(form.meta_mensal) : null,
      ativo: true,
    };
    const { error } = await supabase.from("sales_reps").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Representante cadastrado");
    setOpen(false);
    setForm(emptyForm);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Representantes Comerciais"
        description="Cadastro de representantes com região, comissão e meta mensal."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1.5" />Novo representante</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo representante</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome completo *</Label>
                  <Input required value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} maxLength={15} inputMode="tel" placeholder="(00) 00000-0000"
                    onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Região</Label>
                  <Input placeholder="Sul, Sudeste, Nordeste…" value={form.regiao}
                    onChange={(e) => setForm({ ...form, regiao: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Comissão (%)</Label>
                  <Input type="number" step="0.01" value={form.comissao_pct}
                    onChange={(e) => setForm({ ...form, comissao_pct: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Meta mensal (R$)</Label>
                  <Input type="number" step="0.01" value={form.meta_mensal}
                    onChange={(e) => setForm({ ...form, meta_mensal: e.target.value })} />
                </div>
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="h-5 w-5" />}
          title="Nenhum representante cadastrado"
          description="Clique em “Novo representante” para começar."
        />
      ) : (
        <DataTable data={rows} columns={columns} searchKeys={["nome", "email", "regiao"]}
          onRowClick={(r) => setSelected(r as unknown as Record<string, unknown>)} />
      )}
      <RecordDetailDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        title={(selected?.nome as string) ?? "Representante"}
        tableName="sales_reps"
        record={selected}
        onSaved={load}
      />
    </div>
  );
}
