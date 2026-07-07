import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMultiSelection } from "@/hooks/use-multi-selection";

export const Route = createFileRoute("/_app/usuarios")({
  ssr: false,
  component: UsuariosPage,
});

type Profile = {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  telefone: string | null;
  ativo: boolean;
};

type Cargo = { id: string; nome: string };
type UserCargo = { user_id: string; cargo_id: string };

const PAGE_SIZE = 20;
const sb = supabase as unknown as { from: (t: string) => any };

async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await sb.from("profiles").select("id,nome,email,cargo,telefone,ativo").order("nome");
  if (error) throw error;
  return (data ?? []) as Profile[];
}
async function fetchCargos(): Promise<Cargo[]> {
  const { data, error } = await sb.from("cargos").select("id,nome").order("nome");
  if (error) throw error;
  return (data ?? []) as Cargo[];
}
async function fetchUserCargos(): Promise<UserCargo[]> {
  const { data, error } = await sb.from("user_cargos").select("user_id,cargo_id");
  if (error) return [];
  return (data ?? []) as UserCargo[];
}

function UsuariosPage() {
  const qc = useQueryClient();
  const { data: profiles = [], isLoading } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const { data: cargos = [] } = useQuery({ queryKey: ["cargos"], queryFn: fetchCargos });
  const { data: userCargos = [] } = useQuery({ queryKey: ["user_cargos"], queryFn: fetchUserCargos });

  const cargoById = useMemo(() => new Map(cargos.map((c) => [c.id, c.nome])), [cargos]);
  const cargoByUser = useMemo(() => {
    const m = new Map<string, string>();
    for (const uc of userCargos) {
      const nome = cargoById.get(uc.cargo_id);
      if (nome) m.set(uc.user_id, nome);
    }
    return m;
  }, [userCargos, cargoById]);

  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);

  const rows = useMemo(() => {
    const q = applied.toLowerCase();
    return profiles
      .map((p) => ({ ...p, tipo: cargoByUser.get(p.id) ?? p.cargo ?? "—" }))
      .filter((p) => !q || p.email.toLowerCase().includes(q));
  }, [profiles, cargoByUser, applied]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sel = useMultiSelection(paged);
  const singleRow = sel.singleSelected;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">👤 Listagem Usuário</h1>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-muted/30 p-2">
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <FilePlus2 className="h-4 w-4 mr-1.5" />CADASTRAR
          </Button>
          <Button size="sm" variant="outline" disabled={!singleRow} onClick={() => { setEditing(singleRow); setDialogOpen(true); }}>
            <Pencil className="h-4 w-4 mr-1.5" />ALTERAR
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/90 hover:bg-primary/90">
                <TableHead className="w-10">
                  <Checkbox checked={sel.allSelected} onCheckedChange={(v) => sel.toggleAll(!!v)} />
                </TableHead>
                <TableHead className="text-primary-foreground">Tipo</TableHead>
                <TableHead className="text-primary-foreground">Funcionário / Cliente</TableHead>
                <TableHead className="text-primary-foreground">Email</TableHead>
                <TableHead className="text-primary-foreground w-16 text-center">Hab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
              ) : (
                paged.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Checkbox checked={sel.selectedIds.has(p.id)} onCheckedChange={(v) => sel.toggleOne(p.id, !!v)} />
                    </TableCell>
                    <TableCell className="text-primary font-medium">{p.tipo}</TableCell>
                    <TableCell>{p.nome}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={p.ativo} disabled />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/30 p-2 text-sm">
          <span>Página: {page} / {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>◀ ANTERIOR</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>PRÓXIMO ▶</Button>
          </div>
          <span>Total de Registros: {rows.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/30 p-2">
          <Label className="text-sm">Email:</Label>
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8 w-64" />
          <Button size="sm" onClick={() => { setApplied(filter); setPage(1); }}>FILTRAR</Button>
        </div>
      </Card>

      <UsuarioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        cargos={cargos}
        currentCargoId={editing ? userCargos.find((uc) => uc.user_id === editing.id)?.cargo_id ?? null : null}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["profiles"] }); qc.invalidateQueries({ queryKey: ["user_cargos"] }); sel.clear(); }}
      />
    </div>
  );
}

function UsuarioDialog({
  open, onOpenChange, editing, cargos, currentCargoId, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Profile | null;
  cargos: Cargo[];
  currentCargoId: string | null;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [cargoId, setCargoId] = useState<string>("");

  // Reset form when opening
  useMemo(() => {
    if (open) {
      setNome(editing?.nome ?? "");
      setEmail(editing?.email ?? "");
      setSenha("");
      setAtivo(editing?.ativo ?? true);
      setCargoId(currentCargoId ?? "");
    }
  }, [open, editing, currentCargoId]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await sb.from("profiles").update({ nome: nome.trim(), ativo }).eq("id", editing.id);
        if (error) throw error;
        // Sync cargo
        await sb.from("user_cargos").delete().eq("user_id", editing.id);
        if (cargoId) {
          const { error: e2 } = await sb.from("user_cargos").insert({ user_id: editing.id, cargo_id: cargoId });
          if (e2) throw e2;
        }
        return "Usuário atualizado.";
      } else {
        if (!email || !senha) throw new Error("Email e senha são obrigatórios.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { nome: nome.trim() } },
        });
        if (error) throw error;
        const uid = data.user?.id;
        if (uid && cargoId) {
          await sb.from("user_cargos").insert({ user_id: uid, cargo_id: cargoId });
        }
        return "Usuário cadastrado.";
      }
    },
    onSuccess: (msg) => { toast.success(msg); onOpenChange(false); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Alterar Usuário" : "Cadastrar Usuário"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!editing} />
          </div>
          {!editing && (
            <div>
              <Label>Senha</Label>
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Cargo</Label>
            <Select value={cargoId} onValueChange={setCargoId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ativo" checked={ativo} onCheckedChange={(v) => setAtivo(!!v)} />
            <Label htmlFor="ativo">Habilitado</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
