import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calculator } from "lucide-react";
import { resolverPrecoClienteArtigo, type ResolucaoPreco } from "@/services/comercial/cliente-artigo.functions";

export const Route = createFileRoute("/_app/cliente-artigo/simulador")({
  ssr: false,
  head: () => ({ meta: [{ title: "Simulador de Preço" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Erro: {error.message}</div>,
  component: Simulador,
});

const ORIGEM_LABEL: Record<string, string> = {
  cliente_produto_variante: "Cliente + Produto + Variante",
  cliente_produto: "Cliente + Produto",
  cliente_artigo: "Cliente + Artigo",
  nenhum: "Nenhuma regra encontrada",
};

function Simulador() {
  const resolver = useServerFn(resolverPrecoClienteArtigo);
  const [clienteId, setClienteId] = useState<string>("");
  const [produtoId, setProdutoId] = useState<string>("");
  const [resultado, setResultado] = useState<ResolucaoPreco | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ["sim-clientes"],
    queryFn: async () => (await supabase.from("customers").select("id, razao_social, nome_fantasia").order("razao_social").limit(500)).data ?? [],
  });
  const { data: produtos = [] } = useQuery({
    queryKey: ["sim-produtos"],
    queryFn: async () => (await supabase.from("products").select("id, codigo, descricao, article_id").order("codigo").limit(500)).data ?? [],
  });

  const simular = async () => {
    if (!clienteId || !produtoId) return;
    setLoading(true);
    try {
      const res = await resolver({ data: { cliente_id: clienteId, produto_id: produtoId } });
      setResultado(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Simulador de preço"
        description="Consulte a regra Cliente × Artigo aplicável para um pedido."
        actions={
          <Link to="/cliente-artigo"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button></Link>
        }
      />

      <Card className="p-6 space-y-4 max-w-2xl">
        <div>
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Produto</Label>
          <Select value={produtoId} onValueChange={setProdutoId}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {produtos.map(p => <SelectItem key={p.id} value={p.id}>{p.codigo} — {p.descricao}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={simular} disabled={!clienteId || !produtoId || loading}>
          <Calculator className="w-4 h-4 mr-2" />{loading ? "Calculando..." : "Simular"}
        </Button>

        {resultado && (
          <div className="mt-4 p-4 border rounded-md bg-muted/30 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Origem:</span>
              <Badge variant={resultado.origem === "nenhum" ? "outline" : "default"}>
                {ORIGEM_LABEL[resultado.origem]}
              </Badge>
            </div>
            {resultado.preco !== null && (
              <>
                <div className="text-2xl font-bold">
                  {resultado.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 })}
                </div>
                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                  <div>Desconto máx.: {resultado.desconto_maximo_pct?.toFixed(2) ?? "0"}%</div>
                  <div>Prazo: {resultado.prazo_entrega_dias ? `${resultado.prazo_entrega_dias} dias` : "-"}</div>
                  <div className="col-span-2">Cond. pagamento: {resultado.condicao_pagamento ?? "-"}</div>
                </div>
              </>
            )}
            {resultado.origem === "nenhum" && (
              <p className="text-sm text-muted-foreground">
                Nenhuma regra cadastrada para este cliente + produto. O pedido usará preço manual.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
