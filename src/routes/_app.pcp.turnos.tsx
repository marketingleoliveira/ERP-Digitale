import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/turnos")({
  ssr: false,
  component: TurnosPage,
});

type Turno = {
  id: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
  dias_semana: number[];
  intervalo_min: number;
  ativo: boolean;
  observacao: string | null;
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const empty = (): Omit<Turno, "id"> => ({
  nome: "",
  hora_inicio: "07:00",
  hora_fim: "17:00",
  dias_semana: [1, 2, 3, 4, 5],
  intervalo_min: 60,
  ativo: true,
  observacao: "",
});

function TurnosPage() {
  const qc = useQueryClient();
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState<Turno | Omit<Turno, "id">>(empty());

  const { data = [], isLoading } = useQuery({
    queryKey: ["turnos"],
    queryFn: async (): Promise<Turno[]> => {
      const { data, error } = await supabase.from("turnos" as never).select("*").order("hora_inicio");
      if (error) throw error;
      return (data ?? []) as unknown as Turno[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const isEdit = "id" in form && form.id;
      const payload = { ...form, observacao: form.observacao || null };
      const q = isEdit
        ? supabase.from("turnos" as never).update(payload as never).eq("id", (form as Turno).id)
        : supabase.from("turnos" as never).insert(payload as never);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Turno salvo.");
      setDlg(false);
      qc.invalidateQueries({ queryKey: ["turnos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("turnos" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Turno removido.");
      qc.invalidateQueries({ queryKey: ["turnos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleDia = (d: number) => {
    const cur = form.dias_semana || [];
    setForm({ ...form, dias_semana: cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort() });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Turnos de Produção"
        description="Cadastro base para cálculo de capacidade e programação (Sprint 0 PCP)"
        actions={
          <Button onClick={() => { setForm(empty()); setDlg(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo turno
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead>Intervalo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            )}
            {!isLoading && data.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum turno cadastrado.</TableCell></TableRow>
            )}
            {data.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nome}</TableCell>
                <TableCell>{t.hora_inicio?.slice(0, 5)}</TableCell>
                <TableCell>{t.hora_fim?.slice(0, 5)}</TableCell>
                <TableCell>{(t.dias_semana || []).map((d) => DIAS[d]).join(", ")}</TableCell>
                <TableCell>{t.intervalo_min} min</TableCell>
                <TableCell>
                  <Badge variant={t.ativo ? "default" : "secondary"}>{t.ativo ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => { setForm(t); setDlg(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir turno?")) delMut.mutate(t.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{"id" in form && form.id ? "Editar turno" : "Novo turno"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: 1º Turno" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora início</Label>
                <Input type="time" value={form.hora_inicio?.slice(0, 5)} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} />
              </div>
              <div>
                <Label>Hora fim</Label>
                <Input type="time" value={form.hora_fim?.slice(0, 5)} onChange={(e) => setForm({ ...form, hora_fim: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Dias da semana</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DIAS.map((d, i) => (
                  <label key={i} className={`px-3 py-1 rounded border cursor-pointer text-sm ${form.dias_semana?.includes(i) ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                    <input type="checkbox" className="hidden" checked={form.dias_semana?.includes(i)} onChange={() => toggleDia(i)} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Intervalo (min)</Label>
                <Input type="number" value={form.intervalo_min} onChange={(e) => setForm({ ...form, intervalo_min: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-2">
                <Checkbox checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: Boolean(v) })} id="ativo" />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            </div>
            <div>
              <Label>Observação</Label>
              <Input value={form.observacao ?? ""} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.nome}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
