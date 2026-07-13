import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Upload, Calculator } from "lucide-react";
import { ClienteArtigoFormDialog } from "@/components/comercial/cliente-artigo-form-dialog";
import {
  listarClienteArtigo, exportarCsvClienteArtigo, importarCsvClienteArtigo,
} from "@/services/comercial/cliente-artigo.functions";

export const Route = createFileRoute("/_app/cliente-artigo")({
  ssr: false,
  head: () => ({ meta: [{ title: "Cliente × Artigo" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Erro: {error.message}</div>,
  component: Page,
});

function Page() {
  const listar = useServerFn(listarClienteArtigo);
  const exportar = useServerFn(exportarCsvClienteArtigo);
  const importar = useServerFn(importarCsvClienteArtigo);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["cliente-artigo-list", search],
    queryFn: () => listar({ data: { search: search || undefined } }),
  });

  const baixarCsv = async () => {
    const { csv } = await exportar({ data: {} });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cliente-artigo.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const enviarCsv = async () => {
    try {
      const res = await importar({ data: { csv: csvText } });
      toast.success(`${res.inseridos} regras importadas${res.erros.length ? `, ${res.erros.length} erros` : ""}`);
      if (res.erros.length) console.warn("Erros CSV:", res.erros);
      qc.invalidateQueries({ queryKey: ["cliente-artigo-list"] });
      setImportOpen(false);
      setCsvText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao importar");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Cliente × Artigo"
        description="Preços negociados, condições comerciais e regras específicas por cliente."
        actions={
          <div className="flex gap-2">
            <Link to="/cliente-artigo/simulador">
              <Button variant="outline"><Calculator className="w-4 h-4 mr-2" />Simulador</Button>
            </Link>
            <Button variant="outline" onClick={baixarCsv}><Download className="w-4 h-4 mr-2" />Exportar</Button>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Upload className="w-4 h-4 mr-2" />Importar</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Importar CSV</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Separador <code>;</code>. Cabeçalho: cliente_id;artigo_id;produto_id;variante_id;codigo_cliente;descricao_comercial;unidade;preco_negociado;quantidade_minima;desconto_maximo_pct;vigencia_inicio;vigencia_fim;ativo
                </p>
                <Textarea rows={12} value={csvText} onChange={e => setCsvText(e.target.value)} className="font-mono text-xs" />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
                  <Button onClick={enviarCsv} disabled={!csvText.trim()}>Importar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <ClienteArtigoFormDialog />
          </div>
        }
      />

      <Input
        placeholder="Buscar por código ou descrição..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Artigo</TableHead>
            <TableHead>Cód. cliente</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">Desc. máx.</TableHead>
            <TableHead>Vigência</TableHead>
            <TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma regra cadastrada.</TableCell></TableRow>
            ) : data.map(r => {
              const row = r as unknown as Record<string, unknown> & { id: string };
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link to="/cliente-artigo/$id" params={{ id: row.id }} className="hover:underline font-medium">
                      {row.cliente_nome as string}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{row.artigo_desc as string}</TableCell>
                  <TableCell className="font-mono text-xs">{(row.codigo_cliente as string) ?? "-"}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(row.preco_negociado).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 })}
                  </TableCell>
                  <TableCell className="text-right">{Number(row.desconto_maximo_pct).toFixed(2)}%</TableCell>
                  <TableCell className="text-xs">
                    {new Date(row.vigencia_inicio as string).toLocaleDateString("pt-BR")}
                    {row.vigencia_fim ? ` → ${new Date(row.vigencia_fim as string).toLocaleDateString("pt-BR")}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.ativo ? "default" : "outline"}>{row.ativo ? "Ativo" : "Inativo"}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
