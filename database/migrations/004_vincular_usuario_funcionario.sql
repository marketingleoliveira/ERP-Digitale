-- O usuário de acesso só pode existir quando vinculado a um funcionário habilitado.
-- Usuários legados ficam NULL até serem vinculados pela tela de Usuários.

ALTER TABLE users
  ADD COLUMN funcionario_id CHAR(36) NULL;

CREATE UNIQUE INDEX uq_users_funcionario_id ON users(funcionario_id);
