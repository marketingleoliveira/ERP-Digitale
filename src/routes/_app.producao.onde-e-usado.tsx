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
  Layers, List, GitBranch, AlertCircle, Shirt, ArrowLeft,
  Filter, Eye, EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWhereUsed, WhereUsedItem } from "@/lib/where-used";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/producao/onde-e-usado")({
  ssr: false,
  head: () => ({ meta: [{ title: "Onde é Usado (Reverse BOM)" }] }),
  component: WhereUsedPage,
});

function WhereUsedPage() {
  const [selectedItem, setSelectedItem] = useState<{ id: string; nome: string; codigo: string } | null>(null);
  const [filter, setFilter] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "consolidated" | "levels">("tree");

  const { data: searchItems = [], isLoading: loadingSearch } = useQuery({
    queryKey: ["where-used-search-items"],
    queryFn: async () => {
      // Busca em artigos e produtos (usando articles como base unificada)
      const { data, error } = await supabase
        .from("articles")
        .select("id, codigo, nome, ativo, tipo")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: usage = [], isLoading: loadingUsage, error: usageError } = useQuery({
    queryKey: ["where-used-data", selectedItem?.id, includeInactive],
    queryFn: () => selectedItem ? getWhereUsed(selectedItem.id, includeInactive) : Promise.resolve([]),
    enabled: !!selectedItem,
  });

  const filteredSearchItems = searchItems.filter(a => 
    (a.codigo || "").toLowerCase().includes(filter.toLowerCase()) ||
    (a.nome || "").toLowerCase().includes(filter.toLowerCase())
  );

  const consolidatedData = useMemo(() => {
    const map = new Map<string, WhereUsedItem & { count: number; min_level: number; max_level: number }>();
    usage.forEach(item => {
      const key = item.parent_article_id;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.min_level = Math.min(existing.min_level, item.nivel);
        existing.max_level = Math.max(existing.max_level, item.nivel);
        existing.quantidade_acumulada += Number(item.quantidade_acumulada);
      } else {
        map.set(key, { 
          ...item, 
          count: 1,
          min_level: item.nivel,
          max_level: item.nivel
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.article_nome.localeCompare(b.article_nome));
  }, [usage]);

  if (selectedItem) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedItem(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title={`Onde é Usado: ${selectedItem.nome}`}
            description={`Código: ${selectedItem.codigo}`}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-lg border">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-auto">
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

          <div className="flex items-center space-x-2">
            <Switch 
              id="include-inactive" 
              checked={includeInactive} 
              onCheckedChange={setIncludeInactive} 
            />
            <Label htmlFor="include-inactive" className="text-sm cursor-pointer flex items-center gap-2">
              {includeInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Incluir Inativos
            </Label>
          </div>
        </div>

        {loadingUsage ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Rastreando utilização na cadeia produtiva...</p>
          </div>
        ) : usageError ? (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-4 py-6">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Erro na Consulta</p>
                <p className="text-sm text-muted-foreground">
                  Houve um problema ao rastrear a utilização deste componente.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : usage.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-20 text-muted-foreground text-center">
              <Shirt className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma utilização encontrada.</p>
              <p className="max-w-md">Este item não é utilizado em nenhuma Ficha Técnica ou estrutura de semiacabado.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {viewMode === "tree" && (
                <div className="p-4 overflow-x-auto">
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Caminho de Utilização</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Qtd Vínculo</TableHead>
                        <TableHead className="text-right">Qtd Acumulada</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ciclo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usage.map((item, idx) => (
                        <TableRow key={idx} className={cn(!item.artigo_status && "opacity-60 bg-muted/30")}>
                          <TableCell className="font-medium whitespace-nowrap">
                            <div className="flex items-center" style={{ paddingLeft: `${(item.nivel - 1) * 20}px` }}>
                              {item.nivel > 1 && <ChevronRight className="h-3 w-3 mr-1 text-muted-foreground" />}
                              <span className={cn(
                                "flex items-center gap-2",
                                item.uso_tipo === "Direto" ? "font-bold text-primary" : "text-foreground"
                              )}>
                                {item.article_nome}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{item.article_codigo || "—"}</TableCell>
                          <TableCell>
                             <Badge variant="outline" className="font-mono">{item.nivel}</Badge>
                          </TableCell>
                          <TableCell>
                             <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{item.uso_tipo}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {Number(item.quantidade_no_vinculo).toFixed(4)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                             {Number(item.quantidade_acumulada).toFixed(4)}
                          </TableCell>
                          <TableCell>
                             {!item.artigo_status ? (
                               <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Inativo</Badge>
                             ) : (
                               <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-green-600 border-green-200">Ativo</Badge>
                             )}
                          </TableCell>
                          <TableCell>
                             {item.has_cycle && (
                               <Badge variant="destructive" className="animate-pulse">CICLO</Badge>
                             )}
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
                      <TableHead>Artigo Pai / Final</TableHead>
                      <TableHead>Ocorrências</TableHead>
                      <TableHead>Nível (Min-Max)</TableHead>
                      <TableHead className="text-right">Qtd Acumulada</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidatedData.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{item.article_codigo || "—"}</TableCell>
                        <TableCell className="font-medium">{item.article_nome}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell className="font-mono text-xs">{item.min_level} → {item.max_level}</TableCell>
                        <TableCell className="text-right font-mono font-bold">
                           {Number(item.quantidade_acumulada).toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.uso_tipo === "Direto" ? "default" : "secondary"}>
                            {item.uso_tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/producao/bom" search={{ articleId: item.parent_article_id } as any}>
                              <GitBranch className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {viewMode === "levels" && (
                <div className="p-4 space-y-4">
                  {[...new Set(usage.map(i => i.nivel))].sort().map(level => (
                    <div key={level} className="space-y-2">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Badge variant="default">Nível {level}</Badge>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {usage.filter(i => i.nivel === level).map((item, idx) => (
                          <div key={idx} className="p-3 border rounded-md text-xs bg-card hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold truncate">{item.article_nome}</span>
                              <Badge variant={item.artigo_status ? "outline" : "destructive"} className="text-[9px] h-4">
                                {item.artigo_status ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground font-mono flex flex-col gap-1 mt-2">
                              <div className="flex justify-between">
                                <span>Qtd Acum:</span>
                                <span className="text-foreground">{Number(item.quantidade_acumulada).toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span>Cód: {item.article_codigo}</span>
                                <span>{item.uso_tipo}</span>
                              </div>
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
        title="Onde é Usado"
        description="Engenharia reversa da BOM: identifique onde cada componente é utilizado."
      />

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou nome de componente..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Selecione um Componente / Matéria-prima</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Componente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingSearch && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!loadingSearch && filteredSearchItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filteredSearchItems.map((a) => (
                <TableRow key={a.id} className={cn(!a.ativo && "opacity-60")}>
                  <TableCell className="font-mono text-xs">{a.codigo || "—"}</TableCell>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {a.tipo || "Geral"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.ativo ? "default" : "secondary"}>
                      {a.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedItem({ id: a.id, nome: a.nome, codigo: a.codigo || "" })}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Rastrear Uso
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
