import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Play, PackageX, ArrowLeftRight, XCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/pcp/reservas")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reservas de Material" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

const num = (n: number | null | undefined, d = 2) =>
  Number(n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

type ReservaRow = {
  id: string; op_id: string; op_numero: number; op_status: string;
  item_tipo: string; item_id: string | null; descricao: string | null;
  lote_id: string; numero_lote: string; lote_tipo: string;
  quantidade_reservada: number; quantidade_consumida: number;
  quantidade_liberada: number; pendente: number; status: string;
};

type SaldoRow = {
  lote_id: string; tipo: string; item_id: string | null; numero_lote: string;
  saldo_fisico: number; saldo_reservado: number; saldo_disponivel: number;
};

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    reservada: "bg-blue-600",
    parcialmente_consumida: "bg-yellow-500",
    consumida: "bg-green-600",
    liberada: "bg-slate-500",
    cancelada: "bg-destructive",
  };
  return <Badge className={map[s] ?? ""}>{s.replace(/_/g, " ")}</Badge>;
}

function Page() {
  const qc = useQueryClient();
  const [opNumero, setOpNumero] = useState("");
  const [substDialog, setSubstDialog] = useState<{ reservaId: string; itemId: string | null; item_tipo: string } | null>(null);
  const [novoLoteId, setNovoLoteId] = useState("");
  const [consumoDialog, setConsumoDialog] = useState<{ reservaId: string; pendente: number } | null>(null);
  const [consumoQtd, setConsumoQtd] = useState("");

  const { data: reservas = [] } = useQuery({
    queryKey: ["reservas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_reservas_op" as never)
        .select("*").order("op_numero", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as ReservaRow[];
    },
  });

  const { data: saldos = [] } = useQuery({
    queryKey: ["saldos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_lotes_saldos" as never)
        .select("*").order("saldo_reservado", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as SaldoRow[];
    },
  });

  const { data: opsAbertas = [] } = useQuery({
    queryKey: ["ops-abertas-reserva"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ordens_producao")
        .select("id, numero, status").in("status", ["planejada", "programada"]).order("numero", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const reservar = useMutation({
    mutationFn: async (opId: string) => {
      const { data, error } = await supabase.rpc("op_reservar_materiais" as never, { _op_id: opId } as never);
      if (error) throw error;
      return data as { ok: boolean; reservas: string[]; faltas: unknown[] };
    },
    onSuccess: (d) => {
      const faltas = Array.isArray(d.faltas) ? d.faltas.length : 0;
      toast.success(`${d.reservas?.length ?? 0} reservas criadas${faltas ? ` · ${faltas} pendências` : ""}.`);
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["saldos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const liberar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("op_liberar_reserva" as never, { _reserva_id: id, _quantidade: null } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Reserva liberada."); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelarOp = useMutation({
    mutationFn: async (opId: string) => {
      const { error } = await supabase.rpc("op_cancelar_reservas_op" as never, { _op_id: opId } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Reservas canceladas."); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const consumir = useMutation({
    mutationFn: async ({ id, qtd }: { id: string; qtd: number }) => {
      const { error } = await supabase.rpc("op_consumir_reserva" as never,
        { _reserva_id: id, _quantidade: qtd, _obs: null } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Consumo registrado."); setConsumoDialog(null); setConsumoQtd(""); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const substituir = useMutation({
    mutationFn: async ({ id, lote }: { id: string; lote: string }) => {
      const { error } = await supabase.rpc("op_substituir_lote" as never,
        { _reserva_id: id, _novo_lote_id: lote } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lote substituído."); setSubstDialog(null); setNovoLoteId(""); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: lotesSubst = [] } = useQuery({
    queryKey: ["lotes-subst", substDialog?.itemId],
    enabled: !!substDialog?.itemId,
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_lotes_saldos" as never)
        .select("*").eq("item_id", substDialog!.itemId).gt("saldo_disponivel", 0);
      if (error) throw error;
      return (data ?? []) as SaldoRow[];
    },
  });

  const filtroOp = opNumero ? reservas.filter(r => String(r.op_numero).includes(opNumero)) : reservas;
  const insuficientes = reservas.filter(r => r.pendente > 0 && r.status === "reservada" && r.quantidade_consumida === 0);
  const lotesComReserva = saldos.filter(s => s.saldo_reservado > 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservas de Material</h1>
        <p className="text-sm text-muted-foreground">
          Saldo físico · reservado · disponível — FIFO, atômico, com rastreio no Kardex.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Liberar OP para produção (reservar materiais)</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {opsAbertas.length === 0 && <span className="text-muted-foreground text-sm">Nenhuma OP planejada/programada.</span>}
          {opsAbertas.map(o => (
            <div key={o.id} className="flex items-center gap-1 border rounded-md px-2 py-1">
              <span className="font-medium">#{o.numero}</span>
              <Badge variant="outline">{o.status}</Badge>
              <Button size="sm" variant="ghost" onClick={() => reservar.mutate(o.id)} disabled={reservar.isPending}>
                <Play className="h-3.5 w-3.5 mr-1" /> Reservar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cancelarOp.mutate(o.id)} disabled={cancelarOp.isPending}>
                <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="op">
        <TabsList>
          <TabsTrigger value="op">Por OP</TabsTrigger>
          <TabsTrigger value="lote">Por lote</TabsTrigger>
          <TabsTrigger value="ins">Insuficientes</TabsTrigger>
        </TabsList>

        <TabsContent value="op">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Reservas por OP</CardTitle>
              <Input placeholder="Filtrar por nº OP…" value={opNumero} onChange={e => setOpNumero(e.target.value)} className="w-40" />
            </CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>OP</TableHead><TableHead>Material</TableHead><TableHead>Lote</TableHead>
                  <TableHead className="text-right">Reservada</TableHead>
                  <TableHead className="text-right">Consumida</TableHead>
                  <TableHead className="text-right">Liberada</TableHead>
                  <TableHead className="text-right">Pendente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtroOp.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Sem reservas.</TableCell></TableRow>}
                  {filtroOp.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>#{r.op_numero}</TableCell>
                      <TableCell><div className="font-medium">{r.descricao ?? "—"}</div><div className="text-xs text-muted-foreground">{r.item_tipo}</div></TableCell>
                      <TableCell><div className="font-mono text-xs">{r.numero_lote}</div></TableCell>
                      <TableCell className="text-right">{num(r.quantidade_reservada, 3)}</TableCell>
                      <TableCell className="text-right">{num(r.quantidade_consumida, 3)}</TableCell>
                      <TableCell className="text-right">{num(r.quantidade_liberada, 3)}</TableCell>
                      <TableCell className="text-right font-semibold">{num(r.pendente, 3)}</TableCell>
                      <TableCell><StatusBadge s={r.status} /></TableCell>
                      <TableCell className="text-right space-x-1">
                        {r.pendente > 0 && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setConsumoDialog({ reservaId: r.id, pendente: r.pendente }); setConsumoQtd(String(r.pendente)); }}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setSubstDialog({ reservaId: r.id, itemId: r.item_id, item_tipo: r.item_tipo })}>
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => liberar.mutate(r.id)} disabled={liberar.isPending}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lote">
          <Card>
            <CardHeader><CardTitle>Saldos por lote</CardTitle></CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Lote</TableHead><TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Físico</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {lotesComReserva.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum lote com reserva.</TableCell></TableRow>}
                  {lotesComReserva.map(s => (
                    <TableRow key={s.lote_id}>
                      <TableCell className="font-mono text-xs">{s.numero_lote}</TableCell>
                      <TableCell>{s.tipo}</TableCell>
                      <TableCell className="text-right">{num(s.saldo_fisico, 3)}</TableCell>
                      <TableCell className="text-right text-blue-600">{num(s.saldo_reservado, 3)}</TableCell>
                      <TableCell className="text-right font-semibold">{num(s.saldo_disponivel, 3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ins">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><PackageX className="h-4 w-4" /> Materiais com reserva pendente</CardTitle></CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>OP</TableHead><TableHead>Material</TableHead><TableHead>Lote</TableHead><TableHead className="text-right">Pendente</TableHead></TableRow></TableHeader>
                <TableBody>
                  {insuficientes.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nada pendente.</TableCell></TableRow>}
                  {insuficientes.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>#{r.op_numero}</TableCell>
                      <TableCell>{r.descricao}</TableCell>
                      <TableCell className="font-mono text-xs">{r.numero_lote}</TableCell>
                      <TableCell className="text-right">{num(r.pendente, 3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo consumo */}
      <Dialog open={!!consumoDialog} onOpenChange={o => !o && setConsumoDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar consumo</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Quantidade (pendente: {num(consumoDialog?.pendente ?? 0, 3)})</Label>
            <Input type="number" step="0.001" value={consumoQtd} onChange={e => setConsumoQtd(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConsumoDialog(null)}>Cancelar</Button>
            <Button onClick={() => consumoDialog && consumir.mutate({ id: consumoDialog.reservaId, qtd: Number(consumoQtd) })}
              disabled={consumir.isPending || !consumoQtd}>Consumir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo substituição */}
      <Dialog open={!!substDialog} onOpenChange={o => !o && setSubstDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Substituir lote</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Novo lote (mesmo item)</Label>
            <Select value={novoLoteId} onValueChange={setNovoLoteId}>
              <SelectTrigger><SelectValue placeholder="Selecionar lote…" /></SelectTrigger>
              <SelectContent>
                {lotesSubst.map(l => (
                  <SelectItem key={l.lote_id} value={l.lote_id}>
                    {l.numero_lote} — disp {num(l.saldo_disponivel, 3)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSubstDialog(null)}>Cancelar</Button>
            <Button onClick={() => substDialog && substituir.mutate({ id: substDialog.reservaId, lote: novoLoteId })}
              disabled={substituir.isPending || !novoLoteId}>Substituir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
