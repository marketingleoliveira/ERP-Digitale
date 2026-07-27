import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIndustrializationOrderById, shipMaterialToExternalProcessor } from '@/lib/op-industrializacao.functions';
import { Button } from '@/components/ui/button';
import { Truck, PackageCheck, History, ArrowLeft, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_app/producao/industrializacao/$id')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['industrialization-order', params.id],
      queryFn: () => getIndustrializationOrderById({ data: params.id }),
    });
  },
  component: IndustrializacaoDetailPage,
});


function IndustrializacaoDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: order } = useSuspenseQuery({
    queryKey: ['industrialization-order', id],
    queryFn: () => getIndustrializationOrderById({ data: id }),
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/producao/industrializacao' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ordem #{order.numero}</h1>
          <p className="text-muted-foreground">Industrialização por Terceiros</p>
        </div>
        <div className="ml-auto flex gap-2">
          {order.status === 'RASCUNHO' && (
             <Button className="gap-2">
               Aprovar Ordem
             </Button>
          )}
          {['APROVADA', 'AGUARDANDO-REMESSA', 'REMESSA-PARCIAL'].includes(order.status as string) && (
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Truck className="h-4 w-4" /> Registrar Remessa
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fornecedor</p>
              <p className="font-semibold">{(order.fornecedor as any)?.razao_social}</p>
              <p className="text-xs text-muted-foreground">CNPJ: {(order.fornecedor as any)?.cnpj}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Serviço</p>
              <p className="font-semibold">{order.servico_tipo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Artigo / Produto</p>
              <p className="font-semibold">{(order.artigo as any)?.nome}</p>
              <p className="text-xs text-muted-foreground">Código: {(order.artigo as any)?.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(order.status as string)} className="mt-1">
                {order.status}
              </Badge>
            </div>
            {order.op && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">OP Relacionada</p>
                <p className="font-semibold">#{(order.op as any)?.numero_op}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data Emissão</p>
              <p className="font-semibold">{format(new Date(order.data_emissao!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prazos e Obs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <p className="text-sm font-medium text-muted-foreground">Previsão de Retorno</p>
                <p className="font-semibold">
                  {order.data_prevista ? format(new Date(order.data_prevista), 'dd/MM/yyyy') : 'Não informada'}
                </p>
             </div>
             <div>
                <p className="text-sm font-medium text-muted-foreground">Observações</p>
                <p className="text-sm italic">{order.observacao || 'Nenhuma observação.'}</p>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Remessas Enviadas</CardTitle>
          <History className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Saída</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order.remessas as any[])?.map((remessa) => (
                <TableRow key={remessa.id}>
                  <TableCell>{format(new Date(remessa.data_saida), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell>{remessa.documento_referencia || 'N/A'}</TableCell>
                  <TableCell>{remessa.transportadora_id || '-'}</TableCell>
                  <TableCell>{(remessa.itens as any[])?.length} lotes</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Ver Itens</Button>
                    <Button variant="outline" size="sm" className="ml-2 gap-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100">
                      <PackageCheck className="h-4 w-4" /> Registrar Retorno
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!order.remessas || (order.remessas as any[]).length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground italic">
                    Nenhuma remessa registrada para esta ordem.
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
