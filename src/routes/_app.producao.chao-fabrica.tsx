import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Square, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/producao/chao-fabrica")({ ssr: false, component: ChaoFabricaPage });

type OP = { id: string; numero: number; status: string; maquina_id: string | null };
type Apont = { id: string; op_id: string; funcionario_id: string | null; maquina_id: string | null; inicio: string; fim: string | null; quantidade_produzida: number; quantidade_refugo: number };
type Motivo = { id: string; codigo: string; descricao: string; categoria: string };
type Func = { id: string; nome: string };
type Maq = { id: string; maquina: string };

function ChaoFabricaPage() {
  const qc = useQueryClient();
  const [selOp, setSelOp] = useState<string>("");
  const [selFunc, setSelFunc] = useState<string>("");
  const [selMaq, setSelMaq] = useState<string>("");
  const [fimDlg, setFimDlg] = useState<Apont | null>(null);
  const [fimForm, setFimForm] = useState({ quantidade_produzida: 0, quantidade_refugo: 0, motivo_refugo: "" });
  const [paradaDlg, setParadaDlg] = useState(false);
  const [paradaForm, setParadaForm] = useState({ op_id: "", maquina_id: "", motivo_id: "", inicio: "", fim: "", observacao: "" });

  const { data: ops = [] } = useQuery({
    queryKey: ["cf-ops"],
    queryFn: async (): Promise<OP[]> => {
      const { data, error } = await supabase.from("ordens_producao").select("id, numero, status, maquina_id").in("status", ["programada", "em_producao"]).order("prioridade");
      if (error) throw error;
      return (data ?? []) as OP[];
    },
  });
  const { data: funcs = [] } = useQuery({
    queryKey: ["cf-funcs"],
    queryFn: async (): Promise<Func[]> => {
      const { data, error } = await supabase.from("funcionarios").select("id, nome").eq("ativo", true).order("nome");
      if (error) throw error;
      return (data ?? []) as Func[];
    },
  });
  const { data: maquinas = [] } = useQuery({
    queryKey: ["cf-maq"],
    queryFn: async (): Promise<Maq[]> => {
      const { data, error } = await supabase.from("maquinas").select("id, maquina").eq("habilitado", true).order("maquina");
      if (error) throw error;
      return (data ?? []) as Maq[];
    },
  });
  const { data: motivos = [] } = useQuery({
    queryKey: ["cf-motivos"],
    queryFn: async (): Promise<Motivo[]> => {
      const { data, error } = await supabase.from("motivos_parada" as never).select("*").eq("ativo", true).order("codigo");
      if (error) throw error;
      return (data ?? []) as unknown as Motivo[];
    },
  });
  const { data: abertos = [], isLoading } = useQuery({
    queryKey: ["cf-abertos"],
    queryFn: async (): Promise<Apont[]> => {
      const { data, error } = await supabase.from("op_apontamentos").select("*").is("fim", null).order("inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Apont[];
    },
  });

  const iniciar = useMutation({
    mutationFn: async () => {
      if (!selOp) throw new Error("Selecione uma OP");
      const { error } = await supabase.from("op_apontamentos").insert({
        op_id: selOp, funcionario_id: selFunc || null, maquina_id: selMaq || null,
        inicio: new Date().toISOString(), quantidade_produzida: 0, quantidade_refugo: 0,
      } as never);
      if (error) throw error;
      // Move OP p/ em_producao se estiver programada
      await supabase.from("ordens_producao").update({ status: "em_producao" as never }).eq("id", selOp).eq("status", "programada");
    },
    onSuccess: () => { toast.success("Apontamento iniciado."); qc.invalidateQueries({ queryKey: ["cf-abertos"] }); qc.invalidateQueries({ queryKey: ["cf-ops"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const finalizar = useMutation({
    mutationFn: async () => {
      if (!fimDlg) return;
      const { error } = await supabase.from("op_apontamentos").update({
        fim: new Date().toISOString(),
        quantidade_produzida: fimForm.quantidade_produzida,
        quantidade_refugo: fimForm.quantidade_refugo,
        motivo_refugo: fimForm.motivo_refugo || null,
      } as never).eq("id", fimDlg.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Apontamento finalizado."); setFimDlg(null); qc.invalidateQueries({ queryKey: ["cf-abertos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const registrarParada = useMutation({
    mutationFn: async () => {
      const motivo = motivos.find((m) => m.id === paradaForm.motivo_id);
      const { error } = await supabase.from("op_paradas").insert({
        op_id: paradaForm.op_id || null,
        maquina_id: paradaForm.maquina_id || null,
        motivo: motivo?.descricao ?? "Parada",
        categoria: motivo?.categoria ?? "outros",
        inicio: paradaForm.inicio || new Date().toISOString(),
        fim: paradaForm.fim || null,
        observacao: paradaForm.observacao || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Parada registrada."); setParadaDlg(false); setParadaForm({ op_id: "", maquina_id: "", motivo_id: "", inicio: "", fim: "", observacao: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const opMap = new Map(ops.map((o) => [o.id, o]));

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Chão de Fábrica"
        description="Registre início/fim de apontamentos e paradas em tempo real."
        actions={<Button variant="outline" onClick={() => setParadaDlg(true)}><AlertTriangle className="mr-2 h-4 w-4" /> Registrar parada</Button>}
      />

      <Card className="p-4">
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <Label>OP</Label>
            <Select value={selOp} onValueChange={setSelOp}>
              <SelectTrigger><SelectValue placeholder="OP…" /></SelectTrigger>
              <SelectContent>{ops.map((o) => <SelectItem key={o.id} value={o.id}>#{o.numero} · {o.status}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Operador</Label>
            <Select value={selFunc} onValueChange={setSelFunc}>
              <SelectTrigger><SelectValue placeholder="Operador…" /></SelectTrigger>
              <SelectContent>{funcs.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Máquina</Label>
            <Select value={selMaq} onValueChange={setSelMaq}>
              <SelectTrigger><SelectValue placeholder="Máquina…" /></SelectTrigger>
              <SelectContent>{maquinas.map((m) => <SelectItem key={m.id} value={m.id}>{m.maquina}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={() => iniciar.mutate()} disabled={iniciar.isPending || !selOp}>
            {iniciar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <Play className="mr-2 h-4 w-4" /> Iniciar
          </Button>
        </div>
      </Card>

      <div>
        <div className="mb-2 text-sm font-medium">Apontamentos em aberto</div>
        {isLoading ? <div className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div> :
          abertos.length === 0 ? <Card className="p-6 text-center text-muted-foreground text-sm">Nenhum apontamento aberto.</Card> :
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {abertos.map((a) => {
              const op = opMap.get(a.op_id);
              const min = Math.round((Date.now() - new Date(a.inicio).getTime()) / 60000);
              return (
                <Card key={a.id} className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">OP #{op?.numero ?? "?"}</div>
                    <Badge>{min} min</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Início: {new Date(a.inicio).toLocaleString("pt-BR")}</div>
                  <Button size="sm" className="w-full mt-2" onClick={() => { setFimDlg(a); setFimForm({ quantidade_produzida: 0, quantidade_refugo: 0, motivo_refugo: "" }); }}>
                    <Square className="mr-2 h-3 w-3" /> Finalizar
                  </Button>
                </Card>
              );
            })}
          </div>
        }
      </div>

      <Dialog open={!!fimDlg} onOpenChange={(o) => !o && setFimDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Finalizar apontamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Produzido (kg)</Label><Input type="number" step="0.001" value={fimForm.quantidade_produzida} onChange={(e) => setFimForm({ ...fimForm, quantidade_produzida: Number(e.target.value) })} /></div>
              <div><Label>Refugo (kg)</Label><Input type="number" step="0.001" value={fimForm.quantidade_refugo} onChange={(e) => setFimForm({ ...fimForm, quantidade_refugo: Number(e.target.value) })} /></div>
            </div>
            {fimForm.quantidade_refugo > 0 && (
              <div><Label>Motivo do refugo</Label><Input value={fimForm.motivo_refugo} onChange={(e) => setFimForm({ ...fimForm, motivo_refugo: e.target.value })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFimDlg(null)}>Cancelar</Button>
            <Button onClick={() => finalizar.mutate()} disabled={finalizar.isPending}>{finalizar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Finalizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paradaDlg} onOpenChange={setParadaDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar parada</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Motivo</Label>
              <Select value={paradaForm.motivo_id} onValueChange={(v) => setParadaForm({ ...paradaForm, motivo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>{motivos.map((m) => <SelectItem key={m.id} value={m.id}>{m.codigo} — {m.descricao}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Máquina</Label>
                <Select value={paradaForm.maquina_id} onValueChange={(v) => setParadaForm({ ...paradaForm, maquina_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{maquinas.map((m) => <SelectItem key={m.id} value={m.id}>{m.maquina}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>OP</Label>
                <Select value={paradaForm.op_id} onValueChange={(v) => setParadaForm({ ...paradaForm, op_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{ops.map((o) => <SelectItem key={o.id} value={o.id}>#{o.numero}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="datetime-local" value={paradaForm.inicio} onChange={(e) => setParadaForm({ ...paradaForm, inicio: e.target.value })} /></div>
              <div><Label>Fim (opcional)</Label><Input type="datetime-local" value={paradaForm.fim} onChange={(e) => setParadaForm({ ...paradaForm, fim: e.target.value })} /></div>
            </div>
            <div><Label>Observação</Label><Input value={paradaForm.observacao} onChange={(e) => setParadaForm({ ...paradaForm, observacao: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParadaDlg(false)}>Cancelar</Button>
            <Button onClick={() => registrarParada.mutate()} disabled={registrarParada.isPending || !paradaForm.motivo_id}>
              {registrarParada.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}