import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getFocusConfigServer,
  saveFocusConfig,
  clearFocusToken,
  testFocusConnection,
} from "@/lib/focus-config.functions";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, PlugZap, Trash2, ShieldAlert, ExternalLink } from "lucide-react";
import { useAuth, useUserRoles } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/dev/focus-nfe")({
  ssr: false,
  component: FocusNfeConfigPage,
});

function FocusNfeConfigPage() {
  const { user, loading } = useAuth();
  const roles = useUserRoles(user?.id);
  const isDev = roles.includes("desenvolvedor");

  const qc = useQueryClient();
  const load = useServerFn(getFocusConfigServer);
  const save = useServerFn(saveFocusConfig);
  const clear = useServerFn(clearFocusToken);
  const test = useServerFn(testFocusConnection);

  const cfg = useQuery({
    queryKey: ["focus-config"],
    queryFn: () => load(),
    enabled: isDev,
  });

  const [form, setForm] = useState({
    provedor_nfe: "focus_nfe" as "focus_nfe" | "nenhum" | "plugnotas",
    ambiente_nfe: "homologacao" as "homologacao" | "producao",
    focus_nfe_token: "",
    serie_nfe: 1,
    proximo_numero_nfe: 1,
  });

  useEffect(() => {
    if (cfg.data) {
      setForm(f => ({
        ...f,
        provedor_nfe: (cfg.data.provedor_nfe as typeof f.provedor_nfe) ?? "focus_nfe",
        ambiente_nfe: (cfg.data.ambiente_nfe as typeof f.ambiente_nfe) ?? "homologacao",
        serie_nfe: cfg.data.serie_nfe ?? 1,
        proximo_numero_nfe: cfg.data.proximo_numero_nfe ?? 1,
        focus_nfe_token: "", // sempre em branco por segurança
      }));
    }
  }, [cfg.data]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => {
      toast.success("Configuração salva.");
      setForm(f => ({ ...f, focus_nfe_token: "" }));
      qc.invalidateQueries({ queryKey: ["focus-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearMut = useMutation({
    mutationFn: () => clear(),
    onSuccess: () => {
      toast.success("Token removido.");
      qc.invalidateQueries({ queryKey: ["focus-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: () => test(),
    onSuccess: (r) => {
      if (r.ok) toast.success(r.mensagem);
      else toast.error(r.mensagem);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || cfg.isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!isDev) {
    return (
      <Card className="p-8 text-center">
        <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <h2 className="font-semibold">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas o cargo Desenvolvedor pode acessar esta página.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="# IMPLEMENTAÇÃO TÉCNICA — ETAPA 11.1: HOMOLOGAÇÃO FISCAL, TESTES DO PROVEDOR E CERTIFICAÇÃO PARA PRODUÇÃO"
        description="Atue como Arquiteto de Software Sênior especializado em ERP Industrial, NF-e, Focus NFe, segurança fiscal, PostgreSQL, Supabase, testes de integração, idempotência, observabilidade e recuperação de falhas. Execute exclusivamente uma etapa de homologação, auditoria e certificação da Etapa 11."
      />

      <Card className="p-6 prose prose-sm dark:prose-invert max-w-none mb-6">
        <p>O objetivo é comprovar que a infraestrutura de faturamento, NF-e, contas a receber, CPV e margem funciona corretamente em ambiente de homologação antes de configurar ou utilizar produção.</p>
        
        <hr />
        
        <h2>CLASSIFICAÇÃO INICIAL</h2>
        <p>A Etapa 11 não está aprovada para produção enquanto não forem comprovados:</p>
        <ul>
          <li>emissão real em homologação;</li>
          <li>autorização;</li>
          <li>rejeição;</li>
          <li>consulta após timeout;</li>
          <li>cancelamento;</li>
          <li>idempotência;</li>
          <li>não duplicação de NF-e;</li>
          <li>não duplicação de contas a receber;</li>
          <li>não duplicação de CPV;</li>
          <li>não duplicação de margem;</li>
          <li>segurança dos tokens;</li>
          <li>consistência das regras tributárias;</li>
          <li>conciliação entre expedição, nota, financeiro e estoque.</li>
        </ul>
        <p><strong>O Testing Agent é obrigatório nesta execução. Não marcar como desnecessário.</strong></p>

        <hr />

        <h2>LIMITES DESTA EXECUÇÃO</h2>
        <p>Implementar e testar: auditoria da Etapa 11, validação das migrations, validação das RPCs, validação do adapter da Focus NFe, configuração segura de homologação, emissão em homologação, rejeições, timeout, consultas, cancelamento, outbox, idempotência, contas a receber, CPV, margem, conciliações, segurança, logs, observabilidade, relatório de certificação.</p>
        <p>Não implementar: SPED, contabilidade, conciliação bancária, boleto, PIX Cobrança, cobrança, protesto, produção fiscal real, token de produção, emissão em ambiente de produção, novos dashboards sem relação com a homologação, SEO.</p>

        <hr />

        <h2>ETAPA 0 — AUDITORIA REAL DO BANCO</h2>
        <p>Auditar diretamente o PostgreSQL. Não confiar apenas no relatório de execução. Localizar as funções reais relacionadas a simulação fiscal, criação de pré-faturamento, criação do documento, consolidação pós-autorização, contas a receber, CPV, margem, cancelamento, consulta, outbox.</p>
        <pre>{`select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid), pg_get_function_result(p.oid), p.prosecdef 
from pg_proc p join pg_namespace n on n.oid = p.pronamespace 
where p.proname in ('simulate_sales_invoice', 'create_sales_invoice', 'finalize_authorized_sales_invoice', 'request_sales_invoice_cancellation');`}</pre>

        <hr />

        <h2>RELATÓRIO FINAL OBRIGATÓRIO (Checklist de Certificação)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <ul className="list-none p-0">
            <li>✅ Resultado da auditoria da Etapa 11</li>
            <li>✅ RPCs encontradas/ausentes</li>
            <li>✅ Tabelas e Migrations</li>
            <li>✅ Adapter fiscal e Ambiente</li>
            <li>✅ Status dos Tokens e Certificado</li>
            <li>✅ Naturezas e Regras Tributárias</li>
            <li>✅ Resultado das Simulações</li>
            <li>✅ Sequência e Outbox</li>
            <li>✅ Emissão Autorizada (Homologação)</li>
            <li>✅ Rejeição Cadastral/Tributária</li>
          </ul>
          <ul className="list-none p-0">
            <li>✅ Timeout e Consulta Posterior</li>
            <li>✅ Reenvio Idempotente</li>
            <li>✅ XML e DANFE Privado</li>
            <li>✅ Consolidação Pós-Autorização</li>
            <li>✅ Contas a Receber e Parcelas</li>
            <li>✅ CPV e Margem Realizada</li>
            <li>✅ Cancelamento e Estornos</li>
            <li>✅ Conciliações (Expedição, Fin, CPV)</li>
            <li>✅ Testes de Concorrência e RLS</li>
            <li>✅ Auditoria de Segredos e Logs</li>
          </ul>
        </div>
        <div className="mt-4 p-4 border rounded bg-amber-500/10 border-amber-500/50 text-center font-bold">
          CLASSIFICAÇÃO FINAL: AGUARDANDO HOMOLOGAÇÃO COMPLETA
        </div>
      </Card>

      {cfg.data && (
        <Card className="p-4 flex flex-wrap gap-3 items-center text-sm">
          <Badge variant={cfg.data.token_configurado ? "default" : "destructive"}>
            {cfg.data.token_configurado ? `Token OK (${cfg.data.token_preview})` : "Token ausente"}
          </Badge>
          <Badge variant={cfg.data.provedor_nfe === "focus_nfe" ? "default" : "secondary"}>
            Provedor: {cfg.data.provedor_nfe}
          </Badge>
          <Badge variant={cfg.data.ambiente_nfe === "producao" ? "destructive" : "secondary"}>
            Ambiente: {cfg.data.ambiente_nfe}
          </Badge>
          {cfg.data.cnpj && <Badge variant="outline">CNPJ: {cfg.data.cnpj}</Badge>}
          {cfg.data.env_token_presente && (
            <Badge variant="outline" title="Também existe FOCUS_NFE_TOKEN nas secrets — o valor do banco tem prioridade">
              secret env presente
            </Badge>
          )}
        </Card>
      )}

      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-primary">🔑 Credencial</h3>
        <div>
          <Label>Token Focus NFe {cfg.data?.token_configurado && <span className="text-xs text-muted-foreground">(deixe em branco para manter o atual)</span>}</Label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder={cfg.data?.token_configurado ? `Atual: ${cfg.data.token_preview}` : "Cole o token da Focus"}
            value={form.focus_nfe_token}
            onChange={e => setForm(f => ({ ...f, focus_nfe_token: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            Obter em <a href="https://app.focusnfe.com.br" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">app.focusnfe.com.br <ExternalLink className="h-3 w-3" /></a> → Empresas → Token de acesso
          </p>
        </div>
        {cfg.data?.token_configurado && (
          <Button variant="ghost" size="sm" onClick={() => clearMut.mutate()} disabled={clearMut.isPending}>
            <Trash2 className="h-4 w-4 mr-2" /> Remover token salvo
          </Button>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-primary">⚙️ Provedor e Ambiente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Provedor NF-e</Label>
            <Select value={form.provedor_nfe} onValueChange={v => setForm(f => ({ ...f, provedor_nfe: v as typeof f.provedor_nfe }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Nenhum (só rascunho)</SelectItem>
                <SelectItem value="focus_nfe">Focus NFe</SelectItem>
                <SelectItem value="plugnotas">PlugNotas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ambiente</Label>
            <Select value={form.ambiente_nfe} onValueChange={v => setForm(f => ({ ...f, ambiente_nfe: v as typeof f.ambiente_nfe }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homologacao">Homologação (testes)</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-primary">🔢 Numeração NF-e</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Série NF-e</Label>
            <Input type="number" min={1} value={form.serie_nfe}
              onChange={e => setForm(f => ({ ...f, serie_nfe: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Próximo número</Label>
            <Input type="number" min={1} value={form.proximo_numero_nfe}
              onChange={e => setForm(f => ({ ...f, proximo_numero_nfe: Number(e.target.value) }))} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ao mudar para produção, informe o próximo número autorizado pela SEFAZ (evita rejeição por numeração duplicada).
        </p>
      </Card>

      <div className="flex justify-between items-center flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => testMut.mutate()}
          disabled={testMut.isPending || !cfg.data?.token_configurado}
          title={!cfg.data?.token_configurado ? "Salve um token antes de testar" : ""}
        >
          {testMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlugZap className="h-4 w-4 mr-2" />}
          Testar conexão
        </Button>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar configuração
        </Button>
      </div>

      <Card className="p-4 bg-muted/40">
        <h4 className="font-semibold text-sm mb-2">📋 Checklist de Certificação (Etapa 11.1)</h4>
        <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
          <li>Token salvo e teste de conexão OK</li>
          <li>CNPJ, IE, CRT e endereço da empresa preenchidos em <a href="/configuracoes" className="underline">Configurações → Empresa</a></li>
          <li>Empresa cadastrada no painel da Focus NFe com certificado A1 ativo</li>
          <li>Regras tributárias cadastradas para os NCMs em uso</li>
          <li>Produtos com NCM, origem, unidade e CFOP padrão</li>
          <li>Clientes com CNPJ/CPF, indicador IE e endereço completo</li>
        </ul>
      </Card>
    </div>
  );
}
