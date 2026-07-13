import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  getExpedicao, separarLote, listarLotesDisponiveis, registrarConferencia,
  fecharRomaneio, transicionar, registrarOcorrencia, registrarEntrega,
  type ExpedicaoStatus,
} from "@/services/producao/expedicao.functions";
import { ExpedicaoStatusBadge } from "@/components/producao/expedicao-status-badge";

export const Route = createFileRoute("/_app/producao/expedicao/$id")({
  head: () => ({ meta: [{ title: "Expedição — Detalhe" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Erro: {error.message}</div>,
  notFoundComponent: () => <div className="p-6">Expedição não encontrada</div>,
  component: ExpedicaoDetail,
});

function ExpedicaoDetail() {
  const { id } = useParams({ from: "/_app/producao/expedicao/$id" });
  const get = useServerFn(getExpedicao);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["expedicao", id], queryFn: () => get({ data: { id } }) });

  if (q.isLoading) return <div className="p-6">Carregando...</div>;
  if (q.error) return <div className="p-6 text-destructive">Erro: {(q.error as Error).message}</div>;
  if (!q.data) return null;

  const exp = q.data.expedicao as unknown as Record<string, unknown> & {
    id: string; status: string;
    pedidos?: { numero: string; valor_total: number } | null;
    ordens_producao?: { numero: number } | null;
    notas_fiscais?: { numero: string; serie: string; status_sefaz: string } | null;
  };
  const invalidate = () => qc.invalidateQueries({ queryKey: ["expedicao", id] });

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title={`Expedição · ${exp.pedidos?.numero ?? exp.ordens_producao?.numero ?? id.slice(0, 8)}`}
        description={`Status: ${exp.status}`}
        actions={<Button asChild variant="outline"><Link to="/producao/expedicao">Voltar</Link></Button>}
      />

      <Card className="p-4 flex flex-wrap gap-4 items-center">
        <div><div className="text-xs text-muted-foreground">Status</div><ExpedicaoStatusBadge status={exp.status} /></div>
        <div><div className="text-xs text-muted-foreground">Pedido</div><div className="font-mono">{exp.pedidos?.numero ?? "—"}</div></div>
        <div><div className="text-xs text-muted-foreground">OP</div><div className="font-mono">#{exp.ordens_producao?.numero ?? "—"}</div></div>
        <div><div className="text-xs text-muted-foreground">NF-e</div><div className="font-mono">{exp.notas_fiscais ? `${exp.notas_fiscais.numero}/${exp.notas_fiscais.serie} (${exp.notas_fiscais.status_sefaz})` : "—"}</div></div>
      </Card>

      <Tabs defaultValue="separacao">
        <TabsList>
          <TabsTrigger value="separacao">Separação</TabsTrigger>
          <TabsTrigger value="conferencia">Conferência</TabsTrigger>
          <TabsTrigger value="romaneio">Romaneio</TabsTrigger>
          <TabsTrigger value="entrega">Entrega</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="separacao"><SeparacaoTab data={q.data} onChange={invalidate} /></TabsContent>
        <TabsContent value="conferencia"><ConferenciaTab expedicaoId={id} itensLote={q.data.itens_lote} onChange={invalidate} /></TabsContent>
        <TabsContent value="romaneio"><RomaneioTab data={q.data} onChange={invalidate} /></TabsContent>
        <TabsContent value="entrega"><EntregaTab expedicao={exp} onChange={invalidate} /></TabsContent>
        <TabsContent value="historico"><HistoricoTab eventos={q.data.eventos} /></TabsContent>
      </Tabs>
    </div>
  );
}

type ItemLote = { id: string; quantidade: number; lotes?: { numero_lote: string } | null; op_itens?: { descricao: string } | null };
type Expedicao = { id: string; op_id?: string | null; status: string };
type DataShape = {
  expedicao: unknown; itens_lote: ItemLote[]; op_itens: Array<{ id: string; descricao: string; quantidade_planejada: number }>;
  pedido_itens: Array<{ id: string; descricao: string; quantidade: number }>;
  eventos: Array<{ id: string; data: string; evento: string; descricao: string | null; local: string | null }>;
  transportadoras: Array<{ id: string; nome: string }>;
};

function SeparacaoTab({ data, onChange }: { data: DataShape; onChange: () => void }) {
  const exp = data.expedicao as Expedicao;
  const listarLotes = useServerFn(listarLotesDisponiveis);
  const separar = useServerFn(separarLote);
  const [opItemId, setOpItemId] = useState<string>("");
  const [loteId, setLoteId] = useState<string>("");
  const [qtd, setQtd] = useState<string>("");

  const lotes = useQuery({
    queryKey: ["lotes-disp", exp.op_id],
    queryFn: () => listarLotes({ data: { op_id: exp.op_id ?? undefined } }),
  });

  const mut = useMutation({
    mutationFn: () => separar({ data: { expedicao_id: exp.id, op_item_id: opItemId || undefined, lote_id: loteId, quantidade: Number(qtd) } }),
    onSuccess: () => { toast.success("Lote separado"); setLoteId(""); setQtd(""); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const finalizar = useMutation({
    mutationFn: () => useServerFn(transicionar)({ data: { expedicao_id: exp.id, novo_status: "separado" } }),
    onSuccess: () => { toast.success("Separação concluída"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="font-semibold">Separar por lote</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Item da OP</Label>
            <Select value={opItemId} onValueChange={setOpItemId}>
              <SelectTrigger><SelectValue placeholder="Item..." /></SelectTrigger>
              <SelectContent>
                {data.op_itens.map(i => <SelectItem key={i.id} value={i.id}>{i.descricao}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Lote</Label>
            <Select value={loteId} onValueChange={setLoteId}>
              <SelectTrigger><SelectValue placeholder="Lote..." /></SelectTrigger>
              <SelectContent>
                {(lotes.data ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.numero_lote} (disp: {Number(l.quantidade_disponivel).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantidade</Label>
            <Input type="number" step="0.001" value={qtd} onChange={e => setQtd(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={() => mut.mutate()} disabled={!loteId || !qtd || mut.isPending}>Separar</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Lote</TableHead><TableHead className="text-right">Quantidade</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.itens_lote.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Nada separado ainda</TableCell></TableRow>}
            {data.itens_lote.map(i => (
              <TableRow key={i.id}>
                <TableCell>{i.op_itens?.descricao ?? "—"}</TableCell>
                <TableCell className="font-mono">{i.lotes?.numero_lote ?? "—"}</TableCell>
                <TableCell className="text-right">{Number(i.quantidade).toFixed(3)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => finalizar.mutate()} disabled={data.itens_lote.length === 0 || exp.status !== "em_separacao"}>
          Concluir separação
        </Button>
      </div>
    </div>
  );
}

function ConferenciaTab({ expedicaoId, itensLote, onChange }: { expedicaoId: string; itensLote: ItemLote[]; onChange: () => void }) {
  const conf = useServerFn(registrarConferencia);
  const [divergencias, setDivergencias] = useState<Array<{ item: string; esperado: number; encontrado: number; observacao?: string }>>([]);
  const [novoItem, setNovoItem] = useState("");
  const [esperado, setEsperado] = useState("");
  const [encontrado, setEncontrado] = useState("");

  const mut = useMutation({
    mutationFn: (aprovar: boolean) => conf({ data: { expedicao_id: expedicaoId, divergencias, aprovar } }),
    onSuccess: () => { toast.success("Conferência registrada"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="font-semibold">Itens separados</div>
        <ul className="text-sm space-y-1">
          {itensLote.map(i => <li key={i.id}>• {i.op_itens?.descricao ?? "Item"} — lote {i.lotes?.numero_lote} — {Number(i.quantidade).toFixed(3)}</li>)}
        </ul>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-semibold">Registrar divergência</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Item" value={novoItem} onChange={e => setNovoItem(e.target.value)} />
          <Input type="number" placeholder="Esperado" value={esperado} onChange={e => setEsperado(e.target.value)} />
          <Input type="number" placeholder="Encontrado" value={encontrado} onChange={e => setEncontrado(e.target.value)} />
          <Button variant="outline" onClick={() => {
            if (!novoItem) return;
            setDivergencias([...divergencias, { item: novoItem, esperado: Number(esperado), encontrado: Number(encontrado) }]);
            setNovoItem(""); setEsperado(""); setEncontrado("");
          }}>Adicionar</Button>
        </div>
        {divergencias.length > 0 && (
          <ul className="text-sm">
            {divergencias.map((d, i) => <li key={i}>⚠️ {d.item}: esperado {d.esperado} / encontrado {d.encontrado}</li>)}
          </ul>
        )}
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => mut.mutate(false)} disabled={mut.isPending}>Registrar ocorrência</Button>
        <Button onClick={() => mut.mutate(true)} disabled={mut.isPending}>Aprovar conferência</Button>
      </div>
    </div>
  );
}

function RomaneioTab({ data, onChange }: { data: DataShape; onChange: () => void }) {
  const exp = data.expedicao as Expedicao & { transportadora_id?: string | null; frete_tipo?: string | null; volumes?: number | null; peso_bruto?: number | null; peso_liquido?: number | null; rastreio?: string | null; nota_fiscal_id?: string | null };
  const fechar = useServerFn(fecharRomaneio);
  const trans = useServerFn(transicionar);
  const [tid, setTid] = useState(exp.transportadora_id ?? "");
  const [frete, setFrete] = useState(exp.frete_tipo ?? "CIF");
  const [vol, setVol] = useState(String(exp.volumes ?? 1));
  const [pB, setPB] = useState(String(exp.peso_bruto ?? ""));
  const [pL, setPL] = useState(String(exp.peso_liquido ?? ""));
  const [rast, setRast] = useState(exp.rastreio ?? "");
  const [override, setOverride] = useState("");

  const salvar = useMutation({
    mutationFn: () => fechar({ data: { expedicao_id: exp.id, transportadora_id: tid || null, frete_tipo: frete, volumes: Number(vol), peso_bruto: Number(pB), peso_liquido: Number(pL), rastreio: rast || undefined } }),
    onSuccess: () => { toast.success("Romaneio salvo"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const expedir = useMutation({
    mutationFn: (motivo?: string) => trans({ data: { expedicao_id: exp.id, novo_status: "expedido", motivo } }),
    onSuccess: () => { toast.success("Expedido"); setOverride(""); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Transportadora</Label>
          <Select value={tid} onValueChange={setTid}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {data.transportadoras.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de frete</Label>
          <Select value={frete} onValueChange={setFrete}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["CIF","FOB","Terceiros","Remetente","Destinatario","SemFrete"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Volumes</Label><Input type="number" value={vol} onChange={e => setVol(e.target.value)} /></div>
        <div><Label>Peso bruto (kg)</Label><Input type="number" step="0.001" value={pB} onChange={e => setPB(e.target.value)} /></div>
        <div><Label>Peso líquido (kg)</Label><Input type="number" step="0.001" value={pL} onChange={e => setPL(e.target.value)} /></div>
        <div><Label>Rastreio</Label><Input value={rast} onChange={e => setRast(e.target.value)} /></div>
      </Card>

      <div className="flex flex-wrap gap-2 justify-end items-end">
        <Input placeholder="OVERRIDE_ADM:motivo (opcional)" value={override} onChange={e => setOverride(e.target.value)} className="max-w-xs" />
        <Button variant="outline" onClick={() => window.print()}>Imprimir romaneio</Button>
        <Button variant="outline" onClick={() => salvar.mutate()}>Salvar romaneio</Button>
        <Button onClick={() => expedir.mutate(override || undefined)} disabled={expedir.isPending}>Expedir</Button>
      </div>
    </div>
  );
}

function EntregaTab({ expedicao, onChange }: { expedicao: { id: string; status: string }; onChange: () => void }) {
  const trans = useServerFn(transicionar);
  const entrega = useServerFn(registrarEntrega);
  const ocorr = useServerFn(registrarOcorrencia);
  const [dataEntrega, setDataEntrega] = useState(new Date().toISOString().slice(0, 10));
  const [comprov, setComprov] = useState("");
  const [ocTipo, setOcTipo] = useState("atraso");
  const [ocDesc, setOcDesc] = useState("");

  const setStatus = useMutation({
    mutationFn: (s: ExpedicaoStatus) => trans({ data: { expedicao_id: expedicao.id, novo_status: s } }),
    onSuccess: () => { toast.success("Status atualizado"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const marcar = useMutation({
    mutationFn: () => entrega({ data: { expedicao_id: expedicao.id, data_entrega: dataEntrega, comprovante_url: comprov || undefined } }),
    onSuccess: () => { toast.success("Entrega registrada"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const oc = useMutation({
    mutationFn: () => ocorr({ data: { expedicao_id: expedicao.id, tipo: ocTipo, descricao: ocDesc } }),
    onSuccess: () => { toast.success("Ocorrência registrada"); setOcDesc(""); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="font-semibold">Ações rápidas</div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setStatus.mutate("em_transito")}>Marcar em trânsito</Button>
        </div>
      </Card>
      <Card className="p-4 space-y-3">
        <div className="font-semibold">Confirmar entrega</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><Label>Data de entrega</Label><Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>URL do comprovante</Label><Input value={comprov} onChange={e => setComprov(e.target.value)} /></div>
        </div>
        <div className="flex justify-end"><Button onClick={() => marcar.mutate()} disabled={marcar.isPending}>Confirmar entrega</Button></div>
      </Card>
      <Card className="p-4 space-y-3">
        <div className="font-semibold">Registrar ocorrência</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Tipo</Label>
            <Select value={ocTipo} onValueChange={setOcTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["atraso","avaria","extravio","recusa","endereco_incorreto","devolucao"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={ocDesc} onChange={e => setOcDesc(e.target.value)} /></div>
        </div>
        <div className="flex justify-end"><Button variant="destructive" onClick={() => oc.mutate()} disabled={!ocDesc}>Registrar</Button></div>
      </Card>
    </div>
  );
}

function HistoricoTab({ eventos }: { eventos: DataShape["eventos"] }) {
  if (eventos.length === 0) return <Card className="p-4 text-muted-foreground">Sem eventos registrados.</Card>;
  return (
    <Card>
      <Table>
        <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Evento</TableHead><TableHead>Local</TableHead><TableHead>Descrição</TableHead></TableRow></TableHeader>
        <TableBody>
          {eventos.map(e => (
            <TableRow key={e.id}>
              <TableCell className="font-mono text-xs">{new Date(e.data).toLocaleString("pt-BR")}</TableCell>
              <TableCell><ExpedicaoStatusBadge status={e.evento} /></TableCell>
              <TableCell>{e.local ?? "—"}</TableCell>
              <TableCell>{e.descricao ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
