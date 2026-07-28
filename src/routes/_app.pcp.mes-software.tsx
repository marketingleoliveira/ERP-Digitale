import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Download, Monitor, ShieldCheck, Terminal, HardDrive, Cpu, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export const Route = createFileRoute("/_app/pcp/mes-software")({
  component: MESSoftwarePage,
});

function MESSoftwarePage() {
  const { user, loading } = useAuth();
  const [downloading, setDownloading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f18]">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
      </div>
    );
  }

  const handleDownload = () => {
    setDownloading(true);
    // Simulação de download seguro
    setTimeout(() => {
      setDownloading(false);
      alert("O instalador do MES Digitale (v2.4.0-Edge) está sendo preparado. Em ambiente de produção, este link forneceria o binário otimizado para a arquitetura da sua máquina.");
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-500/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-blue-500" />
            Software de Chão de Fábrica (MES Edge)
          </h1>
          <p className="text-white/60 mt-1 text-lg">
            Instalador e configuração do nó local para monitoramento 24h offline/online.
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleDownload} 
          disabled={downloading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg shadow-blue-500/20"
        >
          {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Baixar Digitale MES v2.4.0
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#111827] border-blue-500/20 text-white md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              Arquitetura MES Edge (Offline First)
            </CardTitle>
            <CardDescription className="text-white/50">
              O software instalado nas máquinas garante a continuidade operacional mesmo sem internet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-900/10 border border-blue-500/10 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-300 flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4" /> Buffer Local
                </h3>
                <p className="text-sm text-white/70">
                  Armazena até 30 dias de logs de produção e telemetria offline. Sincroniza automaticamente ao detectar conexão.
                </p>
              </div>
              <div className="bg-blue-900/10 border border-blue-500/10 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-300 flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4" /> Impressão de Etiquetas
                </h3>
                <p className="text-sm text-white/70">
                  Driver universal para térmicas (Zebra, Argox, Datamax) via protocolo direto local para latência zero.
                </p>
              </div>
            </div>

            <Tabs defaultValue="windows" className="w-full">
              <TabsList className="bg-black/40 border border-white/10 w-full justify-start overflow-x-auto">
                <TabsTrigger value="windows">Windows Server/IoT</TabsTrigger>
                <TabsTrigger value="linux">Linux (Debian/Ubuntu)</TabsTrigger>
                <TabsTrigger value="docker">Docker Container</TabsTrigger>
              </TabsList>
              <TabsContent value="windows" className="p-4 bg-black/20 rounded-b-lg border-x border-b border-white/10 mt-0">
                <pre className="text-xs text-blue-200/60 overflow-x-auto p-2 bg-black/40 rounded">
                  {`# Instalação via PowerShell Admin\nInvoke-WebRequest -Uri "https://api.digitale.app/mes/install.ps1" -OutFile "install.ps1"\n./install.ps1 -Token "CERT_ENC_KEY_PLACEHOLDER" -Env "PROD"`}
                </pre>
              </TabsContent>
              <TabsContent value="linux" className="p-4 bg-black/20 rounded-b-lg border-x border-b border-white/10 mt-0">
                <pre className="text-xs text-blue-200/60 overflow-x-auto p-2 bg-black/40 rounded">
                  {`# Instalação via Bash\ncurl -sSL https://api.digitale.app/mes/install.sh | sudo bash -s -- --token=CERT_ENC_KEY_PLACEHOLDER`}
                </pre>
              </TabsContent>
              <TabsContent value="docker" className="p-4 bg-black/20 rounded-b-lg border-x border-b border-white/10 mt-0">
                <pre className="text-xs text-blue-200/60 overflow-x-auto p-2 bg-black/40 rounded">
                  {`docker pull digitale/mes-edge:latest\ndocker run -d --name mes-node -e AUTH_TOKEN=CERT_ENC_KEY_PLACEHOLDER digitale/mes-edge`}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[#111827] border-blue-500/20 text-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-blue-400">Status do Nó</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Serviço:</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Online
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Versão:</span>
                <span>2.4.0 (Stable)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Heartbeat:</span>
                <span>Há 2 segundos</span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <Button variant="outline" size="sm" className="w-full text-xs border-blue-500/30 hover:bg-blue-500/10">
                  Gerar Novo Token de Acesso
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-blue-900/20 border-blue-500/30 text-white">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertTitle className="text-blue-300">Segurança de Dados</AlertTitle>
            <AlertDescription className="text-white/70 text-xs">
              Todos os registros enviados pelas máquinas são criptografados usando a chave <strong>CERT_ENC_KEY</strong> antes da transmissão.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
