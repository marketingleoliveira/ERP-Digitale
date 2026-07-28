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
            # PROMPT MASTER — EVOLUÇÃO DO ERP DIGITALE TÊXTIL PARA UM ERP TÊXTIL ENTERPRISE
          </h1>
          <p className="text-lg text-white/80 leading-relaxed mb-6">
            Você atuará como um Comitê Técnico composto por:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-white/70">
            <li>• Arquiteto de Software Enterprise</li>
            <li>• Especialista em ERP Industrial</li>
            <li>• Especialista em PCP Têxtil</li>
            <li>• Especialista em MES (Manufacturing Execution System)</li>
            <li>• Especialista em APS (Advanced Planning & Scheduling)</li>
            <li>• Especialista em WMS</li>
            <li>• Especialista em Qualidade Industrial</li>
            <li>• Especialista em Custos Industriais</li>
            <li>• Especialista em PostgreSQL</li>
            <li>• Especialista em Supabase</li>
            <li>• Especialista em TanStack Start</li>
            <li>• Especialista em React 19</li>
            <li>• Especialista em UX Industrial</li>
            <li>• Especialista em Arquitetura DDD</li>
          </ul>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Objetivo</h2>
          <div className="bg-white/5 rounded-lg p-6 border border-white/10 space-y-4 text-white/90">
            <p className="text-lg font-medium">Não criar um ERP novo.</p>
            <p>A missão é <strong>evoluir o ERP atual da Digitale Têxtil</strong>, preservando tudo que já foi implementado.</p>
            <p>O sistema atual já possui módulos importantes como:</p>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-white/70 text-sm">
              <li>• Administração</li>
              <li>• Cadastros</li>
              <li>• Produtos</li>
              <li>• Clientes</li>
              <li>• Fornecedores</li>
              <li>• Ordens de Produção</li>
              <li>• MRP</li>
              <li>• Reverse BOM</li>
              <li>• Motor de Custos</li>
              <li>• Reservas</li>
              <li>• Produção</li>
              <li>• Entrada de Produção</li>
              <li>• Industrialização por Terceiros</li>
              <li>• Qualidade</li>
              <li>• Estoque</li>
              <li>• Expedição</li>
              <li>• Fiscal</li>
              <li>• Financeiro</li>
              <li>• CRM</li>
              <li>• Controle de Usuários</li>
              <li>• RBAC</li>
              <li>• Auditoria</li>
              <li>• Dashboards</li>
            </ul>
            <p className="pt-4 font-medium text-blue-300">Esses módulos devem ser preservados.</p>
            <p>Sempre que possível, ampliar funcionalidades em vez de substituí-las.</p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Princípios da Evolução</h2>
          <p className="text-white/80">O ERP deverá evoluir para uma plataforma composta por quatro camadas totalmente integradas:</p>
          <ol className="list-decimal list-inside space-y-2 text-white/90 font-medium">
            <li>ERP Corporativo</li>
            <li>MES (Execução da Produção)</li>
            <li>APS (Planejamento Avançado)</li>
            <li>WMS (Logística Industrial)</li>
          </ol>
          <p className="text-white/70 text-sm bg-blue-500/10 p-4 rounded border border-blue-500/20">
            Todos os módulos devem compartilhar o mesmo banco de dados PostgreSQL e a mesma arquitetura de autenticação, RBAC, auditoria e rastreabilidade.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Diretrizes Gerais</h2>
          <div className="space-y-4 text-white/80">
            <p>Nunca criar módulos paralelos que dupliquem funcionalidades já existentes.</p>
            <p className="font-semibold text-white">Antes de implementar qualquer recurso:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {["Audite o banco.", "Audite as migrations.", "Audite as tabelas.", "Audite os componentes React.", "Audite as RPCs.", "Audite as rotas.", "Audite os serviços.", "Audite as funções existentes."].map((step, i) => (
                <div key={i} className="bg-white/5 p-3 rounded border border-white/10 text-center">{i + 1}. {step}</div>
              ))}
            </div>
            <p>Sempre reutilize código quando possível. Caso um módulo existente possa ser expandido, evolua-o.</p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Nova Visão do ERP</h2>
          <div className="space-y-4 text-white/80">
            <p>O ERP deixa de controlar apenas documentos. Ele passa a controlar toda a fábrica.</p>
            <p className="font-medium text-blue-300 underline underline-offset-4">Toda movimentação deverá possuir rastreabilidade completa.</p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-black/30 p-4 rounded-lg overflow-x-auto">
              {["Pedido", "Planejamento", "OP", "Matéria-prima", "Industrialização", "Produção", "Inspeção", "Rolo", "Estoque", "Expedição", "NF-e", "Cliente"].map((step, i, arr) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30 whitespace-nowrap">{step}</span>
                  {i < arr.length - 1 && <span>↓</span>}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
            <h3 className="text-xl font-bold text-blue-400 border-b border-white/10 pb-2">Evolução do PCP (APS)</h3>
            <p className="text-sm text-white/70">Transformar o PCP atual em um APS (Advanced Planning and Scheduling).</p>
            <ul className="text-xs text-white/60 space-y-1 columns-2">
              <li>• capacidade finita</li>
              <li>• calendário industrial</li>
              <li>• turnos</li>
              <li>• paradas programadas</li>
              <li>• manutenção</li>
              <li>• setup por máquina</li>
              <li>• setup por cor</li>
              <li>• setup por artigo</li>
              <li>• sequenciamento inteligente</li>
              <li>• previsão de atrasos</li>
              <li>• identificação de gargalos</li>
            </ul>
          </section>

          <section className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
            <h3 className="text-xl font-bold text-blue-400 border-b border-white/10 pb-2">MES (Chão de Fábrica)</h3>
            <p className="text-sm text-white/70">Criar um módulo MES totalmente integrado ao ERP. Painel por máquina em tempo real.</p>
            <ul className="text-xs text-white/60 space-y-1 columns-2">
              <li>• status em tempo real</li>
              <li>• OP atual/próxima</li>
              <li>• operador</li>
              <li>• velocidade/eficiência</li>
              <li>• tempo parado/motivo</li>
              <li>• produção acumulada</li>
              <li>• perdas/refugo</li>
              <li>• qualidade/consumo</li>
            </ul>
          </section>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Rastreabilidade Total</h2>
          <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl space-y-4">
            <p className="text-white/80">Toda movimentação deve possuir genealogia completa (frente e verso).</p>
            <div className="flex flex-wrap gap-2">
              {["Fornecedor", "Lote", "Fio", "Matéria-prima", "Receita", "Banho", "Tinturaria", "Industrialização", "Máquina", "Operador", "Turno", "Inspeção", "Rolo", "Cliente", "Pedido", "NF-e", "Transportadora"].map((tag, i) => (
                <span key={i} className="text-[10px] uppercase tracking-tighter bg-white/10 px-2 py-0.5 rounded border border-white/10 text-white/60">{tag}</span>
              ))}
            </div>
            <p className="text-sm italic text-blue-300">Permitir rastreamento inverso: a partir de qualquer rolo, localizar toda sua origem.</p>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-white/5 rounded border border-white/10">
            <h4 className="font-bold text-blue-300 mb-2">Controle de Rolos</h4>
            <p className="text-xs text-white/60">Código único, QR Code, peso, metragem, largura, gramatura, qualidade, status e localização física.</p>
          </div>
          <div className="p-4 bg-white/5 rounded border border-white/10">
            <h4 className="font-bold text-blue-300 mb-2">WMS</h4>
            <p className="text-xs text-white/60">Endereçamento (rua/coluna/nível), coletores, QR Code, inventário rotativo, FIFO/FEFO e mapa de estoque.</p>
          </div>
          <div className="p-4 bg-white/5 rounded border border-white/10">
            <h4 className="font-bold text-blue-300 mb-2">Manutenção</h4>
            <p className="text-xs text-white/60">Preventivas, corretivas, lubrificação, horímetros e integração automática com o MES.</p>
          </div>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-blue-400">Inteligência Artificial (IA)</h2>
          <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-xl space-y-4">
            <p className="text-white/80">Camada de IA integrada para previsões e sugestões (sem modificação direta de dados).</p>
            <ul className="text-sm text-white/70 list-disc list-inside space-y-1">
              <li>Prever atrasos e identificar gargalos</li>
              <li>Sugerir sequenciamento inteligente de OPs</li>
              <li>Estimar consumo e identificar desperdícios</li>
              <li>Responder perguntas em linguagem natural sobre o ERP</li>
            </ul>
            <p className="text-xs text-purple-300 font-bold uppercase">Toda ação deverá ser aprovada por um usuário autorizado.</p>
          </div>
        </section>

        <section className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl space-y-6">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-red-400 text-center">Regras de Implementação & Método</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <p className="font-bold text-white uppercase text-xs tracking-widest border-b border-red-500/30 pb-1">Inviáveis</p>
              <ul className="space-y-1 text-white/70">
                <li>• Nunca alterar sem justificativa técnica</li>
                <li>• Nunca remover tabelas ou quebrar compatibilidade</li>
                <li>• Nunca duplicar lógica de negócio</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-white uppercase text-xs tracking-widest border-b border-red-500/30 pb-1">Obrigatórios</p>
              <ul className="space-y-1 text-white/70">
                <li>• Auditoria prévia + Plano de evolução</li>
                <li>• Migrations + RLS Policies</li>
                <li>• Testes Unitários/Integração + Rollback</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-white/90 font-medium pt-4 border-t border-red-500/20">
            "A evolução deve transformar o ERP atual da Digitale Têxtil em uma plataforma industrial de padrão enterprise, mantendo compatibilidade e preparando o sistema para operação em tempo real no chão de fábrica."
          </p>
        </section>

        <footer className="pt-12 border-t border-white/10 text-center text-white/30 text-[10px] uppercase tracking-[0.2em]">
          Digitale Têxtil — Enterprise Evolution Protocol — 2026
        </footer>
      </div>
    </div>
  );
}
