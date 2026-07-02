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
import { StatCard } from "@/components/stat-card";
import { Plus, Loader2, BadgeCheck, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/qualidade")({ component: QualidadePage });

type Insp = {
  id: string; numero: number; tipo: string; lote: string | null;
  quantidade_inspecionada: number; quantidade_aprovada: number; quantidade_rejeitada: number;
  defeito: string | null; acao_corretiva: string | null; resultado: string;
  data_inspecao: string; product_id: string | null;
};

const resColor: Record<string, string> = {
  pendente: "bg-muted",
  aprovado: "bg-success/15 text-success",
  reprovado: "bg-destructive/15 text-destructive",
  parcial: "bg-warning/15 text-warning",
};

function QualidadePage() {
  const [rows, setRows] = useState<Insp[]>([]);
  const [products, setProducts] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tipo: "producao", product_id: "", lote: "",
    quantidade_inspecionada: "", quantidade_aprovada: "", quantidade_rejeitada: "",
    defeito: "", acao_corretiva: "", resultado: "pendente",
    data_inspecao: new Date().toISOString().slice(0, 10), observacoes: "",
  });

  const load = async () => {
    setLoading(true);
    const [q, p] = await Promise.all([
      supabase.from("quality_inspections").select("*").order("numero", { ascending: false }),
      supabase.from("products").select("id, nome").order("nome"),
    ]);
    if (q.error) toast.error(q.error.message); else setRows((q.data ?? []) as any);
    if (!p.error) setProducts((p.data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => {
    const total = rows.reduce((a, r) => a + Number(r.quantidade_inspecionada || 0), 0);
    const apr = rows.reduce((a, r) => a + Number(r.quantidade_aprovada || 0), 0);
    const rej = rows.reduce((a, r) => a + Number(r.quantidade_rejeitada || 0), 0);
    const ftq = total > 0 ? (apr / total) * 100 : 0;
    const ppm = total > 0 ? (rej / total) * 1_000_000 : 0;
    return { total, apr, rej, ftq, ppm };
  }, [rows]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const next = (rows[0]?.numero ?? 0) + 1;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("quality_inspections").insert({
      numero: next, tipo: form.tipo,
      product_id: form.product_id || null, lote: form.lote || null,
      quantidade_inspecionada: Number(form.quantidade_inspecionada || 0),
      quantidade_aprovada: Number(form.quantidade_aprovada || 0),
      quantidade_rejeitada: Number(form.quantidade_rejeitada || 0),
      defeito: form.defeito || null, acao_corretiva: form.acao_corretiva || null,
      resultado: form.resultado, data_inspecao: form.data_inspecao,
      inspetor_id: u.user?.id ?? null, observacoes: form.observacoes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Inspeção registrada"); setOpen(false);
    setForm({ tipo: "producao", product_id: "", lote: "", quantidade_inspecionada: "", quantidade_aprovada: "", quantidade_rejeitada: "", defeito: "", acao_corretiva: "", resultado: "pendente", data_inspecao: new Date().toISOString().slice(0, 10), observacoes: "" });
    load();
  };

  const prodNome = (id: string | null) => id ? (products.find((p) => p.id === id)?.nome ?? "—") : "—";

  const cols: Column<Insp>[] = [
    { key: "numero", header: "#", render: (r) => <span className="font-mono">#{r.numero}</span> },
    { key: "data_inspecao", header: "Data", render: (r) => new Date(r.data_inspecao).toLocaleDateString("pt-BR") },
    { key: "tipo", header: "Tipo", render: (r) => <Badge variant="secondary">{r.tipo}</Badge> },
    { key: "product_id", header: "Produto", render: (r) => prodNome(r.product_id) },
    { key: "lote", header: "Lote", render: (r) => r.lote ?? "—" },
    { key: "quantidade_inspecionada", header: "Insp.", className: "text-right tabular-nums", render: (r) => Number(r.quantidade_inspecionada).toLocaleString("pt-BR") },
    { key: "quantidade_aprovada", header: "Aprov.", className: "text-right tabular-nums", render: (r) => Number(r.quantidade_aprovada).toLocaleString("pt-BR") },
    { key: "quantidade_rejeitada", header: "Rejeit.", className: "text-right tabular-nums", render: (r) => Number(r.quantidade_rejeitada).toLocaleString("pt-BR") },
    { key: "defeito", header: "Defeito", render: (r) => r.defeito ?? "—" },
    { key: "resultado", header: "Resultado", render: (r) => <Badge className={resColor[r.resultado] ?? "bg-muted"}>{r.resultado}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualidade"
        description="Inspeções, aprovação/rejeição de lotes, defeitos e indicadores (FTQ, PPM)."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova inspeção</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nova inspeção</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recebimento">Recebimento</SelectItem>
                      <SelectItem value="processo">Processo</SelectItem>
                      <SelectItem value="producao">Produção</SelectItem>
                      <SelectItem value="final">Final / Expedição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.data_inspecao} onChange={(e) => setForm({ ...form, data_inspecao: e.target.value })} /></div>
                <div className="space-y-2"><Label>Produto</Label>
                  <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Lote</Label><Input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} /></div>
                <div className="space-y-2"><Label>Qtd. inspecionada *</Label><Input required type="number" step="0.01" value={form.quantidade_inspecionada} onChange={(e) => setForm({ ...form, quantidade_inspecionada: e.target.value })} /></div>
                <div className="space-y-2"><Label>Qtd. aprovada</Label><Input type="number" step="0.01" value={form.quantidade_aprovada} onChange={(e) => setForm({ ...form, quantidade_aprovada: e.target.value })} /></div>
                <div className="space-y-2"><Label>Qtd. rejeitada</Label><Input type="number" step="0.01" value={form.quantidade_rejeitada} onChange={(e) => setForm({ ...form, quantidade_rejeitada: e.target.value })} /></div>
                <div className="space-y-2"><Label>Resultado</Label>
                  <Select value={form.resultado} onValueChange={(v) => setForm({ ...form, resultado: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="parcial">Parcial</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2"><Label>Defeito / não conformidade</Label><Textarea rows={2} value={form.defeito} onChange={(e) => setForm({ ...form, defeito: e.target.value })} /></div>
                <div className="col-span-2 space-y-2"><Label>Ação corretiva</Label><Textarea rows={2} value={form.acao_corretiva} onChange={(e) => setForm({ ...form, acao_corretiva: e.target.value })} /></div>
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

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Inspecionado" value={kpis.total.toLocaleString("pt-BR")} icon={<BadgeCheck className="h-4 w-4" />} />
            <StatCard title="Aprovado" value={kpis.apr.toLocaleString("pt-BR")} icon={<CheckCircle2 className="h-4 w-4" />} />
            <StatCard title="Rejeitado" value={kpis.rej.toLocaleString("pt-BR")} icon={<XCircle className="h-4 w-4" />} />
            <StatCard title="FTQ / PPM" value={`${kpis.ftq.toFixed(1)}%`} description={`${Math.round(kpis.ppm).toLocaleString("pt-BR")} PPM`} icon={<AlertTriangle className="h-4 w-4" />} />
          </div>
          {rows.length === 0
            ? <EmptyState icon={<BadgeCheck className="h-5 w-5" />} title="Nenhuma inspeção registrada" description="Clique em “Nova inspeção” para começar." />
            : <DataTable data={rows} columns={cols} searchKeys={["tipo","lote","defeito","resultado"]} />}
        </>
      )}
    </div>
  );
}
