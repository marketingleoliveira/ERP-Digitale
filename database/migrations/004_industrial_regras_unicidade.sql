-- ERP Digitale - Fase 1A.1: regras de unicidade dos cadastros industriais
-- Corrige a equivalencia com o schema legado sem inserir dados.
-- Dependencias: database/migrations/003_industrial_cadastros_base.sql

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'composicoes'
      AND index_name = 'uq_composicoes_codigo'
  ),
  'SELECT 1',
  'ALTER TABLE composicoes ADD UNIQUE KEY uq_composicoes_codigo (codigo)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'fios'
      AND index_name = 'uq_fios_codigo'
  ),
  'SELECT 1',
  'ALTER TABLE fios ADD UNIQUE KEY uq_fios_codigo (codigo)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
