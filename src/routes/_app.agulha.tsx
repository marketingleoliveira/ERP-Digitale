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

export const Route = createFileRoute("/_app/agulha")({
  ssr: false,
  component: AgulhaPage,
});

type Agulha = {
  id: string;
  agulha: string;
  modelo: string | null;
  pe: number | null;
  marca: string | null;
  habilitado: boolean;
};

const PAGE_SIZE = 20;

const sb = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => { order: (col: string, o: { ascending: boolean }) => Promise<{ data: unknown; error: Error | null }> };
    insert: (p: unknown) => Promise<{ error: Error | null }>;
    update: (p: unknown) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
    delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
  };
};

async function fetchAgulhas(): Promise<Agulha[]> {
  const { data, error } = await sb.from("agulhas").select("*").order("agulha", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Agulha[];
}

function AgulhaPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["agulhas"], queryFn: fetchAgulhas });

  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agulha | null>(null);

  const filtered = useMemo(
    () => data.filter((a) => a.agulha.toLowerCase().includes(applied.toLowerCase())),
    [data, applied],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sel = useMultiSelection(paged);
  const singleRow = sel.singleSelected;

  const deleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase.from("agulhas") as any).delete().in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} agulha(s) excluída(s).`);
      sel.clear();
      qc.invalidateQueries({ queryKey: ["agulhas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🌸 Listagem Agulha</h1>

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
                  <Checkbox
                    checked={sel.allSelected}
                    onCheckedChange={(c) => sel.toggleAll(!!c)}
                    aria-label="Selecionar todas"
                  />
                </TableHead>
                <TableHead className="text-primary-foreground font-semibold">Agulha</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Modelo</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center w-20">PE</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Marca</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center w-14">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : paged.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Checkbox checked={sel.isSelected(a.id)} onCheckedChange={(c) => sel.toggleOne(a.id, !!c)} />
                  </TableCell>
                  <TableCell><span className="text-primary font-medium">{a.agulha}</span></TableCell>
                  <TableCell>{a.modelo ?? "—"}</TableCell>
                  <TableCell className="text-center">{a.pe ?? "—"}</TableCell>
                  <TableCell>{a.marca ?? "—"}</TableCell>
                  <TableCell className="text-center"><Checkbox checked={a.habilitado} disabled /></TableCell>
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
            <div className="flex items-center gap-2">
              <span>Página:</span>
              <select
                className="h-8 rounded border border-input bg-background px-2 text-sm"
                value={page}
                onChange={(ev) => setPage(Number(ev.target.value))}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="ml-auto text-muted-foreground">Total de Registros: {filtered.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs text-muted-foreground">Agulha:</Label>
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <Button variant="secondary" onClick={() => { setApplied(filter); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <AgulhaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["agulhas"] })}
      />
    </div>
  );
}

function AgulhaDialog({
  open, onOpenChange, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: Agulha | null; onSaved: () => void }) {
  const [agulha, setAgulha] = useState("");
  const [modelo, setModelo] = useState("");
  const [pe, setPe] = useState("");
  const [marca, setMarca] = useState("");
  const [habilitado, setHabilitado] = useState(true);

  useEffect(() => {
    if (!open) return;
    setAgulha(editing?.agulha ?? "");
    setModelo(editing?.modelo ?? "");
    setPe(editing?.pe?.toString() ?? "");
    setMarca(editing?.marca ?? "");
    setHabilitado(editing?.habilitado ?? true);
  }, [open, editing]);

  const mut = useMutation({
    mutationFn: async () => {
      const peN = pe.trim() ? Number(pe) : null;
      if (peN != null && !Number.isFinite(peN)) throw new Error("PE inválido.");
      const payload = {
        agulha: agulha.trim(),
        modelo: modelo.trim() || null,
        pe: peN,
        marca: marca.trim() || null,
        habilitado,
      };
      if (editing) {
        const { error } = await sb.from("agulhas").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("agulhas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Agulha atualizada." : "Agulha cadastrada.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!agulha.trim()) { toast.error("Informe a agulha."); return; }
    mut.mutate();
  };

  const Row = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="grid grid-cols-[130px_1fr] items-center gap-3">
      <Label className="justify-self-end text-sm">
        {required && <span className="text-destructive mr-1">*</span>}{label}:
      </Label>
      <div>{children}</div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">🌸 {editing ? "Alterar" : "Cadastro"} Agulha</DialogTitle>
        </DialogHeader>
        <div className="rounded bg-muted/50 p-5 space-y-3">
          <Row label="Agulha" required>
            <Input value={agulha} onChange={(e) => setAgulha(e.target.value)} maxLength={100} />
          </Row>
          <Row label="Modelo">
            <Input value={modelo} onChange={(e) => setModelo(e.target.value)} maxLength={100} />
          </Row>
          <Row label="PE">
            <Input value={pe} onChange={(e) => setPe(e.target.value)} className="max-w-[140px]" />
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
