import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FilePlus2, Loader2, Pencil, Trash2, Plus, X, Send, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { emitirNFe } from "@/lib/nfe.functions";
import { openDanfe, type DanfeData } from "@/lib/danfe";

export type NF = {
  id: string; tipo: "saida" | "entrada" | "importacao"; numero: string; serie: string;
  data_emissao: string; valor_total: number; status: string;
};

const STATUS = ["rascunho", "emitida", "autorizada", "cancelada"] as const;
const FINALIDADES = ["Normal", "Complementar", "Ajuste", "Devolução"];
const FRETE_TIPOS = ["CIF (emitente)", "FOB (destinatário)", "Terceiros", "Sem frete"];
const UNIDADES = ["UN", "KG", "MT", "M2", "PC", "CX", "PC"];

type Opt = { id: string; label: string; extra?: Record<string, unknown> };

async function fetchOpts(table: string, mapper: (r: Record<string, unknown>) => Opt): Promise<Opt[]> {
  const { data, error } = await supabase.from(table as never).select("*");
  if (error) throw error;
  return (data ?? []).map(mapper as never);
}

export function NotaFiscalList({ tipo, title, emoji }: { tipo: NF["tipo"]; title: string; emoji: string }) {
  const qc = useQueryClient();
  const key = ["notas_fiscais", tipo];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("notas_fiscais" as never)
        .select("*").eq("tipo", tipo).order("data_emissao", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NF[];
    },
  });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("notas_fiscais" as never) as never as { delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluída."); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">{emoji} {title}</h1>
      <Card className="p-3">
        <Button size="sm" onClick={() => { setEditingId(null); setOpen(true); }}>
          <FilePlus2 className="h-4 w-4 mr-1.5" />Nova nota
        </Button>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">Número</TableHead>
              <TableHead className="text-primary-foreground">Série</TableHead>
              <TableHead className="text-primary-foreground">Emissão</TableHead>
              <TableHead className="text-primary-foreground">Valor Total</TableHead>
              <TableHead className="text-primary-foreground">Status</TableHead>
              <TableHead className="text-primary-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow> :
              data.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma nota cadastrada.</TableCell></TableRow> :
              data.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono">{n.numero}</TableCell>
                  <TableCell>{n.serie}</TableCell>
                  <TableCell>{new Date(n.data_emissao).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>R$ {Number(n.valor_total).toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{n.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <NFActions nf={n} />
                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(n.id); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(n.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
      {open && (
        <NFFullDialog
          open={open}
          onOpenChange={setOpen}
          editingId={editingId}
          tipo={tipo}
          onSaved={() => qc.invalidateQueries({ queryKey: key })}
        />
      )}
    </div>
  );
}

/* =============== Dialog completo =============== */

type ItemRow = {
  _k: string; produto_id: string | null; descricao: string; unidade: string;
  cor_id: string | null; qtd_entrada: number; qtd_saida: number; qtd_embalagem: number;
  valor_unitario: number; valor_complementar: number; valor_total: number;
  base_icms: number; aliquota_icms: number; valor_icms: number;
  observacao_lote: string;
};
type FaturaRow = {
  _k: string; numero: string; dias: number; parcelas: number; intervalo: number;
  vencimento: string; valor: number; valor_complementar: number;
};

function NFFullDialog({ open, onOpenChange, editingId, tipo, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; editingId: string | null;
  tipo: NF["tipo"]; onSaved: () => void;
}) {
  // Referenciais
  const { data: clientes = [] } = useQuery({
    queryKey: ["nf-clientes"],
    queryFn: () => fetchOpts("customers", (r) => ({ id: r.id as string, label: (r.nome_fantasia || r.razao_social) as string })),
  });
  const { data: produtos = [] } = useQuery({
    queryKey: ["nf-produtos"],
    queryFn: () => fetchOpts("products", (r) => ({ id: r.id as string, label: `${r.codigo} — ${r.nome}`, extra: { unidade: r.unidade, preco: r.preco_venda } })),
  });
  const { data: cores = [] } = useQuery({
    queryKey: ["nf-cores"],
    queryFn: () => fetchOpts("cores", (r) => ({ id: r.id as string, label: `${r.codigo} — ${r.cor}` })),
  });
  const { data: cfops = [] } = useQuery({
    queryKey: ["nf-cfop"],
    queryFn: () => fetchOpts("cfop", (r) => ({ id: r.id as string, label: `${r.codigo} — ${r.descricao}` })),
  });
  const { data: transportadoras = [] } = useQuery({
    queryKey: ["nf-transportadoras"],
    queryFn: async () => {
      const { data } = await supabase.from("tinturarias" as never).select("id, nome_fantasia, categoria").eq("categoria", "Transportadora");
      return (data ?? []).map((r) => ({ id: (r as { id: string }).id, label: (r as { nome_fantasia: string }).nome_fantasia }));
    },
  });

  // Estado — cabeçalho
  const [finalidade, setFinalidade] = useState("Normal");
  const [modelo, setModelo] = useState("55");
  const [numero, setNumero] = useState("");
  const [serie, setSerie] = useState("1");
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().slice(0, 10));
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [emissor, setEmissor] = useState("");
  const [destinatarioId, setDestinatarioId] = useState<string | null>(null);
  const [cfopId, setCfopId] = useState<string | null>(null);
  const [chaveRef, setChaveRef] = useState("");
  const [status, setStatus] = useState<string>("rascunho");

  // Itens
  const [items, setItems] = useState<ItemRow[]>([]);
  const emptyItem = (): ItemRow => ({
    _k: crypto.randomUUID(), produto_id: null, descricao: "", unidade: "UN",
    cor_id: null, qtd_entrada: 0, qtd_saida: 0, qtd_embalagem: 0,
    valor_unitario: 0, valor_complementar: 0, valor_total: 0,
    base_icms: 0, aliquota_icms: 0, valor_icms: 0, observacao_lote: "",
  });
  const [curItem, setCurItem] = useState<ItemRow>(emptyItem());

  // Totais
  const [valorFrete, setValorFrete] = useState(0);
  const [valorDesconto, setValorDesconto] = useState(0);
  const [valorOutros, setValorOutros] = useState(0);

  const rProdutos = useMemo(() => items.reduce((a, i) => a + Number(i.valor_total || 0), 0), [items]);
  const baseIcmsTotal = useMemo(() => items.reduce((a, i) => a + Number(i.base_icms || 0), 0), [items]);
  const valorIcmsTotal = useMemo(() => items.reduce((a, i) => a + Number(i.valor_icms || 0), 0), [items]);
  const rTotal = rProdutos + Number(valorFrete || 0) + Number(valorOutros || 0) - Number(valorDesconto || 0);

  // Faturas
  const [faturas, setFaturas] = useState<FaturaRow[]>([]);
  const emptyFatura = (): FaturaRow => ({
    _k: crypto.randomUUID(), numero: "", dias: 30, parcelas: 1, intervalo: 30,
    vencimento: new Date().toISOString().slice(0, 10), valor: 0, valor_complementar: 0,
  });
  const [curFat, setCurFat] = useState<FaturaRow>(emptyFatura());

  // Volumes
  const [tipoEmb, setTipoEmb] = useState("");
  const [qtdEmb, setQtdEmb] = useState(0);
  const [pesoBruto, setPesoBruto] = useState(0);
  const [pesoLiquido, setPesoLiquido] = useState(0);
  const [transpId, setTranspId] = useState<string | null>(null);
  const [freteTipo, setFreteTipo] = useState("");
  const [placa, setPlaca] = useState("");
  const [drawback, setDrawback] = useState("");
  const [observacao, setObservacao] = useState("");

  // Carrega para edição
  useEffect(() => {
    if (!editingId) return;
    (async () => {
      const { data: nf } = await supabase.from("notas_fiscais" as never).select("*").eq("id", editingId).maybeSingle();
      if (!nf) return;
      const r = nf as Record<string, unknown>;
      setFinalidade((r.finalidade as string) ?? "Normal");
      setModelo((r.modelo as string) ?? "55");
      setNumero((r.numero as string) ?? "");
      setSerie((r.serie as string) ?? "1");
      setDataEmissao((r.data_emissao as string) ?? new Date().toISOString().slice(0, 10));
      setClienteId((r.cliente_id as string) ?? null);
      setEmissor((r.emissor as string) ?? "");
      setDestinatarioId((r.destinatario_id as string) ?? null);
      setCfopId((r.cfop_id as string) ?? null);
      setChaveRef((r.chave_ref as string) ?? "");
      setStatus((r.status as string) ?? "rascunho");
      setValorFrete(Number(r.valor_frete) || 0);
      setValorDesconto(Number(r.valor_desconto) || 0);
      setValorOutros(Number(r.valor_outros) || 0);
      setTipoEmb((r.tipo_embalagem as string) ?? "");
      setQtdEmb(Number(r.quantidade_emb) || 0);
      setPesoBruto(Number(r.peso_bruto) || 0);
      setPesoLiquido(Number(r.peso_liquido) || 0);
      setTranspId((r.transportadora_id as string) ?? null);
      setFreteTipo((r.frete_tipo as string) ?? "");
      setPlaca((r.placa_veiculo as string) ?? "");
      setDrawback((r.drawback as string) ?? "");
      setObservacao((r.observacao as string) ?? "");

      const { data: its } = await supabase.from("notas_fiscais_itens" as never).select("*").eq("nota_fiscal_id", editingId);
      setItems(((its ?? []) as unknown as Record<string, unknown>[]).map(i => ({
        _k: crypto.randomUUID(),
        produto_id: (i.produto_id as string) ?? null,
        descricao: (i.descricao as string) ?? "",
        unidade: (i.unidade as string) ?? "UN",
        cor_id: (i.cor_id as string) ?? null,
        qtd_entrada: Number(i.quantidade_entrada) || 0,
        qtd_saida: Number(i.quantidade_saida) || 0,
        qtd_embalagem: Number(i.quantidade_embalagem) || 0,
        valor_unitario: Number(i.valor_unitario) || 0,
        valor_complementar: Number(i.valor_complementar) || 0,
        valor_total: Number(i.valor_total) || 0,
        base_icms: Number(i.base_icms) || 0,
        aliquota_icms: Number(i.aliquota_icms) || 0,
        valor_icms: Number(i.valor_icms) || 0,
        observacao_lote: (i.observacao_lote as string) ?? "",
      })));

      const { data: fts } = await supabase.from("notas_fiscais_faturas" as never).select("*").eq("nota_fiscal_id", editingId);
      setFaturas(((fts ?? []) as unknown as Record<string, unknown>[]).map(f => ({
        _k: crypto.randomUUID(),
        numero: (f.numero as string) ?? "",
        dias: Number(f.dias) || 0,
        parcelas: Number(f.parcelas) || 1,
        intervalo: Number(f.intervalo) || 0,
        vencimento: (f.vencimento as string) ?? new Date().toISOString().slice(0, 10),
        valor: Number(f.valor) || 0,
        valor_complementar: Number(f.valor_complementar) || 0,
      })));
    })();
  }, [editingId]);

  // Recalcula total do item corrente ao mudar qtd / unitário / complementar / aliquota
  useEffect(() => {
    const qtd = tipo === "entrada" ? curItem.qtd_entrada : curItem.qtd_saida;
    const total = qtd * curItem.valor_unitario + Number(curItem.valor_complementar || 0);
    const icms = (curItem.base_icms || total) * (curItem.aliquota_icms || 0) / 100;
    if (total !== curItem.valor_total || icms !== curItem.valor_icms) {
      setCurItem((s) => ({ ...s, valor_total: total, valor_icms: icms }));
    }
     
  }, [curItem.qtd_entrada, curItem.qtd_saida, curItem.valor_unitario, curItem.valor_complementar, curItem.aliquota_icms, curItem.base_icms, tipo]);

  function addItem() {
    if (!curItem.produto_id && !curItem.descricao) { toast.error("Selecione um produto ou informe descrição."); return; }
    const prod = produtos.find(p => p.id === curItem.produto_id);
    setItems((s) => [...s, { ...curItem, descricao: curItem.descricao || (prod?.label ?? "") }]);
    setCurItem(emptyItem());
  }
  function addFatura() {
    if (!curFat.numero) { toast.error("Informe o número da fatura."); return; }
    setFaturas((s) => [...s, curFat]);
    setCurFat({ ...emptyFatura(), numero: String((faturas.length + 2)) });
  }

  const save = useMutation({
    mutationFn: async () => {
      const nfPayload = {
        tipo, finalidade, modelo, numero, serie,
        data_emissao: dataEmissao, cliente_id: clienteId, destinatario_id: destinatarioId,
        emissor: emissor || null, cfop_id: cfopId, chave_ref: chaveRef || null,
        valor_total: rTotal, base_icms: baseIcmsTotal, valor_icms: valorIcmsTotal,
        valor_frete: valorFrete, valor_desconto: valorDesconto, valor_outros: valorOutros,
        status, tipo_embalagem: tipoEmb || null, quantidade_emb: qtdEmb,
        peso_bruto: pesoBruto, peso_liquido: pesoLiquido,
        transportadora_id: transpId, frete_tipo: freteTipo || null,
        placa_veiculo: placa || null, drawback: drawback || null,
        observacao: observacao || null,
      };
      let nfId = editingId;
      if (editingId) {
        const { error } = await (supabase.from("notas_fiscais" as never) as never as { update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).update(nfPayload).eq("id", editingId);
        if (error) throw error;
        await (supabase.from("notas_fiscais_itens" as never) as never as { delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).delete().eq("nota_fiscal_id", editingId);
        await (supabase.from("notas_fiscais_faturas" as never) as never as { delete: () => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }).delete().eq("nota_fiscal_id", editingId);
      } else {
        const { data, error } = await (supabase.from("notas_fiscais" as never) as never as { insert: (v: object) => { select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } } }).insert(nfPayload).select("id").single();
        if (error) throw error;
        nfId = data!.id;
      }
      if (items.length) {
        const rows = items.map(i => ({
          nota_fiscal_id: nfId, descricao: i.descricao, unidade: i.unidade,
          cor_id: i.cor_id, quantidade_entrada: i.qtd_entrada, quantidade_saida: i.qtd_saida,
          quantidade_embalagem: i.qtd_embalagem, valor_unitario: i.valor_unitario,
          valor_complementar: i.valor_complementar, valor_total: i.valor_total,
          base_icms: i.base_icms, aliquota_icms: i.aliquota_icms, valor_icms: i.valor_icms,
          observacao_lote: i.observacao_lote || null,
          quantidade: (i.qtd_entrada || 0) + (i.qtd_saida || 0),
        }));
        const { error } = await (supabase.from("notas_fiscais_itens" as never) as never as { insert: (v: object) => Promise<{ error: Error | null }> }).insert(rows);
        if (error) throw error;
      }
      if (faturas.length) {
        const rows = faturas.map(f => ({
          nota_fiscal_id: nfId, numero: f.numero, dias: f.dias, parcelas: f.parcelas,
          intervalo: f.intervalo, vencimento: f.vencimento, valor: f.valor,
          valor_complementar: f.valor_complementar,
        }));
        const { error } = await (supabase.from("notas_fiscais_faturas" as never) as never as { insert: (v: object) => Promise<{ error: Error | null }> }).insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Nota salva."); onSaved(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const nameOf = (opts: Opt[], id: string | null) => opts.find(o => o.id === id)?.label ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingId ? "Editar Nota Fiscal" : "Cadastro Nota Fiscal"}</DialogTitle></DialogHeader>

        {/* CABEÇALHO */}
        <Card className="p-3 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div><Label>Finalidade</Label>
              <Select value={finalidade} onValueChange={setFinalidade}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FINALIDADES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Modelo</Label><Input value={modelo} onChange={e => setModelo(e.target.value)} /></div>
            <div><Label>Número *</Label><Input value={numero} onChange={e => setNumero(e.target.value)} /></div>
            <div><Label>Série</Label><Input value={serie} onChange={e => setSerie(e.target.value)} /></div>

            <div className="col-span-2"><Label>Cliente *</Label>
              <Select value={clienteId ?? ""} onValueChange={(v) => setClienteId(v || null)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data Emissão *</Label><Input type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)} /></div>
            <div><Label>Status</Label>
              <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
            </div>

            <div className="col-span-2"><Label>Emissor</Label><Input value={emissor} onChange={e => setEmissor(e.target.value)} placeholder="Nome do emissor" /></div>
            <div className="col-span-2"><Label>Destinatário</Label>
              <Select value={destinatarioId ?? ""} onValueChange={(v) => setDestinatarioId(v || null)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="col-span-2"><Label>CFOP</Label>
              <Select value={cfopId ?? ""} onValueChange={(v) => setCfopId(v || null)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{cfops.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Chave Nota Ref.</Label><Input value={chaveRef} onChange={e => setChaveRef(e.target.value)} maxLength={44} /></div>
          </div>
        </Card>

        {/* DADOS PRODUTO */}
        <Card className="p-3 space-y-3">
          <div className="text-sm font-semibold text-primary">Dados Produto</div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2"><Label>Produto *</Label>
              <Select value={curItem.produto_id ?? ""} onValueChange={(v) => {
                const p = produtos.find(x => x.id === v);
                setCurItem(s => ({ ...s, produto_id: v || null, unidade: (p?.extra?.unidade as string) || s.unidade, valor_unitario: Number(p?.extra?.preco) || s.valor_unitario }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{produtos.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Unidade</Label>
              <Select value={curItem.unidade} onValueChange={(v) => setCurItem(s => ({ ...s, unidade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Cor / Estampa</Label>
              <Select value={curItem.cor_id ?? ""} onValueChange={(v) => setCurItem(s => ({ ...s, cor_id: v || null }))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{cores.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select>
            </div>

            <div><Label>Qtd. Entrada</Label><Input type="number" step="0.01" value={curItem.qtd_entrada} onChange={e => setCurItem(s => ({ ...s, qtd_entrada: Number(e.target.value) || 0 }))} /></div>
            <div><Label>Qtd. Saída</Label><Input type="number" step="0.01" value={curItem.qtd_saida} onChange={e => setCurItem(s => ({ ...s, qtd_saida: Number(e.target.value) || 0 }))} /></div>
            <div><Label>Qtd. Embalagem</Label><Input type="number" step="0.01" value={curItem.qtd_embalagem} onChange={e => setCurItem(s => ({ ...s, qtd_embalagem: Number(e.target.value) || 0 }))} /></div>
            <div />

            <div><Label>R$ Unitário</Label><Input type="number" step="0.0001" value={curItem.valor_unitario} onChange={e => setCurItem(s => ({ ...s, valor_unitario: Number(e.target.value) || 0 }))} /></div>
            <div><Label>R$ Complementar</Label><Input type="number" step="0.0001" value={curItem.valor_complementar} onChange={e => setCurItem(s => ({ ...s, valor_complementar: Number(e.target.value) || 0 }))} /></div>
            <div><Label>R$ Total</Label><Input type="number" value={curItem.valor_total.toFixed(2)} readOnly className="bg-muted" /></div>
            <div />

            <div><Label>Base ICMS</Label><Input type="number" step="0.01" value={curItem.base_icms} onChange={e => setCurItem(s => ({ ...s, base_icms: Number(e.target.value) || 0 }))} /></div>
            <div><Label>% ICMS</Label><Input type="number" step="0.01" value={curItem.aliquota_icms} onChange={e => setCurItem(s => ({ ...s, aliquota_icms: Number(e.target.value) || 0 }))} /></div>
            <div><Label>R$ ICMS</Label><Input type="number" value={curItem.valor_icms.toFixed(2)} readOnly className="bg-muted" /></div>
            <div />

            <div className="col-span-4"><Label>Observação (Lote)</Label><Textarea rows={2} value={curItem.observacao_lote} onChange={e => setCurItem(s => ({ ...s, observacao_lote: e.target.value }))} /></div>
          </div>
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1.5" />INSERIR</Button>
          </div>

          <Table>
            <TableHeader><TableRow className="bg-muted">
              <TableHead>Produto</TableHead><TableHead>Cor</TableHead><TableHead>Qtd.</TableHead>
              <TableHead>R$ Unitário</TableHead><TableHead>R$ Total</TableHead><TableHead>R$ ICMS</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-4">Nenhum item.</TableCell></TableRow> :
                items.map((i) => (
                  <TableRow key={i._k}>
                    <TableCell>{nameOf(produtos, i.produto_id)}</TableCell>
                    <TableCell>{nameOf(cores, i.cor_id)}</TableCell>
                    <TableCell>{((i.qtd_entrada || 0) + (i.qtd_saida || 0)).toFixed(2)}</TableCell>
                    <TableCell>R$ {i.valor_unitario.toFixed(4)}</TableCell>
                    <TableCell>R$ {i.valor_total.toFixed(2)}</TableCell>
                    <TableCell>R$ {i.valor_icms.toFixed(2)}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => setItems(items.filter(x => x._k !== i._k))}><X className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>

        {/* TOTAIS */}
        <Card className="p-3">
          <div className="text-sm font-semibold text-primary mb-3">Totais Nota Fiscal</div>
          <div className="grid grid-cols-4 gap-3">
            <div><Label>R$ Produtos</Label><Input readOnly value={rProdutos.toFixed(2)} className="bg-muted" /></div>
            <div><Label>Base ICMS</Label><Input readOnly value={baseIcmsTotal.toFixed(2)} className="bg-muted" /></div>
            <div><Label>R$ ICMS</Label><Input readOnly value={valorIcmsTotal.toFixed(2)} className="bg-muted" /></div>
            <div />
            <div><Label>R$ Frete</Label><Input type="number" step="0.01" value={valorFrete} onChange={e => setValorFrete(Number(e.target.value) || 0)} /></div>
            <div><Label>R$ Desconto</Label><Input type="number" step="0.01" value={valorDesconto} onChange={e => setValorDesconto(Number(e.target.value) || 0)} /></div>
            <div><Label>R$ Outros</Label><Input type="number" step="0.01" value={valorOutros} onChange={e => setValorOutros(Number(e.target.value) || 0)} /></div>
            <div><Label>R$ Total</Label><Input readOnly value={rTotal.toFixed(2)} className="bg-muted font-bold" /></div>
          </div>
        </Card>

        {/* FATURAS */}
        <Card className="p-3 space-y-3">
          <div className="text-sm font-semibold text-primary">Dados Fatura</div>
          <div className="grid grid-cols-7 gap-2">
            <div><Label>Número *</Label><Input value={curFat.numero} onChange={e => setCurFat(s => ({ ...s, numero: e.target.value }))} /></div>
            <div><Label>Dias</Label><Input type="number" value={curFat.dias} onChange={e => setCurFat(s => ({ ...s, dias: Number(e.target.value) || 0 }))} /></div>
            <div><Label>Parcelas</Label><Input type="number" value={curFat.parcelas} onChange={e => setCurFat(s => ({ ...s, parcelas: Number(e.target.value) || 1 }))} /></div>
            <div><Label>Intervalo</Label><Input type="number" value={curFat.intervalo} onChange={e => setCurFat(s => ({ ...s, intervalo: Number(e.target.value) || 0 }))} /></div>
            <div><Label>Vencimento *</Label><Input type="date" value={curFat.vencimento} onChange={e => setCurFat(s => ({ ...s, vencimento: e.target.value }))} /></div>
            <div><Label>Valor</Label><Input type="number" step="0.01" value={curFat.valor} onChange={e => setCurFat(s => ({ ...s, valor: Number(e.target.value) || 0 }))} /></div>
            <div><Label>V. Compl.</Label><Input type="number" step="0.01" value={curFat.valor_complementar} onChange={e => setCurFat(s => ({ ...s, valor_complementar: Number(e.target.value) || 0 }))} /></div>
          </div>
          <div className="flex justify-center">
            <Button type="button" size="sm" onClick={addFatura}><Plus className="h-4 w-4 mr-1.5" />INSERIR</Button>
          </div>
          <Table>
            <TableHeader><TableRow className="bg-muted">
              <TableHead>Número</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor R$</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {faturas.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhuma fatura.</TableCell></TableRow> :
                faturas.map(f => (
                  <TableRow key={f._k}>
                    <TableCell>{f.numero}</TableCell>
                    <TableCell>{new Date(f.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>R$ {f.valor.toFixed(2)}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => setFaturas(faturas.filter(x => x._k !== f._k))}><X className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>

        {/* VOLUMES */}
        <Card className="p-3 space-y-3">
          <div className="text-sm font-semibold text-primary">Dados Volumes</div>
          <div className="grid grid-cols-4 gap-3">
            <div><Label>Tipo Emb.</Label><Input value={tipoEmb} onChange={e => setTipoEmb(e.target.value)} /></div>
            <div><Label>Qtd. Emb. *</Label><Input type="number" step="0.01" value={qtdEmb} onChange={e => setQtdEmb(Number(e.target.value) || 0)} /></div>
            <div><Label>Peso Bruto</Label><Input type="number" step="0.01" value={pesoBruto} onChange={e => setPesoBruto(Number(e.target.value) || 0)} /></div>
            <div><Label>Peso Líquido</Label><Input type="number" step="0.01" value={pesoLiquido} onChange={e => setPesoLiquido(Number(e.target.value) || 0)} /></div>
            <div className="col-span-2"><Label>Transportadora</Label>
              <Select value={transpId ?? ""} onValueChange={(v) => setTranspId(v || null)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{transportadoras.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Frete *</Label>
              <Select value={freteTipo} onValueChange={setFreteTipo}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{FRETE_TIPOS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Placa Veículo</Label><Input value={placa} onChange={e => setPlaca(e.target.value)} /></div>
            <div className="col-span-2"><Label>Drawback</Label><Input value={drawback} onChange={e => setDrawback(e.target.value)} /></div>
            <div className="col-span-4"><Label>Observação</Label><Textarea rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} /></div>
          </div>
        </Card>

        <p className="text-xs text-destructive">* Campo Obrigatório</p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !numero || !clienteId}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}CADASTRAR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
