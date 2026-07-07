import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Loader2, Pencil, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMultiSelection } from "@/hooks/use-multi-selection";

export const Route = createFileRoute("/_app/cor")({
  ssr: false,
  component: CorPage,
});

type Cor = {
  id: string;
  codigo: string;
  tipo: string;
  cor: string;
  valor: number | null;
  valor_complementar: number | null;
  tinturaria_id: string | null;
  observacao: string | null;
  habilitado: boolean;
};

type Tinturaria = { id: string; nome_fantasia: string };

const TIPOS = ["Clara", "Média", "Escura", "Especial"];
const PAGE_SIZE = 20;
const fmt = (n: number | null) => (n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function fetchCores(): Promise<Cor[]> {
  const client = supabase as unknown as { from: (t: string) => { select: (c: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Cor[] | null; error: Error | null }> } } };
  const { data, error } = await client.from("cores").select("*").order("cor", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
async function fetchTinturarias(): Promise<Tinturaria[]> {
  const client = supabase as unknown as { from: (t: string) => { select: (c: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Tinturaria[] | null; error: Error | null }> } } };
  const { data, error } = await client.from("tinturarias").select("id,nome_fantasia").order("nome_fantasia", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function CorPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["cores"], queryFn: fetchCores });
  const { data: tinturarias = [] } = useQuery({ queryKey: ["tinturarias"], queryFn: fetchTinturarias });

  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cor | null>(null);

  const filtered = useMemo(
    () => data.filter((c) => c.cor.toLowerCase().includes(applied.toLowerCase())),
    [data, applied],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sel = useMultiSelection(paged);
  const singleRow = sel.singleSelected;

  const deleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase.from("cores") as any).delete().in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} cor(es) excluída(s).`);
      sel.clear();
      qc.invalidateQueries({ queryKey: ["cores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🎨 Listagem Cor</h1>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 p-2">
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <FilePlus2 className="h-4 w-4 mr-1.5" />CADASTRAR
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedRow} onClick={() => { setEditing(selectedRow); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4 mr-1.5" />ALTERAR
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedRow || deleteMut.isPending} onClick={() => selectedRow && deleteMut.mutate(selectedRow)}>
            <Trash2 className="h-4 w-4 mr-1.5" />EXCLUIR
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" />IMPRIMIR
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-primary-foreground font-semibold">Código</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Tipo</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Cor</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Valor R$</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-right">Valor Compl.</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : paged.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Checkbox checked={selected === c.id} onCheckedChange={(v) => setSelected(v ? c.id : null)} />
                  </TableCell>
                  <TableCell><span className="text-primary font-medium">{c.codigo}</span></TableCell>
                  <TableCell>{c.tipo}</TableCell>
                  <TableCell>{c.cor}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(c.valor)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(c.valor_complementar)}</TableCell>
                  <TableCell className="text-center"><Checkbox checked={c.habilitado} disabled /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border p-3 bg-muted/30">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">Página: {page} / {totalPages}</span>
            <div className="mx-auto flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>◀ ANTERIOR</Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>PRÓXIMO ▶</Button>
            </div>
            <span className="ml-auto text-muted-foreground">Total de Registros: {filtered.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs text-muted-foreground">Cor:</Label>
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <Button variant="secondary" onClick={() => { setApplied(filter); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <CorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        tinturarias={tinturarias}
        onSaved={() => qc.invalidateQueries({ queryKey: ["cores"] })}
      />
    </div>
  );
}

function CorDialog({
  open, onOpenChange, editing, tinturarias, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Cor | null;
  tinturarias: Tinturaria[]; onSaved: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("");
  const [cor, setCor] = useState("");
  const [valor, setValor] = useState("");
  const [valorC, setValorC] = useState("");
  const [tinturariaId, setTinturariaId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [habilitado, setHabilitado] = useState(true);

  useEffect(() => {
    if (!open) return;
    setCodigo(editing?.codigo ?? "");
    setTipo(editing?.tipo ?? "");
    setCor(editing?.cor ?? "");
    setValor(editing?.valor != null ? String(editing.valor) : "");
    setValorC(editing?.valor_complementar != null ? String(editing.valor_complementar) : "");
    setTinturariaId(editing?.tinturaria_id ?? "");
    setObservacao(editing?.observacao ?? "");
    setHabilitado(editing?.habilitado ?? true);
  }, [open, editing]);

  const num = (v: string) => {
    if (!v.trim()) return 0;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!codigo.trim() || !tipo || !cor.trim()) throw new Error("Preencha Código, Tipo e Cor.");
      const payload = {
        codigo: codigo.trim(),
        tipo,
        cor: cor.trim(),
        valor: num(valor),
        valor_complementar: num(valorC),
        tinturaria_id: tinturariaId || null,
        observacao: observacao.trim() || null,
        habilitado,
      };
      const client = supabase as unknown as { from: (t: string) => { update: (p: unknown) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> }; insert: (p: unknown) => Promise<{ error: Error | null }> } };
      if (editing) {
        const { error } = await client.from("cores").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await client.from("cores").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Cor atualizada." : "Cor cadastrada.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary">🎨 {editing ? "Alterar" : "Cadastro"} Cor</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded bg-muted/50 p-5">
          <div className="space-y-1.5">
            <Label><span className="text-destructive">*</span> Código:</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label><span className="text-destructive">*</span> Tipo:</Label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-10 w-full rounded border border-input bg-background px-2 text-sm">
              <option value="">[SELECIONE]</option>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label><span className="text-destructive">*</span> Cor:</Label>
            <Input value={cor} onChange={(e) => setCor(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Tinturaria:</Label>
            <select value={tinturariaId} onChange={(e) => setTinturariaId(e.target.value)} className="h-10 w-full rounded border border-input bg-background px-2 text-sm">
              <option value="">[SELECIONE]</option>
              {tinturarias.map((t) => <option key={t.id} value={t.id}>{t.nome_fantasia}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor R$:</Label>
            <Input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Valor Complementar R$:</Label>
            <Input inputMode="decimal" value={valorC} onChange={(e) => setValorC(e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Observação:</Label>
            <Textarea rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={500} />
          </div>
          {editing && (
            <label className="flex items-center gap-2 md:col-span-2">
              <Checkbox checked={habilitado} onCheckedChange={(v) => setHabilitado(!!v)} />
              <span className="text-sm">Habilitado</span>
            </label>
          )}
        </div>
        <p className="text-center text-sm text-destructive">* Campo Obrigatório</p>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {editing ? "SALVAR" : "CADASTRAR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
