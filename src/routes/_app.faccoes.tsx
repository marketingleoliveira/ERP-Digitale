import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Loader2, Scissors, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/faccoes")({ component: FaccoesPage });

type Faccao = {
  id: string; nome: string; cnpj: string | null; responsavel: string | null;
  telefone: string | null; email: string | null; cidade: string | null; uf: string | null;
  especialidade: string | null; capacidade_mensal: number | null; custo_peca: number | null;
  prazo_medio_dias: number | null; ativo: boolean;
};
type Ordem = {
  id: string; numero: number; faccao_id: string; descricao: string;
  quantidade_enviada: number; quantidade_retornada: number; perdas: number; custo_total: number;
  data_envio: string | null; data_prevista: string | null; data_retorno: string | null; status: string;
};

const fmt = (v: number | null) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));
const statusColor: Record<string, string> = {
  enviado: "bg-info/15 text-info",
  produzindo: "bg-warning/15 text-warning",
  retornado: "bg-success/15 text-success",
  cancelado: "bg-destructive/15 text-destructive",
};

function FaccoesPage() {
  const [faccoes, setFaccoes] = useState<Faccao[]>([]);
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openF, setOpenF] = useState(false);
  const [openO, setOpenO] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ nome: "", cnpj: "", responsavel: "", telefone: "", email: "", cidade: "", uf: "", especialidade: "", capacidade_mensal: "", custo_peca: "", prazo_medio_dias: "", observacoes: "" });
  const [o, setO] = useState({ faccao_id: "", descricao: "", quantidade_enviada: "", custo_total: "", data_envio: "", data_prevista: "", status: "enviado", observacoes: "" });

  const load = async () => {
    setLoading(true);
    const [ff, oo] = await Promise.all([
      supabase.from("faccoes").select("*").order("nome"),
      supabase.from("faccao_ordens").select("*").order("numero", { ascending: false }),
    ]);
    if (ff.error) toast.error(ff.error.message); else setFaccoes((ff.data ?? []) as any);
    if (oo.error) toast.error(oo.error.message); else setOrdens((oo.data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveFaccao = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("faccoes").insert({
      nome: f.nome, cnpj: f.cnpj || null, responsavel: f.responsavel || null,
      telefone: f.telefone || null, email: f.email || null, cidade: f.cidade || null, uf: f.uf || null,
      especialidade: f.especialidade || null,
      capacidade_mensal: f.capacidade_mensal ? Number(f.capacidade_mensal) : null,
      custo_peca: f.custo_peca ? Number(f.custo_peca) : null,
      prazo_medio_dias: f.prazo_medio_dias ? Number(f.prazo_medio_dias) : null,
      observacoes: f.observacoes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Facção cadastrada"); setOpenF(false);
    setF({ nome: "", cnpj: "", responsavel: "", telefone: "", email: "", cidade: "", uf: "", especialidade: "", capacidade_mensal: "", custo_peca: "", prazo_medio_dias: "", observacoes: "" });
    load();
  };

  const saveOrdem = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const next = (ordens[0]?.numero ?? 0) + 1;
    const { error } = await supabase.from("faccao_ordens").insert({
      numero: next, faccao_id: o.faccao_id, descricao: o.descricao,
      quantidade_enviada: Number(o.quantidade_enviada || 0),
      custo_total: Number(o.custo_total || 0),
      data_envio: o.data_envio || null, data_prevista: o.data_prevista || null,
      status: o.status, observacoes: o.observacoes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Envio registrado"); setOpenO(false);
    setO({ faccao_id: "", descricao: "", quantidade_enviada: "", custo_total: "", data_envio: "", data_prevista: "", status: "enviado", observacoes: "" });
    load();
  };

  const faccaoNome = (id: string) => faccoes.find((x) => x.id === id)?.nome ?? "—";

  const colsF: Column<Faccao>[] = [
    { key: "nome", header: "Facção", sortable: true, render: (r) => <div><p className="font-medium">{r.nome}</p><p className="text-xs text-muted-foreground">{r.cnpj ?? ""}</p></div> },
    { key: "responsavel", header: "Responsável", render: (r) => r.responsavel ?? "—" },
    { key: "cidade", header: "Localização", render: (r) => [r.cidade, r.uf].filter(Boolean).join("/") || "—" },
    { key: "especialidade", header: "Especialidade", render: (r) => r.especialidade ?? "—" },
    { key: "capacidade_mensal", header: "Cap. mensal", className: "text-right tabular-nums", render: (r) => r.capacidade_mensal?.toLocaleString("pt-BR") ?? "—" },
    { key: "custo_peca", header: "Custo/peça", className: "text-right tabular-nums", render: (r) => fmt(r.custo_peca) },
    { key: "prazo_medio_dias", header: "Prazo", render: (r) => r.prazo_medio_dias ? `${r.prazo_medio_dias} d` : "—" },
    { key: "ativo", header: "Status", render: (r) => <Badge className={r.ativo ? "bg-success/15 text-success" : "bg-muted"}>{r.ativo ? "Ativa" : "Inativa"}</Badge> },
  ];
  const colsO: Column<Ordem>[] = [
    { key: "numero", header: "#", render: (r) => <span className="font-mono">#{r.numero}</span> },
    { key: "faccao_id", header: "Facção", render: (r) => faccaoNome(r.faccao_id) },
    { key: "descricao", header: "Descrição" },
    { key: "quantidade_enviada", header: "Enviado", className: "text-right tabular-nums", render: (r) => Number(r.quantidade_enviada).toLocaleString("pt-BR") },
    { key: "quantidade_retornada", header: "Retornado", className: "text-right tabular-nums", render: (r) => Number(r.quantidade_retornada).toLocaleString("pt-BR") },
    { key: "perdas", header: "Perdas", className: "text-right tabular-nums", render: (r) => Number(r.perdas).toLocaleString("pt-BR") },
    { key: "custo_total", header: "Custo", className: "text-right tabular-nums", render: (r) => fmt(r.custo_total) },
    { key: "data_prevista", header: "Previsão", render: (r) => r.data_prevista ? new Date(r.data_prevista).toLocaleDateString("pt-BR") : "—" },
    { key: "status", header: "Status", render: (r) => <Badge className={statusColor[r.status] ?? "bg-muted"}>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facções Terceirizadas"
        description="Cadastro de parceiros, envio/retorno de material, perdas e custos."
        actions={
          <div className="flex gap-2">
            <Dialog open={openO} onOpenChange={setOpenO}>
              <DialogTrigger asChild><Button variant="outline" disabled={faccoes.length === 0}><Send className="h-4 w-4 mr-1.5" />Novo envio</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Envio para facção</DialogTitle></DialogHeader>
                <form onSubmit={saveOrdem} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2"><Label>Facção *</Label>
                    <Select value={o.faccao_id} onValueChange={(v) => setO({ ...o, faccao_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                      <SelectContent>{faccoes.map((x) => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2"><Label>Descrição *</Label><Input required value={o.descricao} onChange={(e) => setO({ ...o, descricao: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Quantidade enviada *</Label><Input required type="number" step="0.01" value={o.quantidade_enviada} onChange={(e) => setO({ ...o, quantidade_enviada: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Custo total</Label><Input type="number" step="0.01" value={o.custo_total} onChange={(e) => setO({ ...o, custo_total: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Data envio</Label><Input type="date" value={o.data_envio} onChange={(e) => setO({ ...o, data_envio: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Previsão retorno</Label><Input type="date" value={o.data_prevista} onChange={(e) => setO({ ...o, data_prevista: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Status</Label>
                    <Select value={o.status} onValueChange={(v) => setO({ ...o, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enviado">Enviado</SelectItem>
                        <SelectItem value="produzindo">Produzindo</SelectItem>
                        <SelectItem value="retornado">Retornado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2"><Label>Observações</Label><Textarea rows={2} value={o.observacoes} onChange={(e) => setO({ ...o, observacoes: e.target.value })} /></div>
                  <DialogFooter className="col-span-2">
                    <Button type="button" variant="outline" onClick={() => setOpenO(false)}>Cancelar</Button>
                    <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={openF} onOpenChange={setOpenF}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova facção</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Nova facção</DialogTitle></DialogHeader>
                <form onSubmit={saveFaccao} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2"><Label>Nome *</Label><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
                  <div className="space-y-2"><Label>CNPJ</Label><Input value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Responsável</Label><Input value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Cidade</Label><Input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
                  <div className="space-y-2"><Label>UF</Label><Input maxLength={2} value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value.toUpperCase() })} /></div>
                  <div className="col-span-2 space-y-2"><Label>Especialidade</Label><Input placeholder="Costura, estampa, bordado…" value={f.especialidade} onChange={(e) => setF({ ...f, especialidade: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Capacidade mensal</Label><Input type="number" value={f.capacidade_mensal} onChange={(e) => setF({ ...f, capacidade_mensal: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Custo por peça</Label><Input type="number" step="0.01" value={f.custo_peca} onChange={(e) => setF({ ...f, custo_peca: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Prazo médio (dias)</Label><Input type="number" value={f.prazo_medio_dias} onChange={(e) => setF({ ...f, prazo_medio_dias: e.target.value })} /></div>
                  <div className="col-span-2 space-y-2"><Label>Observações</Label><Textarea rows={2} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} /></div>
                  <DialogFooter className="col-span-2">
                    <Button type="button" variant="outline" onClick={() => setOpenF(false)}>Cancelar</Button>
                    <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <Tabs defaultValue="faccoes">
          <TabsList>
            <TabsTrigger value="faccoes">Facções ({faccoes.length})</TabsTrigger>
            <TabsTrigger value="ordens">Envios/Retornos ({ordens.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="faccoes" className="mt-4">
            {faccoes.length === 0
              ? <EmptyState icon={<Scissors className="h-5 w-5" />} title="Nenhuma facção cadastrada" description="Clique em “Nova facção” para começar." />
              : <DataTable data={faccoes} columns={colsF} searchKeys={["nome","cnpj","responsavel","cidade","especialidade"]} />}
          </TabsContent>
          <TabsContent value="ordens" className="mt-4">
            {ordens.length === 0
              ? <EmptyState icon={<Send className="h-5 w-5" />} title="Nenhum envio registrado" description="Clique em “Novo envio” para registrar o primeiro." />
              : <DataTable data={ordens} columns={colsO} searchKeys={["descricao","status"]} />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
