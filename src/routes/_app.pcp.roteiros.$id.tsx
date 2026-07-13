import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/pcp/roteiros/$id")({
  ssr: false,
  component: RoteiroEtapasPage,
});

type Etapa = {
  id: string;
  roteiro_id: string;
  sequencia: number;
  operacao_id: string | null;
  nome_operacao: string;
  centro_trabalho: string | null;
  maquina_preferencial_id: string | null;
  tempo_padrao_min: number;
  setup_min: number;
  consumo_previsto: number;
  perdas_previstas_pct: number;
  qualidade_obrigatoria: boolean;
  terceirizada: boolean;
  fornecedor_terceiro_id: string | null;
  observacao: string | null;
};

type Op = { id: string; codigo: string; nome: string; centro_trabalho: string | null; tempo_padrao_min: number; setup_padrao_min: number };
type Maq = { id: string; nome: string };
type Forn = { id: string; nome: string | null; razao_social: string | null };

const emptyEtapa = (roteiro_id: string, seq: number): Omit<Etapa, "id"> => ({
  roteiro_id, sequencia: seq, operacao_id: null, nome_operacao: "",
  centro_trabalho: "", maquina_preferencial_id: null,
  tempo_padrao_min: 0, setup_min: 0, consumo_previsto: 0, perdas_previstas_pct: 0,
  qualidade_obrigatoria: false, terceirizada: false, fornecedor_terceiro_id: null, observacao: "",
});

function RoteiroEtapasPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState<Etapa | Omit<Etapa, "id">>(emptyEtapa(id, 1));

  const { data: roteiro } = useQuery({
    queryKey: ["roteiro", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("roteiros" as never).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as { codigo: string; descricao: string; revisao: number } | null;
    },
  });

  const { data: etapas = [], isLoading } = useQuery({
    queryKey: ["roteiro-etapas", id],
    queryFn: async (): Promise<Etapa[]> => {
      const { data, error } = await supabase
        .from("roteiro_etapas" as never).select("*").eq("roteiro_id", id).order("sequencia");
      if (error) throw error;
      return (data ?? []) as unknown as Etapa[];
    },
  });

  const { data: operacoes = [] } = useQuery({
    queryKey: ["operacoes_produtivas"],
    queryFn: async (): Promise<Op[]> => {
      const { data, error } = await supabase.from("operacoes_produtivas" as never).select("id, codigo, nome, centro_trabalho, tempo_padrao_min, setup_padrao_min").eq("ativo", true).order("codigo");
      if (error) throw error;
      return (data ?? []) as unknown as Op[];
    },
  });

  const { data: maquinas = [] } = useQuery({
    queryKey: ["maquinas-lite"],
    queryFn: async (): Promise<Maq[]> => {
      const { data, error } = await supabase.from("maquinas").select("id, nome").order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as Maq[];
    },
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores-lite"],
    queryFn: async (): Promise<Forn[]> => {
      const { data, error } = await supabase.from("fornecedores").select("id, nome, razao_social").order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as Forn[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const isEdit = "id" in form && form.id;
      const payload = {
        ...form,
        centro_trabalho: form.centro_trabalho || null,
        observacao: form.observacao || null,
      };
      const q = isEdit
        ? supabase.from("roteiro_etapas" as never).update(payload as never).eq("id", (form as Etapa).id)
        : supabase.from("roteiro_etapas" as never).insert(payload as never);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Etapa salva.");
      setDlg(false);
      qc.invalidateQueries({ queryKey: ["roteiro-etapas", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (etapaId: string) => {
      const { error } = await supabase.from("roteiro_etapas" as never).delete().eq("id", etapaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Etapa removida.");
      qc.invalidateQueries({ queryKey: ["roteiro-etapas", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveMut = useMutation({
    mutationFn: async ({ a, b }: { a: Etapa; b: Etapa }) => {
      // swap sequencias em duas etapas via update temporário para respeitar UNIQUE(roteiro_id, sequencia)
      const tmp = -Math.abs(a.sequencia) - 1000;
      const { error: e1 } = await supabase.from("roteiro_etapas" as never).update({ sequencia: tmp } as never).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("roteiro_etapas" as never).update({ sequencia: a.sequencia } as never).eq("id", b.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("roteiro_etapas" as never).update({ sequencia: b.sequencia } as never).eq("id", a.id);
      if (e3) throw e3;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roteiro-etapas", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openNova = () => {
    const nextSeq = etapas.length > 0 ? Math.max(...etapas.map((e) => e.sequencia)) + 1 : 1;
    setForm(emptyEtapa(id, nextSeq));
    setDlg(true);
  };

  const preencherPorOperacao = (opId: string) => {
    const op = operacoes.find((o) => o.id === opId);
    if (!op) { setForm({ ...form, operacao_id: opId }); return; }
    setForm({
      ...form,
      operacao_id: opId,
      nome_operacao: op.nome,
      centro_trabalho: op.centro_trabalho ?? "",
      tempo_padrao_min: op.tempo_padrao_min || form.tempo_padrao_min,
      setup_min: op.setup_padrao_min || form.setup_min,
    });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/pcp/roteiros" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Roteiros
        </Link>
      </div>

      <PageHeader
        title={roteiro ? `${roteiro.codigo} — ${roteiro.descricao}` : "Roteiro"}
        description={roteiro ? `Revisão ${roteiro.revisao} · Etapas ordenadas do fluxo produtivo` : ""}
        actions={<Button onClick={openNova}><Plus className="mr-2 h-4 w-4" /> Nova etapa</Button>}
      />

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Seq.</TableHead>
              <TableHead>Operação</TableHead>
              <TableHead>Centro</TableHead>
              <TableHead>Máquina pref.</TableHead>
              <TableHead className="text-right">Tempo</TableHead>
              <TableHead className="text-right">Setup</TableHead>
              <TableHead className="text-right">Perdas %</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            )}
            {!isLoading && etapas.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma etapa. Comece pela sequência 01.</TableCell></TableRow>
            )}
            {etapas.map((e, i) => {
              const maq = maquinas.find((m) => m.id === e.maquina_preferencial_id);
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-mono">{String(e.sequencia).padStart(2, "0")}</TableCell>
                  <TableCell className="font-medium">{e.nome_operacao}</TableCell>
                  <TableCell>{e.centro_trabalho ?? "—"}</TableCell>
                  <TableCell>{maq?.nome ?? "—"}</TableCell>
                  <TableCell className="text-right">{e.tempo_padrao_min} min</TableCell>
                  <TableCell className="text-right">{e.setup_min} min</TableCell>
                  <TableCell className="text-right">{e.perdas_previstas_pct}%</TableCell>
                  <TableCell className="space-x-1">
                    {e.qualidade_obrigatoria && <Badge variant="outline">QA</Badge>}
                    {e.terceirizada && <Badge variant="secondary">Terceirizada</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => moveMut.mutate({ a: etapas[i - 1], b: e })}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" disabled={i === etapas.length - 1} onClick={() => moveMut.mutate({ a: e, b: etapas[i + 1] })}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setForm(e); setDlg(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir etapa?")) delMut.mutate(e.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{"id" in form && form.id ? "Editar etapa" : "Nova etapa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Sequência</Label>
                <Input type="number" value={form.sequencia} onChange={(e) => setForm({ ...form, sequencia: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <Label>Operação (catálogo)</Label>
                <Select value={form.operacao_id ?? "__none"} onValueChange={(v) => preencherPorOperacao(v === "__none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Livre —</SelectItem>
                    {operacoes.map((o) => <SelectItem key={o.id} value={o.id}>{o.codigo} — {o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome da operação</Label>
                <Input value={form.nome_operacao} onChange={(e) => setForm({ ...form, nome_operacao: e.target.value })} placeholder="Ex.: Malharia" />
              </div>
              <div>
                <Label>Centro de trabalho</Label>
                <Input value={form.centro_trabalho ?? ""} onChange={(e) => setForm({ ...form, centro_trabalho: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Máquina preferencial</Label>
              <Select value={form.maquina_preferencial_id ?? "__none"} onValueChange={(v) => setForm({ ...form, maquina_preferencial_id: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Nenhuma —</SelectItem>
                  {maquinas.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>Tempo (min)</Label>
                <Input type="number" step="0.01" value={form.tempo_padrao_min} onChange={(e) => setForm({ ...form, tempo_padrao_min: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Setup (min)</Label>
                <Input type="number" step="0.01" value={form.setup_min} onChange={(e) => setForm({ ...form, setup_min: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Consumo prev.</Label>
                <Input type="number" step="0.001" value={form.consumo_previsto} onChange={(e) => setForm({ ...form, consumo_previsto: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Perdas %</Label>
                <Input type="number" step="0.01" value={form.perdas_previstas_pct} onChange={(e) => setForm({ ...form, perdas_previstas_pct: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.qualidade_obrigatoria} onCheckedChange={(v) => setForm({ ...form, qualidade_obrigatoria: Boolean(v) })} id="qa" />
                <Label htmlFor="qa">Qualidade obrigatória</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.terceirizada} onCheckedChange={(v) => setForm({ ...form, terceirizada: Boolean(v) })} id="terc" />
                <Label htmlFor="terc">Terceirizada</Label>
              </div>
            </div>
            {form.terceirizada && (
              <div>
                <Label>Fornecedor terceiro</Label>
                <Select value={form.fornecedor_terceiro_id ?? "__none"} onValueChange={(v) => setForm({ ...form, fornecedor_terceiro_id: v === "__none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Nenhum —</SelectItem>
                    {fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome ?? f.razao_social ?? f.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Observação</Label>
              <Input value={form.observacao ?? ""} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.nome_operacao}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
