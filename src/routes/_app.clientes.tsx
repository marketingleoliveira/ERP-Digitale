import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RecordDetailDialog } from "@/components/record-detail-dialog";

export const Route = createFileRoute("/_app/clientes")({ component: ClientesPage });

type Customer = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  segmento: string | null;
  cidade: string | null;
  uf: string | null;
  email: string | null;
  telefone: string | null;
  limite_credito: number | null;
  status: string;
};

type Option = { id: string; label: string };

const fmtBRL = (v: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

const columns: Column<Customer>[] = [
  {
    key: "razao_social",
    header: "Razão Social / Fantasia",
    sortable: true,
    render: (r) => (
      <div>
        <p className="font-medium">{r.razao_social}</p>
        <p className="text-xs text-muted-foreground">{r.nome_fantasia ?? r.cnpj ?? ""}</p>
      </div>
    ),
  },
  { key: "cnpj", header: "CNPJ/CPF", className: "font-mono text-xs" },
  { key: "cidade", header: "Cidade", render: (r) => (r.cidade ? `${r.cidade}/${r.uf ?? ""}` : "—") },
  { key: "segmento", header: "Segmento", sortable: true },
  { key: "telefone", header: "Telefone" },
  { key: "limite_credito", header: "Limite", className: "text-right", render: (r) => fmtBRL(r.limite_credito) },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge className={r.status === "ativo" ? "bg-success/15 text-success hover:bg-success/20" : "bg-muted text-muted-foreground"}>
        {r.status}
      </Badge>
    ),
  },
];

const emptyForm = {
  nome_fantasia: "",
  razao_social: "",
  matriz: "",
  cnpj: "",
  cpf: "",
  inscricao_estadual: "",
  rg: "",
  endereco: "",
  bairro: "",
  cidade: "",
  cidade_codigo: "",
  cep: "",
  uf: "",
  telefone: "",
  celular: "",
  contato: "",
  email: "",
  sales_rep_id: "",
  comissao: "0",
  transportadora_id: "",
  observacao: "",
  tipo_cliente: "",
  segmento: "",
  crt: "",
  icms: "0",
  tipo_pagamento: "",
  limite_credito: "0",
  tabela_prazo: "",
  prazo: "0",
  parcelas: "0",
  intervalo: "0",
};

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-[140px_1fr] items-center gap-3 ${className}`}>
      <Label className="text-sm font-medium text-right">{label}:</Label>
      <div className="bg-background rounded border border-input">{children}</div>
    </div>
  );
}

const bare =
  "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-9";

function ClientesPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [reps, setReps] = useState<Option[]>([]);
  const [trans, setTrans] = useState<Option[]>([]);

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*").order("razao_social");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Customer[]);
    setLoading(false);
  };

  const loadRefs = async () => {
    const [r, t] = await Promise.all([
      supabase.from("sales_reps").select("id, codigo, nome").order("nome"),
      supabase.from("transportadoras").select("id, nome").order("nome"),
    ]);
    setReps(((r.data ?? []) as any[]).map((x) => ({ id: x.id, label: `${x.codigo ?? ""} ${x.nome}`.trim() })));
    setTrans(((t.data ?? []) as any[]).map((x) => ({ id: x.id, label: x.nome })));
  };

  useEffect(() => {
    load();
    loadRefs();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.razao_social.trim()) {
      toast.error("Informe a Razão Social");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload: Record<string, unknown> = {
      ...form,
      owner_id: u.user?.id,
      comissao: Number(form.comissao) || 0,
      icms: Number(form.icms) || 0,
      limite_credito: Number(form.limite_credito) || 0,
      prazo: Number(form.prazo) || 0,
      parcelas: Number(form.parcelas) || 0,
      intervalo: Number(form.intervalo) || 0,
    };
    // convert empty strings to null
    for (const k of Object.keys(payload)) {
      if (payload[k] === "") payload[k] = null;
    }
    const { error } = await supabase.from("customers").insert(payload as any);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cliente cadastrado");
    setOpen(false);
    setForm({ ...emptyForm });
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro completo de clientes PF/PJ com dados fiscais, comerciais e financeiros."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                Novo cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={save} className="space-y-2 bg-muted/40 p-4 rounded-lg">
                <Field label="Nome Fantasia">
                  <Input className={bare} value={form.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} />
                </Field>
                <Field label="Razão Social">
                  <Input className={bare} required value={form.razao_social} onChange={(e) => set("razao_social", e.target.value)} />
                </Field>
                <Field label="Matriz">
                  <Input className={bare} value={form.matriz} onChange={(e) => set("matriz", e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="CNPJ">
                    <Input className={bare} value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} />
                  </Field>
                  <Field label="IE">
                    <Input className={bare} value={form.inscricao_estadual} onChange={(e) => set("inscricao_estadual", e.target.value)} />
                  </Field>
                  <Field label="CPF">
                    <Input className={bare} value={form.cpf} onChange={(e) => set("cpf", e.target.value)} />
                  </Field>
                  <Field label="RG">
                    <Input className={bare} value={form.rg} onChange={(e) => set("rg", e.target.value)} />
                  </Field>
                </div>

                <Field label="Endereço">
                  <Input className={bare} value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
                </Field>
                <Field label="Bairro">
                  <Input className={bare} value={form.bairro} onChange={(e) => set("bairro", e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Cidade">
                    <Input className={bare} value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
                  </Field>
                  <Field label="Cidade Código">
                    <Input className={bare} value={form.cidade_codigo} onChange={(e) => set("cidade_codigo", e.target.value)} />
                  </Field>
                  <Field label="CEP">
                    <Input className={bare} value={form.cep} onChange={(e) => set("cep", e.target.value)} />
                  </Field>
                  <Field label="UF">
                    <Input className={bare} maxLength={2} value={form.uf} onChange={(e) => set("uf", e.target.value.toUpperCase())} />
                  </Field>
                  <Field label="Telefone">
                    <Input className={bare} value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
                  </Field>
                  <Field label="Celular">
                    <Input className={bare} value={form.celular} onChange={(e) => set("celular", e.target.value)} />
                  </Field>
                </div>

                <Field label="Contato">
                  <Input className={bare} value={form.contato} onChange={(e) => set("contato", e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input className={bare} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Representante">
                    <Select value={form.sales_rep_id} onValueChange={(v) => set("sales_rep_id", v)}>
                      <SelectTrigger className={bare}>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {reps.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Comissão (%)">
                    <Input className={bare} type="number" step="0.01" value={form.comissao} onChange={(e) => set("comissao", e.target.value)} />
                  </Field>
                </div>

                <Field label="Transportadora">
                  <Select value={form.transportadora_id} onValueChange={(v) => set("transportadora_id", v)}>
                    <SelectTrigger className={bare}>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {trans.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Observação">
                  <Textarea className={`${bare} min-h-[70px] py-2`} value={form.observacao} onChange={(e) => set("observacao", e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Tipo Cliente">
                    <Select value={form.tipo_cliente} onValueChange={(v) => set("tipo_cliente", v)}>
                      <SelectTrigger className={bare}>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Atacado">Atacado</SelectItem>
                        <SelectItem value="Varejo">Varejo</SelectItem>
                        <SelectItem value="Indústria">Indústria</SelectItem>
                        <SelectItem value="Distribuidor">Distribuidor</SelectItem>
                        <SelectItem value="Consumidor Final">Consumidor Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Segmento Cliente">
                    <Input className={bare} placeholder="Fitness, Moda…" value={form.segmento} onChange={(e) => set("segmento", e.target.value)} />
                  </Field>
                  <Field label="CRT">
                    <Select value={form.crt} onValueChange={(v) => set("crt", v)}>
                      <SelectTrigger className={bare}>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-Simples Nacional">1 - Simples Nacional</SelectItem>
                        <SelectItem value="2-Simples excesso sublimite">2 - Simples excesso sublimite</SelectItem>
                        <SelectItem value="3-Regime Normal">3 - Regime Normal</SelectItem>
                        <SelectItem value="4-MEI">4 - MEI</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="ICMS (%)">
                    <Input className={bare} type="number" step="0.01" value={form.icms} onChange={(e) => set("icms", e.target.value)} />
                  </Field>
                  <Field label="Tipo Pagamento">
                    <Select value={form.tipo_pagamento} onValueChange={(v) => set("tipo_pagamento", v)}>
                      <SelectTrigger className={bare}>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Cartão">Cartão</SelectItem>
                        <SelectItem value="Depósito">Depósito</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Limite">
                    <Input className={bare} type="number" step="0.01" value={form.limite_credito} onChange={(e) => set("limite_credito", e.target.value)} />
                  </Field>
                  <Field label="Tabela Prazo">
                    <Select value={form.tabela_prazo} onValueChange={(v) => set("tabela_prazo", v)}>
                      <SelectTrigger className={bare}>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A VISTA">A VISTA</SelectItem>
                        <SelectItem value="15 DIAS">15 DIAS</SelectItem>
                        <SelectItem value="28 DIAS">28 DIAS</SelectItem>
                        <SelectItem value="30 DIAS">30 DIAS</SelectItem>
                        <SelectItem value="30/60">30/60</SelectItem>
                        <SelectItem value="30/60/90">30/60/90</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Prazo">
                    <Input className={bare} type="number" value={form.prazo} onChange={(e) => set("prazo", e.target.value)} />
                  </Field>
                  <Field label="Parcelas">
                    <Input className={bare} type="number" value={form.parcelas} onChange={(e) => set("parcelas", e.target.value)} />
                  </Field>
                  <Field label="Intervalo">
                    <Input className={bare} type="number" value={form.intervalo} onChange={(e) => set("intervalo", e.target.value)} />
                  </Field>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchKeys={["razao_social", "nome_fantasia", "cnpj", "cidade", "segmento"]}
          onRowClick={(r) => setSelected(r as unknown as Record<string, unknown>)}
        />
      )}

      <RecordDetailDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        title={(selected?.razao_social as string) ?? "Cliente"}
        tableName="customers"
        record={selected}
        hidden={["sales_rep_id", "transportadora_id"]}
        textareas={["observacao", "endereco"]}
        onSaved={load}
      />
    </div>
  );
}
