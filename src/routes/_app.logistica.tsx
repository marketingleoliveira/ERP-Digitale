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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Plus, Loader2, PackageCheck, Truck, MapPin, ClipboardCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/logistica")({ component: LogisticaPage });

const dt = (d?: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");
const statusCls: Record<string, string> = {
  preparando: "bg-info/15 text-info",
  separado: "bg-warning/15 text-warning",
  em_transito: "bg-primary/15 text-primary",
  entregue: "bg-success/15 text-success",
  cancelado: "bg-destructive/15 text-destructive",
};

type Transp = { id: string; nome: string; cnpj: string | null; contato: string | null; telefone: string | null; email: string | null; modal: string; prazo_medio_dias: number | null; ativo: boolean };
type Ship = { id: string; numero: string; data_saida: string | null; previsao_entrega: string | null; data_entrega: string | null; volumes: number; peso_kg: number | null; frete_valor: number | null; rastreio: string | null; status: string; sales_order_id: string | null; customer: { razao_social: string } | null; transportadora: { nome: string } | null; order: { numero: number } | null };

function LogisticaPage() {
  const [loading, setLoading] = useState(true);
  const [transps, setTransps] = useState<Transp[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [customers, setCustomers] = useState<{ id: string; razao_social: string }[]>([]);
  const [orders, setOrders] = useState<{ id: string; numero: number }[]>([]);

  const load = async () => {
    setLoading(true);
    const [t, s, c, o] = await Promise.all([
      supabase.from("transportadoras").select("*").order("nome"),
      supabase.from("shipments").select("*, customer:customers(razao_social), transportadora:transportadoras(nome), order:sales_orders(numero)").order("created_at", { ascending: false }),
      supabase.from("customers").select("id,razao_social").order("razao_social"),
      supabase.from("sales_orders").select("id,numero").order("numero", { ascending: false }).limit(200),
    ]);
    setTransps((t.data ?? []) as any);
    setShips((s.data ?? []) as any);
    setCustomers((c.data ?? []) as any);
    setOrders((o.data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => ({
    total: ships.length,
    em_transito: ships.filter((s) => s.status === "em_transito").length,
    entregues: ships.filter((s) => s.status === "entregue").length,
    transportadoras: transps.filter((t) => t.ativo).length,
  }), [ships, transps]);

  const advance = async (s: Ship) => {
    const next: Record<string, string> = { preparando: "separado", separado: "em_transito", em_transito: "entregue" };
    const novo = next[s.status];
    if (!novo) return;
    const patch: any = { status: novo };
    if (novo === "em_transito" && !s.data_saida) patch.data_saida = new Date().toISOString().slice(0, 10);
    if (novo === "entregue") patch.data_entrega = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("shipments").update(patch).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success(`Status: ${novo.replace("_", " ")}`);
    load();
  };

  const transpCols: Column<Transp>[] = [
    { key: "nome", header: "Transportadora", render: (r) => <div><p className="font-medium">{r.nome}</p><p className="text-xs text-muted-foreground">{r.cnpj ?? "—"}</p></div> },
    { key: "modal", header: "Modal", render: (r) => <Badge variant="outline">{r.modal}</Badge> },
    { key: "contato", header: "Contato", render: (r) => <div className="text-sm"><p>{r.contato ?? "—"}</p><p className="text-xs text-muted-foreground">{r.telefone ?? r.email ?? ""}</p></div> },
    { key: "prazo_medio_dias", header: "Prazo médio", render: (r) => (r.prazo_medio_dias ?? "—") + (r.prazo_medio_dias ? " dias" : "") },
    { key: "ativo", header: "Status", render: (r) => r.ativo ? <Badge className="bg-success/15 text-success">Ativo</Badge> : <Badge variant="outline">Inativo</Badge> },
  ];
  const shipCols: Column<Ship>[] = [
    { key: "numero", header: "Romaneio", className: "font-mono text-xs", render: (r) => <div><p className="font-semibold">{r.numero}</p><p className="text-xs text-muted-foreground">{r.order ? `Pedido #${String(r.order.numero).padStart(5, "0")}` : "—"}</p></div> },
    { key: "customer", header: "Cliente", render: (r) => r.customer?.razao_social ?? "—" },
    { key: "transportadora", header: "Transportadora", render: (r) => r.transportadora?.nome ?? "—" },
    { key: "data_saida", header: "Saída", render: (r) => dt(r.data_saida) },
    { key: "previsao_entrega", header: "Previsão", render: (r) => dt(r.previsao_entrega) },
    { key: "volumes", header: "Vol/Peso", render: (r) => `${r.volumes ?? 1} vol · ${r.peso_kg ?? 0} kg` },
    { key: "status", header: "Status", render: (r) => <Badge className={statusCls[r.status] ?? "bg-muted"}>{r.status.replace("_", " ")}</Badge> },
    { key: "id", header: "Ações", render: (r) => r.status !== "entregue" && r.status !== "cancelado" ? <Button size="sm" variant="outline" onClick={() => advance(r)}>Avançar</Button> : (r.rastreio ?? "—") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Logística" description="Separação, expedição, transportadoras, romaneios e rastreamento." />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Expedições" value={String(kpis.total)} icon={<PackageCheck className="h-4 w-4" />} />
        <StatCard label="Em trânsito" value={String(kpis.em_transito)} icon={<Truck className="h-4 w-4" />} />
        <StatCard label="Entregues" value={String(kpis.entregues)} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard label="Transportadoras ativas" value={String(kpis.transportadoras)} icon={<MapPin className="h-4 w-4" />} />
      </div>

      <Tabs defaultValue="expedicoes">
        <TabsList>
          <TabsTrigger value="expedicoes">Expedições</TabsTrigger>
          <TabsTrigger value="transportadoras">Transportadoras</TabsTrigger>
        </TabsList>

        <TabsContent value="expedicoes" className="space-y-3">
          <div className="flex justify-end"><NovaExpedicao customers={customers} transps={transps} orders={orders} onSaved={load} /></div>
          {loading ? <Spinner /> : ships.length === 0 ? <EmptyState icon={<PackageCheck className="h-5 w-5" />} title="Nenhuma expedição" description="Crie um romaneio para começar a acompanhar entregas." /> : <DataTable data={ships} columns={shipCols} searchKeys={["numero","status","rastreio"]} />}
        </TabsContent>

        <TabsContent value="transportadoras" className="space-y-3">
          <div className="flex justify-end"><NovaTransp onSaved={load} /></div>
          {loading ? <Spinner /> : transps.length === 0 ? <EmptyState icon={<Truck className="h-5 w-5" />} title="Nenhuma transportadora" description="Cadastre parceiros logísticos para usar nas expedições." /> : <DataTable data={transps} columns={transpCols} searchKeys={["nome","cnpj"]} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Spinner = () => <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

function NovaTransp({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ nome: "", cnpj: "", contato: "", telefone: "", email: "", modal: "rodoviario", prazo_medio_dias: "", observacoes: "" });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("transportadoras").insert({
      nome: f.nome, cnpj: f.cnpj || null, contato: f.contato || null, telefone: f.telefone || null,
      email: f.email || null, modal: f.modal, prazo_medio_dias: f.prazo_medio_dias ? Number(f.prazo_medio_dias) : null,
      observacoes: f.observacoes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Transportadora cadastrada"); setOpen(false);
    setF({ nome: "", cnpj: "", contato: "", telefone: "", email: "", modal: "rodoviario", prazo_medio_dias: "", observacoes: "" });
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova transportadora</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova transportadora</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Nome *</Label><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div className="space-y-2"><Label>CNPJ</Label><Input value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} /></div>
          <div className="space-y-2"><Label>Modal</Label>
            <Select value={f.modal} onValueChange={(v) => setF({ ...f, modal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="rodoviario">Rodoviário</SelectItem><SelectItem value="aereo">Aéreo</SelectItem><SelectItem value="motoboy">Motoboy</SelectItem><SelectItem value="proprio">Frota própria</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Contato</Label><Input value={f.contato} onChange={(e) => setF({ ...f, contato: e.target.value })} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>E-mail</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="space-y-2"><Label>Prazo médio (dias)</Label><Input type="number" value={f.prazo_medio_dias} onChange={(e) => setF({ ...f, prazo_medio_dias: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>Observações</Label><Textarea rows={2} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovaExpedicao({ customers, transps, orders, onSaved }: { customers: { id: string; razao_social: string }[]; transps: Transp[]; orders: { id: string; numero: number }[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ numero: "", sales_order_id: "", customer_id: "", transportadora_id: "", data_saida: "", previsao_entrega: "", volumes: "1", peso_kg: "", frete_valor: "", rastreio: "", status: "preparando", observacoes: "" });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const numero = f.numero || `ROM-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from("shipments").insert({
      numero, sales_order_id: f.sales_order_id || null, customer_id: f.customer_id || null,
      transportadora_id: f.transportadora_id || null,
      data_saida: f.data_saida || null, previsao_entrega: f.previsao_entrega || null,
      volumes: Number(f.volumes || 1), peso_kg: f.peso_kg ? Number(f.peso_kg) : null,
      frete_valor: f.frete_valor ? Number(f.frete_valor) : null,
      rastreio: f.rastreio || null, status: f.status, observacoes: f.observacoes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Expedição criada"); setOpen(false);
    setF({ numero: "", sales_order_id: "", customer_id: "", transportadora_id: "", data_saida: "", previsao_entrega: "", volumes: "1", peso_kg: "", frete_valor: "", rastreio: "", status: "preparando", observacoes: "" });
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova expedição</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Nova expedição / romaneio</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Número do romaneio</Label><Input value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} placeholder="Auto se vazio" /></div>
          <div className="space-y-2"><Label>Pedido de venda</Label>
            <Select value={f.sales_order_id} onValueChange={(v) => setF({ ...f, sales_order_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{orders.map((o) => <SelectItem key={o.id} value={o.id}>#{String(o.numero).padStart(5, "0")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Cliente</Label>
            <Select value={f.customer_id} onValueChange={(v) => setF({ ...f, customer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Transportadora</Label>
            <Select value={f.transportadora_id} onValueChange={(v) => setF({ ...f, transportadora_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>{transps.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Data de saída</Label><Input type="date" value={f.data_saida} onChange={(e) => setF({ ...f, data_saida: e.target.value })} /></div>
          <div className="space-y-2"><Label>Previsão de entrega</Label><Input type="date" value={f.previsao_entrega} onChange={(e) => setF({ ...f, previsao_entrega: e.target.value })} /></div>
          <div className="space-y-2"><Label>Volumes</Label><Input type="number" value={f.volumes} onChange={(e) => setF({ ...f, volumes: e.target.value })} /></div>
          <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" step="0.001" value={f.peso_kg} onChange={(e) => setF({ ...f, peso_kg: e.target.value })} /></div>
          <div className="space-y-2"><Label>Valor do frete</Label><Input type="number" step="0.01" value={f.frete_valor} onChange={(e) => setF({ ...f, frete_valor: e.target.value })} /></div>
          <div className="space-y-2"><Label>Código de rastreio</Label><Input value={f.rastreio} onChange={(e) => setF({ ...f, rastreio: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>Observações</Label><Textarea rows={2} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
