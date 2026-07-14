import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calcularNota } from "@/services/fiscal/tax-engine";
import type {
  RegraTributaria, UfAliquota, TaxContext, ItemInput,
  RegimeTributario, TipoCliente, TipoOperacao, Finalidade,
} from "@/services/fiscal/tax-engine/types";

export const Route = createFileRoute("/_app/fiscal/simulador")({ ssr: false, component: SimuladorPage });

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","EX","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

async function fetchRegras(): Promise<RegraTributaria[]> {
  const { data, error } = await supabase.from("regras_tributarias" as never).select("*");
  if (error) throw error;
  return (data ?? []) as unknown as RegraTributaria[];
}
async function fetchUfs(): Promise<UfAliquota[]> {
  const { data, error } = await supabase.from("uf_aliquotas" as never).select("sigla,icms_interno_pct,icms_interestadual_pct,icms_st_pct,fundo_pobreza_pct");
  if (error) throw error;
  return (data ?? []) as unknown as UfAliquota[];
}

function SimuladorPage() {
  const { data: regras = [] } = useQuery({ queryKey: ["regras_tributarias"], queryFn: fetchRegras });
  const { data: ufs = [] } = useQuery({ queryKey: ["uf_aliquotas_lookup"], queryFn: fetchUfs });

  const [ufOrig, setUfOrig] = useState("SP");
  const [regime, setRegime] = useState<RegimeTributario>("presumido");
  const [ufDest, setUfDest] = useState("MG");
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("pj_contribuinte");
  const [consumidorFinal, setConsumidorFinal] = useState(false);
  const [operacao, setOperacao] = useState<TipoOperacao>("venda");
  const [finalidade, setFinalidade] = useState<Finalidade>("revenda");

  const [ncm, setNcm] = useState("60063100");
  const [cest, setCest] = useState("");
  const [qtd, setQtd] = useState("100");
  const [vunit, setVunit] = useState("25.00");
  const [frete, setFrete] = useState("0");
  const [desconto, setDesconto] = useState("0");

  const [rodou, setRodou] = useState(false);

  const resultado = useMemo(() => {
    if (!rodou) return null;
    const ctx: TaxContext = {
      emitente: { uf: ufOrig, regime },
      destinatario: { uf: ufDest, tipo_cliente: tipoCliente, consumidor_final: consumidorFinal },
      operacao, finalidade, regras, uf_aliquotas: ufs,
    };
    const item: ItemInput = {
      descricao: "Item simulado",
      ncm, cest: cest || null,
      quantidade: Number(qtd) || 0, valor_unitario: Number(vunit) || 0,
      desconto: Number(desconto) || 0, frete: Number(frete) || 0,
      outras: 0, seguro: 0,
    };
    return calcularNota(ctx, [item]);
  }, [rodou, ufOrig, regime, ufDest, tipoCliente, consumidorFinal, operacao, finalidade, regras, ufs, ncm, cest, qtd, vunit, desconto, frete]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">🧮 Simulador Tributário</h1>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div><Label>UF Origem</Label>
            <Select value={ufOrig} onValueChange={setUfOrig}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Regime Emitente</Label>
            <Select value={regime} onValueChange={(v) => setRegime(v as RegimeTributario)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="presumido">Lucro Presumido</SelectItem>
                <SelectItem value="real">Lucro Real</SelectItem>
              </SelectContent></Select>
          </div>
          <div><Label>UF Destino</Label>
            <Select value={ufDest} onValueChange={setUfDest}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Tipo Cliente</Label>
            <Select value={tipoCliente} onValueChange={(v) => setTipoCliente(v as TipoCliente)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pj_contribuinte">PJ Contribuinte</SelectItem>
                <SelectItem value="pj_nao_contrib">PJ Não Contribuinte</SelectItem>
                <SelectItem value="pf">Pessoa Física</SelectItem>
                <SelectItem value="orgao_publico">Órgão Público</SelectItem>
                <SelectItem value="exterior">Exterior</SelectItem>
              </SelectContent></Select>
          </div>
          <div><Label>Operação</Label>
            <Select value={operacao} onValueChange={(v) => setOperacao(v as TipoOperacao)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="devolucao">Devolução</SelectItem>
                <SelectItem value="remessa">Remessa</SelectItem>
                <SelectItem value="bonif">Bonificação</SelectItem>
                <SelectItem value="amostra">Amostra</SelectItem>
                <SelectItem value="industrializacao">Industrialização</SelectItem>
                <SelectItem value="exportacao">Exportação</SelectItem>
              </SelectContent></Select>
          </div>
          <div><Label>Finalidade</Label>
            <Select value={finalidade} onValueChange={(v) => setFinalidade(v as Finalidade)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="consumo">Consumo</SelectItem>
                <SelectItem value="revenda">Revenda</SelectItem>
                <SelectItem value="industrializacao">Industrialização</SelectItem>
                <SelectItem value="ativo">Ativo Imobilizado</SelectItem>
              </SelectContent></Select>
          </div>
          <div className="flex items-center gap-2 col-span-2"><Switch checked={consumidorFinal} onCheckedChange={setConsumidorFinal} /><Label>Consumidor Final</Label></div>
        </div>

        <div className="grid grid-cols-6 gap-3 border-t pt-3">
          <div><Label>NCM</Label><Input value={ncm} onChange={(e) => setNcm(e.target.value)} /></div>
          <div><Label>CEST</Label><Input value={cest} onChange={(e) => setCest(e.target.value)} /></div>
          <div><Label>Qtd</Label><Input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} /></div>
          <div><Label>Vlr Unitário</Label><Input type="number" step="0.01" value={vunit} onChange={(e) => setVunit(e.target.value)} /></div>
          <div><Label>Desconto</Label><Input type="number" step="0.01" value={desconto} onChange={(e) => setDesconto(e.target.value)} /></div>
          <div><Label>Frete</Label><Input type="number" step="0.01" value={frete} onChange={(e) => setFrete(e.target.value)} /></div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setRodou(true)}>
            <Calculator className="h-4 w-4 mr-1.5" />Calcular
          </Button>
        </div>
      </Card>

      {resultado && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Resultado</h2>
            {resultado.itens[0].regra_aplicada
              ? <Badge>{resultado.itens[0].regra_aplicada}</Badge>
              : <Badge variant="destructive">Sem regra compatível</Badge>}
          </div>
          {resultado.itens[0].avisos.map((a, i) => (
            <p key={i} className="text-sm text-destructive">⚠ {a}</p>
          ))}
          <Table>
            <TableHeader><TableRow>
              <TableHead>Campo</TableHead><TableHead className="text-right">Valor</TableHead>
              <TableHead>Campo</TableHead><TableHead className="text-right">Valor</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(() => {
                const it = resultado.itens[0];
                const t = resultado.totais;
                const linhas: [string, string | number, string, string | number][] = [
                  ["CFOP", it.cfop, "CST/CSOSN", it.cst_icms ?? it.csosn ?? "—"],
                  ["Valor produtos", brl(it.valor_produtos), "Total NF", brl(t.valor_total)],
                  ["Base ICMS", brl(it.base_icms), "Valor ICMS", brl(it.valor_icms)],
                  ["Alíquota ICMS", `${it.aliq_icms}%`, "FCP", brl(it.valor_fcp)],
                  ["Base ICMS-ST", brl(it.base_icms_st), "Valor ICMS-ST", brl(it.valor_icms_st)],
                  ["FCP-ST", brl(it.valor_fcp_st), "DIFAL", brl(it.valor_difal)],
                  ["IPI", brl(it.valor_ipi), "IPI CST/Alíq", `${it.cst_ipi ?? "—"} / ${it.aliq_ipi}%`],
                  ["PIS", brl(it.valor_pis), "COFINS", brl(it.valor_cofins)],
                ];
                return linhas.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{l[0]}</TableCell>
                    <TableCell className="text-right font-mono">{l[1]}</TableCell>
                    <TableCell className="text-muted-foreground">{l[2]}</TableCell>
                    <TableCell className="text-right font-mono">{l[3]}</TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
