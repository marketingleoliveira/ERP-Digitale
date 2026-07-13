
CREATE OR REPLACE VIEW public.vw_custos_op
WITH (security_invoker=true) AS
SELECT
  o.id AS op_id,
  o.numero,
  o.status::text AS status,
  o.maquina_id,
  COALESCE(m.maquina, m.modelo, m.numero::text) AS maquina_nome,
  o.pedido_id,
  p.numero AS pedido_numero,
  p.cliente_id,
  cli.razao_social AS cliente_nome,
  COALESCE(oc.custo_materia_prima, 0) AS custo_mp,
  COALESCE(oc.custo_mao_obra, 0) AS custo_mo,
  COALESCE(oc.custo_cif, 0) AS custo_cif,
  COALESCE(oc.custo_total, 0) AS custo_real,
  COALESCE(oc.quantidade_produzida, 0) AS qtd_produzida,
  COALESCE(oc.custo_por_kg, 0) AS custo_por_kg,
  COALESCE(ap.qtd_refugo, 0) AS qtd_refugo,
  ROUND(COALESCE(ap.qtd_refugo, 0) * COALESCE(oc.custo_por_kg, 0), 2) AS custo_perdas,
  COALESCE(rp.custo_retrabalho, 0) AS custo_retrabalho,
  0::numeric AS custo_terceirizacao,
  0::numeric AS custo_frete_interno,
  COALESCE(p.valor_total, 0) AS receita_pedido,
  (COALESCE(p.valor_total, 0) - COALESCE(oc.custo_total, 0)) AS margem_valor,
  CASE WHEN COALESCE(p.valor_total, 0) > 0
       THEN ROUND(((p.valor_total - COALESCE(oc.custo_total, 0)) / p.valor_total) * 100, 2)
       ELSE NULL END AS margem_pct
FROM public.ordens_producao o
LEFT JOIN public.op_custos oc ON oc.op_id = o.id
LEFT JOIN public.pedidos p ON p.id = o.pedido_id
LEFT JOIN public.customers cli ON cli.id = p.cliente_id
LEFT JOIN public.maquinas m ON m.id = o.maquina_id
LEFT JOIN LATERAL (SELECT SUM(quantidade_refugo) AS qtd_refugo FROM public.op_apontamentos WHERE op_id = o.id) ap ON true
LEFT JOIN LATERAL (SELECT SUM(COALESCE(custo_adicional,0)) AS custo_retrabalho FROM public.op_reprocessos WHERE op_origem_id = o.id) rp ON true;

CREATE OR REPLACE VIEW public.vw_custos_cliente
WITH (security_invoker=true) AS
SELECT cliente_id, cliente_nome, COUNT(*) AS ops,
  SUM(custo_real) AS custo_real, SUM(custo_perdas) AS custo_perdas,
  SUM(custo_retrabalho) AS custo_retrabalho, SUM(receita_pedido) AS receita,
  SUM(margem_valor) AS margem_valor,
  CASE WHEN SUM(receita_pedido) > 0
       THEN ROUND((SUM(margem_valor) / SUM(receita_pedido)) * 100, 2) ELSE NULL END AS margem_pct
FROM public.vw_custos_op WHERE cliente_id IS NOT NULL
GROUP BY cliente_id, cliente_nome;

CREATE OR REPLACE VIEW public.vw_custos_maquina
WITH (security_invoker=true) AS
SELECT maquina_id, maquina_nome, COUNT(*) AS ops,
  SUM(qtd_produzida) AS qtd_produzida, SUM(custo_real) AS custo_real,
  SUM(custo_perdas) AS custo_perdas, SUM(custo_retrabalho) AS custo_retrabalho,
  CASE WHEN SUM(qtd_produzida) > 0 THEN ROUND(SUM(custo_real) / SUM(qtd_produzida), 4) ELSE NULL END AS custo_medio_kg
FROM public.vw_custos_op WHERE maquina_id IS NOT NULL
GROUP BY maquina_id, maquina_nome;

CREATE OR REPLACE VIEW public.vw_custos_produto
WITH (security_invoker=true) AS
SELECT oi.product_id, pr.nome AS produto_nome,
  COUNT(DISTINCT vco.op_id) AS ops, SUM(vco.qtd_produzida) AS qtd_produzida,
  SUM(vco.custo_real) AS custo_real, SUM(vco.custo_perdas) AS custo_perdas,
  SUM(vco.custo_retrabalho) AS custo_retrabalho,
  CASE WHEN SUM(vco.qtd_produzida) > 0 THEN ROUND(SUM(vco.custo_real) / SUM(vco.qtd_produzida), 4) ELSE NULL END AS custo_medio_un
FROM public.vw_custos_op vco
JOIN public.op_itens oi ON oi.op_id = vco.op_id
LEFT JOIN public.products pr ON pr.id = oi.product_id
WHERE oi.product_id IS NOT NULL
GROUP BY oi.product_id, pr.nome;

GRANT SELECT ON public.vw_custos_op TO authenticated;
GRANT SELECT ON public.vw_custos_cliente TO authenticated;
GRANT SELECT ON public.vw_custos_maquina TO authenticated;
GRANT SELECT ON public.vw_custos_produto TO authenticated;
