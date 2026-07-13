import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/maquina-turnos")({
  ssr: false,
  component: MaquinaTurnosPage,
});

type Maquina = { id: string; numero: number; maquina: string; tipo: string; habilitado: boolean };
type Turno = { id: string; nome: string; hora_inicio: string; hora_fim: string; ativo: boolean };
type Link = { maquina_id: string; turno_id: string };

function MaquinaTurnosPage() {
  const qc = useQueryClient();

  const maquinas = useQuery({
    queryKey: ["maquinas-ativas"],
    queryFn: async (): Promise<Maquina[]> => {
      const { data, error } = await supabase.from("maquinas" as never).select("id, numero, maquina, tipo, habilitado").eq("habilitado", true).order("numero");
      if (error) throw error;
      return (data ?? []) as unknown as Maquina[];
    },
  });

  const turnos = useQuery({
    queryKey: ["turnos-ativos"],
    queryFn: async (): Promise<Turno[]> => {
      const { data, error } = await supabase.from("turnos" as never).select("id, nome, hora_inicio, hora_fim, ativo").eq("ativo", true).order("hora_inicio");
      if (error) throw error;
      return (data ?? []) as unknown as Turno[];
    },
  });

  const links = useQuery({
    queryKey: ["maquina-turnos"],
    queryFn: async (): Promise<Link[]> => {
      const { data, error } = await supabase.from("maquina_turnos" as never).select("maquina_id, turno_id");
      if (error) throw error;
      return (data ?? []) as unknown as Link[];
    },
  });

  const linkSet = useMemo(() => new Set((links.data ?? []).map((l) => `${l.maquina_id}:${l.turno_id}`)), [links.data]);

  const toggle = useMutation({
    mutationFn: async ({ maquina_id, turno_id, on }: { maquina_id: string; turno_id: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("maquina_turnos" as never).insert({ maquina_id, turno_id } as never);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("maquina_turnos" as never).delete().eq("maquina_id", maquina_id).eq("turno_id", turno_id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maquina-turnos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const loading = maquinas.isLoading || turnos.isLoading || links.isLoading;

  return (
    <div className="p-6">
      <PageHeader
        title="Máquina × Turno"
        description="Defina em quais turnos cada máquina opera. Base para o cálculo de capacidade e Gantt do PCP."
      />

      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (turnos.data?.length ?? 0) === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Cadastre turnos antes.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 sticky left-0 bg-muted">Máquina</th>
                {turnos.data!.map((t) => (
                  <th key={t.id} className="p-3 text-center">
                    <div className="font-medium">{t.nome}</div>
                    <div className="text-xs text-muted-foreground">{t.hora_inicio?.slice(0, 5)}–{t.hora_fim?.slice(0, 5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {maquinas.data!.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3 sticky left-0 bg-background">
                    <div className="font-medium">#{m.numero} — {m.maquina}</div>
                    <div className="text-xs text-muted-foreground">{m.tipo}</div>
                  </td>
                  {turnos.data!.map((t) => {
                    const on = linkSet.has(`${m.id}:${t.id}`);
                    return (
                      <td key={t.id} className="p-3 text-center">
                        <Checkbox
                          checked={on}
                          onCheckedChange={(v) => toggle.mutate({ maquina_id: m.id, turno_id: t.id, on: Boolean(v) })}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
