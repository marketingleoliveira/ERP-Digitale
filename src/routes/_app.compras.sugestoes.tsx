import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchMrpSuggestions, 
  generateMrpSuggestions, 
  approveMrpSuggestion, 
  fetchSuggestionOrigins,
  convertSuggestionsToOrder 
} from '@/lib/mrp-suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 

  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Play, 
  ArrowRight,
  Filter,
  Search,
  ShoppingCart,
  ExternalLink
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { Link, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/compras/sugestoes')({
  component: MrpSuggestionsPage,
});

function MrpSuggestionsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [conversionData, setConversionData] = useState<{
    supplierId: string;
    paymentTerms: string;
    deliveryDate: string;
    items: any[];
  } | null>(null);

  const { data: suggestions, isLoading } = useQuery({

    queryKey: ['mrp-suggestions', filterStatus],
    queryFn: () => fetchMrpSuggestions(filterStatus !== 'all' ? { status: filterStatus } : {}),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateMrpSuggestions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mrp-suggestions'] });
      toast.success('Sugestões geradas com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao gerar sugestões: ' + error.message);
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string, qty: number }) => approveMrpSuggestion(id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mrp-suggestions'] });
      toast.success('Sugestão aprovada');
    }
  });

  const convertMutation = useMutation({
    mutationFn: (data: { ids: string[], supplierId: string, paymentTerms?: string, deliveryDate?: string }) => 
      convertSuggestionsToOrder(data.ids, data.supplierId, data.paymentTerms, data.deliveryDate),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['mrp-suggestions'] });
      const orderNumber = order.numero || order.id.slice(0, 8);
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Pedido de compra #{orderNumber} gerado com sucesso</span>
          <Button 
            variant="link" 
            className="p-0 h-auto text-blue-600 justify-start"
            onClick={() => navigate({ to: `/_app/compras/pedidos/${order.id}` })}
          >
            Visualizar pedido
          </Button>
        </div>,
        { duration: 6000 }
      );
      setIsConversionModalOpen(false);
      setSelectedIds([]);
    },
    onError: (error: any) => {
      toast.error('Erro ao converter sugestões: ' + (error.message || 'Erro desconhecido'));
    }
  });

  const handleOpenConversion = () => {
    if (selectedIds.length === 0) return;
    
    const selectedItems = suggestions?.filter(s => selectedIds.includes(s.id)) || [];
    const suppliers = new Set(selectedItems.map(s => s.fornecedor_sugerido_id).filter(Boolean));
    
    if (suppliers.size > 1) {
      toast.error('Selecione sugestões do mesmo fornecedor para converter em um único pedido.');
      return;
    }

    const supplierId = Array.from(suppliers)[0] as string || '';
    
    setConversionData({
      supplierId,
      paymentTerms: '',
      deliveryDate: format(new Date(), 'yyyy-MM-dd'),
      items: selectedItems
    });
    setIsConversionModalOpen(true);
  };

  const filteredData = useMemo(() => {
    if (!suggestions) return [];
    return suggestions.filter(s => 
      s.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ref_tipo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suggestions, searchTerm]);

  const summary = useMemo(() => {
    if (!suggestions) return { total: 0, pending: 0, totalValue: 0, critical: 0 };
    return {
      total: suggestions.length,
      pending: suggestions.filter(s => s.status === 'SUGERIDA').length,
      totalValue: suggestions.reduce((acc, s) => acc + (s.custo_total_estimado || 0), 0),
      critical: suggestions.filter(s => s.prioridade === 'urgente' || s.prioridade === 'alta').length
    };
  }, [suggestions]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      SUGERIDA: { label: 'Sugerida', variant: 'secondary' },
      EM_ANALISE: { label: 'Em Análise', variant: 'outline' },
      APROVADA: { label: 'Aprovada', variant: 'default' },
      CONVERTIDA: { label: 'Convertida', variant: 'success' },
      CANCELADA: { label: 'Cancelada', variant: 'destructive' },
      DESATUALIZADA: { label: 'Desatualizada', variant: 'warning' },
    };
    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sugestões do MRP</h1>
          <p className="text-muted-foreground">Converta necessidades líquidas em pedidos de compra.</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button 
              onClick={handleOpenConversion}
              variant="default"
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Converter ({selectedIds.length})
            </Button>
          )}
          <Button 
            onClick={() => generateMutation.mutate()} 
            disabled={generateMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            {generateMutation.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Reprocessar MRP
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sugestões</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">{summary.pending} pendentes de análise</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">Baseado no melhor custo atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
            <p className="text-xs text-muted-foreground">Prioridade alta ou urgente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura MRP</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">OPs ativas processadas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Listagem de Sugestões</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar material..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="SUGERIDA">Sugeridas</SelectItem>
                  <SelectItem value="APROVADA">Aprovadas</SelectItem>
                  <SelectItem value="CONVERTIDA">Convertidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredData.filter(s => s.status === 'APROVADA').map(s => s.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      checked={selectedIds.length > 0 && selectedIds.length === filteredData.filter(s => s.status === 'APROVADA').length}
                    />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Nec. Líquida</TableHead>
                  <TableHead className="text-right">Sugerido</TableHead>
                  <TableHead>Un</TableHead>
                  <TableHead>Data Nec.</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={10}><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      Nenhuma sugestão encontrada. Processe o MRP para gerar novas sugestões.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className={`${item.prioridade === 'urgente' ? 'bg-red-50/30' : ''} cursor-pointer hover:bg-muted/50 ${selectedIds.includes(item.id) ? 'bg-muted' : ''}`}
                    >

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item.id)}
                          disabled={item.status !== 'APROVADA'}
                          onChange={() => {
                            setSelectedIds(prev => 
                              prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell onClick={() => setSelectedSuggestion(item)}>{getStatusBadge(item.status)}</TableCell>
                      <TableCell onClick={() => setSelectedSuggestion(item)}>
                        <Badge 
                          variant={item.prioridade === 'urgente' || item.prioridade === 'alta' ? 'destructive' : 'outline'}
                          className="capitalize"
                        >
                          {item.prioridade}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium" onClick={() => setSelectedSuggestion(item)}>
                        {item.descricao}
                        <div className="text-xs text-muted-foreground uppercase">{item.ref_tipo}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono" onClick={() => setSelectedSuggestion(item)}>{item.necessidade_liquida.toFixed(3)}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary" onClick={() => setSelectedSuggestion(item)}>{item.quantidade_sugerida.toFixed(3)}</TableCell>
                      <TableCell onClick={() => setSelectedSuggestion(item)}>{item.unidade}</TableCell>
                      <TableCell onClick={() => setSelectedSuggestion(item)}>{item.data_necessaria ? format(new Date(item.data_necessaria), 'dd/MM/yy') : '—'}</TableCell>
                      <TableCell className="max-w-[150px] truncate" onClick={() => setSelectedSuggestion(item)}>{item.fornecedor?.nome_fantasia || 'A definir'}</TableCell>
                      <TableCell className="text-right" onClick={() => setSelectedSuggestion(item)}>
                        {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_total_estimado || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === 'SUGERIDA' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => approveMutation.mutate({ id: item.id, qty: item.quantidade_sugerida })}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {item.status === 'APROVADA' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIds([item.id]);
                              handleOpenConversion();
                            }}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Comprar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!selectedSuggestion} onOpenChange={(open) => !open && setSelectedSuggestion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhamento da Sugestão</DialogTitle>
            <DialogDescription>
              Origens e composição da necessidade para {selectedSuggestion?.descricao}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSuggestion && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Necessidade Bruta</h4>
                  <p className="text-lg font-bold">{selectedSuggestion.necessidade_bruta.toFixed(3)} {selectedSuggestion.unidade}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Estoque Disponível</h4>
                  <p className="text-lg font-bold">{selectedSuggestion.estoque_disponivel.toFixed(3)} {selectedSuggestion.unidade}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Compras em Trânsito</h4>
                  <p className="text-lg font-bold">{selectedSuggestion.quantidade_em_transito.toFixed(3)} {selectedSuggestion.unidade}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Necessidade Líquida</h4>
                  <p className="text-lg font-bold text-primary">{selectedSuggestion.necessidade_liquida.toFixed(3)} {selectedSuggestion.unidade}</p>
                </div>
              </div>

              <div className="border rounded-md p-4 bg-muted/50">
                <h4 className="text-sm font-semibold mb-2">Composição por Ordens de Produção</h4>
                <div className="space-y-2">
                  <SuggestionOrigins suggestionId={selectedSuggestion.id} />
                </div>
              </div>

              {selectedSuggestion.status === 'SUGERIDA' && (
                <div className="flex items-center gap-2 pt-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Quantidade a Aprovar</label>
                    <Input 
                      type="number" 
                      defaultValue={selectedSuggestion.quantidade_sugerida}
                      onChange={(e) => selectedSuggestion.tempQty = Number(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="mt-6"
                    onClick={() => {
                      approveMutation.mutate({ 
                        id: selectedSuggestion.id, 
                        qty: selectedSuggestion.tempQty || selectedSuggestion.quantidade_sugerida 
                      });
                      setSelectedSuggestion(null);
                    }}
                  >
                    Aprovar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isConversionModalOpen} onOpenChange={setIsConversionModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Conferência de Conversão</DialogTitle>
            <DialogDescription>
              Revise os itens e condições antes de gerar o pedido de compra.
            </DialogDescription>
          </DialogHeader>
          
          {conversionData && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Condição de Pagamento</label>
                  <Input 
                    placeholder="Ex: 30/60 dias" 
                    value={conversionData.paymentTerms}
                    onChange={(e) => setConversionData({...conversionData, paymentTerms: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Entrega</label>
                  <Input 
                    type="date" 
                    value={conversionData.deliveryDate}
                    onChange={(e) => setConversionData({...conversionData, deliveryDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Un</TableHead>
                      <TableHead className="text-right">Preço Un. (Est.)</TableHead>
                      <TableHead className="text-right">Total (Est.)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversionData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.descricao}</TableCell>
                        <TableCell className="text-right">{item.quantidade_aprovada.toFixed(3)}</TableCell>
                        <TableCell>{item.unidade}</TableCell>
                        <TableCell className="text-right">
                          {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_unitario_estimado || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_total_estimado || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/20 font-bold">
                      <TableCell colSpan={4} className="text-right">Total Geral Estimado:</TableCell>
                      <TableCell className="text-right">
                        {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          conversionData.items.reduce((acc, curr) => acc + (curr.custo_total_estimado || 0), 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-100 rounded text-yellow-800 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>Esta operação é irreversível. O pedido será criado no status <strong>rascunho</strong>.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConversionModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={convertMutation.isPending}
              onClick={() => {
                if (conversionData) {
                  convertMutation.mutate({
                    ids: selectedIds,
                    supplierId: conversionData.supplierId,
                    paymentTerms: conversionData.paymentTerms,
                    deliveryDate: conversionData.deliveryDate
                  });
                }
              }}
            >
              {convertMutation.isPending ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirmar Conversão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SuggestionOrigins({ suggestionId }: { suggestionId: string }) {
  const { data: origins, isLoading } = useQuery({
    queryKey: ['mrp-suggestion-origins', suggestionId],
    queryFn: () => fetchSuggestionOrigins(suggestionId),
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!origins || origins.length === 0) return <p className="text-sm text-muted-foreground">Sem dados de origem.</p>;

  return (
    <ul className="space-y-1">
      {origins.map((o: any) => (
        <li key={o.id} className="text-sm flex justify-between">
          <span>OP #{o.op?.numero || 'Extra'}</span>
          <span className="font-mono">{o.quantidade.toFixed(3)}</span>
        </li>
      ))}
    </ul>
  );
}

