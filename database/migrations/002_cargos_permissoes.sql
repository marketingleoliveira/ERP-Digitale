-- Cargos personalizados e permissões de menu.
-- Não confundir com roles/user_roles, que controlam papéis de segurança/autorização.

CREATE TABLE IF NOT EXISTS cargos (
  id CHAR(36) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT NULL,
  permissoes JSON NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cargos_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_cargos (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  cargo_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_cargos_user_cargo (user_id, cargo_id),
  KEY idx_user_cargos_user_id (user_id),
  KEY idx_user_cargos_cargo_id (cargo_id),
  CONSTRAINT fk_user_cargos_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_cargos_cargo
    FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
