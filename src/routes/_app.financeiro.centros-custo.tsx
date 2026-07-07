import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/financeiro/centros-custo")({
  ssr: false,
  head: () => ({ meta: [{ title: "Centros de Custo" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
  component: Page,
});

type Row = { id: string; codigo: string; nome: string; tipo: string; ativo: boolean };

function Page() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["centros_custo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("centros_custo").select("*").order("codigo");
      if (error) throw error;
      return data as Row[];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Centros de Custo</h1>
        <NovoDialog onDone={() => qc.invalidateQueries({ queryKey: ["centros_custo"] })} />
      </div>
      <Card>
        <CardHeader><CardTitle>Lista</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Ativo</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={4}>Carregando…</TableCell></TableRow> :
                data.map(r => <TableRow key={r.id}><TableCell className="font-mono">{r.codigo}</TableCell><TableCell>{r.nome}</TableCell><TableCell>{r.tipo}</TableCell><TableCell>{r.ativo ? "Sim" : "Não"}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NovoDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("despesa");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("centros_custo").insert({ codigo, nome, tipo });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Centro de custo criado."); setOpen(false); setCodigo(""); setNome(""); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Novo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Centro de Custo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Código</Label><Input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} /></div>
          <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div><Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={() => save.mutate()} disabled={!codigo || !nome || save.isPending}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
