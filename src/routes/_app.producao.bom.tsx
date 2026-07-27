import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Search, FileText, ChevronRight, ChevronDown, 
  Layers, List, GitBranch, AlertCircle, Shirt, ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { explodeBom, ExplodeBomItem } from "@/lib/bom-explosion";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/producao/bom")({
  ssr: false,
  head: () => ({ meta: [{ title: "Ficha Técnica (BOM)" }] }),
  component: BomPage,
});

function BomPage() {
  const [selectedArticle, setSelectedArticle] = useState<{ id: string; nome: string; codigo: string } | null>(null);
  const [filter, setFilter] = useState("");
  const [plannedQty, setPlannedQty] = useState(1);
  const [viewMode, setViewMode] = useState<"tree" | "consolidated" | "levels">("tree");

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ["articles-bom-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, codigo, nome, ativo, tipo")
        .order("codigo", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: explosion = [], isLoading: loadingExplosion, error: explosionError } = useQuery({
    queryKey: ["bom-explosion", selectedArticle?.id, plannedQty],
    queryFn: () => selectedArticle ? explodeBom(selectedArticle.id, plannedQty) : Promise.resolve([]),
    enabled: !!selectedArticle,
  });

  const filteredArticles = articles.filter(a => 
    (a.codigo || "").toLowerCase().includes(filter.toLowerCase()) ||
    (a.nome || "").toLowerCase().includes(filter.toLowerCase())
  );

  // Agrupamento para tabela consolidada
  const consolidatedData = useMemo(() => {
    const map = new Map<string, ExplodeBomItem & { total_liq: number; total_bru: number }>();
    explosion.forEach(item => {
      const key = `${item.component_ref_id}-${item.component_ref_tipo}`;
      const existing = map.get(key);
      if (existing) {
        existing.total_liq += Number(item.quantidade_liquida);
        existing.total_bru += Number(item.quantidade_bruta);
      } else {
        map.set(key, { 
          ...item, 
          total_liq: Number(item.quantidade_liquida), 
          total_bru: Number(item.quantidade_bruta) 
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.codigo || "").localeCompare(b.codigo || ""));
  }, [explosion]);

  if (selectedArticle) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedArticle(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title={`Explosão: ${selectedArticle.nome}`}
            description={`Código: ${selectedArticle.codigo} | Planejado: ${plannedQty} unidades`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantidade Planejada</label>
            <Input 
              type="number" 
              value={plannedQty} 
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 1000000) return; // Limite de 1 milhão
                setPlannedQty(Math.max(0.0001, val));
              }}
              min={1}
            />
          </div>
          <div className="md:col-span-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
              <TabsList>
                <TabsTrigger value="tree" className="gap-2">
                  <GitBranch className="h-4 w-4" /> Árvore
                </TabsTrigger>
                <TabsTrigger value="consolidated" className="gap-2">
                  <List className="h-4 w-4" /> Consolidado
                </TabsTrigger>
                <TabsTrigger value="levels" className="gap-2">
                  <Layers className="h-4 w-4" /> Por Nível
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loadingExplosion ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Processando motor de explosão...</p>
          </div>
        ) : explosionError ? (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-4 py-6">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Erro na Explosão</p>
                <p className="text-sm text-muted-foreground">
                  Houve um problema ao processar a estrutura recursiva. Verifique se existem ciclos infinitos ou artigos sem cadastro na BOM.
                  Detalhamento técnico: {(explosionError as any)?.message || 'Erro desconhecido'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : explosion.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-20 text-muted-foreground">
              <Shirt className="h-12 w-12 mb-4 opacity-20" />
              <p>Este artigo não possui itens definidos na Ficha Técnica (BOM).</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/artigos" search={{ detail: selectedArticle.id }}>Ir para cadastro</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">Estrutura de Materiais</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {viewMode === "tree" && (
                <div className="p-4 overflow-x-auto">
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estrutura / Descrição</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Qtd Liq</TableHead>
                        <TableHead className="text-right">Qtd Bruta (c/ perda)</TableHead>
                        <TableHead>Un</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {explosion.map((item, idx) => (
                        <TableRow key={idx} className={cn(!item.ativo && "opacity-60 bg-muted/30")}>
                          <TableCell className="font-medium whitespace-nowrap">
                            <div className="flex items-center" style={{ paddingLeft: `${(item.nivel - 1) * 20}px` }}>
                              {item.nivel > 1 && <div className="w-4 h-px bg-border mr-2" />}
                              <span className={cn(
                                "flex items-center gap-2",
                                item.component_ref_tipo === "artigo" ? "text-primary" : "text-foreground"
                              )}>
                                {item.component_ref_tipo === "artigo" ? <Layers className="h-3 w-3" /> : <GitBranch className="h-3 w-3" />}
                                {item.component_descricao}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{item.codigo || "—"}</TableCell>
                          <TableCell>
                             <Badge variant="outline" className="font-mono">{item.nivel}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize text-[10px] h-5 px-1.5">
                              {item.component_ref_tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {Number(item.quantidade_liquida).toLocaleString(undefined, { minimumFractionDigits: 4 })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                             {Number(item.quantidade_bruta).toLocaleString(undefined, { minimumFractionDigits: 4 })}
                          </TableCell>
                          <TableCell className="text-xs">{item.unidade}</TableCell>
                          <TableCell>
                             {!item.ativo && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Inativo</Badge>}
                             {item.ativo && <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-green-600 border-green-200">OK</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {viewMode === "consolidated" && (
                <Table>
                   <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Componente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Total Liq</TableHead>
                      <TableHead className="text-right">Total Bruto</TableHead>
                      <TableHead>Un</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidatedData.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{item.codigo || "—"}</TableCell>
                        <TableCell className="font-medium">{item.component_descricao}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {item.component_ref_tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                           {item.total_liq.toLocaleString(undefined, { minimumFractionDigits: 4 })}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                           {item.total_bru.toLocaleString(undefined, { minimumFractionDigits: 4 })}
                        </TableCell>
                        <TableCell className="text-xs">{item.unidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {viewMode === "levels" && (
                <div className="p-4 space-y-4">
                  {[...new Set(explosion.map(i => i.nivel))].sort().map(level => (
                    <div key={level} className="space-y-2">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Badge variant="default">Nível {level}</Badge>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {explosion.filter(i => i.nivel === level).map((item, idx) => (
                          <div key={idx} className="p-2 border rounded-md text-xs bg-card hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold truncate">{item.component_descricao}</span>
                              <Badge variant="outline" className="text-[9px] h-4">{item.unidade}</Badge>
                            </div>
                            <div className="text-muted-foreground font-mono flex justify-between">
                              <span>Qtd: {Number(item.quantidade_bruta).toFixed(4)}</span>
                              <span>{item.codigo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Ficha Técnica (BOM)"
        description="Explosão multinível de materiais e componentes."
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
          <CardTitle className="text-sm font-medium">Artigos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Artigo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingArticles && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!loadingArticles && filteredArticles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum artigo encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filteredArticles.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.codigo || "—"}</TableCell>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {a.tipo || "Produto"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.ativo ? "default" : "secondary"}>
                      {a.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedArticle({ id: a.id, nome: a.nome, codigo: a.codigo || "" })}
                    >
                      <GitBranch className="h-4 w-4 mr-2" />
                      Explodir BOM
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/artigos" search={{ detail: a.id }}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
