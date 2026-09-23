import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useMultiSelection } from "@/hooks/use-multi-selection";
import {
  adminCreateUserMariaDb,
  adminDeleteUsersMariaDb,
  adminListUsersMariaDb,
  adminListFuncionariosMariaDb,
  adminUpdateUserMariaDb,
} from "@/lib/admin-users-mariadb.functions";
import { friendlyDbError } from "@/lib/db-errors";


export const Route = createFileRoute("/_app/usuarios")({
  ssr: false,
  component: UsuariosPage,
});

type Profile = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
  roles: string[];
  isSuperuser: boolean;
  cargos: Array<{ id: string; nome: string }>;
  funcionario_id: string | null;
};

type Funcionario = { id: string; nome: string; cargo_id: string | null; habilitado: boolean };

const PAGE_SIZE = 20;

async function fetchProfiles(): Promise<Profile[]> {
  return (await adminListUsersMariaDb()) as Profile[];
}

function UsuariosPage() {
  const qc = useQueryClient();
  const { data: profiles = [], isLoading, error: profilesError } = useQuery({
    queryKey: ["mariadb-users"],
    queryFn: fetchProfiles,
  });

  const { data: funcionarios = [], error: funcionariosError } = useQuery({
    queryKey: ["funcionarios-usuarios"],
    queryFn: () => adminListFuncionariosMariaDb() as Promise<Funcionario[]>,
  });

  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);

  const rows = useMemo(() => {
    const q = applied.toLowerCase();
    return profiles
      .map((p) => ({
        ...p,
        tipo: p.cargos.length ? p.cargos.map((c) => c.nome).join(", ") : "—",
      }))
      .filter((p) => !q || p.email.toLowerCase().includes(q));
  }, [profiles, applied]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectablePaged = paged.filter((profile) => !profile.isSuperuser);
  const sel = useMultiSelection(selectablePaged);
  const singleRow = sel.singleSelected;

  const deleteMut = useMutation({
    mutationFn: async (ids: string[]) =>
      adminDeleteUsersMariaDb({ data: { ids } }),
    onSuccess: (result) => {
      const deleted = (result as { deleted: number }).deleted;
      toast.success(
        deleted === 1
          ? "Usuário excluído."
          : `${deleted} usuários excluídos.`,
      );
      qc.invalidateQueries({ queryKey: ["mariadb-users"] });
      sel.clear();
    },
    onError: (error: Error) => {
      toast.error(friendlyDbError(error));
    },
  });

  const askDelete = () => {
    const selected = sel.selectedRows;
    if (!selected.length) return;

    const label =
      selected.length === 1
        ? `Excluir o usuário "${selected[0].nome}"?`
        : `Excluir ${selected.length} usuários selecionados?`;

    if (!confirm(`${label} Esta ação é permanente.`)) return;

    deleteMut.mutate(selected.map((profile) => profile.id));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary"> Listagem Usuário</h1>

      <Card className="overflow-hidden">
        {profilesError && (
          <Alert variant="destructive" className="m-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar os usuários: {(profilesError as Error).message}
            </AlertDescription>
          </Alert>
        )}
        {funcionariosError && (
          <Alert variant="destructive" className="m-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar os funcionários cadastrados. Corrija a conexão com o cadastro de funcionários antes de criar um usuário.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-muted/30 p-2">
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <FilePlus2 className="h-4 w-4 mr-1.5" />CADASTRAR
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!singleRow}
            onClick={() => {
              if (!singleRow) return;
              setEditing(singleRow);
              setDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 mr-1.5" />ALTERAR
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={sel.count === 0 || deleteMut.isPending}
            onClick={askDelete}
          >
            {deleteMut.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1.5" />
            )}
            EXCLUIR{sel.count > 1 ? ` (${sel.count})` : ""}
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
                      <Checkbox
                        checked={sel.selectedIds.has(p.id)}
                        disabled={p.isSuperuser}
                        onCheckedChange={(v) => sel.toggleOne(p.id, !!v)}
                      />
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
        funcionarios={funcionarios.filter(
          (funcionario) =>
            !profiles.some(
              (profile) =>
                profile.funcionario_id === funcionario.id &&
                profile.id !== editing?.id,
            ),
        )}
        currentFuncionarioId={editing?.funcionario_id ?? null}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["mariadb-users"] });
          sel.clear();
        }}
      />
    </div>
  );
}


function Field({
  label,
  req,
  children,
}: {
  label: string;
  req?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <Label className="text-right text-sm">
        {req ? <span className="text-destructive mr-0.5">{"*".repeat(req)}</span> : null}
        {label}:
      </Label>
      <div>{children}</div>
    </div>
  );
}

function UsuarioDialog({
  open,
  onOpenChange,
  editing,
  funcionarios,
  currentFuncionarioId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Profile | null;
  funcionarios: Funcionario[];
  currentFuncionarioId: string | null;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setNome(editing?.nome ?? "");
    setFuncionarioId(currentFuncionarioId ?? "");
    setEmail(editing?.email ?? "");
    setTelefone(editing?.telefone ?? "");
    setSenha("");
    setConfirma("");
    setAtivo(editing?.ativo ?? true);
    setErrorMsg(null);
  }, [open, editing, currentFuncionarioId]);

  const saveMut = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);

      const cleanNome = nome.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanNome) throw new Error("Informe o nome.");
      if (!cleanEmail) throw new Error("Informe o e-mail.");
      if (!funcionarioId) throw new Error("Selecione um funcionário já cadastrado.");

      if (editing) {
        await adminUpdateUserMariaDb({
          data: {
            id: editing.id,
            email: cleanEmail,
            nome: cleanNome,
            telefone: telefone.trim() || null,
            ativo,
            funcionario_id: funcionarioId,
          },
        });

        return "Usuário atualizado.";
      }

      if (senha.length < 8) {
        throw new Error("A senha deve ter ao menos 8 caracteres.");
      }

      if (senha !== confirma) {
        throw new Error("As senhas não conferem.");
      }

      await adminCreateUserMariaDb({
        data: {
          email: cleanEmail,
          password: senha,
          nome: cleanNome,
          funcionario_id: funcionarioId,
        },
      });

      return "Usuário cadastrado.";
    },

    onSuccess: (msg) => {
      toast.success(msg);
      onOpenChange(false);
      onSaved();
    },

    onError: (e: Error) => {
      const msg = friendlyDbError(e);
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Alterar Usuário" : "Cadastro Usuário"}
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 rounded-md bg-muted/40 p-4">
          <Field label="Funcionário" req={1}>
            <Select
              value={funcionarioId}
              onValueChange={(selectedId) => {
                setFuncionarioId(selectedId);

                const funcionarioSelecionado = funcionarios.find(
                  (funcionario) => funcionario.id === selectedId,
                );

                if (funcionarioSelecionado) {
                  setNome(funcionarioSelecionado.nome);
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Selecione um funcionário já cadastrado" />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((funcionario) => (
                  <SelectItem key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>



          <Field label="Nome" req={1}>
            <Input
              className="h-8"
              value={nome}
              readOnly
              aria-readonly="true"
              title="O nome é definido pelo funcionário selecionado"
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>

          <Field label="Email" req={1}>
            <Input
              className="h-8"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          {editing && (
            <Field label="Telefone">
              <Input
                className="h-8"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </Field>
          )}

          {!editing && (
            <>
              <Field label="Senha" req={1}>
                <Input
                  className="h-8 w-40"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </Field>

              <Field label="Confirme Senha" req={1}>
                <Input
                  className="h-8 w-40"
                  type="password"
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                />
              </Field>
            </>
          )}

          {editing && (
            <Field label="Habilitado">
              <Checkbox
                checked={ativo}
                onCheckedChange={(v) => setAtivo(!!v)}
              />
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMut.isPending}
          >
            CANCELAR
          </Button>

          <Button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || funcionarios.length === 0}
          >
            {saveMut.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            SALVAR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
