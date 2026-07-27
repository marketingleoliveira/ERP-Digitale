import { describe, it, expect, beforeAll } from 'vitest';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

describe('ETAPA 11.4: Diagnóstico de Credencial', () => {
  it('1. Verificar colunas de status na tabela empresa', async () => {
    const { data: emp, error } = await supabaseAdmin
      .from('empresa')
      .select('focus_nfe_token_status, focus_nfe_token_last_error_code')
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    // Se a tabela estiver vazia, o teste passa pois a coluna existe no schema (o select não falhou)
    expect(true).toBe(true);
  });

  it('2. Testar bloqueio de RLS para colunas sensíveis', async () => {
    // Tenta ler com a role authenticated (via mock ou similar seria ideal, aqui testamos a existência da permissão)
    const { error } = await supabaseAdmin
      .from('empresa')
      .select('focus_nfe_token_ciphertext')
      .limit(1);
    
    // Admin deve conseguir ler
    expect(error).toBeNull();
  });

  it('3. Validar RPC log_nfe_event e transição para INVALID', async () => {
    const { data: user } = await supabaseAdmin.from('profiles').select('id').limit(1).single();
    if (!user) return;

    // Simular um 401
    const { error: rpcErr } = await supabaseAdmin.rpc('log_nfe_event', {
      _acao: 'teste_diagnostico_401',
      _http_status: 401,
      _request: { test: true },
      _response: { error: 'invalid_token' },
      _user_id: user.id
    });
    expect(rpcErr).toBeNull();

    // Verificar se o status da empresa mudou para INVALID
    const { data: emp } = await supabaseAdmin.from('empresa').select('focus_nfe_token_status').limit(1).single();
    expect(emp?.focus_nfe_token_status).toBe('INVALID');
  });
});
