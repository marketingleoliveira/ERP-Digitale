
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS article_id UUID NULL REFERENCES public.articles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_article_id ON public.products(article_id);

COMMENT ON COLUMN public.products.article_id IS
  'Artigo têxtil de referência (FK articles.id). Necessário para produtos destinados à produção — MRP e BOM dependem desse vínculo.';

-- View de sugestões para a tela de revisão de vínculos.
-- Não altera dados; apenas propõe correspondências por código/nome exatos (case-insensitive).
CREATE OR REPLACE VIEW public.vw_produtos_sugestao_artigo
WITH (security_invoker = true) AS
SELECT
  p.id                                       AS product_id,
  p.codigo                                   AS product_codigo,
  p.nome                                     AS product_nome,
  p.article_id                               AS article_id_atual,
  a_cod.id                                   AS sugestao_por_codigo_id,
  a_cod.codigo                               AS sugestao_por_codigo,
  a_nome.id                                  AS sugestao_por_nome_id,
  a_nome.nome                                AS sugestao_por_nome,
  CASE
    WHEN p.article_id IS NOT NULL                        THEN 'vinculado'
    WHEN a_cod.id IS NOT NULL AND a_nome.id IS NOT NULL
      AND a_cod.id = a_nome.id                            THEN 'sugestao_forte'
    WHEN a_cod.id IS NOT NULL OR a_nome.id IS NOT NULL   THEN 'sugestao_fraca'
    ELSE 'sem_sugestao'
  END                                        AS status
FROM public.products p
LEFT JOIN public.articles a_cod
  ON a_cod.ativo = true
 AND LOWER(TRIM(a_cod.codigo)) = LOWER(TRIM(p.codigo))
LEFT JOIN public.articles a_nome
  ON a_nome.ativo = true
 AND LOWER(TRIM(a_nome.nome))   = LOWER(TRIM(p.nome));

GRANT SELECT ON public.vw_produtos_sugestao_artigo TO authenticated;
