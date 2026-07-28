import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { Loader2, Download, Monitor, ShieldCheck, Terminal, HardDrive, Cpu, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

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
        <p className="text-white font-medium mt-2 max-w-xs">A área de downloads industriais é exclusiva para Desenvolvedores e Super Admins.</p>
      </div>
    );
  }

  const handleDownload = (platform: string) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      // NOTE: The URL below is a placeholder that might return 404 if the repository/release doesn't exist yet.
      // To resolve, ensure the 'lovable-dev/industrial-agent' repository is public and contains the specified release.
      const link = document.createElement("a");
      link.href = "https://github.com/lovable-dev/industrial-agent/releases/download/v2.4.0/DigitaleMES_Setup.exe";
      link.setAttribute("download", `MES_Digitale_${platform}_v2.4.0.exe`);
      link.target = "_blank"; // Open in new tab to avoid unloading app if it fails
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Tentativa de download (${platform}) iniciada.`);
      toast.info("Nota: O link depende da existência da release no GitHub.", { duration: 5000 });
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-500/20 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-black flex items-center gap-3">
            <Download className="w-8 h-8 text-black" />
            Central de Downloads Industriais
          </h1>
          <p className="text-black mt-1 text-lg font-bold">
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
            <CardDescription className="text-white font-medium">Para máquinas rodando Windows 10/11 IoT Enterprise.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-white font-medium">
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
            <CardDescription className="text-white font-medium">Otimizado para Raspberry Pi e Controladores Industriais.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-white font-medium">
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
            <CardDescription className="text-white font-medium">Para ambientes virtualizados e clusters industriais.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-white font-medium">
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

      <div className="bg-blue-900/20 border border-blue-500/30 p-8 rounded-xl">
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-blue-400 shrink-0 mt-1" />
          <div className="w-full">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              Guia de Instalação e Configuração Industrial
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="relative pl-8 border-l-2 border-blue-500/30">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#0a0f18]" />
                  <h4 className="text-white font-bold mb-2">1. Preparação do Ambiente</h4>
                  <p className="text-white font-medium text-sm leading-relaxed">
                    Certifique-se que a máquina possui acesso à rede industrial e que as portas 443 (HTTPS) e 1883 (MQTT - Opcional) estão liberadas no firewall.
                  </p>
                </div>

                <div className="relative pl-8 border-l-2 border-blue-500/30">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#0a0f18]" />
                  <h4 className="text-white font-bold mb-2">2. Instalação do Agente</h4>
                  <p className="text-white font-medium text-sm leading-relaxed">
                    Execute o instalador baixado acima. Em Linux, utilize <code className="text-blue-300">sudo dpkg -i mes-edge.deb</code>. Em Windows, siga o assistente MSI até a conclusão.
                  </p>
                </div>

                <div className="relative pl-8 border-l-2 border-blue-500/30">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#0a0f18]" />
                  <h4 className="text-white font-bold mb-2">3. Vinculação Criptográfica</h4>
                  <p className="text-white font-medium text-sm leading-relaxed">
                    O nó industrial exige uma chave de criptografia AES-256 (CERT_ENC_KEY) para assinar os registros enviados ao ERP.
                  </p>
                </div>
              </div>

              <div className="bg-black/40 p-6 rounded-lg border border-white/10 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400">Terminal de Configuração</h4>
                <div className="space-y-3">
                  <p className="text-[11px] text-white font-bold uppercase">Comando de Ativação:</p>
                  <code className="block text-blue-300 text-xs bg-black/60 p-3 rounded border border-blue-500/20 leading-loose">
                    digitale-mes configure \<br/>
                    &nbsp;&nbsp;--token "SUA_CHAVE_AES_AQUI" \<br/>
                    &nbsp;&nbsp;--endpoint "https://erp.digitale.têxtil" \<br/>
                    &nbsp;&nbsp;--mode edge-offline-first
                  </code>
                </div>
                
                <div className="pt-4 space-y-2">
                  <p className="text-[11px] text-white font-bold uppercase">Verificação de Status:</p>
                  <code className="block text-emerald-400 text-xs bg-black/60 p-3 rounded border border-emerald-500/20">
                    digitale-mes status --check-sync
                  </code>
                </div>

                <Alert className="bg-amber-500/10 border-amber-500/20 mt-4">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-500 text-xs font-bold">Nota de Segurança</AlertTitle>
                  <AlertDescription className="text-white font-medium text-[10px]">
                    Nunca compartilhe a CERT_ENC_KEY fora do ambiente seguro do chão de fábrica.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
