import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth, useUserRoles } from "@/hooks/use-auth";
import { 
  Loader2, 
  ShieldAlert, 
  ArrowRight, 
  FileText,
  Search,
  Database,
  Layout,
  Lock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Para facilitar a homologação, mantemos o conteúdo técnico na raiz temporariamente
    // mas a intenção final é o redirect.
    // throw redirect({ to: "/dashboard/industrial" });
  },
  component: HomologacaoDashboardPage,
});

function HomologacaoDashboardPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);
  
  const isAuthorized = roles.some(r => ["desenvolvedor", "gerente", "admin"].includes(r));

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
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
        <p className="text-white/60 mt-2">Homologação Técnica exclusiva para Engenharia.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white p-4 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* HEADER ESTRATÉGICO */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-900 p-8 md:p-12 shadow-2xl shadow-blue-900/20">
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-widest text-blue-100">
              <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              Sprint de Homologação
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Dashboard Executivo <br/>
              <span className="text-blue-300">Industrial Digitale</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Gauge className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase font-bold">Missão Crítica</p>
                  <p className="text-sm font-medium text-white/90">Auditar, Validar e Concluir</p>
                </div>
              </div>
              <div className="w-px h-10 bg-white/10 hidden md:block"></div>
              <p className="text-sm text-white/70 max-w-md leading-relaxed">
                Protocolo rigoroso de certificação técnica. Dados reais, regras íntegras e segurança absoluta em cada bit de informação.
              </p>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 blur-[100px] -mr-48 -mt-48 rounded-full"></div>
        </header>

        {/* 1. AUDITORIA DOS INDICADORES */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Auditoria de KPIs</h2>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Cada indicador deve ser uma prova técnica da realidade fabril. placeholders ou mocks resultam em falha na homologação.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Checklist de Campo</h3>
              <ul className="space-y-3 text-[11px] text-white/60">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Tabela de Origem</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Regra de Cálculo (Fórmula)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Serviço ou RPC Responsável</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Comportamento "Zero vs Vazio"</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Database className="w-32 h-32" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Escopo Mínimo Auditado
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                "OPs Planejadas", "OPs em Andamento", "OPs Atrasadas",
                "Produção Realizada", "Carga por Máquina", "Lead Time Médio",
                "Estoque Crítico", "Faturamento Real", "Contas Vencidas"
              ].map((item) => (
                <div key={item} className="p-3 bg-black/20 border border-white/5 rounded-xl hover:border-blue-500/30 transition-colors group">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-2 group-hover:scale-125 transition-transform"></div>
                  <span className="text-[10px] font-bold text-white/80">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-200/70 font-mono leading-relaxed">
                PROIBIDO: Valor fixo, número aleatório, placeholders ou qualquer fallback apresentado como dado real.
              </p>
            </div>
          </div>
        </section>

        {/* 2 & 3. BACKEND & VALIDAÇÃO */}
        <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/10 bg-gradient-to-r from-blue-500/5 to-transparent">
            <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-400" /> 
              Arquitetura Industrial & Validação
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
            <div className="bg-[#0a0f18] p-8 space-y-6">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Estratégia Backend</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Auditoria rigorosa em <code className="text-blue-300">home.functions.ts</code>. Cálculos críticos centralizados no PostgreSQL (RPC/Triggers) para garantir integridade multi-contexto.
              </p>
              <ul className="space-y-2 text-[11px] text-white/50">
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Prevenção de consultas N+1</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Filtros por Empresa/Unidade Industrial</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-blue-500" /> Respostas 100% Tipadas (Zod/TypeScript)</li>
              </ul>
            </div>
            <div className="bg-[#0a0f18] p-8 space-y-6 border-l border-white/10">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Protocolo de Validação</h3>
              <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] space-y-2 border border-white/5">
                <p className="text-white/40">// Exemplo de Teste de Integridade</p>
                <p className="text-blue-300">KPI: OPs em Andamento</p>
                <p className="text-white/60">Contar OPs status ativo - canceladas - encerradas</p>
                <p className="text-green-400 mt-2">Comparar Valor UI vs Consulta Direta SQL</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. LEAD TIMES & INTEGRAÇÃO */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl">
              <Layout className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Matriz de Lead Times & Integrações</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "MES / PCP", icon: Activity, desc: "Status de máquina, refugos e OEE real." },
              { title: "APS / Carga", icon: Gauge, desc: "Capacidade ocupada vs nominal por centro." },
              { title: "WMS / Estoque", icon: Database, desc: "Saldo disponível (Físico - Reservas)." },
              { title: "Finanças / Fiscal", icon: Lock, desc: "Faturamento autorizado vs pre-faturamento." },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all cursor-default group">
                <item.icon className="w-6 h-6 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-sm font-bold text-white mb-2">{item.title}</h4>
                <p className="text-[10px] text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-3xl p-8 space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Métricas de Velocidade (Lead Times)</h3>
                <span className="px-2 py-1 rounded bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-bold text-indigo-300">MÉTRICA: MEDIANA</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  "Pedido → Aprovação",
                  "Aprovação → Início Produção",
                  "Início → Conclusão Industrial",
                  "Conclusão → Qualidade",
                  "Liberação → Expedição",
                  "Pedido → Entrega (Final)"
                ].map(lt => (
                  <div key={lt} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-[10px] text-white/70">{lt}</span>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* 9-13. REALTIME, RBAC & PERFORMANCE */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3" /> Tempo Real (Supabase)
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Auditoria de canais Realtime. Caso não comprovado, a terminologia deve ser removida. Prevenção de memory leaks e reconexões.
              </p>
           </div>
           <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3" /> Segurança & RBAC
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                RLS em 100% das rotas sensíveis. Bloqueio de dados financeiros para produção e custos industriais para vendas.
              </p>
           </div>
           <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Gauge className="w-3 h-3" /> Performance & UX
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Agregações consolidadas. Loading states precisos e diferenciação clara entre "Valor Zero" e "Dados Indisponíveis".
              </p>
           </div>
        </section>

        {/* 14. TESTES E ACEITE */}
        <section className="bg-blue-600/10 border border-blue-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Critérios de Homologação</h2>
              <div className="space-y-4">
                {[
                  "Nenhum KPI utilizando dados mockados.",
                  "MES, APS e WMS conectados via RPC/Database.",
                  "RBAC e RLS testados contra bypass de URL.",
                  "Build de produção e Unit Tests aprovados."
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm text-white/80">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-64 space-y-4">
               <div className="p-6 bg-black/40 rounded-2xl border border-white/10 text-center space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Testing Agent</div>
                  <div className="text-2xl font-black text-white italic">Obrigatório</div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-full animate-pulse"></div>
                  </div>
               </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 p-4 opacity-10">
             <Zap className="w-48 h-48 text-blue-500" />
          </div>
        </section>

        <footer className="pt-12 border-t border-white/10 text-center pb-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
            Relatório Final Obrigatório — Engenharia Digitale Têxtil — 2026
          </p>
        </footer>
      </div>
    </div>
  );
}
