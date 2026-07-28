INSERT INTO public.cargos (nome, descricao, permissoes)
VALUES 
  ('Operador de Máquina', 'Responsável pela operação direta das máquinas produtivas.', '{"producao.apontamento", "producao.visualizar"}'),
  ('Auxiliar de Produção', 'Suporte operacional nas linhas de produção e movimentação.', '{"producao.visualizar"}'),
  ('Inspetor de Qualidade', 'Responsável pela inspeção e liberação técnica de lotes.', '{"qualidade.inspecao", "qualidade.liberacao"}'),
  ('Encarregado de Produção', 'Gestão direta da equipe de turno e cumprimento de metas.', '{"producao.gestao", "producao.apontamento", "dashboard.industrial"}'),
  ('Técnico de Manutenção', 'Manutenção preventiva e corretiva de equipamentos.', '{"manutencao.ordens", "manutencao.visualizar"}'),
  ('Operador de Logística', 'Gestão de movimentação interna e WMS.', '{"estoque.movimentacao", "wms.operacao"}'),
  ('Apontador de Produção', 'Registro de tempos, métodos e consumo de materiais.', '{"producao.apontamento", "estoque.consumo"}')
ON CONFLICT (nome) DO NOTHING;