import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHomeDashboardData } from "@/services/dashboard/home.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Users, Receipt, FileUp, FileDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inicio" as any)({
  component: InicioPage,
});

function fmtBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function KpiBox({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="flex flex-col border border-border">
      <div className="bg-[#000080] text-white text-[10px] font-bold py-1 px-3 uppercase tracking-tighter">
        {label}
      </div>
      <div className="bg-white p-6 text-center text-4xl font-bold text-black">
        {value}
      </div>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="bg-[#e67e22] rounded-full p-1">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h2 className="text-[#c0392b] font-bold text-lg">{title}</h2>
    </div>
  );
}

function InicioPage() {
  const getDashboard = useServerFn(getHomeDashboardData);
  const { data, isLoading } = useQuery({
    queryKey: ["home-dashboard"],
    queryFn: () => getDashboard(),
  });

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-8 bg-[#f0f2f5] min-h-screen">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-12 bg-[#f0f2f5] min-h-screen font-sans text-sm">
      {/* Resumo Vendas */}
      <section>
        <SectionHeader title="Resumo Vendas" icon={Receipt} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 shadow-sm border border-border">
          <KpiBox label="Total Clientes" value={data.resumoVendas.total} />
          <KpiBox label="Clientes Ativos (2 M)" value={data.resumoVendas.ativos} />
          <KpiBox label="Clientes Inativos (2 M)" value={data.resumoVendas.inativos} />
          <KpiBox label="Clientes Ativos Julho" value={data.resumoVendas.ativosMes} />
          <KpiBox label="% Clientes Ativos Julho" value={`${data.resumoVendas.percentualAtivosMes.toFixed(2)} %`} />
          <KpiBox label="R$ Ticket Médio Julho" value={fmtBRL(data.resumoVendas.ticketMedioMes).replace("R$", "").trim()} />
        </div>
      </section>

      {/* Listagem Nota Fiscal Upload */}
      <section>
        <SectionHeader title="Listagem Nota Fiscal Upload" icon={FileUp} />
        <div className="border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#000080] hover:bg-[#000080] border-none">
                <TableHead className="text-white h-8 text-[11px] font-bold border-r border-white/20">Número</TableHead>
                <TableHead className="text-white h-8 text-[11px] font-bold border-r border-white/20">Data</TableHead>
                <TableHead className="text-white h-8 text-[11px] font-bold border-r border-white/20">Emissor</TableHead>
                <TableHead className="text-white h-8 text-[11px] font-bold border-r border-white/20">Destinatário</TableHead>
                <TableHead className="text-white h-8 text-[11px] font-bold border-r border-white/20">R$ Total</TableHead>
                <TableHead className="text-white h-8 text-[11px] font-bold text-center">PDF XML UP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.listagemNFe.map((nfe: any, idx: number) => (
                <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="py-1 border-r border-border text-[11px]">{nfe.numero}</TableCell>
                  <TableCell className="py-1 border-r border-border text-[11px]">{nfe.data}</TableCell>
                  <TableCell className="py-1 border-r border-border text-[11px] truncate max-w-[200px]">{nfe.emissor}</TableCell>
                  <TableCell className="py-1 border-r border-border text-[11px] truncate max-w-[250px]">{nfe.destinatario}</TableCell>
                  <TableCell className="py-1 border-r border-border text-[11px] font-bold text-right">{fmtBRL(nfe.total).replace("R$", "").trim()}</TableCell>
                  <TableCell className="py-1 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-400">
                        <FileUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="bg-[#85c1e9] p-2 flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-900">Número:</span>
            <Input className="h-6 w-24 bg-white text-[10px]" />
            <span className="text-[11px] font-bold text-blue-900 ml-4">Emissor/Destinatário:</span>
            <Input className="h-6 w-48 bg-white text-[10px]" />
            <span className="text-[11px] font-bold text-blue-900 ml-4">Data:</span>
            <Input className="h-6 w-24 bg-white text-[10px]" />
            <Button size="sm" className="h-6 ml-auto bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 text-[10px] font-bold">FILTRAR</Button>
          </div>
        </div>
      </section>

      {/* Principal - Listagem Cliente (Listagem Fornecedor) */}
      <section>
        <SectionHeader title="Principal - Listagem Cliente (Listagem Fornecedor)" icon={Users} />
        <div className="border border-border shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#000080] hover:bg-[#000080] border-none">
                <TableHead className="text-white h-8 text-[11px] font-bold border-r border-white/20">Nome Fantasia</TableHead>
                <TableHead className="text-white h-8 text-[11px] font-bold border-r border-white/20">CNPJ/CPF</TableHead>
                <TableHead className="text-white h-8 text-[11px] font-bold border-r border-white/20">NF</TableHead>
                <TableHead className="text-white h-8 text-[11px] font-bold border-r border-white/20">R$ Faturado</TableHead>
                <TableHead className="text-white h-8 text-[11px] font-bold">R$ Pendente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rankingClientes.map((cliente: any, idx: number) => {
                const isHighlight = cliente.nome.includes("PATA LEVE") || cliente.nome.includes("TIP TOP");
                return (
                  <TableRow key={idx} className={cn(
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50",
                    isHighlight && "bg-[#00ff00]/80"
                  )}>
                    <TableCell className="py-1 border-r border-border text-[11px] font-bold text-blue-900">{cliente.nome}</TableCell>
                    <TableCell className="py-1 border-r border-border text-[11px]">{cliente.cnpj}</TableCell>
                    <TableCell className="py-1 border-r border-border text-[11px] text-center text-blue-900 font-bold">{cliente.nfs}</TableCell>
                    <TableCell className="py-1 border-r border-border text-[11px] text-right font-bold">{fmtBRL(cliente.faturado).replace("R$", "").trim()}</TableCell>
                    <TableCell className="py-1 text-[11px] text-right font-bold">{fmtBRL(cliente.pendente).replace("R$", "").trim()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="bg-[#85c1e9] p-2 flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-1 bg-white border border-gray-300 px-2 py-0.5 rounded text-[10px]">
                Página: 1 / 134
             </div>
             <Button size="sm" className="h-6 bg-white text-black text-[10px] font-bold border border-gray-300">PRÓXIMO ▶</Button>
             
             <div className="flex items-center gap-1 ml-4">
                <span className="text-[11px] font-bold text-blue-900">Página:</span>
                <Select defaultValue="1">
                  <SelectTrigger className="h-6 w-16 bg-white text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="flex items-center gap-1 ml-auto">
                <span className="text-[11px] font-bold text-blue-900">Nome/Razão:</span>
                <Input className="h-6 w-32 bg-white text-[10px]" />
                
                <span className="text-[11px] font-bold text-blue-900 ml-2">CNPJ:</span>
                <Input className="h-6 w-32 bg-white text-[10px]" />

                <span className="text-[11px] font-bold text-blue-900 ml-2">Tipo Cliente:</span>
                <Select defaultValue="selecione">
                  <SelectTrigger className="h-6 w-24 bg-white text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selecione">[SELECIONE]</SelectItem>
                  </SelectContent>
                </Select>

                <Button size="sm" className="h-6 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 text-[10px] font-bold ml-2">FILTRAR</Button>
             </div>
          </div>
          <div className="bg-[#85c1e9] px-2 pb-2 text-right">
             <span className="text-[10px] text-blue-900 font-bold">Total de Registros: 2681</span>
          </div>
        </div>
      </section>
    </div>
  );
}
