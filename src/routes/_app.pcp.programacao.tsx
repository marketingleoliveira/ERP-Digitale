import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/programacao")({ ssr: false, component: ProgramacaoPage });

type Slot = {
  id: string; op_id: string; op_item_id: string | null; maquina_id: string;
  inicio_previsto: string; fim_previsto: string; sequencia: number;
  status: "planejado" | "em_execucao" | "concluido" | "cancelado";
};
type OP = { id: string; numero: number; status: string; prioridade: number; maquina_id: string | null; data_prevista: string | null };
type Maq = { id: string; maquina: string };

const STATUS_COLOR: Record<Slot["status"], string> = {
  planejado: "bg-blue-500", em_execucao: "bg-amber-500", concluido: "bg-emerald-500", cancelado: "bg-muted-foreground",
};

function ProgramacaoPage() {
  const qc = useQueryClient();
  const [rangeStart, setRangeStart] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dias, setDias] = useState(7);
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState({
    op_id: "", maquina_id: "", inicio_previsto: "", fim_previsto: "", sequencia: 1,
  });

  const start = useMemo(() => new Date(rangeStart + "T00:00:00"), [rangeStart]);
  const end = useMemo(() => new Date(start.getTime() + dias * 86400000), [start, dias]);

  const { data: maquinas = [] } = useQuery({
    queryKey: ["maquinas-min"],
    queryFn: async (): Promise<Maq[]> => {
      const { data, error } = await supabase.from("maquinas").select("id, maquina").eq("habilitado", true).order("maquina");
      if (error) throw error;
      return (data ?? []) as Maq[];
    },
  });
  const { data: ops = [] } = useQuery({
    queryKey: ["ops-programaveis"],
    queryFn: async (): Promise<OP[]> => {
      const { data, error } = await supabase.from("ordens_producao").select("id, numero, status, prioridade, maquina_id, data_prevista").in("status", ["planejada", "em_execucao"]).order("prioridade");
      if (error) throw error;
      return (data ?? []) as OP[];
    },
  });
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["prog_slots", rangeStart, dias],
    queryFn: async (): Promise<Slot[]> => {
      const { data, error } = await supabase.from("programacao_slots" as never)
        .select("*").gte("fim_previsto", start.toISOString()).lte("inicio_previsto", end.toISOString())
        .order("inicio_previsto");
      if (error) throw error;
      return (data ?? []) as unknown as Slot[];
    },
  });
  const opMap = useMemo(() => new Map(ops.map((o) => [o.id, o])), [ops]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("programacao_slots" as never).insert({
        op_id: form.op_id, maquina_id: form.maquina_id,
        inicio_previsto: form.inicio_previsto, fim_previsto: form.fim_previsto,
        sequencia: form.sequencia, status: "planejado",
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Slot agendado."); setDlg(false); qc.invalidateQueries({ queryKey: ["prog_slots"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("programacao_slots" as never).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prog_slots"] }),
  });

  const totalMs = end.getTime() - start.getTime();
  const posPct = (iso: string) => Math.max(0, Math.min(100, ((new Date(iso).getTime() - start.getTime()) / totalMs) * 100));
  const widthPct = (a: string, b: string) => Math.max(0.5, Math.min(100, ((new Date(b).getTime() - new Date(a).getTime()) / totalMs) * 100));

  return (
    <div className="p-6">
      <PageHeader
        title="Programação Fina — Gantt por Máquina"
        description="Sequencie OPs em janelas de tempo por recurso. Conflitos e sobrecarga visuais."
        actions={<Button onClick={() => { setForm({ op_id: "", maquina_id: "", inicio_previsto: start.toISOString().slice(0, 16), fim_previsto: new Date(start.getTime() + 3600000).toISOString().slice(0, 16), sequencia: 1 }); setDlg(true); }}><Plus className="mr-2 h-4 w-4" /> Agendar OP</Button>}
      />

      <Card className="p-4 mb-4 flex gap-3 items-end">
        <div><Label>Início</Label><Input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} /></div>
        <div><Label>Dias</Label><Input type="number" min={1} max={30} className="w-24" value={dias} onChange={(e) => setDias(Number(e.target.value))} /></div>
        <div className="ml-auto flex gap-3 text-xs">
          {(["planejado", "em_execucao", "concluido"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1"><span className={`inline-block w-3 h-3 rounded ${STATUS_COLOR[s]}`} />{s}</span>
          ))}
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
        {isLoading && <div className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>}
        {!isLoading && (
          <div className="min-w-[900px]">
            <div className="flex text-xs text-muted-foreground border-b pb-1 mb-2">
              <div className="w-48 shrink-0">Máquina</div>
              <div className="flex-1 flex">
                {Array.from({ length: dias }).map((_, i) => (
                  <div key={i} className="flex-1 border-l pl-1">{new Date(start.getTime() + i * 86400000).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</div>
                ))}
              </div>
            </div>
            {maquinas.map((m) => {
              const linha = slots.filter((s) => s.maquina_id === m.id);
              return (
                <div key={m.id} className="flex items-center border-b py-2 min-h-[42px]">
                  <div className="w-48 shrink-0 text-sm font-medium truncate">{m.maquina}</div>
                  <div className="flex-1 relative h-8 bg-muted/30 rounded">
                    {linha.map((s) => {
                      const op = opMap.get(s.op_id);
                      return (
                        <div key={s.id}
                          className={`absolute top-0 h-8 rounded text-xs text-white px-1 flex items-center overflow-hidden cursor-pointer ${STATUS_COLOR[s.status]}`}
                          style={{ left: `${posPct(s.inicio_previsto)}%`, width: `${widthPct(s.inicio_previsto, s.fim_previsto)}%` }}
                          title={`OP #${op?.numero ?? "?"} · ${new Date(s.inicio_previsto).toLocaleString("pt-BR")} → ${new Date(s.fim_previsto).toLocaleString("pt-BR")}`}
                          onDoubleClick={() => { if (confirm("Remover slot?")) delMut.mutate(s.id); }}
                        >
                          OP#{op?.numero ?? "?"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {maquinas.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma máquina ativa.</div>}
          </div>
        )}
      </Card>

      <Card className="mt-4 p-3 text-xs text-muted-foreground">
        Dica: clique duas vezes em um slot para removê-lo. Sequência ordena OPs concorrentes.
      </Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agendar OP na máquina</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>OP</Label>
              <Select value={form.op_id} onValueChange={(v) => setForm({ ...form, op_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione OP…" /></SelectTrigger>
                <SelectContent>{ops.map((o) => <SelectItem key={o.id} value={o.id}>#{o.numero} · prio {o.prioridade} · {o.status}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Máquina</Label>
              <Select value={form.maquina_id} onValueChange={(v) => setForm({ ...form, maquina_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione máquina…" /></SelectTrigger>
                <SelectContent>{maquinas.map((m) => <SelectItem key={m.id} value={m.id}>{m.maquina}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="datetime-local" value={form.inicio_previsto} onChange={(e) => setForm({ ...form, inicio_previsto: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={form.fim_previsto} onChange={(e) => setForm({ ...form, fim_previsto: e.target.value })} /></div>
            </div>
            <div><Label>Sequência</Label><Input type="number" value={form.sequencia} onChange={(e) => setForm({ ...form, sequencia: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.op_id || !form.maquina_id || !form.inicio_previsto || !form.fim_previsto}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}