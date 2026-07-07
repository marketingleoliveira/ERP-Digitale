import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Loader2, Pencil, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMultiSelection } from "@/hooks/use-multi-selection";

export const Route = createFileRoute("/_app/tabela-cor")({
  ssr: false,
  component: TinturariasPage,
});

type Tinturaria = {
  id: string;
  codigo: string;
  nome_fantasia: string;
  razao_social: string | null;
  cnpj: string | null;
  telefone: string | null;
  contato: string | null;
  habilitado: boolean;
};

const PAGE_SIZE = 20;

async function fetchTinturarias(): Promise<Tinturaria[]> {
  const client = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Tinturaria[] | null; error: Error | null }> };
    };
  };
  const { data, error } = await client
    .from("tinturarias")
    .select("id,codigo,nome_fantasia,razao_social,cnpj,telefone,contato,habilitado")
    .order("nome_fantasia", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function TinturariasPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["tinturarias"], queryFn: fetchTinturarias });

  const [filterNome, setFilterNome] = useState("");
  const [filterCnpj, setFilterCnpj] = useState("");
  const [appliedNome, setAppliedNome] = useState("");
  const [appliedCnpj, setAppliedCnpj] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tinturaria | null>(null);

  const filtered = useMemo(
    () =>
      data.filter(
        (r) =>
          r.nome_fantasia.toLowerCase().includes(appliedNome.toLowerCase()) &&
          (r.cnpj ?? "").includes(appliedCnpj.trim()),
      ),
    [data, appliedNome, appliedCnpj],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sel = useMultiSelection(paged);
  const singleRow = sel.singleSelected;

  const deleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase.from("tinturarias") as any).delete().in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} tinturaria(s) excluída(s).`);
      sel.clear();
      qc.invalidateQueries({ queryKey: ["tinturarias"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🎨 Listagem Fornecedores</h1>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-muted/30 p-2">
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <FilePlus2 className="h-4 w-4 mr-1.5" />CADASTRAR
          </Button>
          <Button size="sm" variant="outline" disabled={!singleRow} onClick={() => { setEditing(singleRow); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4 mr-1.5" />ALTERAR
          </Button>
          <Button size="sm" variant="outline" disabled={sel.count === 0 || deleteMut.isPending} onClick={() => deleteMut.mutate([...sel.selectedIds])}>
            <Trash2 className="h-4 w-4 mr-1.5" />EXCLUIR{sel.count > 1 ? ` (${sel.count})` : ""}
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" />IMPRIMIR
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="w-10 text-center">
                  <Checkbox checked={sel.allSelected} onCheckedChange={(c) => sel.toggleAll(!!c)} aria-label="Selecionar todas" />
                </TableHead>
                <TableHead className="text-primary-foreground font-semibold">Código</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Nome Fantasia</TableHead>
                <TableHead className="text-primary-foreground font-semibold">CNPJ/CPF</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Telefone</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Contato</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center w-14">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : paged.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Checkbox checked={sel.isSelected(r.id)} onCheckedChange={(c) => sel.toggleOne(r.id, !!c)} />
                  </TableCell>
                  <TableCell><span className="text-primary font-medium">{r.codigo}</span></TableCell>
                  <TableCell>{r.nome_fantasia}</TableCell>
                  <TableCell>{r.cnpj ?? "—"}</TableCell>
                  <TableCell>{r.telefone ?? "—"}</TableCell>
                  <TableCell>{r.contato ?? "—"}</TableCell>
                  <TableCell className="text-center"><Checkbox checked={r.habilitado} disabled /></TableCell>
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
              <Label className="text-xs text-muted-foreground">Nome/Razão:</Label>
              <Input value={filterNome} onChange={(e) => setFilterNome(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <div className="min-w-[200px]">
              <Label className="text-xs text-muted-foreground">CNPJ:</Label>
              <Input value={filterCnpj} onChange={(e) => setFilterCnpj(e.target.value)} className="h-9" maxLength={20} />
            </div>
            <Button variant="secondary" onClick={() => { setAppliedNome(filterNome); setAppliedCnpj(filterCnpj); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <TinturariaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["tinturarias"] })}
      />
    </div>
  );
}

function TinturariaDialog({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Tinturaria | null; onSaved: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [contato, setContato] = useState("");
  const [habilitado, setHabilitado] = useState(true);

  useEffect(() => {
    if (!open) return;
    setCodigo(editing?.codigo ?? "");
    setNomeFantasia(editing?.nome_fantasia ?? "");
    setRazaoSocial(editing?.razao_social ?? "");
    setCnpj(editing?.cnpj ?? "");
    setTelefone(editing?.telefone ?? "");
    setContato(editing?.contato ?? "");
    setHabilitado(editing?.habilitado ?? true);
  }, [open, editing]);

  const mut = useMutation({
    mutationFn: async () => {
      if (!codigo.trim() || !nomeFantasia.trim()) throw new Error("Preencha Código e Nome Fantasia.");
      const payload = {
        codigo: codigo.trim(),
        nome_fantasia: nomeFantasia.trim(),
        razao_social: razaoSocial.trim() || null,
        cnpj: cnpj.trim() || null,
        telefone: telefone.trim() || null,
        contato: contato.trim() || null,
        habilitado,
      };
      const client = supabase as unknown as { from: (t: string) => { update: (p: unknown) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> }; insert: (p: unknown) => Promise<{ error: Error | null }> } };
      if (editing) {
        const { error } = await client.from("tinturarias").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await client.from("tinturarias").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Tinturaria atualizada." : "Tinturaria cadastrada.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-primary">🎨 {editing ? "Alterar" : "Cadastro"} Tinturaria</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded bg-muted/50 p-5">
          <div className="space-y-1.5">
            <Label><span className="text-destructive">*</span> Código:</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ/CPF:</Label>
            <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label><span className="text-destructive">*</span> Nome Fantasia:</Label>
            <Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Razão Social:</Label>
            <Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} maxLength={160} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone:</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={30} />
          </div>
          <div className="space-y-1.5">
            <Label>Contato:</Label>
            <Input value={contato} onChange={(e) => setContato(e.target.value)} maxLength={80} />
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
