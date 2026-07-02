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
import { Plus, Loader2, Wallet, TrendingUp, TrendingDown, Banknote, CircleDollarSign } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/financeiro")({ component: FinanceiroPage });

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const dt = (d?: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");
const statusCls: Record<string, string> = {
  pendente: "bg-warning/15 text-warning",
  pago: "bg-success/15 text-success",
  recebido: "bg-success/15 text-success",
  atrasado: "bg-destructive/15 text-destructive",
  cancelado: "bg-muted text-muted-foreground",
};

type AR = { id: string; descricao: string; valor: number; data_emissao: string; data_vencimento: string; data_pagamento: string | null; status: string; forma_pagamento: string | null; customer: { razao_social: string } | null };
type AP = { id: string; descricao: string; valor: number; data_emissao: string; data_vencimento: string; data_pagamento: string | null; status: string; categoria: string | null; supplier: { razao_social: string } | null };
type Bank = { id: string; nome: string; banco: string | null; agencia: string | null; conta: string | null; tipo: string; saldo_inicial: number; ativo: boolean };
type Cash = { id: string; data: string; tipo: string; categoria: string | null; descricao: string; valor: number; documento: string | null; conciliado: boolean; bank_account_id: string | null; bank: { nome: string } | null };

function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [ar, setAr] = useState<AR[]>([]);
  const [ap, setAp] = useState<AP[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [cash, setCash] = useState<Cash[]>([]);
  const [customers, setCustomers] = useState<{ id: string; razao_social: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; razao_social: string }[]>([]);

  const load = async () => {
    setLoading(true);
    const [a, b, c, d, cu, su] = await Promise.all([
      supabase.from("accounts_receivable").select("id,descricao,valor,data_emissao,data_vencimento,data_pagamento,status,forma_pagamento,customer:customers(razao_social)").order("data_vencimento", { ascending: true }),
      supabase.from("accounts_payable").select("id,descricao,valor,data_emissao,data_vencimento,data_pagamento,status,categoria,supplier:suppliers(razao_social)").order("data_vencimento", { ascending: true }),
      supabase.from("bank_accounts").select("*").order("nome"),
      supabase.from("cash_movements").select("*,bank:bank_accounts(nome)").order("data", { ascending: false }),
      supabase.from("customers").select("id,razao_social").order("razao_social"),
      supabase.from("suppliers").select("id,razao_social").order("razao_social"),
    ]);
    setAr((a.data ?? []) as any);
    setAp((b.data ?? []) as any);
    setBanks((c.data ?? []) as any);
    setCash((d.data ?? []) as any);
    setCustomers((cu.data ?? []) as any);
    setSuppliers((su.data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const receber = ar.filter((r) => r.status === "pendente").reduce((s, r) => s + Number(r.valor), 0);
    const pagar = ap.filter((r) => r.status === "pendente").reduce((s, r) => s + Number(r.valor), 0);
    const saldo = banks.reduce((s, r) => s + Number(r.saldo_inicial), 0)
      + cash.reduce((s, r) => s + (r.tipo === "entrada" ? Number(r.valor) : -Number(r.valor)), 0);
    const hoje = new Date().toISOString().slice(0, 10);
    const atrasadas = [...ar, ...ap].filter((r) => r.status === "pendente" && r.data_vencimento < hoje).length;
    return { receber, pagar, saldo, atrasadas };
  }, [ar, ap, banks, cash]);

  const arCols: Column<AR>[] = [
    { key: "descricao", header: "Descrição", render: (r) => <div><p className="font-medium">{r.descricao}</p><p className="text-xs text-muted-foreground">{r.customer?.razao_social ?? "—"}</p></div> },
    { key: "data_vencimento", header: "Vencimento", render: (r) => dt(r.data_vencimento) },
    { key: "valor", header: "Valor", className: "text-right tabular-nums", render: (r) => fmt(Number(r.valor)) },
    { key: "forma_pagamento", header: "Forma", render: (r) => r.forma_pagamento ?? "—" },
    { key: "status", header: "Status", render: (r) => <Badge className={statusCls[r.status] ?? "bg-muted"}>{r.status}</Badge> },
    { key: "id", header: "Ações", render: (r) => r.status === "pendente" ? <Button size="sm" variant="outline" onClick={() => baixar("ar", r.id)}>Baixar</Button> : dt(r.data_pagamento) },
  ];
  const apCols: Column<AP>[] = [
    { key: "descricao", header: "Descrição", render: (r) => <div><p className="font-medium">{r.descricao}</p><p className="text-xs text-muted-foreground">{r.supplier?.razao_social ?? "—"}</p></div> },
    { key: "data_vencimento", header: "Vencimento", render: (r) => dt(r.data_vencimento) },
    { key: "valor", header: "Valor", className: "text-right tabular-nums", render: (r) => fmt(Number(r.valor)) },
    { key: "categoria", header: "Categoria", render: (r) => r.categoria ?? "—" },
    { key: "status", header: "Status", render: (r) => <Badge className={statusCls[r.status] ?? "bg-muted"}>{r.status}</Badge> },
    { key: "id", header: "Ações", render: (r) => r.status === "pendente" ? <Button size="sm" variant="outline" onClick={() => baixar("ap", r.id)}>Pagar</Button> : dt(r.data_pagamento) },
  ];

  const baixar = async (tipo: "ar" | "ap", id: string) => {
    const table = tipo === "ar" ? "accounts_receivable" : "accounts_payable";
    const { error } = await supabase.from(table).update({ status: tipo === "ar" ? "recebido" : "pago", data_pagamento: new Date().toISOString().slice(0, 10) }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Baixa registrada");
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Contas a pagar/receber, fluxo de caixa, bancos e conciliação." />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="A Receber" value={fmt(totals.receber)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="A Pagar" value={fmt(totals.pagar)} icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard label="Saldo em Contas" value={fmt(totals.saldo)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Títulos Atrasados" value={String(totals.atrasadas)} icon={<CircleDollarSign className="h-4 w-4" />} />
      </div>

      <Tabs defaultValue="receber">
        <TabsList>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="bancos">Bancos</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-3">
          <div className="flex justify-end"><NovoAR customers={customers} onSaved={load} /></div>
          {loading ? <Spinner /> : ar.length === 0 ? <EmptyState icon={<TrendingUp className="h-5 w-5" />} title="Sem contas a receber" description="Cadastre lançamentos ou gere a partir de vendas." /> : <DataTable data={ar} columns={arCols} searchKeys={["descricao","status"]} />}
        </TabsContent>

        <TabsContent value="pagar" className="space-y-3">
          <div className="flex justify-end"><NovoAP suppliers={suppliers} onSaved={load} /></div>
          {loading ? <Spinner /> : ap.length === 0 ? <EmptyState icon={<TrendingDown className="h-5 w-5" />} title="Sem contas a pagar" description="Cadastre lançamentos ou vincule a compras." /> : <DataTable data={ap} columns={apCols} searchKeys={["descricao","status"]} />}
        </TabsContent>

        <TabsContent value="bancos" className="space-y-3">
          <div className="flex justify-end"><NovoBanco onSaved={load} /></div>
          {loading ? <Spinner /> : banks.length === 0 ? <EmptyState icon={<Banknote className="h-5 w-5" />} title="Nenhuma conta bancária" description="Cadastre suas contas para controlar saldos e fluxo." /> : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {banks.map((b) => {
                const mov = cash.filter((c) => c.bank_account_id === b.id).reduce((s, c) => s + (c.tipo === "entrada" ? Number(c.valor) : -Number(c.valor)), 0);
                return (
                  <div key={b.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div><p className="font-semibold">{b.nome}</p><p className="text-xs text-muted-foreground">{b.banco ?? ""} {b.agencia ? `Ag ${b.agencia}` : ""} {b.conta ? `C/C ${b.conta}` : ""}</p></div>
                      <Badge variant="outline">{b.tipo}</Badge>
                    </div>
                    <div className="mt-3 text-2xl font-semibold tabular-nums">{fmt(Number(b.saldo_inicial) + mov)}</div>
                    <p className="text-xs text-muted-foreground">Saldo inicial {fmt(Number(b.saldo_inicial))} · Mov. {fmt(mov)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fluxo" className="space-y-3">
          <div className="flex justify-end"><NovoCaixa banks={banks} onSaved={load} /></div>
          {loading ? <Spinner /> : cash.length === 0 ? <EmptyState icon={<CircleDollarSign className="h-5 w-5" />} title="Sem lançamentos de caixa" description="Registre entradas e saídas para acompanhar o fluxo." /> : (
            <DataTable
              data={cash}
              columns={[
                { key: "data", header: "Data", render: (r) => dt(r.data) },
                { key: "descricao", header: "Descrição", render: (r) => <div><p className="font-medium">{r.descricao}</p><p className="text-xs text-muted-foreground">{r.bank?.nome ?? "—"} · {r.categoria ?? "—"}</p></div> },
                { key: "tipo", header: "Tipo", render: (r) => <Badge className={r.tipo === "entrada" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}>{r.tipo}</Badge> },
                { key: "valor", header: "Valor", className: "text-right tabular-nums", render: (r) => (r.tipo === "entrada" ? "+" : "-") + fmt(Number(r.valor)) },
                { key: "conciliado", header: "Conciliado", render: (r) => r.conciliado ? <Badge className="bg-success/15 text-success">sim</Badge> : <Badge variant="outline">não</Badge> },
              ] as Column<Cash>[]}
              searchKeys={["descricao","categoria"]}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Spinner = () => <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

function NovoAR({ customers, onSaved }: { customers: { id: string; razao_social: string }[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ customer_id: "", descricao: "", valor: "", data_vencimento: "", forma_pagamento: "", status: "pendente" });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("accounts_receivable").insert({
      customer_id: f.customer_id || null, descricao: f.descricao,
      valor: Number(f.valor || 0), data_vencimento: f.data_vencimento,
      forma_pagamento: f.forma_pagamento || null, status: f.status,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Conta a receber criada"); setOpen(false);
    setF({ customer_id: "", descricao: "", valor: "", data_vencimento: "", forma_pagamento: "", status: "pendente" });
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Novo recebimento</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova conta a receber</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Cliente</Label>
            <Select value={f.customer_id} onValueChange={(v) => setF({ ...f, customer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2"><Label>Descrição *</Label><Input required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
          <div className="space-y-2"><Label>Valor *</Label><Input required type="number" step="0.01" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></div>
          <div className="space-y-2"><Label>Vencimento *</Label><Input required type="date" value={f.data_vencimento} onChange={(e) => setF({ ...f, data_vencimento: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>Forma de pagamento</Label>
            <Select value={f.forma_pagamento} onValueChange={(v) => setF({ ...f, forma_pagamento: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boleto">Boleto</SelectItem><SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem><SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovoAP({ suppliers, onSaved }: { suppliers: { id: string; razao_social: string }[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ supplier_id: "", descricao: "", valor: "", data_vencimento: "", categoria: "", status: "pendente" });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("accounts_payable").insert({
      supplier_id: f.supplier_id || null, descricao: f.descricao,
      valor: Number(f.valor || 0), data_vencimento: f.data_vencimento,
      categoria: f.categoria || null, status: f.status,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Conta a pagar criada"); setOpen(false);
    setF({ supplier_id: "", descricao: "", valor: "", data_vencimento: "", categoria: "", status: "pendente" });
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova despesa</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova conta a pagar</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Fornecedor</Label>
            <Select value={f.supplier_id} onValueChange={(v) => setF({ ...f, supplier_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.razao_social}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2"><Label>Descrição *</Label><Input required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
          <div className="space-y-2"><Label>Valor *</Label><Input required type="number" step="0.01" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></div>
          <div className="space-y-2"><Label>Vencimento *</Label><Input required type="date" value={f.data_vencimento} onChange={(e) => setF({ ...f, data_vencimento: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>Categoria</Label><Input value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} placeholder="Ex: Insumos, Energia, Aluguel…" /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovoBanco({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ nome: "", banco: "", agencia: "", conta: "", tipo: "corrente", saldo_inicial: "" });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("bank_accounts").insert({ ...f, saldo_inicial: Number(f.saldo_inicial || 0) });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Conta cadastrada"); setOpen(false);
    setF({ nome: "", banco: "", agencia: "", conta: "", tipo: "corrente", saldo_inicial: "" });
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nova conta bancária</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova conta bancária</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Nome *</Label><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div className="space-y-2"><Label>Banco</Label><Input value={f.banco} onChange={(e) => setF({ ...f, banco: e.target.value })} /></div>
          <div className="space-y-2"><Label>Tipo</Label>
            <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="corrente">Corrente</SelectItem><SelectItem value="poupanca">Poupança</SelectItem><SelectItem value="caixa">Caixa</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Agência</Label><Input value={f.agencia} onChange={(e) => setF({ ...f, agencia: e.target.value })} /></div>
          <div className="space-y-2"><Label>Conta</Label><Input value={f.conta} onChange={(e) => setF({ ...f, conta: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>Saldo inicial</Label><Input type="number" step="0.01" value={f.saldo_inicial} onChange={(e) => setF({ ...f, saldo_inicial: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovoCaixa({ banks, onSaved }: { banks: Bank[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ bank_account_id: "", data: new Date().toISOString().slice(0, 10), tipo: "entrada", categoria: "", descricao: "", valor: "", documento: "" });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("cash_movements").insert({
      bank_account_id: f.bank_account_id || null, data: f.data, tipo: f.tipo,
      categoria: f.categoria || null, descricao: f.descricao,
      valor: Number(f.valor || 0), documento: f.documento || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Lançamento registrado"); setOpen(false);
    setF({ bank_account_id: "", data: new Date().toISOString().slice(0, 10), tipo: "entrada", categoria: "", descricao: "", valor: "", documento: "" });
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Novo lançamento</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Novo lançamento de caixa</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Conta bancária</Label>
            <Select value={f.bank_account_id} onValueChange={(v) => setF({ ...f, bank_account_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>{banks.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Data *</Label><Input required type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
          <div className="space-y-2"><Label>Tipo *</Label>
            <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2"><Label>Descrição *</Label><Input required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
          <div className="space-y-2"><Label>Categoria</Label><Input value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} /></div>
          <div className="space-y-2"><Label>Valor *</Label><Input required type="number" step="0.01" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></div>
          <div className="col-span-2 space-y-2"><Label>Documento / Ref</Label><Input value={f.documento} onChange={(e) => setF({ ...f, documento: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
