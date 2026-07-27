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
  ShoppingCart
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_app/compras/sugestoes')({
  component: MrpSuggestionsPage,
});

function MrpSuggestionsPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={generateMutation.isPending}
          className="gap-2"
        >
          {generateMutation.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Processar MRP
        </Button>
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
                    <TableRow key={item.id} className={item.prioridade === 'urgente' ? 'bg-red-50/30' : ''}>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.prioridade === 'urgente' || item.prioridade === 'alta' ? 'destructive' : 'outline'}
                          className="capitalize"
                        >
                          {item.prioridade}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.descricao}
                        <div className="text-xs text-muted-foreground uppercase">{item.ref_tipo}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{item.necessidade_liquida.toFixed(3)}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">{item.quantidade_sugerida.toFixed(3)}</TableCell>
                      <TableCell>{item.unidade}</TableCell>
                      <TableCell>{item.data_necessaria ? format(new Date(item.data_necessaria), 'dd/MM/yy') : '—'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{item.fornecedor?.nome_fantasia || 'A definir'}</TableCell>
                      <TableCell className="text-right">
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
                          <Button size="sm" variant="outline" className="h-8 gap-1">
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
    </div>
  );
}
