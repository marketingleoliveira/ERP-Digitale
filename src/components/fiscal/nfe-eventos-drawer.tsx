import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Ban, FileEdit, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cancelarNFe, emitirCCe, consultarNFe } from "@/lib/nfe.functions";

export function NfeEventosDrawer({ notaId, numero }: { notaId: string; numero: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const cancelFn = useServerFn(cancelarNFe);
  const cceFn = useServerFn(emitirCCe);
  const consultFn = useServerFn(consultarNFe);

  const { data: eventos = [] } = useQuery({
    queryKey: ["nfe_eventos", notaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("nfe_eventos" as never)
        .select("*").eq("nota_fiscal_id", notaId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string; tipo: string; motivo: string; status: string; mensagem: string; created_at: string;
      }>;
    },
    enabled: open,
  });

  const [motivo, setMotivo] = useState("");
  const [correcao, setCorrecao] = useState("");

  const doCancel = useMutation({
    mutationFn: () => cancelFn({ data: { notaId, justificativa: motivo } }),
    onSuccess: () => { toast.success("Cancelamento enviado."); qc.invalidateQueries({ queryKey: ["nfe_eventos", notaId] }); qc.invalidateQueries({ queryKey: ["notas_fiscais"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const doCCe = useMutation({
    mutationFn: () => cceFn({ data: { notaId, correcao } }),
    onSuccess: () => { toast.success("CC-e enviada."); qc.invalidateQueries({ queryKey: ["nfe_eventos", notaId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const doConsult = useMutation({
    mutationFn: () => consultFn({ data: { notaId } }),
    onSuccess: (r) => { toast.success("Consulta: " + JSON.stringify((r as { body: { status?: string } }).body?.status ?? "ok")); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" title="Eventos SEFAZ">
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Eventos NF-e #{numero}</SheetTitle></SheetHeader>

        <Tabs defaultValue="hist" className="mt-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="hist">Histórico</TabsTrigger>
            <TabsTrigger value="cancel">Cancelar</TabsTrigger>
            <TabsTrigger value="cce">CC-e</TabsTrigger>
            <TabsTrigger value="consult">Consultar</TabsTrigger>
          </TabsList>

          <TabsContent value="hist" className="space-y-2 mt-3">
            {eventos.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sem eventos.</p>}
            {eventos.map(ev => (
              <Card key={ev.id} className="p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">{ev.tipo}</Badge>
                  <Badge variant={ev.status === "sucesso" ? "default" : "destructive"}>{ev.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString("pt-BR")}</p>
                {ev.motivo && <p><span className="font-medium">Motivo:</span> {ev.motivo}</p>}
                {ev.mensagem && <p className="text-xs">{ev.mensagem}</p>}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="cancel" className="space-y-3 mt-3">
            <div>
              <Label>Justificativa (mín 15 caracteres) *</Label>
              <Textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={4} />
            </div>
            <Button className="w-full" onClick={() => doCancel.mutate()} disabled={doCancel.isPending || motivo.length < 15}>
              {doCancel.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              Cancelar NF-e na SEFAZ
            </Button>
          </TabsContent>

          <TabsContent value="cce" className="space-y-3 mt-3">
            <div>
              <Label>Texto da correção (mín 15 caracteres) *</Label>
              <Textarea value={correcao} onChange={e => setCorrecao(e.target.value)} rows={4} />
            </div>
            <Button className="w-full" onClick={() => doCCe.mutate()} disabled={doCCe.isPending || correcao.length < 15}>
              {doCCe.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileEdit className="h-4 w-4 mr-2" />}
              Enviar Carta de Correção
            </Button>
          </TabsContent>

          <TabsContent value="consult" className="space-y-3 mt-3">
            <p className="text-sm text-muted-foreground">Consulta o status atual da nota na SEFAZ.</p>
            <Button className="w-full" onClick={() => doConsult.mutate()} disabled={doConsult.isPending}>
              {doConsult.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Consultar Situação
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
