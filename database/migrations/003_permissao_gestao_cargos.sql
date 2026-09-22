-- Permite que o cargo Diretoria gerencie cargos e usuários.
-- A operação é idempotente e não concede papel de superusuário.

UPDATE cargos
SET permissoes = JSON_ARRAY_APPEND(permissoes, '$', '/dev/cargos')
WHERE nome = 'Diretoria'
  AND JSON_SEARCH(permissoes, 'one', '/dev/cargos') IS NULL;