import { describe, it, expect, beforeAll } from 'vitest';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

describe('Etapa 11.2: Homologação Fiscal e Certificação (Direct SQL Validation)', () => {
  let testData: any = {};

  beforeAll(async () => {
    const { data: emp } = await supabaseAdmin.from('empresa').select('id, focus_nfe_token').limit(1).single();
    const { data: nat } = await supabaseAdmin.from('naturezas_operacao').select('id').eq('ativo', true).limit(1).single();
    
    testData = {
      empresaId: emp?.id,
      naturezaId: nat?.id,
      tokenPresent: !!emp?.focus_nfe_token
    };
  });

  it('ETAPA 0: Auditoria de Segurança do Token', async () => {
    expect(testData.tokenPresent).toBe(true);
    
    const { data, error } = await supabaseAdmin
      .from('empresa')
      .select('focus_nfe_token')
      .limit(1)
      .single();

    expect(error).toBeNull();
    expect(data?.focus_nfe_token).toBeDefined();
  });

  it('ETAPA 7: Validar RPC de Simulação', async () => {
    const { data: exp } = await supabaseAdmin.from('op_expedicoes').insert({
      status: 'pendente',
      observacao: 'Teste Homologação'
    }).select().single();

    if (exp) {
      const { data: sim, error } = await supabaseAdmin.rpc('simulate_sales_invoice' as any, {
        p_expedicao_id: exp.id,
        p_natureza_id: testData.naturezaId
      });

      expect(error).toBeNull();
      expect(sim).toBeDefined();
      const s = sim as any;
      expect(s.valor_total).toBeGreaterThan(0);
      
      await supabaseAdmin.from('op_expedicoes').delete().eq('id', exp.id);
    }
  });

  it('ETAPA 9: Validar Pré-faturamento Idempotente via SQL', async () => {
    const { data: exp } = await supabaseAdmin.from('op_expedicoes').insert({ status: 'pendente' }).select().single();
    const idempotencyKey = crypto.randomUUID();

    if (exp) {
      const insert = async () => {
        return supabaseAdmin.from('pre_faturamentos').upsert({
          expedicao_id: exp.id,
          natureza_id: testData.naturezaId,
          status: 'validado',
          valor_total: 1050,
          idempotency_key: idempotencyKey,
          payload_fiscal: {}
        }, { onConflict: 'idempotency_key' }).select().single();
      };

      const res1 = await insert();
      const res2 = await insert();

      expect(res1.data?.id).toBe(res2.data?.id);
      
      if (res1.data) {
        await supabaseAdmin.from('pre_faturamentos').delete().eq('id', res1.data.id);
      }
      await supabaseAdmin.from('op_expedicoes').delete().eq('id', exp.id);
    }
  });
});
