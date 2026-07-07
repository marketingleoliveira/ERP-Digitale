import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/logistica/romaneios")({
  ssr: false,
  head: () => ({ meta: [{ title: "Romaneios" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

type Row = { id: string; numero: number; data_emissao: string; motorista: string | null; veiculo_placa: string | null; status: string; volumes_total: number; peso_total: number; valor_frete: number; transportadoras: { razao_social: string } | null };

const NEXT: Record<string, string[]> = {
  aberto: ["fechado", "cancelado"],
  fechado: ["em_transito", "aberto"],
  em_transito: ["entregue", "devolvido"],
};

function Page() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["romaneios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("romaneios").select("*, transportadoras(razao_social)").order("numero", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Row[];
    },
  });

  const trans = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.rpc("romaneio_transicionar", { _romaneio_id: id, _novo_status: status });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Romaneio atualizado."); qc.invalidateQueries({ queryKey: ["romaneios"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Romaneios</h1>
        <NovoDialog onDone={() => qc.invalidateQueries({ queryKey: ["romaneios"] })} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nº</TableHead><TableHead>Data</TableHead><TableHead>Transportadora</TableHead><TableHead>Motorista</TableHead><TableHead>Placa</TableHead><TableHead>Vol.</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={8}>Carregando…</TableCell></TableRow> :
                data.length === 0 ? <TableRow><TableCell colSpan={8} className="text-muted-foreground text-center">Nenhum romaneio.</TableCell></TableRow> :
                data.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.numero}</TableCell>
                    <TableCell>{r.data_emissao}</TableCell>
                    <TableCell>{r.transportadoras?.razao_social ?? "—"}</TableCell>
                    <TableCell>{r.motorista ?? "—"}</TableCell>
                    <TableCell>{r.veiculo_placa ?? "—"}</TableCell>
                    <TableCell>{r.volumes_total}</TableCell>
                    <TableCell><Badge>{r.status}</Badge></TableCell>
                    <TableCell className="space-x-1">
                      {(NEXT[r.status] ?? []).map(s => (
                        <Button key={s} size="sm" variant="outline" onClick={() => trans.mutate({ id: r.id, status: s })}>{s}</Button>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NovoDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [transp, setTransp] = useState<string | undefined>();
  const [motorista, setMotorista] = useState("");
  const [placa, setPlaca] = useState("");
  const [frete, setFrete] = useState("0");

  const { data: transportadoras = [] } = useQuery({
    queryKey: ["transp-ativas"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from("transportadoras").select("id,razao_social").eq("ativa", true);
      if (error) throw error;
      return data as { id: string; razao_social: string }[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("romaneios").insert({
        transportadora_id: transp ?? null,
        motorista, veiculo_placa: placa.toUpperCase(),
        valor_frete: Number(frete),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Romaneio criado."); setOpen(false); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Novo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Romaneio</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Transportadora</Label>
            <Select value={transp} onValueChange={setTransp}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{transportadoras.map(t => <SelectItem key={t.id} value={t.id}>{t.razao_social}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Motorista</Label><Input value={motorista} onChange={e => setMotorista(e.target.value)} /></div>
          <div><Label>Placa</Label><Input value={placa} onChange={e => setPlaca(e.target.value)} /></div>
          <div className="col-span-2"><Label>Valor Frete</Label><Input type="number" step="0.01" value={frete} onChange={e => setFrete(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending}>Criar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
