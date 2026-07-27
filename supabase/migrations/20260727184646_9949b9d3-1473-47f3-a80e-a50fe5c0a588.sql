CREATE OR REPLACE VIEW public.vw_estoque_comercial AS
SELECT 
    l.id as lote_id,
    l.numero_lote,
    l.tipo as lote_tipo,
    l.item_id as artigo_id,
    l.classificacao,
    l.liberado_comercial,
    l.deposito,
    l.quantidade as saldo_fisico,
    l.saldo_aprovado,
    l.saldo_reservado_comercial as saldo_reservado,
    l.saldo_em_separacao,
    (l.saldo_aprovado - l.saldo_reservado_comercial - l.saldo_em_separacao) as saldo_disponivel,
    l.custo_definitivo,
    l.data_entrada,
    l.status_processo,
    (now() - l.data_entrada) as idade_lote
FROM public.lotes l;

GRANT SELECT ON public.vw_estoque_comercial TO authenticated;
