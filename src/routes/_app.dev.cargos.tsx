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
import { supabase } from "@/integrations/supabase/client";
import { ALL_MENU_ITEMS, GROUP_ORDER } from "@/lib/menu-config";
import { useAuth, useUserRoles } from "@/hooks/use-auth";

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

type Profile = { id: string; nome: string | null; email: string | null };
type UserCargo = { id: string; user_id: string; cargo_id: string };

const sb = supabase as unknown as {
  from: (t: string) => any;
};

async function fetchCargos(): Promise<Cargo[]> {
  const { data, error } = await sb.from("cargos").select("*").order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Cargo[];
}
async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await sb.from("profiles").select("id,nome,email").order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}
async function fetchUserCargos(): Promise<UserCargo[]> {
  const { data, error } = await sb.from("user_cargos").select("id,user_id,cargo_id");
  if (error) throw error;
  return (data ?? []) as UserCargo[];
}

function DevCargosPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!roles.includes("desenvolvedor")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>Apenas o cargo Desenvolvedor pode gerenciar cargos.</CardDescription>
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("cargos").delete().eq("id", id);
      if (error) throw error;
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
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
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
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
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
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["cargos"] })}
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
        const { error } = await sb.from("cargos").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("cargos").insert(payload);
        if (error) throw error;
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
  const { data: profiles = [], isLoading: lp } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const { data: cargos = [], isLoading: lc } = useQuery({ queryKey: ["cargos"], queryFn: fetchCargos });
  const { data: userCargos = [], isLoading: luc } = useQuery({ queryKey: ["user_cargos"], queryFn: fetchUserCargos });

  const byUser = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const uc of userCargos) {
      if (!map.has(uc.user_id)) map.set(uc.user_id, new Set());
      map.get(uc.user_id)!.add(uc.cargo_id);
    }
    return map;
  }, [userCargos]);

  const toggleMut = useMutation({
    mutationFn: async ({ userId, cargoId, add }: { userId: string; cargoId: string; add: boolean }) => {
      if (add) {
        const { error } = await sb.from("user_cargos").insert({ user_id: userId, cargo_id: cargoId });
        if (error) throw error;
      } else {
        const { error } = await sb.from("user_cargos").delete().eq("user_id", userId).eq("cargo_id", cargoId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_cargos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (lp || lc || luc) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
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
        <CardTitle className="text-base">Atribuir cargos a colaboradores</CardTitle>
        <CardDescription>Marque os cargos de cada colaborador. Um colaborador pode ter vários cargos.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Colaborador</TableHead>
              {cargos.map((c) => (
                <TableHead key={c.id} className="text-center">{c.nome}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => {
              const assigned = byUser.get(p.id) ?? new Set<string>();
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.nome ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </TableCell>
                  {cargos.map((c) => {
                    const checked = assigned.has(c.id);
                    return (
                      <TableCell key={c.id} className="text-center">
                        <Checkbox
                          checked={checked}
                          disabled={toggleMut.isPending}
                          onCheckedChange={(v) => toggleMut.mutate({ userId: p.id, cargoId: c.id, add: !!v })}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
