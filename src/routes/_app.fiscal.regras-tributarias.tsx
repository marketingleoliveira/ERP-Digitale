import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { RegraTributaria } from "@/services/fiscal/tax-engine/types";

export const Route = createFileRoute("/_app/fiscal/regras-tributarias")({ ssr: false, component: RegrasPage });

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","EX","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const REGIMES = [["simples","Simples Nacional"],["presumido","Lucro Presumido"],["real","Lucro Real"]] as const;
const TIPOS_CLIENTE = [["pj_contribuinte","PJ Contribuinte"],["pj_nao_contrib","PJ Não Contribuinte"],["pf","Pessoa Física"],["orgao_publico","Órgão Público"],["exterior","Exterior"]] as const;
const OPERACOES = [["venda","Venda"],["devolucao","Devolução"],["remessa","Remessa"],["retorno","Retorno"],["bonif","Bonificação"],["amostra","Amostra"],["industrializacao","Industrialização"],["exportacao","Exportação"]] as const;
const FINALIDADES = [["consumo","Consumo"],["revenda","Revenda"],["industrializacao","Industrialização"],["ativo","Ativo Imobilizado"]] as const;

async function fetchAll(): Promise<RegraTributaria[]> {
  const { data, error } = await supabase.from("regras_tributarias" as never).select("*").order("prioridade", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RegraTributaria[];
}

function RegrasPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["regras_tributarias"], queryFn: fetchAll });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RegraTributaria | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("regras_tributarias" as never) as never as {
        delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
      }).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluída."); qc.invalidateQueries({ queryKey: ["regras_tributarias"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">⚙️ Regras Tributárias</h1>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><FilePlus2 className="h-4 w-4 mr-1.5" />Nova regra</Button>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              {["Prioridade","Nome","Origem→Destino","Operação","NCM","CFOP","CST/CSOSN","ICMS%","ST","Ativa","Ações"].map((h) => (
                <TableHead key={h} className="text-primary-foreground">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8"><Loader2 className="h-4 w-4 inline animate-spin" /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Nenhuma regra cadastrada.</TableCell></TableRow>
            ) : data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.prioridade}</TableCell>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell className="text-xs">{(r.uf_origem ?? "*")}→{(r.uf_destino ?? "*")}</TableCell>
                <TableCell className="text-xs">{r.tipo_operacao ?? "todas"}</TableCell>
                <TableCell className="text-xs">{r.ncm_prefix ?? "*"}</TableCell>
                <TableCell className="font-mono">{r.cfop}</TableCell>
                <TableCell className="font-mono">{r.cst_icms ?? r.csosn ?? "—"}</TableCell>
                <TableCell>{Number(r.aliq_icms).toFixed(2)}</TableCell>
                <TableCell>{r.calcula_st ? <Badge variant="default">Sim</Badge> : <Badge variant="outline">Não</Badge>}</TableCell>
                <TableCell>{r.ativo ? "Sim" : "Não"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <RegraDialog open={open} onOpenChange={setOpen} editing={editing} />
      <p className="text-xs text-muted-foreground">Regras com escopo mais específico têm prioridade automática. Use "Prioridade" apenas como desempate.</p>
    </div>
  );
}

const empty: Omit<RegraTributaria, "id"> = {
  nome: "", prioridade: 100, ativo: true,
  uf_origem: null, uf_destino: null, regime_tributario_emitente: null,
  tipo_cliente: null, tipo_operacao: "venda", ncm_prefix: null, cest: null, finalidade: null,
  cfop: "", cst_icms: null, csosn: null,
  aliq_icms: 0, red_base_icms_pct: 0,
  calcula_st: false, mva_pct: 0, aliq_icms_st: 0,
  aliq_fcp: 0, aliq_fcp_st: 0,
  cst_ipi: null, aliq_ipi: 0,
  cst_pis: "01", aliq_pis: 1.65,
  cst_cofins: "01", aliq_cofins: 7.6,
  calcula_difal: false, observacao: null,
};

function RegraDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: RegraTributaria | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Omit<RegraTributaria, "id">>(empty);
  useEffect(() => { setForm(editing ?? empty); }, [editing, open]);
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form,
        uf_origem: form.uf_origem || null, uf_destino: form.uf_destino || null,
        ncm_prefix: form.ncm_prefix || null, cest: form.cest || null,
        cst_icms: form.cst_icms || null, csosn: form.csosn || null,
        cst_ipi: form.cst_ipi || null, cst_pis: form.cst_pis || null, cst_cofins: form.cst_cofins || null,
        observacao: form.observacao || null,
      };
      if (editing) {
        const { error } = await (supabase.from("regras_tributarias" as never) as never as {
          update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
        }).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("regras_tributarias" as never) as never as {
          insert: (v: object) => Promise<{ error: Error | null }>;
        }).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Regra salva."); qc.invalidateQueries({ queryKey: ["regras_tributarias"] }); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const optSelect = (val: string | null, setter: (v: string | null) => void, opts: readonly (readonly [string, string])[]) => (
    <Select value={val ?? "__all__"} onValueChange={(v) => setter(v === "__all__" ? null : v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">Qualquer</SelectItem>
        {opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Editar regra" : "Nova regra tributária"}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <fieldset className="grid grid-cols-4 gap-3">
            <legend className="text-sm font-semibold">Identificação</legend>
            <div className="col-span-3"><Label>Nome</Label><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
            <div><Label>Prioridade</Label><Input type="number" value={form.prioridade} onChange={(e) => set("prioridade", Number(e.target.value))} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} /><Label>Ativa</Label></div>
          </fieldset>

          <fieldset className="grid grid-cols-4 gap-3">
            <legend className="text-sm font-semibold">Escopo (deixe vazio = qualquer)</legend>
            <div><Label>UF Origem</Label>{optSelect(form.uf_origem, (v) => set("uf_origem", v), UFS.map(u => [u, u] as const))}</div>
            <div><Label>UF Destino</Label>{optSelect(form.uf_destino, (v) => set("uf_destino", v), UFS.map(u => [u, u] as const))}</div>
            <div><Label>Regime Emitente</Label>{optSelect(form.regime_tributario_emitente, (v) => set("regime_tributario_emitente", v as typeof form.regime_tributario_emitente), REGIMES)}</div>
            <div><Label>Tipo Cliente</Label>{optSelect(form.tipo_cliente, (v) => set("tipo_cliente", v as typeof form.tipo_cliente), TIPOS_CLIENTE)}</div>
            <div><Label>Operação</Label>{optSelect(form.tipo_operacao, (v) => set("tipo_operacao", v as typeof form.tipo_operacao), OPERACOES)}</div>
            <div><Label>Finalidade</Label>{optSelect(form.finalidade, (v) => set("finalidade", v as typeof form.finalidade), FINALIDADES)}</div>
            <div><Label>NCM Prefixo</Label><Input value={form.ncm_prefix ?? ""} onChange={(e) => set("ncm_prefix", e.target.value || null)} placeholder="ex. 6006" /></div>
            <div><Label>CEST</Label><Input value={form.cest ?? ""} onChange={(e) => set("cest", e.target.value || null)} /></div>
          </fieldset>

          <fieldset className="grid grid-cols-4 gap-3">
            <legend className="text-sm font-semibold">ICMS</legend>
            <div><Label>CFOP</Label><Input value={form.cfop} onChange={(e) => set("cfop", e.target.value)} /></div>
            <div><Label>CST ICMS</Label><Input value={form.cst_icms ?? ""} onChange={(e) => set("cst_icms", e.target.value || null)} /></div>
            <div><Label>CSOSN</Label><Input value={form.csosn ?? ""} onChange={(e) => set("csosn", e.target.value || null)} /></div>
            <div><Label>Alíquota ICMS %</Label><Input type="number" step="0.01" value={form.aliq_icms} onChange={(e) => set("aliq_icms", Number(e.target.value))} /></div>
            <div><Label>Redução Base %</Label><Input type="number" step="0.01" value={form.red_base_icms_pct} onChange={(e) => set("red_base_icms_pct", Number(e.target.value))} /></div>
            <div><Label>FCP %</Label><Input type="number" step="0.01" value={form.aliq_fcp} onChange={(e) => set("aliq_fcp", Number(e.target.value))} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.calcula_difal} onCheckedChange={(v) => set("calcula_difal", v)} /><Label>Calcula DIFAL</Label></div>
          </fieldset>

          <fieldset className="grid grid-cols-4 gap-3">
            <legend className="text-sm font-semibold">ICMS ST</legend>
            <div className="flex items-center gap-2"><Switch checked={form.calcula_st} onCheckedChange={(v) => set("calcula_st", v)} /><Label>Calcula ST</Label></div>
            <div><Label>MVA %</Label><Input type="number" step="0.01" value={form.mva_pct} onChange={(e) => set("mva_pct", Number(e.target.value))} /></div>
            <div><Label>Alíq. ICMS ST %</Label><Input type="number" step="0.01" value={form.aliq_icms_st} onChange={(e) => set("aliq_icms_st", Number(e.target.value))} /></div>
            <div><Label>FCP ST %</Label><Input type="number" step="0.01" value={form.aliq_fcp_st} onChange={(e) => set("aliq_fcp_st", Number(e.target.value))} /></div>
          </fieldset>

          <fieldset className="grid grid-cols-4 gap-3">
            <legend className="text-sm font-semibold">IPI / PIS / COFINS</legend>
            <div><Label>CST IPI</Label><Input value={form.cst_ipi ?? ""} onChange={(e) => set("cst_ipi", e.target.value || null)} /></div>
            <div><Label>Alíq. IPI %</Label><Input type="number" step="0.01" value={form.aliq_ipi} onChange={(e) => set("aliq_ipi", Number(e.target.value))} /></div>
            <div><Label>CST PIS</Label><Input value={form.cst_pis ?? ""} onChange={(e) => set("cst_pis", e.target.value || null)} /></div>
            <div><Label>Alíq. PIS %</Label><Input type="number" step="0.0001" value={form.aliq_pis} onChange={(e) => set("aliq_pis", Number(e.target.value))} /></div>
            <div><Label>CST COFINS</Label><Input value={form.cst_cofins ?? ""} onChange={(e) => set("cst_cofins", e.target.value || null)} /></div>
            <div><Label>Alíq. COFINS %</Label><Input type="number" step="0.0001" value={form.aliq_cofins} onChange={(e) => set("aliq_cofins", Number(e.target.value))} /></div>
          </fieldset>

          <div><Label>Observação</Label><Input value={form.observacao ?? ""} onChange={(e) => set("observacao", e.target.value || null)} /></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !form.nome || !form.cfop}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
