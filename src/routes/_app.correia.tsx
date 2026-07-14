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
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMultiSelection } from "@/hooks/use-multi-selection";

export const Route = createFileRoute("/_app/correia")({
  ssr: false,
  component: CorreiaPage,
});

type Correia = {
  id: string;
  correia: string;
  modelo: string | null;
  marca: string | null;
  habilitado: boolean;
};

const PAGE_SIZE = 20;

async function fetchCorreias(): Promise<Correia[]> {
  const { data, error } = await supabase
    .from("correias" as never)
    .select("*")
    .order("correia", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Correia[];
}

function CorreiaPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["correias"], queryFn: fetchCorreias });

  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Correia | null>(null);

  const filtered = useMemo(
    () => data.filter((c) => c.correia.toLowerCase().includes(applied.toLowerCase())),
    [data, applied],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sel = useMultiSelection(paged);
  const singleRow = sel.singleSelected;

  const deleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase.from("correias" as never) as never as {
        delete: () => { in: (c: string, v: string[]) => Promise<{ error: Error | null }> };
      }).delete().in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} correia(s) excluída(s).`);
      sel.clear();
      qc.invalidateQueries({ queryKey: ["correias"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">⚙️ Listagem Correias</h1>

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
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="w-10 text-center">
                  <Checkbox checked={sel.allSelected} onCheckedChange={(c) => sel.toggleAll(!!c)} aria-label="Selecionar todas" />
                </TableHead>
                <TableHead className="text-primary-foreground font-semibold">Correia</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Modelo</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Marca</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center w-14">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : paged.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Checkbox checked={sel.isSelected(c.id)} onCheckedChange={(v) => sel.toggleOne(c.id, !!v)} />
                  </TableCell>
                  <TableCell><span className="text-primary font-medium">{c.correia}</span></TableCell>
                  <TableCell>{c.modelo ?? "—"}</TableCell>
                  <TableCell>{c.marca ?? "—"}</TableCell>
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
              <Label className="text-xs text-muted-foreground">Correia:</Label>
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <Button variant="secondary" onClick={() => { setApplied(filter); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <CorreiaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["correias"] })}
      />
    </div>
  );
}

function CorreiaDialog({
  open, onOpenChange, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: Correia | null; onSaved: () => void }) {
  const [correia, setCorreia] = useState("");
  const [modelo, setModelo] = useState("");
  const [marca, setMarca] = useState("");
  const [habilitado, setHabilitado] = useState(true);

  useEffect(() => {
    if (!open) return;
    setCorreia(editing?.correia ?? "");
    setModelo(editing?.modelo ?? "");
    setMarca(editing?.marca ?? "");
    setHabilitado(editing?.habilitado ?? true);
  }, [open, editing]);

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        correia: correia.trim(),
        modelo: modelo.trim() || null,
        marca: marca.trim() || null,
        habilitado,
      };
      const table = supabase.from("correias" as never) as never as {
        insert: (p: unknown) => Promise<{ error: Error | null }>;
        update: (p: unknown) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
      };
      if (editing) {
        const { error } = await table.update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await table.insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Correia atualizada." : "Correia cadastrada.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!correia.trim()) { toast.error("Informe a correia."); return; }
    mut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">⚙️ {editing ? "Alterar" : "Cadastro"} Correia</DialogTitle>
        </DialogHeader>
        <div className="rounded bg-muted/50 p-5 space-y-3">
          <Row label="Correia" required>
            <Input value={correia} onChange={(e) => setCorreia(e.target.value)} maxLength={100} />
          </Row>
          <Row label="Modelo">
            <Input value={modelo} onChange={(e) => setModelo(e.target.value)} maxLength={100} />
          </Row>
          <Row label="Marca">
            <Input value={marca} onChange={(e) => setMarca(e.target.value)} maxLength={100} />
          </Row>
          {editing && (
            <Row label="Habilitado">
              <Checkbox checked={habilitado} onCheckedChange={(v) => setHabilitado(!!v)} />
            </Row>
          )}
        </div>
        <p className="text-center text-sm text-destructive">* Campo Obrigatório</p>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>Cancelar</Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {editing ? "SALVAR" : "CADASTRAR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-center gap-3">
      <Label className="justify-self-end text-sm">
        {required && <span className="text-destructive mr-1">*</span>}{label}:
      </Label>
      <div>{children}</div>
    </div>
  );
}
