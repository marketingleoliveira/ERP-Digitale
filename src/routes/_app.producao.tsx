import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Factory, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/producao")({ component: ProducaoPage });

type OP = {
  id: string; numero: number; descricao: string; quantidade: number;
  estagio: string; prioridade: string | null;
  data_inicio: string | null; data_prevista: string | null; data_conclusao: string | null;
  product_id: string | null; observacoes: string | null;
};

const STAGES = [
  { key: "planejado", label: "Planejado" },
  { key: "corte", label: "Corte" },
  { key: "estampa", label: "Estamparia" },
  { key: "costura", label: "Costura" },
  { key: "acabamento", label: "Acabamento" },
  { key: "concluido", label: "Concluído" },
];
const priorityColors: Record<string, string> = {
  baixa: "bg-muted", normal: "bg-info/15 text-info",
  alta: "bg-warning/15 text-warning", urgente: "bg-destructive/15 text-destructive",
};

function ProducaoPage() {
  const [rows, setRows] = useState<OP[]>([]);
  const [products, setProducts] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    descricao: "", quantidade: "", product_id: "", estagio: "planejado", prioridade: "normal",
    data_inicio: "", data_prevista: "", observacoes: "",
  });

  const load = async () => {
    setLoading(true);
    const [op, pr] = await Promise.all([
      supabase.from("production_orders").select("*").order("numero", { ascending: false }),
      supabase.from("products").select("id, nome").order("nome"),
    ]);
    if (op.error) toast.error(op.error.message); else setRows((op.data ?? []) as any);
    if (!pr.error) setProducts((pr.data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const nextNumero = (rows[0]?.numero ?? 0) + 1;
    const { error } = await supabase.from("production_orders").insert({
      numero: nextNumero,
      descricao: form.descricao,
      quantidade: Number(form.quantidade || 0),
      product_id: form.product_id || null,
      estagio: form.estagio,
      prioridade: form.prioridade,
      data_inicio: form.data_inicio || null,
      data_prevista: form.data_prevista || null,
      observacoes: form.observacoes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("OP criada");
    setOpen(false);
    setForm({ descricao: "", quantidade: "", product_id: "", estagio: "planejado", prioridade: "normal", data_inicio: "", data_prevista: "", observacoes: "" });
    load();
  };

  const moveStage = async (op: OP, dir: -1 | 1) => {
    const idx = STAGES.findIndex((s) => s.key === op.estagio);
    const next = STAGES[Math.min(Math.max(idx + dir, 0), STAGES.length - 1)];
    if (next.key === op.estagio) return;
    const patch: any = { estagio: next.key };
    if (next.key === "concluido") patch.data_conclusao = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("production_orders").update(patch).eq("id", op.id);
    if (error) { toast.error(error.message); return; }
    setRows((rs) => rs.map((r) => r.id === op.id ? { ...r, ...patch } : r));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens de Produção (PCP)"
        description="Kanban em tempo real — avance cada OP pelas etapas com um clique."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova OP</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nova ordem de produção</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2"><Label>Descrição *</Label><Input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="space-y-2"><Label>Produto</Label>
                  <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Quantidade *</Label><Input required type="number" step="0.01" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} /></div>
                <div className="space-y-2"><Label>Etapa inicial</Label>
                  <Select value={form.estagio} onValueChange={(v) => setForm({ ...form, estagio: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Início</Label><Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
                <div className="space-y-2"><Label>Previsão</Label><Input type="date" value={form.data_prevista} onChange={(e) => setForm({ ...form, data_prevista: e.target.value })} /></div>
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
        : rows.length === 0 ? <EmptyState icon={<Factory className="h-5 w-5" />} title="Nenhuma ordem de produção" description="Clique em “Nova OP” para lançar a primeira." />
        : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAGES.map((s) => {
              const list = rows.filter((r) => r.estagio === s.key);
              return (
                <div key={s.key} className="bg-muted/40 rounded-lg p-2 min-h-[300px]">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <h3 className="text-sm font-semibold">{s.label}</h3>
                    <Badge variant="secondary">{list.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {list.map((op) => (
                      <Card key={op.id} className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-mono text-muted-foreground">#{op.numero}</span>
                          {op.prioridade && <Badge className={priorityColors[op.prioridade] ?? "bg-muted"}>{op.prioridade}</Badge>}
                        </div>
                        <p className="text-sm font-medium leading-snug">{op.descricao}</p>
                        <p className="text-xs text-muted-foreground">{Number(op.quantidade).toLocaleString("pt-BR")} un</p>
                        {op.data_prevista && <p className="text-xs text-muted-foreground">Previsão: {new Date(op.data_prevista).toLocaleDateString("pt-BR")}</p>}
                        <div className="flex gap-1 pt-1">
                          <Button size="sm" variant="outline" className="h-7 flex-1" onClick={() => moveStage(op, -1)} disabled={op.estagio === STAGES[0].key}><ChevronLeft className="h-3 w-3" /></Button>
                          <Button size="sm" variant="outline" className="h-7 flex-1" onClick={() => moveStage(op, 1)} disabled={op.estagio === STAGES[STAGES.length - 1].key}><ChevronRight className="h-3 w-3" /></Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
