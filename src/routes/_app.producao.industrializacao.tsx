import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getIndustrializationOrders } from '@/lib/op-industrializacao.functions';
import { Button } from '@/components/ui/button';
import { Plus, Truck, PackageCheck, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_app/producao/industrializacao')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['industrialization-orders'],
      queryFn: () => getIndustrializationOrders(),
    });
  },
  component: IndustrializacaoPage,
});

function IndustrializacaoPage() {
  const { data: orders } = useSuspenseQuery({
    queryKey: ['industrialization-orders'],
    queryFn: () => getIndustrializationOrders(),
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'CONCLUÍDA': return 'default';
      case 'CANCELADA': return 'destructive';
      case 'EM-PODER-DO-TERCEIRO': return 'secondary';
      case 'RASCUNHO': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Industrialização por Terceiros</h1>
          <p className="text-muted-foreground">Gestão de remessas e retornos de beneficiamento externo.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nova Ordem
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordens Ativas</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status !== 'CONCLUÍDA' && o.status !== 'CANCELADA').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Terceiros</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'EM-PODER-DO-TERCEIRO').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Retorno</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'RETORNO-PARCIAL').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordens de Industrialização</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Artigo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.numero}</TableCell>
                  <TableCell>{(order.fornecedor as any)?.nome_fantasia || (order.fornecedor as any)?.razao_social}</TableCell>
                  <TableCell>{order.servico_tipo}</TableCell>
                  <TableCell>{(order.artigo as any)?.nome} ({(order.artigo as any)?.codigo})</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status as string)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.data_emissao!), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Ver Detalhes</Button>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhuma ordem de industrialização encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
