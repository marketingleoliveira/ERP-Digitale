import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Search, Printer, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/fiscal/nota-fiscal")({
  component: NotasFiscaisPage,
  head: () => ({
    title: "Documentos Fiscais | ERP Digitale",
    meta: [
      { name: "description", content: "Gerenciamento de Notas Fiscais, Emissão, Cancelamento e Rastreabilidade SEFAZ." },
      { property: "og:title", content: "Documentos Fiscais | ERP Digitale" },
    ],
  }),
});

function NotasFiscaisPage() {
  const { data: notas } = useSuspenseQuery({
    queryKey: ["notas-fiscais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notas_fiscais")
        .select("*, customer:cliente_id(razao_social)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "autorizada": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejeitada": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "cancelada": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos Fiscais</h1>
          <p className="text-muted-foreground">Emissão e controle de NF-e integrados à expedição.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Emissões</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número/Série</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status SEFAZ</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum documento fiscal emitido.
                  </TableCell>
                </TableRow>
              ) : (
                notas.map((nota) => (
                  <TableRow key={nota.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{nota.numero || "—"}</span>
                        <span className="text-xs text-muted-foreground">Série {nota.serie || 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(nota.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{nota.customer?.razao_social || "Consumidor"}</TableCell>
                    <TableCell>R$ {Number(nota.valor_total || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(nota.status_sefaz || "")} variant="outline">
                        {nota.status_sefaz?.toUpperCase() || "PENDENTE"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" title="Ver Detalhes">
                          <Search className="h-4 w-4" />
                        </Button>
                        {nota.danfe_url && (
                          <Button size="icon" variant="ghost" asChild title="Imprimir DANFE">
                            <a href={nota.danfe_url} target="_blank" rel="noreferrer">
                              <Printer className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {nota.status_sefaz === "rejeitada" && (
                          <Button size="icon" variant="ghost" className="text-red-500" title="Ver Rejeição">
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
