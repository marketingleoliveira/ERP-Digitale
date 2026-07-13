import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/capacidade")({
  ssr: false,
  component: CapacidadePage,
});

type Maquina = { id: string; numero: number; maquina: string; tipo: string; habilitado: boolean };
type Cap = {
  id?: string;
  maquina_id: string;
  kg_por_hora: number;
  horas_por_turno: number;
  turnos_por_dia: number;
  dias_uteis_semana: number;
  eficiencia_alvo_pct: number;
};

const DEFAULT: Omit<Cap, "maquina_id"> = {
  kg_por_hora: 0,
  horas_por_turno: 8,
  turnos_por_dia: 1,
  dias_uteis_semana: 5,
  eficiencia_alvo_pct: 85,
};

function CapacidadePage() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Record<string, Cap>>({});

  const maquinas = useQuery({
    queryKey: ["maquinas-cap"],
    queryFn: async (): Promise<Maquina[]> => {
      const { data, error } = await supabase.from("maquinas" as never).select("id, numero, maquina, tipo, habilitado").eq("habilitado", true).order("numero");
      if (error) throw error;
      return (data ?? []) as unknown as Maquina[];
    },
  });

  const caps = useQuery({
    queryKey: ["capacidade"],
    queryFn: async (): Promise<Cap[]> => {
      const { data, error } = await supabase.from("maquina_capacidade" as never).select("*");
      if (error) throw error;
      return (data ?? []) as unknown as Cap[];
    },
  });

  useEffect(() => {
    if (!maquinas.data || !caps.data) return;
    const map: Record<string, Cap> = {};
    for (const m of maquinas.data) {
      const ex = caps.data.find((c) => c.maquina_id === m.id);
      map[m.id] = ex ?? { maquina_id: m.id, ...DEFAULT };
    }
    setRows(map);
  }, [maquinas.data, caps.data]);

  const upsert = useMutation({
    mutationFn: async (r: Cap) => {
      const { error } = await supabase
        .from("maquina_capacidade" as never)
        .upsert(r as never, { onConflict: "maquina_id" } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Capacidade salva.");
      qc.invalidateQueries({ queryKey: ["capacidade"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upd = (id: string, patch: Partial<Cap>) => setRows((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const loading = maquinas.isLoading || caps.isLoading;
  const total = maquinas.data?.length ?? 0;
  const preenchidas = (caps.data ?? []).filter((c) => c.kg_por_hora > 0).length;

  return (
    <div className="p-6">
      <PageHeader
        title="Capacidade das Máquinas"
        description={`Preenchimento: ${preenchidas}/${total} — necessário para o motor PCP calcular tempos.`}
      />

      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Máquina</TableHead>
                <TableHead>kg/hora</TableHead>
                <TableHead>h/turno</TableHead>
                <TableHead>Turnos/dia</TableHead>
                <TableHead>Dias/semana</TableHead>
                <TableHead>Eficiência alvo %</TableHead>
                <TableHead className="w-24 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maquinas.data!.map((m) => {
                const r = rows[m.id];
                if (!r) return null;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">#{m.numero} — {m.maquina}</div>
                      <div className="text-xs text-muted-foreground">{m.tipo}</div>
                    </TableCell>
                    <TableCell><Input type="number" step="0.01" value={r.kg_por_hora} onChange={(e) => upd(m.id, { kg_por_hora: Number(e.target.value) })} className="w-24" /></TableCell>
                    <TableCell><Input type="number" step="0.5" value={r.horas_por_turno} onChange={(e) => upd(m.id, { horas_por_turno: Number(e.target.value) })} className="w-20" /></TableCell>
                    <TableCell><Input type="number" value={r.turnos_por_dia} onChange={(e) => upd(m.id, { turnos_por_dia: Number(e.target.value) })} className="w-20" /></TableCell>
                    <TableCell><Input type="number" value={r.dias_uteis_semana} onChange={(e) => upd(m.id, { dias_uteis_semana: Number(e.target.value) })} className="w-20" /></TableCell>
                    <TableCell><Input type="number" value={r.eficiencia_alvo_pct} onChange={(e) => upd(m.id, { eficiencia_alvo_pct: Number(e.target.value) })} className="w-20" /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => upsert.mutate(r)} disabled={upsert.isPending}>
                        <Save className="h-3 w-3 mr-1" /> Salvar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
