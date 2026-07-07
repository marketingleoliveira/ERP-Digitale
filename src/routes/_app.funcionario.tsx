import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMultiSelection } from "@/hooks/use-multi-selection";


export const Route = createFileRoute("/_app/funcionario")({
  ssr: false,
  component: FuncionarioPage,
});

type Funcionario = {
  id: string;
  nome: string;
  tipo: string | null;
  cpf: string | null;
  rg: string | null;
  cep: string | null;
  uf: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  observacao: string | null;
  habilitado: boolean;
};

const TIPOS = [
  "Vendedor",
  "Tecelão",
  "Auxiliar de Escritório",
  "Ajudante Geral",
  "Revisador",
  "Gerente",
  "Financeiro",
  "Produção",
  "Logística",
  "Qualidade",
  "Outro",
];

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];


const PAGE_SIZE = 20;

const sb = supabase as unknown as { from: (t: string) => any };

async function fetchFuncionarios(): Promise<Funcionario[]> {
  const { data, error } = await sb.from("funcionarios").select("*").order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Funcionario[];
}

function FuncionarioPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["funcionarios"], queryFn: fetchFuncionarios });

  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Funcionario | null>(null);

  const filtered = useMemo(
    () => data.filter((f) => f.nome.toLowerCase().includes(applied.toLowerCase())),
    [data, applied],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sel = useMultiSelection(paged);
  const singleRow = sel.singleSelected;

  const deleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await sb.from("funcionarios").delete().in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} funcionário(s) excluído(s).`);
      sel.clear();
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">👥 Listagem Funcionário</h1>

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
                  <Checkbox checked={sel.allSelected} onCheckedChange={(c) => sel.toggleAll(!!c)} aria-label="Selecionar todos" />
                </TableHead>
                <TableHead className="text-primary-foreground font-semibold">Nome</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Tipo</TableHead>
                <TableHead className="text-primary-foreground font-semibold">CPF</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Telefone</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Celular</TableHead>
                <TableHead className="text-primary-foreground font-semibold text-center w-14">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Nenhum registro encontrado.</TableCell></TableRow>
              ) : paged.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Checkbox checked={sel.isSelected(f.id)} onCheckedChange={(c) => sel.toggleOne(f.id, !!c)} />
                  </TableCell>
                  <TableCell><span className="text-primary font-medium">{f.nome}</span></TableCell>
                  <TableCell>{f.tipo ?? "—"}</TableCell>
                  <TableCell>{f.cpf ?? ""}</TableCell>
                  <TableCell>{f.telefone ?? ""}</TableCell>
                  <TableCell>{f.celular ?? ""}</TableCell>
                  <TableCell className="text-center"><Checkbox checked={f.habilitado} disabled /></TableCell>
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
              <select className="h-8 rounded border border-input bg-background px-2 text-sm" value={page} onChange={(ev) => setPage(Number(ev.target.value))}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="ml-auto text-muted-foreground">Total de Registros: {filtered.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs text-muted-foreground">Nome:</Label>
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9" maxLength={100} />
            </div>
            <Button variant="secondary" onClick={() => { setApplied(filter); setPage(1); }}>FILTRAR</Button>
          </div>
        </div>
      </Card>

      <FuncionarioDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSaved={() => qc.invalidateQueries({ queryKey: ["funcionarios"] })} />
    </div>
  );
}

function FuncionarioDialog({
  open, onOpenChange, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: Funcionario | null; onSaved: () => void }) {
  const [f, setF] = useState({
    tipo: "", nome: "", cpf: "", rg: "", cep: "", uf: "",
    endereco: "", numero: "", complemento: "", bairro: "", cidade: "",
    telefone: "", celular: "", email: "", observacao: "",
    habilitado: true,
  });

  useEffect(() => {
    if (!open) return;
    setF({
      tipo: editing?.tipo ?? "",
      nome: editing?.nome ?? "",
      cpf: editing?.cpf ?? "",
      rg: editing?.rg ?? "",
      cep: editing?.cep ?? "",
      uf: editing?.uf ?? "",
      endereco: editing?.endereco ?? "",
      numero: editing?.numero ?? "",
      complemento: editing?.complemento ?? "",
      bairro: editing?.bairro ?? "",
      cidade: editing?.cidade ?? "",
      telefone: editing?.telefone ?? "",
      celular: editing?.celular ?? "",
      email: editing?.email ?? "",
      observacao: editing?.observacao ?? "",
      habilitado: editing?.habilitado ?? true,
    });
  }, [open, editing]);

  const upd = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: async () => {
      const clean = (s: string) => s.trim() || null;
      const payload = {
        tipo: clean(f.tipo),
        nome: f.nome.trim(),
        cpf: clean(f.cpf),
        rg: clean(f.rg),
        cep: clean(f.cep),
        uf: clean(f.uf),
        endereco: clean(f.endereco),
        numero: clean(f.numero),
        complemento: clean(f.complemento),
        bairro: clean(f.bairro),
        cidade: clean(f.cidade),
        telefone: clean(f.telefone),
        celular: clean(f.celular),
        email: clean(f.email),
        observacao: clean(f.observacao),
        habilitado: f.habilitado,
      };
      if (editing) {
        const { error } = await sb.from("funcionarios").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("funcionarios").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Funcionário atualizado." : "Funcionário cadastrado.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!f.tipo.trim()) { toast.error("Selecione o tipo."); return; }
    if (!f.nome.trim()) { toast.error("Informe o nome."); return; }
    mut.mutate();
  };

  const Field = ({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) => (
    <div className={className}>
      <Label className="text-xs font-semibold">
        {required && <span className="text-destructive mr-1">*</span>}{label}:
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">👥 {editing ? "Alterar" : "Cadastro"} Funcionário</DialogTitle>
        </DialogHeader>

        <div className="rounded bg-muted/40 p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Tipo" required>
              <Select value={f.tipo} onValueChange={(v) => upd("tipo", v)}>
                <SelectTrigger><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Habilitado">
              <div className="h-9 flex items-center">
                <Checkbox checked={f.habilitado} onCheckedChange={(v) => upd("habilitado", !!v)} />
              </div>
            </Field>
          </div>

          <Field label="Nome" required>
            <Input value={f.nome} onChange={(e) => upd("nome", e.target.value)} maxLength={150} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="CPF"><Input value={f.cpf} onChange={(e) => upd("cpf", e.target.value)} maxLength={20} /></Field>
            <Field label="RG"><Input value={f.rg} onChange={(e) => upd("rg", e.target.value)} maxLength={20} /></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="CEP"><Input value={f.cep} onChange={(e) => upd("cep", e.target.value)} maxLength={10} /></Field>
            <Field label="UF">
              <Select value={f.uf} onValueChange={(v) => upd("uf", v)}>
                <SelectTrigger><SelectValue placeholder="[SELECIONE]" /></SelectTrigger>
                <SelectContent>{UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Endereço"><Input value={f.endereco} onChange={(e) => upd("endereco", e.target.value)} maxLength={200} /></Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Número"><Input value={f.numero} onChange={(e) => upd("numero", e.target.value)} maxLength={20} /></Field>
            <Field label="Complemento"><Input value={f.complemento} onChange={(e) => upd("complemento", e.target.value)} maxLength={80} /></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Bairro"><Input value={f.bairro} onChange={(e) => upd("bairro", e.target.value)} maxLength={100} /></Field>
            <Field label="Cidade"><Input value={f.cidade} onChange={(e) => upd("cidade", e.target.value)} maxLength={100} /></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Telefone"><Input value={f.telefone} onChange={(e) => upd("telefone", e.target.value)} maxLength={20} /></Field>
            <Field label="Celular"><Input value={f.celular} onChange={(e) => upd("celular", e.target.value)} maxLength={20} /></Field>
          </div>

          <Field label="Email"><Input type="email" value={f.email} onChange={(e) => upd("email", e.target.value)} maxLength={150} /></Field>

          <Field label="Observação">
            <Textarea value={f.observacao} onChange={(e) => upd("observacao", e.target.value)} rows={4} maxLength={1000} />
          </Field>
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

}
