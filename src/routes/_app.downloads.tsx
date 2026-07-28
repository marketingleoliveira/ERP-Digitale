import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, Download, Monitor, ShieldCheck, Terminal, HardDrive, Cpu, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export const Route = createFileRoute("/_app/downloads")({
  beforeLoad: async ({ context }) => {
    // Note: session is handled by the _app layout, but we check roles here
  },
  component: DownloadsPage,
});

function DownloadsPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);
  const [downloading, setDownloading] = useState(false);

  const isAuthorized = roles.some(r => ["desenvolvedor", "admin"].includes(r.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f18]">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#0a0f18]">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Acesso Restrito</h1>
        <p className="text-white/60 mt-2 max-w-xs">A área de downloads industriais é exclusiva para Desenvolvedores e Super Admins.</p>
      </div>
    );
  }

  const handleDownload = (platform: string) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`O instalador do MES Digitale (${platform}) v2.4.0 está sendo preparado para download seguro.`);
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-500/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Download className="w-8 h-8 text-blue-500" />
            Central de Downloads Industriais
          </h1>
          <p className="text-white/80 mt-1 text-lg font-medium">
            Softwares e drivers para alimentação automática do ERP pelas máquinas do chão de fábrica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-[#111827] border-blue-500/20 text-white shadow-xl">
          <CardHeader>
            <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 border border-blue-500/20">
              <Monitor className="w-6 h-6 text-blue-400" />
            </div>
            <CardTitle>Windows Edge Node</CardTitle>
            <CardDescription className="text-white/50">Para máquinas rodando Windows 10/11 IoT Enterprise.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-white/70">
              <li className="flex items-center gap-2">• Suporte a porta serial nativa</li>
              <li className="flex items-center gap-2">• Drivers Zebra/Argox inclusos</li>
              <li className="flex items-center gap-2">• SQL Lite local para buffer</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleDownload('Windows')}>
              <Download className="mr-2 h-4 w-4" /> Download .MSI
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-[#111827] border-blue-500/20 text-white shadow-xl">
          <CardHeader>
            <div className="bg-emerald-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 border border-emerald-500/20">
              <Terminal className="w-6 h-6 text-emerald-400" />
            </div>
            <CardTitle>Linux Terminal</CardTitle>
            <CardDescription className="text-white/50">Otimizado para Raspberry Pi e Controladores Industriais.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-white/70">
              <li className="flex items-center gap-2">• Baixíssimo consumo de RAM</li>
              <li className="flex items-center gap-2">• Execução em background (systemd)</li>
              <li className="flex items-center gap-2">• Auto-update via repositório</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleDownload('Linux')}>
              <Download className="mr-2 h-4 w-4" /> Download .DEB / .SH
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-[#111827] border-blue-500/20 text-white shadow-xl">
          <CardHeader>
            <div className="bg-amber-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 border border-amber-500/20">
              <Cpu className="w-6 h-6 text-amber-400" />
            </div>
            <CardTitle>Docker Gateway</CardTitle>
            <CardDescription className="text-white/50">Para ambientes virtualizados e clusters industriais.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-white/70">
              <li className="flex items-center gap-2">• Isolamento total de processos</li>
              <li className="flex items-center gap-2">• Orquestração centralizada</li>
              <li className="flex items-center gap-2">• Variáveis de ambiente configuráveis</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => handleDownload('Docker')}>
              <Download className="mr-2 h-4 w-4" /> Pull Image
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Instruções de Instalação</h3>
            <p className="text-white/70 mb-4">
              Após a instalação, utilize o token de criptografia <strong>AES-256</strong> configurado no sistema para autenticar o nó industrial.
              O software entrará automaticamente em modo de escuta 24h, armazenando dados localmente em caso de queda de conexão.
            </p>
            <div className="bg-black/40 p-4 rounded border border-white/10">
              <code className="text-blue-300 text-sm">
                digitale-mes configure --token "SUA_CHAVE_AQUI" --mode edge --sync real-time
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
