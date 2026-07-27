import { describe, it, expect, beforeAll } from 'vitest';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { simulateInvoice, createPreFaturamento } from '@/lib/faturamento.functions';
import { getFiscalCertificationStatus } from '@/services/fiscal/auditoria.functions';

describe('Etapa 11.2: Homologação Fiscal e Certificação', () => {
  let testData: any = {};

  beforeAll(async () => {
    const { data: emp } = await supabaseAdmin.from('empresa').select('id, focus_nfe_token').limit(1).single();
    const { data: art } = await supabaseAdmin.from('articles').select('id').limit(1).single();
    const { data: cust } = await supabaseAdmin.from('customers').select('id').limit(1).single();
    const { data: nat } = await supabaseAdmin.from('naturezas_operacao').select('id').eq('ativo', true).limit(1).single();
    
    testData = {
      empresaId: emp?.id,
      articleId: art?.id,
      customerId: cust?.id,
      naturezaId: nat?.id,
      tokenPresent: !!emp?.focus_nfe_token
    };
  });

  it('ETAPA 0: Auditoria de Segurança do Token', async () => {
    const status = await getFiscalCertificationStatus();
    expect(status.tokenConfigurado).toBe(true);
    // Verificação de exposição (simulada via auditoria de server function)
    expect(status.bloqueadores).not.toContain('Token Focus NFe não configurado');
  });

  it('ETAPA 7: Executar Simulação Real', async () => {
    // Criar uma expedição fictícia para o teste se não existir
    const { data: exp } = await supabaseAdmin.from('op_expedicoes').insert({
      status: 'pendente',
      observacao: 'Teste Homologação'
    }).select().single();

    if (exp) {
      const result = await simulateInvoice({
        expedicaoId: exp.id,
        naturezaId: testData.naturezaId
      });

      expect(result).toBeDefined();
      expect(result.valor_total).toBeGreaterThan(0);
      
      // Cleanup
      await supabaseAdmin.from('op_expedicoes').delete().eq('id', exp.id);
    }
  });

  it('ETAPA 9: Criar Pré-faturamento Idempotente', async () => {
    const { data: exp } = await supabaseAdmin.from('op_expedicoes').insert({
      status: 'pendente'
    }).select().single();

    if (exp) {
      const idempotencyKey = crypto.randomUUID();
      const payload = {
        expedicaoId: exp.id,
        naturezaId: testData.naturezaId,
        idempotencyKey
      };

      const call1 = await createPreFaturamento(payload);
      const call2 = await createPreFaturamento(payload);

      expect(call1.id).toBe(call2.id);
      
      // Cleanup
      await supabaseAdmin.from('pre_faturamentos').delete().eq('id', call1.id);
      await supabaseAdmin.from('op_expedicoes').delete().eq('id', exp.id);
    }
  });
});
