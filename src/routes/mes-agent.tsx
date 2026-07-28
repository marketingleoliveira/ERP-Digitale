import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Play, Pause, Square, AlertTriangle, 
  Wifi, WifiOff, RefreshCw, LogOut, Cpu
} from "lucide-react";

export const Route = createFileRoute("/mes-agent")({
  component: MESAgentPWA,
});

function MESAgentPWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeOP, setActiveOP] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [production, setProduction] = useState({ ok: 0, loss: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    let interval: any;
    if (status === 'running') {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [status]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans p-4 md:p-8">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-blue-400">Digitale MES Agent</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estação: T-800 / Unidade: Industrial 01</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={isOnline ? "outline" : "destructive"} className="gap-1 px-3 py-1 font-bold">
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Badge>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700 pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Máquina & Operador</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Equipamento</p>
                <p className="text-lg font-bold text-white uppercase tracking-tight">TEAR CIRCULAR 04</p>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Operador</p>
                <p className="text-lg font-bold text-blue-400 uppercase tracking-tight italic">JOÃO SILVA (MAT. 4521)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700 pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Ordem de Produção</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {activeOP ? (
                <>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">OP Ativa</p>
                    <p className="text-2xl font-black text-white">#10254</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Artigo / Produto</p>
                    <p className="text-sm font-bold text-slate-300">MEIA MALHA ALGODÃO / COR: AZUL ROYAL</p>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-500 font-medium italic">Nenhuma OP selecionada</p>
                  <Button 
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs h-12"
                    onClick={() => setActiveOP({ id: 1 })}
                  >
                    Selecionar OP
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center: Execution Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-2">Status</p>
                  <Badge className={`
                    text-xs font-black px-4 py-1 uppercase tracking-widest
                    ${status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 
                      status === 'paused' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}
                  `}>
                    {status === 'running' ? 'EM EXECUÇÃO' : status === 'paused' ? 'PAUSADO' : 'AGUARDANDO'}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-2">Cronômetro</p>
                  <p className="text-4xl font-black tracking-tighter text-white font-mono">{formatTime(elapsedTime)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-2">Produção OK</p>
                  <p className="text-4xl font-black tracking-tighter text-emerald-400 font-mono">{production.ok} KG</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-2">Perdas</p>
                  <p className="text-4xl font-black tracking-tighter text-rose-500 font-mono">{production.loss} KG</p>
                </div>
              </div>

              {/* Main Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {status === 'idle' && (
                  <Button 
                    size="lg" 
                    className="h-24 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl gap-3 shadow-lg shadow-emerald-900/20 uppercase"
                    onClick={() => setStatus('running')}
                    disabled={!activeOP}
                  >
                    <Play className="w-8 h-8 fill-current" /> Iniciar Produção
                  </Button>
                )}
                
                {status === 'running' && (
                  <Button 
                    size="lg" 
                    className="h-24 bg-amber-600 hover:bg-amber-700 text-white font-black text-xl gap-3 shadow-lg shadow-amber-900/20 uppercase"
                    onClick={() => setStatus('paused')}
                  >
                    <Pause className="w-8 h-8 fill-current" /> Pausar Máquina
                  </Button>
                )}

                {status === 'paused' && (
                  <Button 
                    size="lg" 
                    className="h-24 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl gap-3 shadow-lg shadow-emerald-900/20 uppercase"
                    onClick={() => setStatus('running')}
                  >
                    <Play className="w-8 h-8 fill-current" /> Retomar
                  </Button>
                )}

                {(status === 'running' || status === 'paused') && (
                  <Button 
                    size="lg" 
                    variant="destructive"
                    className="h-24 bg-rose-700 hover:bg-rose-800 text-white font-black text-xl gap-3 shadow-lg shadow-rose-900/20 uppercase"
                    onClick={() => {
                      if (confirm("Deseja realmente finalizar esta OP?")) {
                        setStatus('idle');
                        toast.success("Produção finalizada com sucesso!");
                      }
                    }}
                  >
                    <Square className="w-8 h-8 fill-current" /> Finalizar OP
                  </Button>
                )}
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <Button 
                  variant="outline" 
                  className="h-16 border-slate-700 bg-slate-800/40 hover:bg-slate-800 font-bold uppercase text-xs"
                  onClick={() => setProduction(p => ({ ...p, ok: p.ok + 10 }))}
                >
                  Registrar Produção (+10kg)
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 border-slate-700 bg-slate-800/40 hover:bg-slate-800 font-bold uppercase text-xs text-rose-400"
                  onClick={() => setProduction(p => ({ ...p, loss: p.loss + 1 }))}
                >
                  Registrar Perda (+1kg)
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 border-slate-700 bg-slate-800/40 hover:bg-slate-800 font-bold uppercase text-xs text-amber-400"
                >
                  Motivo de Parada
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sync Status Footer */}
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin-slow" />
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">
                Sincronização: <span className="text-emerald-400">Tudo Atualizado</span> (Há 2 min)
              </p>
            </div>
            <p className="text-[10px] text-slate-500 font-bold">V 2.4.0-STABLE</p>
          </div>
        </div>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
