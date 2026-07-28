import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: EvolutionMasterPage,
});

function EvolutionMasterPage() {
  return (
    <div className="min-h-screen bg-[#1a2333] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="border-b border-white/10 pb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-6">
            # PROMPT MASTER — EVOLUÇÃO DO ERP DIGITALE TÊXTIL (INDÚSTRIA TÊXTIL BRASILEIRA)
          </h1>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-wider">Missão</h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Você atuará como um Comitê Técnico composto por:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-white/70">
              <li>• Arquiteto de Software Enterprise</li>
              <li>• Especialista em ERP Industrial</li>
              <li>• Especialista em Indústria Têxtil Brasileira</li>
              <li>• Especialista em PCP</li>
              <li>• Especialista em MES (Manufacturing Execution System)</li>
              <li>• Especialista em APS (Advanced Planning & Scheduling)</li>
              <li>• Especialista em WMS</li>
              <li>• Especialista em Custos Industriais</li>
              <li>• Especialista em Qualidade Têxtil</li>
              <li>• Especialista Fiscal Brasileiro (NF-e, CT-e, MDF-e, SPED)</li>
              <li>• Especialista PostgreSQL</li>
              <li>• Especialista Supabase</li>
              <li>• Especialista React 19 + TanStack Start</li>
              <li>• Especialista UX Industrial</li>
            </ul>
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mt-4">
              <p className="text-white/90">Sua missão <span className="text-red-400 font-bold uppercase">NÃO</span> é desenvolver um ERP novo.</p>
              <p className="text-white/80 mt-2">Sua missão é transformar o ERP atual da Digitale Têxtil em uma plataforma industrial de classe enterprise, preservando toda a arquitetura existente.</p>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-red-500 pl-4 uppercase tracking-wider text-red-400">Regra Principal</h2>
          <div className="space-y-4 text-white/80">
            <p className="font-semibold text-white">Antes de qualquer implementação:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {["Audite o banco de dados.", "Audite todas as migrations.", "Audite todas as tabelas.", "Audite todas as funções SQL.", "Audite todas as RPCs.", "Audite todos os componentes React.", "Audite todas as rotas.", "Audite todos os módulos existentes."].map((step, i) => (
                <div key={i} className="bg-white/5 p-3 rounded border border-white/10 text-center">{i + 1}. {step}</div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <span className="bg-red-500/20 text-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase">Nunca implemente funcionalidades que já existam</span>
              <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase">Sempre reutilize</span>
              <span className="bg-green-500/20 text-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase">Sempre evolua</span>
            </div>
            <p className="text-sm italic text-white/60">Nunca substitua módulos sem justificativa técnica.</p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Contexto da Digitale Têxtil</h2>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
            <p className="text-white/80 italic">A Digitale Têxtil é uma indústria brasileira especializada em:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-white/70">
              <li>• tecidos fitness;</li>
              <li>• tecidos para moda praia;</li>
              <li>• tecidos tecnológicos;</li>
              <li>• estamparia digital;</li>
              <li>• desenvolvimento de artigos;</li>
              <li>• industrialização por terceiros (principalmente tingimento);</li>
              <li>• vendas B2B para confecções.</li>
            </ul>
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded text-sm text-yellow-200">
              <p><strong>Restrição:</strong> Não implementar funcionalidades voltadas para exportação, comércio exterior, câmbio, regimes aduaneiros ou operações internacionais. Toda a solução deve ser voltada para a legislação, processos industriais e realidade operacional do Brasil.</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Objetivo da Evolução</h2>
          <p className="text-white/80">Transformar o ERP atual em uma plataforma integrada composta por:</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {["ERP Corporativo", "APS", "MES", "WMS", "BI Industrial"].map((mod) => (
              <div key={mod} className="bg-blue-500/20 p-4 rounded-lg text-center font-bold border border-blue-500/30 text-blue-100">{mod}</div>
            ))}
          </div>
          <p className="text-xs text-center text-white/50">Tudo utilizando o mesmo banco PostgreSQL e a arquitetura já existente.</p>
        </section>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-blue-300">Fase 1 — Modelo Industrial</h3>
              <p className="text-sm text-white/70 leading-relaxed">Consolidar o modelo industrial da fábrica: Centros de Trabalho, Setores, Máquinas, Linhas, Operadores, Turnos, Calendário e Motivos de Parada.</p>
            </section>
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-blue-300">Fase 2 — Evolução do PCP</h3>
              <p className="text-sm text-white/70 leading-relaxed">Transformar o PCP em APS: Capacidade finita, setup por artigo/cor/gramatura, sequenciamento automático e cálculo de gargalos.</p>
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-blue-300">Fase 3 — MES</h3>
              <p className="text-sm text-white/70 leading-relaxed">Execução em tempo real: OP atual/próxima, status por máquina, eficiência, produção realizada/prevista e consumo registrado.</p>
            </section>
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-blue-300">Fase 4 — Digital Twin</h3>
              <p className="text-sm text-white/70 leading-relaxed">Mapa visual da fábrica com status em tempo real via Supabase Realtime (Produzindo, Setup, Parado, Manutenção).</p>
            </section>
          </div>

          <section className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl space-y-4">
            <h3 className="text-xl font-bold text-blue-300">Fase 5 — Rastreabilidade Completa</h3>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              {["Fornecedor", "Matéria-prima", "Lote", "Industrialização", "Produção", "Máquina", "Operador", "Turno", "Inspeção", "Rolo", "Estoque", "Separação", "Expedição", "NF-e", "Cliente"].map((step, i, arr) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="bg-white/10 px-2 py-1 rounded border border-white/10">{step}</span>
                  {i < arr.length - 1 && <span>↓</span>}
                </span>
              ))}
            </div>
            <p className="text-xs italic text-blue-300">Permitir rastreamento inverso a partir de qualquer lote ou rolo.</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <h4 className="font-bold text-blue-200 text-sm mb-2">Fase 6 — Controle de Rolos</h4>
              <p className="text-[11px] text-white/60">QR Code, metragem, peso, qualidade, localização e histórico por rolo.</p>
            </div>
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <h4 className="font-bold text-blue-200 text-sm mb-2">Fase 7 — Qualidade</h4>
              <p className="text-[11px] text-white/60">Inspeção por rolo/lote, classificação de defeitos e checklists configuráveis.</p>
            </div>
            <div className="p-4 bg-white/5 rounded border border-white/10">
              <h4 className="font-bold text-blue-200 text-sm mb-2">Fase 8 — WMS</h4>
              <p className="text-[11px] text-white/60">Endereçamento físico, inventário rotativo e separação guiada.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-blue-300">Fase 9 — Manutenção</h3>
              <p className="text-sm text-white/70 leading-relaxed">Preventivas, corretivas e horímetros integrados ao APS e MES.</p>
            </section>
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-blue-300">Fase 10 — Custos Industriais</h3>
              <p className="text-sm text-white/70 leading-relaxed">Cálculo automático: mão de obra, energia, perdas, setup e logística nacional por lote/OP.</p>
            </section>
          </div>

          <section className="space-y-6">
            <h3 className="text-xl font-bold text-blue-300">Fase 11 — BI Industrial</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {["OEE", "Lead Time", "Qualidade", "MRP", "Financeiro", "Fiscal", "Eficiência", "Paradas", "Produção", "Rentabilidade"].map((kpi) => (
                <div key={kpi} className="text-[10px] bg-white/5 p-2 rounded border border-white/10 text-center uppercase tracking-widest">{kpi}</div>
              ))}
            </div>
          </section>

          <section className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-xl space-y-4">
            <h3 className="text-xl font-bold text-purple-300">IA Industrial</h3>
            <p className="text-sm text-white/70">Assistente para previsão de atrasos, sugestão de sequência e identificação de desperdícios.</p>
            <p className="text-[10px] uppercase font-bold text-purple-400">A IA nunca poderá alterar dados automaticamente. Ela apenas recomenda ações.</p>
          </section>
        </div>

        <section className="bg-green-500/10 border border-green-500/20 p-8 rounded-2xl space-y-6">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-green-400 text-center">Home do ERP</h2>
          <div className="bg-black/40 p-6 rounded-xl border border-white/10 space-y-4">
            <p className="text-white/90 text-center font-medium">Dashboard Executivo Industrial</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[10px] text-white/60 text-center">
              {["Produção do dia", "Máquinas produzindo", "OPs atrasadas", "Estoque crítico", "Faturamento do dia"].map((kpi) => (
                <div key={kpi} className="bg-white/5 p-2 rounded border border-white/5">{kpi}</div>
              ))}
            </div>
            <p className="text-xs text-red-300 text-center uppercase tracking-tight pt-2 font-bold">Não utilizar a página inicial para documentação técnica ou prompts.</p>
          </div>
        </section>

        <section className="space-y-6 text-center">
          <h2 className="text-2xl font-semibold border-b border-white/10 pb-4 uppercase tracking-wider text-blue-400">Padrão de Implementação</h2>
          <p className="text-sm text-white/70 italic">Cada entrega obrigatoriamente deverá conter: Auditoria, Arquitetura, Migrations, RLS, Testes, Rollback e Documentação.</p>
          <div className="bg-red-500/10 p-4 rounded border border-red-500/20">
            <p className="text-xs text-red-200 font-bold uppercase tracking-tighter">Nenhuma etapa poderá iniciar sem que a anterior esteja totalmente funcional.</p>
          </div>
        </section>

        <footer className="pt-12 border-t border-white/10 text-center space-y-4">
          <p className="text-white/30 text-[10px] uppercase tracking-[0.2em]">Digitale Têxtil — Enterprise Evolution Protocol — 2026</p>
          <p className="text-[9px] text-white/20 max-w-2xl mx-auto leading-relaxed uppercase tracking-tighter">
            O objetivo final é transformar o ERP atual da Digitale Têxtil em um ERP industrial brasileiro de referência para o setor têxtil, preservando a base já construída, aumentando a rastreabilidade e a integração total.
          </p>
        </footer>
      </div>
    </div>
  );
}
