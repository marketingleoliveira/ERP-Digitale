import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, Loader2, Pencil, Trash2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateCargoMariaDb,
  adminDeleteCargoMariaDb,
  adminListCargosMariaDb,
  adminUpdateCargoMariaDb,
} from "@/lib/cargos-mariadb.functions";
import {
  adminListUsersMariaDb,
  adminUpdateUserMariaDb,
} from "@/lib/admin-users-mariadb.functions";
import { ALL_MENU_ITEMS, GROUP_ORDER } from "@/lib/menu-config";
import { useAuth, useHasAppPermission } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/dev/cargos")({
  ssr: false,
  component: DevCargosPage,
});

type Cargo = {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: string[];
};

type UserRow = {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  roles: string[];
  isSuperuser: boolean;
  cargos: Array<{ id: string; nome: string }>;
};

async function fetchCargos(): Promise<Cargo[]> {
  return (await adminListCargosMariaDb()) as Cargo[];
}

async function fetchUsers(): Promise<UserRow[]> {
  return (await adminListUsersMariaDb()) as UserRow[];
}

function DevCargosPage() {
  const { user, loading } = useAuth();
  const canManage = useHasAppPermission("/dev/cargos");

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>É necessário um cargo com permissão para gerenciar cargos.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" /> Cargos & Permissões
        </h1>
        <p className="text-sm text-muted-foreground">
          Crie cargos personalizados, defina quais menus cada cargo pode acessar e atribua a colaboradores.
        </p>
      </div>

      <Tabs defaultValue="cargos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
          <TabsTrigger value="atribuicoes">Atribuições</TabsTrigger>
        </TabsList>
        <TabsContent value="cargos"><CargosTab /></TabsContent>
        <TabsContent value="atribuicoes"><AtribuicoesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Cargos CRUD ---------------- */

function CargosTab() {
  const qc = useQueryClient();
  const { data: cargos = [], isLoading } = useQuery({ queryKey: ["cargos"], queryFn: fetchCargos });
  const [editor, setEditor] = useState<Cargo | "new" | null>(null);
  const editing = editor === null || editor === "new" ? null : editor;
  const dialogOpen = editor !== null;

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await adminDeleteCargoMariaDb({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Cargo excluído.");
      qc.invalidateQueries({ queryKey: ["cargos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Cargos cadastrados</CardTitle>
          <CardDescription>{cargos.length} cargo(s)</CardDescription>
        </div>
        <Button type="button" size="sm" onClick={() => setEditor("new")}>
          <FilePlus2 className="h-4 w-4 mr-1.5" /> Novo cargo
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : cargos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum cargo cadastrado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Permissões</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.descricao ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{c.permissoes.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditor(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={deleteMut.isPending}
                      onClick={() => { if (confirm(`Excluir cargo "${c.nome}"?`)) deleteMut.mutate(c.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CargoDialog
        key={editor === "new" ? "new" : editing?.id ?? "closed"}
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        editing={editing}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["cargos"] });
        }}
      />
    </Card>
  );
}

function CargoDialog({
  open, onOpenChange, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: Cargo | null; onSaved: () => void }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [permissoes, setPermissoes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setNome(editing?.nome ?? "");
    setDescricao(editing?.descricao ?? "");
    setPermissoes(new Set(editing?.permissoes ?? []));
  }, [open, editing]);

  const toggle = (url: string, checked: boolean) => {
    setPermissoes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(url); else next.delete(url);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof ALL_MENU_ITEMS }[] = [];
    const standalone = ALL_MENU_ITEMS.filter((i) => !i.group);
    if (standalone.length) groups.push({ label: "Geral", items: standalone });
    for (const g of GROUP_ORDER) {
      const items = ALL_MENU_ITEMS.filter((i) => i.group === g);
      if (items.length) groups.push({ label: g, items });
    }
    return groups;
  }, []);

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        permissoes: Array.from(permissoes),
      };
      if (editing) {
        await adminUpdateCargoMariaDb({
          data: {
            id: editing.id,
            ...payload,
          },
        });
      } else {
        await adminCreateCargoMariaDb({
          data: payload,
        });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Cargo atualizado." : "Cargo criado.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!nome.trim()) { toast.error("Informe o nome do cargo."); return; }
    mut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cargo" : "Novo cargo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome do cargo *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Supervisor de Produção" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Permissões de acesso (menus)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Selecione os menus que este cargo poderá acessar.
            </p>
            <div className="space-y-4 border rounded-md p-4 bg-muted/30">
              {grouped.map((g) => (
                <div key={g.label}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-primary">{g.label}</h4>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary"
                      onClick={() => {
                        const allSelected = g.items.every((i) => permissoes.has(i.url));
                        setPermissoes((prev) => {
                          const next = new Set(prev);
                          for (const i of g.items) { if (allSelected) next.delete(i.url); else next.add(i.url); }
                          return next;
                        });
                      }}
                    >
                      {g.items.every((i) => permissoes.has(i.url)) ? "Desmarcar todos" : "Marcar todos"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {g.items.map((i) => {
                      const Icon = i.icon;
                      return (
                        <label key={i.url} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-background/60 rounded px-2 py-1">
                          <Checkbox
                            checked={permissoes.has(i.url)}
                            onCheckedChange={(v) => toggle(i.url, !!v)}
                          />
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{i.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>Cancelar</Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {editing ? "Salvar" : "Criar cargo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Atribuições ---------------- */

function AtribuicoesTab() {
  const qc = useQueryClient();

  const { data: users = [], isLoading: lu } = useQuery({
    queryKey: ["mariadb-users"],
    queryFn: fetchUsers,
  });

  const { data: cargos = [], isLoading: lc } = useQuery({
    queryKey: ["cargos"],
    queryFn: fetchCargos,
  });

  const toggleMut = useMutation({
    mutationFn: async ({
      user,
      cargoId,
      add,
    }: {
      user: UserRow;
      cargoId: string;
      add: boolean;
    }) => {
      const currentCargoIds = user.cargos.map((cargo) => cargo.id);

      const cargoIds = add
        ? [...new Set([...currentCargoIds, cargoId])]
        : currentCargoIds.filter((id) => id !== cargoId);

      await adminUpdateUserMariaDb({
        data: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          telefone: user.telefone,
          ativo: user.ativo,
          cargo_ids: cargoIds,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mariadb-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (lu || lc) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (cargos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Crie ao menos um cargo na aba <strong>Cargos</strong> antes de atribuí-los.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Atribuir cargos a usuários
        </CardTitle>
        <CardDescription>
          Marque os cargos de cada usuário. Usuários master são protegidos contra alteração por esta operação.
        </CardDescription>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Usuário</TableHead>
              {cargos.map((cargo) => (
                <TableHead key={cargo.id} className="text-center">
                  {cargo.nome}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user) => {
              const assigned = new Set(user.cargos.map((cargo) => cargo.id));

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                      {user.isSuperuser ? " · master protegido" : ""}
                    </div>
                  </TableCell>

                  {cargos.map((cargo) => (
                    <TableCell key={cargo.id} className="text-center">
                      <Checkbox
                        checked={assigned.has(cargo.id)}
                        disabled={user.isSuperuser || toggleMut.isPending}
                        onCheckedChange={(value) =>
                          toggleMut.mutate({
                            user,
                            cargoId: cargo.id,
                            add: !!value,
                          })
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
