
CREATE OR REPLACE VIEW public.vw_oee_maquina_periodo
WITH (security_invoker = true) AS
WITH ap AS (
  SELECT a.maquina_id,
    SUM(EXTRACT(EPOCH FROM (COALESCE(a.fim, now()) - a.inicio))/60) AS min_operado,
    SUM(a.quantidade_produzida) AS qtd_produzida,
    SUM(a.quantidade_refugo) AS qtd_refugo
  FROM public.op_apontamentos a
  WHERE a.inicio >= now() - INTERVAL '30 days'
  GROUP BY a.maquina_id
),
pa AS (
  SELECT maquina_id, SUM(COALESCE(duracao_min,0)) AS min_parado
  FROM public.op_paradas WHERE inicio >= now() - INTERVAL '30 days'
  GROUP BY maquina_id
)
SELECT
  m.id AS maquina_id, m.numero, m.maquina AS nome,
  COALESCE(ap.min_operado,0)::numeric(14,2) AS min_operado,
  COALESCE(pa.min_parado,0)::numeric(14,2) AS min_parado,
  COALESCE(ap.qtd_produzida,0) AS qtd_produzida,
  COALESCE(ap.qtd_refugo,0) AS qtd_refugo,
  CASE WHEN COALESCE(ap.min_operado,0)+COALESCE(pa.min_parado,0) > 0
    THEN ROUND((ap.min_operado / (ap.min_operado + pa.min_parado) * 100)::numeric, 2) END AS disponibilidade_pct,
  CASE WHEN COALESCE(ap.min_operado,0) > 0 AND COALESCE(mc.kg_por_hora,0) > 0
    THEN ROUND(LEAST(ap.qtd_produzida / ((ap.min_operado/60.0) * mc.kg_por_hora) * 100, 100)::numeric, 2) END AS performance_pct,
  CASE WHEN COALESCE(ap.qtd_produzida,0) > 0
    THEN ROUND(((ap.qtd_produzida - ap.qtd_refugo) / ap.qtd_produzida * 100)::numeric, 2) END AS qualidade_pct,
  CASE WHEN COALESCE(ap.min_operado,0)+COALESCE(pa.min_parado,0) > 0
        AND COALESCE(ap.qtd_produzida,0) > 0 AND COALESCE(mc.kg_por_hora,0) > 0
    THEN ROUND((
      (ap.min_operado / (ap.min_operado + pa.min_parado)) *
      LEAST(ap.qtd_produzida / ((ap.min_operado/60.0) * mc.kg_por_hora), 1) *
      ((ap.qtd_produzida - ap.qtd_refugo) / ap.qtd_produzida) * 100
    )::numeric, 2) END AS oee_pct
FROM public.maquinas m
LEFT JOIN ap ON ap.maquina_id = m.id
LEFT JOIN pa ON pa.maquina_id = m.id
LEFT JOIN public.maquina_capacidade mc ON mc.maquina_id = m.id
WHERE m.habilitado = true;

CREATE OR REPLACE VIEW public.vw_oee_operador
WITH (security_invoker = true) AS
WITH ap AS (
  SELECT a.funcionario_id,
    SUM(EXTRACT(EPOCH FROM (COALESCE(a.fim, now()) - a.inicio))/60) AS min_operado,
    SUM(a.quantidade_produzida) AS qtd_produzida,
    SUM(a.quantidade_refugo) AS qtd_refugo,
    AVG(mc.kg_por_hora) AS kgh_med
  FROM public.op_apontamentos a
  LEFT JOIN public.maquina_capacidade mc ON mc.maquina_id = a.maquina_id
  WHERE a.inicio >= now() - INTERVAL '30 days' AND a.funcionario_id IS NOT NULL
  GROUP BY a.funcionario_id
)
SELECT
  f.id AS funcionario_id, f.nome,
  ap.min_operado::numeric(14,2), ap.qtd_produzida, ap.qtd_refugo,
  CASE WHEN ap.min_operado > 0 AND COALESCE(ap.kgh_med,0) > 0
    THEN ROUND(LEAST(ap.qtd_produzida / ((ap.min_operado/60.0) * ap.kgh_med) * 100, 100)::numeric, 2) END AS performance_pct,
  CASE WHEN ap.qtd_produzida > 0
    THEN ROUND(((ap.qtd_produzida - ap.qtd_refugo) / ap.qtd_produzida * 100)::numeric, 2) END AS qualidade_pct,
  CASE WHEN ap.min_operado > 0 AND COALESCE(ap.kgh_med,0) > 0 AND ap.qtd_produzida > 0
    THEN ROUND((
      LEAST(ap.qtd_produzida / ((ap.min_operado/60.0) * ap.kgh_med), 1) *
      ((ap.qtd_produzida - ap.qtd_refugo) / ap.qtd_produzida) * 100
    )::numeric, 2) END AS oee_pct
FROM public.funcionarios f
JOIN ap ON ap.funcionario_id = f.id;

CREATE OR REPLACE VIEW public.vw_oee_artigo
WITH (security_invoker = true) AS
WITH ap AS (
  SELECT pr.id AS product_id, pr.codigo, pr.nome,
    SUM(EXTRACT(EPOCH FROM (COALESCE(a.fim, now()) - a.inicio))/60) AS min_operado,
    SUM(a.quantidade_produzida) AS qtd_produzida,
    SUM(a.quantidade_refugo) AS qtd_refugo,
    AVG(mc.kg_por_hora) AS kgh_med
  FROM public.op_apontamentos a
  JOIN public.op_itens oi ON oi.op_id = a.op_id
  JOIN public.products pr ON pr.id = oi.product_id
  LEFT JOIN public.maquina_capacidade mc ON mc.maquina_id = a.maquina_id
  WHERE a.inicio >= now() - INTERVAL '30 days'
  GROUP BY pr.id, pr.codigo, pr.nome
)
SELECT product_id, codigo, nome,
  min_operado::numeric(14,2), qtd_produzida, qtd_refugo,
  CASE WHEN min_operado > 0 AND COALESCE(kgh_med,0) > 0
    THEN ROUND(LEAST(qtd_produzida / ((min_operado/60.0) * kgh_med) * 100, 100)::numeric, 2) END AS performance_pct,
  CASE WHEN qtd_produzida > 0
    THEN ROUND(((qtd_produzida - qtd_refugo) / qtd_produzida * 100)::numeric, 2) END AS qualidade_pct,
  CASE WHEN min_operado > 0 AND COALESCE(kgh_med,0) > 0 AND qtd_produzida > 0
    THEN ROUND((
      LEAST(qtd_produzida / ((min_operado/60.0) * kgh_med), 1) *
      ((qtd_produzida - qtd_refugo) / qtd_produzida) * 100
    )::numeric, 2) END AS oee_pct
FROM ap;

CREATE OR REPLACE VIEW public.vw_oee_turno
WITH (security_invoker = true) AS
WITH ap AS (
  SELECT
    CASE
      WHEN EXTRACT(HOUR FROM a.inicio) >= 22 OR EXTRACT(HOUR FROM a.inicio) < 6 THEN 'Noite'
      WHEN EXTRACT(HOUR FROM a.inicio) < 14 THEN 'Manhã'
      ELSE 'Tarde'
    END AS turno,
    SUM(EXTRACT(EPOCH FROM (COALESCE(a.fim, now()) - a.inicio))/60) AS min_operado,
    SUM(a.quantidade_produzida) AS qtd_produzida,
    SUM(a.quantidade_refugo) AS qtd_refugo,
    AVG(mc.kg_por_hora) AS kgh_med
  FROM public.op_apontamentos a
  LEFT JOIN public.maquina_capacidade mc ON mc.maquina_id = a.maquina_id
  WHERE a.inicio >= now() - INTERVAL '30 days'
  GROUP BY 1
)
SELECT turno, min_operado::numeric(14,2), qtd_produzida, qtd_refugo,
  CASE WHEN min_operado > 0 AND COALESCE(kgh_med,0) > 0
    THEN ROUND(LEAST(qtd_produzida / ((min_operado/60.0) * kgh_med) * 100, 100)::numeric, 2) END AS performance_pct,
  CASE WHEN qtd_produzida > 0
    THEN ROUND(((qtd_produzida - qtd_refugo) / qtd_produzida * 100)::numeric, 2) END AS qualidade_pct,
  CASE WHEN min_operado > 0 AND COALESCE(kgh_med,0) > 0 AND qtd_produzida > 0
    THEN ROUND((
      LEAST(qtd_produzida / ((min_operado/60.0) * kgh_med), 1) *
      ((qtd_produzida - qtd_refugo) / qtd_produzida) * 100
    )::numeric, 2) END AS oee_pct
FROM ap;

CREATE OR REPLACE VIEW public.vw_oee_mensal
WITH (security_invoker = true) AS
WITH ap AS (
  SELECT date_trunc('month', a.inicio) AS mes,
    SUM(EXTRACT(EPOCH FROM (COALESCE(a.fim, now()) - a.inicio))/60) AS min_operado,
    SUM(a.quantidade_produzida) AS qtd_produzida,
    SUM(a.quantidade_refugo) AS qtd_refugo,
    AVG(mc.kg_por_hora) AS kgh_med
  FROM public.op_apontamentos a
  LEFT JOIN public.maquina_capacidade mc ON mc.maquina_id = a.maquina_id
  WHERE a.inicio >= date_trunc('month', now()) - INTERVAL '12 months'
  GROUP BY 1
),
pa AS (
  SELECT date_trunc('month', inicio) AS mes, SUM(COALESCE(duracao_min,0)) AS min_parado
  FROM public.op_paradas
  WHERE inicio >= date_trunc('month', now()) - INTERVAL '12 months'
  GROUP BY 1
)
SELECT
  ap.mes::date AS mes,
  ap.min_operado::numeric(14,2),
  COALESCE(pa.min_parado,0)::numeric(14,2) AS min_parado,
  ap.qtd_produzida, ap.qtd_refugo,
  CASE WHEN (ap.min_operado + COALESCE(pa.min_parado,0)) > 0
    THEN ROUND((ap.min_operado / (ap.min_operado + COALESCE(pa.min_parado,0)) * 100)::numeric, 2) END AS disponibilidade_pct,
  CASE WHEN ap.min_operado > 0 AND COALESCE(ap.kgh_med,0) > 0
    THEN ROUND(LEAST(ap.qtd_produzida / ((ap.min_operado/60.0) * ap.kgh_med) * 100, 100)::numeric, 2) END AS performance_pct,
  CASE WHEN ap.qtd_produzida > 0
    THEN ROUND(((ap.qtd_produzida - ap.qtd_refugo) / ap.qtd_produzida * 100)::numeric, 2) END AS qualidade_pct,
  CASE WHEN (ap.min_operado + COALESCE(pa.min_parado,0)) > 0
        AND ap.qtd_produzida > 0 AND COALESCE(ap.kgh_med,0) > 0
    THEN ROUND((
      (ap.min_operado / (ap.min_operado + COALESCE(pa.min_parado,0))) *
      LEAST(ap.qtd_produzida / ((ap.min_operado/60.0) * ap.kgh_med), 1) *
      ((ap.qtd_produzida - ap.qtd_refugo) / ap.qtd_produzida) * 100
    )::numeric, 2) END AS oee_pct
FROM ap LEFT JOIN pa ON pa.mes = ap.mes
ORDER BY ap.mes;

GRANT SELECT ON public.vw_oee_maquina_periodo TO authenticated;
GRANT SELECT ON public.vw_oee_operador TO authenticated;
GRANT SELECT ON public.vw_oee_artigo TO authenticated;
GRANT SELECT ON public.vw_oee_turno TO authenticated;
GRANT SELECT ON public.vw_oee_mensal TO authenticated;
