import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { getProcessos, saveProcesso } from "@/services/engenharia/processos.functions";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/engenharia/processos" as any)({
  ssr: false,
  component: ProcessosPage,
});

type Processo = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  setor_id: string | null;
  centro_trabalho_padrao_id: string | null;
  duracao_padrao_minutos: number;
  custo_padrao: number;
  sequencia_sugerida: number | null;
  ativo: boolean;
  setor?: { nome: string };
  centro_trabalho?: { nome: string };
};

const empty = (): Omit<Processo, "id"> => ({
  codigo: "", nome: "", descricao: "", tipo: "Industrial",
  setor_id: null, centro_trabalho_padrao_id: null,
  duracao_padrao_minutos: 0, custo_padrao: 0,
  sequencia_sugerida: null, ativo: true,
});

function ProcessosPage() {
  const qc = useQueryClient();
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState<Processo | Omit<Processo, "id">>(empty());
  const [filter, setFilter] = useState("");

  const fetchProcessos = useServerFn(getProcessos);
  const { data = [], isLoading } = useQuery({
    queryKey: ["processos_industriais"],
    queryFn: () => fetchProcessos(),
  });

  const { data: setores = [] } = useQuery({
    queryKey: ["setores"],
    queryFn: async () => {
      const { data } = await supabase.from("setores" as any).select("id, nome").order("nome");
      return (data || []) as any[];
    }
  });

  const { data: centros = [] } = useQuery({
    queryKey: ["centros_trabalho"],
    queryFn: async () => {
      const { data } = await supabase.from("centros_trabalho" as any).select("id, nome").order("nome");
      return (data || []) as any[];
    }
  });

  const saveProcessoFn = useServerFn(saveProcesso);
  const saveMut = useMutation({
    mutationFn: (payload: any) => saveProcessoFn({ data: payload }),
    onSuccess: () => {
      toast.success("Processo industrial salvo.");
      setDlg(false);
      qc.invalidateQueries({ queryKey: ["processos_industriais"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("processos_industriais" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Processo removido.");
      qc.invalidateQueries({ queryKey: ["processos_industriais"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => 
    data.filter(p => 
      p.nome.toLowerCase().includes(filter.toLowerCase()) || 
      p.codigo.toLowerCase().includes(filter.toLowerCase())
    ), [data, filter]
  );

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Processos Industriais"
        description="Gestão dos processos base para roteiros de produção"
        actions={
          <Button onClick={() => { setForm(empty()); setDlg(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Processo
          </Button>
        }
      />

      <div className="flex items-center gap-2 bg-card p-3 rounded-lg border shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filtrar por nome ou código..." 
          className="max-w-md h-9" 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <Card className="p-0 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>C. Trabalho</TableHead>
              <TableHead className="text-right">Duração (min)</TableHead>
              <TableHead className="text-right">Custo (R$)</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Nenhum processo encontrado.</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-[10px] font-bold text-blue-600">{p.codigo}</TableCell>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell className="text-xs">{p.setor?.nome || "—"}</TableCell>
                <TableCell className="text-xs">{p.centro_trabalho?.nome || "—"}</TableCell>
                <TableCell className="text-right">{p.duracao_padrao_minutos}</TableCell>
                <TableCell className="text-right">{p.custo_padrao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                <TableCell>
                  <Badge variant={p.ativo ? "default" : "secondary"} className="text-[10px] uppercase font-bold">
                    {p.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setForm(p); setDlg(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Excluir processo?")) delMut.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{"id" in form ? "Editar Processo" : "Novo Processo Industrial"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} placeholder="EX: EST-ROT" />
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Estamparia Rotativa" />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.setor_id || ""}
                onChange={(e) => setForm({ ...form, setor_id: e.target.value || null })}
              >
                <option value="">Selecione...</option>
                {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Centro de Trabalho Padrão</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.centro_trabalho_padrao_id || ""}
                onChange={(e) => setForm({ ...form, centro_trabalho_padrao_id: e.target.value || null })}
              >
                <option value="">Selecione...</option>
                {centros.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Duração Padrão (Minutos)</Label>
              <Input type="number" value={form.duracao_padrao_minutos} onChange={(e) => setForm({ ...form, duracao_padrao_minutos: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Custo Padrão (R$)</Label>
              <Input type="number" step="0.01" value={form.custo_padrao} onChange={(e) => setForm({ ...form, custo_padrao: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Descrição</Label>
              <Input value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="proc-ativo" checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: !!v })} />
              <Label htmlFor="proc-ativo" className="cursor-pointer">Processo Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending || !form.codigo || !form.nome}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
