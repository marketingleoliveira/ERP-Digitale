import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: FinalAuditPage,
});

function FinalAuditPage() {
  return (
    <div className="min-h-screen bg-[#1a2333] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            # PROMPT MASTER — AUDITORIA COMPLETA DO ERP (ENTERPRISE REVIEW)
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Atue como um Comitê Técnico composto por:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-white/70">
            <li>• Arquiteto de Software Enterprise</li>
            <li>• Arquiteto de Banco de Dados PostgreSQL</li>
            <li>• Especialista em Supabase</li>
            <li>• Especialista em Segurança (OWASP ASVS, API Security, RLS)</li>
            <li>• Especialista Fiscal (NF-e, SEFAZ, Focus NFe)</li>
            <li>• Especialista em Performance</li>
            <li>• Especialista em React/TanStack Start</li>
            <li>• Especialista em UX</li>
            <li>• Especialista em DevOps</li>
            <li>• Especialista em Testes Automatizados</li>
            <li>• Especialista em Observabilidade</li>
            <li>• Especialista em ERP Industrial Têxtil</li>
          </ul>
        </header>

        <section className="space-y-4">
          <p className="text-xl font-medium">
            Sua missão é realizar uma <span className="text-blue-400">auditoria completa do sistema</span>, identificando absolutamente todos os problemas existentes.
          </p>
          <div className="bg-white/5 rounded-lg p-6 border border-white/10 space-y-4">
            <p>Não faça suposições.</p>
            <p>Não invente implementações.</p>
            <p>Somente considere algo como "implementado" quando houver evidência real no código ou banco.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4">METODOLOGIA</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-white/80">
            {[
              "Audite o banco de dados.", "Audite todas as migrations.", "Audite todas as tabelas.",
              "Audite índices.", "Audite constraints.", "Audite foreign keys.", "Audite triggers.",
              "Audite funções SQL.", "Audite RPCs.", "Audite RLS.", "Audite Grants.",
              "Audite Storage.", "Audite Buckets.", "Audite Secrets.", "Audite Environment Variables.",
              "Audite Server Functions.", "Audite React.", "Audite TanStack Router.",
              "Audite TanStack Query.", "Audite SSR.", "Audite Vite.", "Audite autenticação.",
              "Audite autorização.", "Audite RBAC.", "Audite logs.", "Audite auditoria.",
              "Audite observabilidade.", "Audite tratamento de erros.", "Audite concorrência.",
              "Audite transações.", "Audite rollback.", "Audite idempotência.",
              "Audite integrações externas.", "Audite APIs.", "Audite testes.",
              "Audite documentação.", "Audite duplicações.", "Audite código morto.",
              "Audite arquivos não utilizados.", "Audite dependências."
            ].map((item, i) => (
              <p key={i}>{i + 1}. {item}</p>
            ))}
          </div>
          <p className="italic text-blue-300 mt-4">Nada deve ficar sem análise.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4">REGRAS OBRIGATÓRIAS</h2>
          <ul className="list-disc list-inside space-y-2 text-white/80 bg-red-500/10 p-6 rounded-lg border border-red-500/20">
            <li>Não criar código novo durante a auditoria.</li>
            <li>Não corrigir automaticamente nenhum problema.</li>
            <li>Não mascarar falhas.</li>
            <li>Não assumir implementações inexistentes.</li>
            <li>Sempre citar a evidência (arquivo, migration, tabela, função ou componente).</li>
            <li>Se uma informação não puder ser comprovada, classifique-a como <strong>"Não evidenciada"</strong>.</li>
            <li>Ao final, gere uma matriz de riscos (Probabilidade × Impacto), uma lista priorizada dos 20 principais problemas e um plano de ação detalhado para tornar o ERP apto para produção enterprise.</li>
          </ul>
        </section>

        <footer className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          Digitale Têxtil — Enterprise Review Protocol v1.0
        </footer>
      </div>
    </div>
  );
}


