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
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/calendario")({
  ssr: false,
  component: CalendarioPage,
});

type Evento = {
  id: string;
  data: string; // YYYY-MM-DD
  tipo: "util" | "feriado" | "manutencao" | "parada";
  observacao: string | null;
};

const TIPO_LABEL: Record<Evento["tipo"], string> = {
  util: "Dia útil",
  feriado: "Feriado",
  manutencao: "Manutenção",
  parada: "Parada",
};

const TIPO_COLOR: Record<Evento["tipo"], string> = {
  util: "bg-background",
  feriado: "bg-destructive/20 text-destructive",
  manutencao: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  parada: "bg-muted text-muted-foreground",
};

function CalendarioPage() {
  const qc = useQueryClient();
  const [ref, setRef] = useState(() => new Date());
  const [dlg, setDlg] = useState<{ open: boolean; data: string; ev?: Evento }>({ open: false, data: "" });
  const [tipo, setTipo] = useState<Evento["tipo"]>("feriado");
  const [obs, setObs] = useState("");

  const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const startISO = monthStart.toISOString().slice(0, 10);
  const endISO = monthEnd.toISOString().slice(0, 10);

  const { data = [], isLoading } = useQuery({
    queryKey: ["calendario", startISO, endISO],
    queryFn: async (): Promise<Evento[]> => {
      const { data, error } = await supabase
        .from("calendario_produtivo" as never)
        .select("id, data, tipo, observacao")
        .gte("data", startISO)
        .lte("data", endISO);
      if (error) throw error;
      return (data ?? []) as unknown as Evento[];
    },
  });

  const byDate = useMemo(() => {
    const m = new Map<string, Evento>();
    for (const e of data) m.set(e.data, e);
    return m;
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = { data: dlg.data, tipo, observacao: obs || null };
      if (dlg.ev) {
        const { error } = await supabase.from("calendario_produtivo" as never).update(payload as never).eq("id", dlg.ev.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("calendario_produtivo" as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Salvo.");
      setDlg({ open: false, data: "" });
      qc.invalidateQueries({ queryKey: ["calendario"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendario_produtivo" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido.");
      setDlg({ open: false, data: "" });
      qc.invalidateQueries({ queryKey: ["calendario"] });
    },
  });

  // Grid do mês (semana começa domingo)
  const days: (Date | null)[] = [];
  const firstWeekday = monthStart.getDay();
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= monthEnd.getDate(); d++) days.push(new Date(ref.getFullYear(), ref.getMonth(), d));

  const openDia = (d: Date) => {
    const iso = d.toISOString().slice(0, 10);
    const ev = byDate.get(iso);
    setTipo(ev?.tipo ?? "feriado");
    setObs(ev?.observacao ?? "");
    setDlg({ open: true, data: iso, ev });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Calendário Produtivo"
        description="Marque feriados, paradas e manutenções. Dias sem marcação são considerados úteis."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="min-w-[160px] text-center font-medium">
              {ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </div>
            <Button variant="outline" size="icon" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={() => setRef(new Date())}>Hoje</Button>
          </div>
        }
      />

      <Card className="p-4">
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
        <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground mb-1">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <div key={d} className="text-center p-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = d.toISOString().slice(0, 10);
            const ev = byDate.get(iso);
            return (
              <button
                key={i}
                onClick={() => openDia(d)}
                className={`aspect-square border rounded p-2 text-left text-sm hover:bg-accent transition ${ev ? TIPO_COLOR[ev.tipo] : ""}`}
              >
                <div className="font-medium">{d.getDate()}</div>
                {ev && <div className="text-[10px] mt-1 leading-tight">{TIPO_LABEL[ev.tipo]}</div>}
              </button>
            );
          })}
        </div>
      </Card>

      <Dialog open={dlg.open} onOpenChange={(o) => setDlg((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{new Date(dlg.data + "T12:00").toLocaleDateString("pt-BR")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as Evento["tipo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observação</Label>
              <Input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {dlg.ev && (
              <Button variant="destructive" onClick={() => delMut.mutate(dlg.ev!.id)}>Remover</Button>
            )}
            <Button variant="outline" onClick={() => setDlg({ open: false, data: "" })}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
