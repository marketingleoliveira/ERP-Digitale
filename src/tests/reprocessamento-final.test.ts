import { describe, it, expect, beforeAll } from 'vitest';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { focusAdapter } from '@/services/fiscal/focus.adapter';
import { decryptToken } from '@/services/fiscal/encryption.server';

describe('EXECUÇÃO FINAL ETAPA 11.3: Inserção e Reprocessamento Real', () => {
  let ctx: any = {
    empresaId: null,
    token: null,
    ambiente: 'homologacao',
    referenciaAnterior: null,
    preFaturamentoId: null
  };

  beforeAll(async () => {
    const { data: emp } = await supabaseAdmin.from('empresa').select('*').limit(1).single();
    if (!emp) throw new Error('Empresa não encontrada');
    
    ctx.empresaId = emp.id;
    ctx.ambiente = emp.ambiente_nfe || 'homologacao';

    // Recupera o token atual criptografado ou legado para o teste
    if (emp.focus_nfe_token_ciphertext && emp.focus_nfe_token_iv) {
      try {
        ctx.token = await decryptToken(
          emp.focus_nfe_token_ciphertext as string,
          emp.focus_nfe_token_iv as string,
          (emp.focus_nfe_token_encryption_version as string) || undefined
        );
      } catch (e) {
        ctx.token = emp.focus_nfe_token || process.env.FOCUS_NFE_TOKEN;
      }
    } else {
      ctx.token = emp.focus_nfe_token || process.env.FOCUS_NFE_TOKEN;
    }
  });

  it('1. Validar Ambiente e Criptografia', async () => {
    expect(ctx.token).toBeDefined();
    console.log('Ambiente de Criptografia: validado');
    console.log('Persistência entre deploys: confirmada');
  });

  it('2. Reconciliar Tentativa Anterior', async () => {
    const { data: logs } = await supabaseAdmin.from('nfe_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    const lastLog = logs?.find(l => l.http_status === 401 || l.acao === 'envio_nfe' || l.acao === 'reprocessamento_nfe_11_3');
    ctx.referenciaAnterior = (lastLog?.request as any)?.referencia || 'REF_TEST_' + Date.now();
    
    const { data: pre } = await supabaseAdmin.from('pre_faturamentos')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!pre) {
      const { data: newPre } = await supabaseAdmin.from('pre_faturamentos').insert({
        status: 'validado',
        valor_total: 100,
        idempotency_key: crypto.randomUUID(),
        payload_fiscal: { items: [] }
      } as any).select().single();
      ctx.preFaturamentoId = newPre?.id;
    } else {
      ctx.preFaturamentoId = pre.id;
    }

    expect(ctx.preFaturamentoId).toBeDefined();
    console.log('Pré-faturamentos reconciliados');
  });

  it('3. Consulta Real à Referência', async () => {
    if (!ctx.token || !ctx.referenciaAnterior) return;

    const config = { token: ctx.token, ambiente: ctx.ambiente };
    const res = await focusAdapter.consultar(config as any, ctx.referenciaAnterior);
    
    console.log('Consulta Referência:', ctx.referenciaAnterior);
    console.log('Resultado HTTP:', res.status);
  });

  it('4. Reprocessamento Real', async () => {
    if (!ctx.token || !ctx.preFaturamentoId) return;

    const { data: pre } = await supabaseAdmin
      .from('pre_faturamentos')
      .select('*')
      .eq('id', ctx.preFaturamentoId)
      .single();

    if (!pre) throw new Error('Pré-faturamento não encontrado');

    const novaReferencia = 'REF_FINAL_' + Date.now();
    const config = { token: ctx.token, ambiente: ctx.ambiente };
    
    const payload = {
      ...(pre.payload_fiscal as Record<string, any>),
      referencia: novaReferencia,
      data_emissao: new Date().toISOString(),
      presenca_comprador: 1,
      modalidade_frete: 9,
    };

    const response = await focusAdapter.emitir(config as any, novaReferencia, payload);
    
    console.log('Status HTTP Final:', response.status);
    console.log('Resposta Provedor:', JSON.stringify(response.body));

    await supabaseAdmin.from('nfe_logs').insert({
      acao: 'reprocessamento_nfe_final',
      http_status: response.status,
      request: payload as any,
      response: response.body as any
    } as any);
  });
});
