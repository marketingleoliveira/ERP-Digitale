import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/logistica/transportadoras")({
  ssr: false,
  head: () => ({ meta: [{ title: "Transportadoras" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

type Row = { id: string; razao_social: string; cnpj: string | null; telefone: string | null; uf: string | null; antt: string | null; ativa: boolean };

function Page() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["transportadoras"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transportadoras").select("*").order("razao_social");
      if (error) throw error;
      return data as Row[];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transportadoras</h1>
        <NovoDialog onDone={() => qc.invalidateQueries({ queryKey: ["transportadoras"] })} />
      </div>
      <Card>
        <CardHeader><CardTitle>Cadastro</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Razão Social</TableHead><TableHead>CNPJ</TableHead><TableHead>Telefone</TableHead><TableHead>UF</TableHead><TableHead>ANTT</TableHead><TableHead>Ativa</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6}>Carregando…</TableCell></TableRow> :
                data.length === 0 ? <TableRow><TableCell colSpan={6} className="text-muted-foreground text-center">Nenhuma transportadora.</TableCell></TableRow> :
                data.map(r => <TableRow key={r.id}>
                  <TableCell>{r.razao_social}</TableCell><TableCell>{r.cnpj ?? "—"}</TableCell>
                  <TableCell>{r.telefone ?? "—"}</TableCell><TableCell>{r.uf ?? "—"}</TableCell>
                  <TableCell>{r.antt ?? "—"}</TableCell><TableCell>{r.ativa ? "Sim" : "Não"}</TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NovoDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ razao_social: "", cnpj: "", telefone: "", uf: "", antt: "" });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("transportadoras").insert(f);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Transportadora criada."); setOpen(false); setF({ razao_social: "", cnpj: "", telefone: "", uf: "", antt: "" }); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Transportadora</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Razão Social</Label><Input value={f.razao_social} onChange={e => setF({ ...f, razao_social: e.target.value })} /></div>
          <div><Label>CNPJ</Label><Input value={f.cnpj} onChange={e => setF({ ...f, cnpj: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={f.telefone} onChange={e => setF({ ...f, telefone: e.target.value })} /></div>
          <div><Label>UF</Label><Input value={f.uf} maxLength={2} onChange={e => setF({ ...f, uf: e.target.value.toUpperCase() })} /></div>
          <div><Label>ANTT</Label><Input value={f.antt} onChange={e => setF({ ...f, antt: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={() => save.mutate()} disabled={!f.razao_social || save.isPending}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
