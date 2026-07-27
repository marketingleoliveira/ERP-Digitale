import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, FileText, Plus, Shirt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/producao/bom")({
  ssr: false,
  head: () => ({ meta: [{ title: "Ficha Técnica (BOM)" }] }),
  component: BomPage,
});

function BomPage() {
  const [filter, setFilter] = useState("");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles-bom-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, codigo, nome, ativo")
        .order("codigo", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: bomCounts = {} } = useQuery({
    queryKey: ["bom-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_bom")
        .select("article_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const b of data) {
        counts[b.article_id] = (counts[b.article_id] || 0) + 1;
      }
      return counts;
    },
  });

  const filtered = articles.filter(a => 
    (a.codigo || "").toLowerCase().includes(filter.toLowerCase()) ||
    (a.nome || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Ficha Técnica (BOM)"
        description="Gerenciamento de explosão de materiais por artigo. Base para o MRP."
      />

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou nome..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Artigos</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Artigo</TableHead>
                <TableHead className="text-center">Itens na BOM</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum artigo encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((a) => {
                const count = bomCounts[a.id] || 0;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.codigo || "—"}</TableCell>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell className="text-center">
                      {count > 0 ? (
                        <Badge variant="secondary">{count} itens</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Vazia</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.ativo ? "default" : "secondary"}>
                        {a.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/artigos" search={{ detail: a.id }}>
                          <FileText className="h-4 w-4 mr-2" />
                          Editar BOM
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="rounded-md border border-blue-500/50 bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-400">
        <h4 className="font-semibold flex items-center gap-2 mb-1">
          <Shirt className="h-4 w-4" /> Dica de Integração
        </h4>
        <p>
          A Ficha Técnica (BOM) está integrada ao cadastro de Artigos. 
          Ao editar um artigo, você pode definir os fios, tecidos e outros componentes 
          que compõem o produto final. Essas informações são usadas pelo MRP para 
          calcular a necessidade de materiais.
        </p>
      </div>
    </div>
  );
}
