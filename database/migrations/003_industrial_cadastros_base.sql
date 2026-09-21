-- ERP Digitale - Fase 1A: cadastros industriais base em MariaDB
-- Idempotente e sem dados/seeds. Não contém credenciais.
-- Dependências: database/migrations/001_auth_base.sql

CREATE TABLE IF NOT EXISTS composicoes (
  id CHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  codigo VARCHAR(100) NOT NULL,
  ncm VARCHAR(20) NULL,
  composicao TEXT NOT NULL,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,
  owner_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_composicoes_tipo_codigo (tipo, codigo),
  KEY idx_composicoes_owner (owner_id),
  CONSTRAINT chk_composicoes_tipo CHECK (tipo IN ('Artigo','Fio')),
  CONSTRAINT fk_composicoes_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fios (
  id CHAR(36) NOT NULL,
  codigo VARCHAR(100) NOT NULL,
  ncm VARCHAR(20) NULL,
  tipo VARCHAR(100) NULL,
  titulo DECIMAL(14,4) NULL,
  n_filamentos INT NULL,
  n_cabos INT NULL,
  composicao TEXT NULL,
  cest VARCHAR(20) NULL,
  origem VARCHAR(20) NULL,
  quebra_percent DECIMAL(8,4) NULL,
  custo DECIMAL(14,4) NULL,
  cor VARCHAR(100) NULL,
  composicao_id CHAR(36) NULL,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,
  owner_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fios_codigo (codigo),
  KEY idx_fios_composicao (composicao_id),
  KEY idx_fios_owner (owner_id),
  CONSTRAINT fk_fios_composicao
    FOREIGN KEY (composicao_id) REFERENCES composicoes(id) ON DELETE SET NULL,
  CONSTRAINT fk_fios_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS variantes (
  id CHAR(36) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variantes_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tinturarias (
  id CHAR(36) NOT NULL,
  codigo VARCHAR(100) NOT NULL,
  nome_fantasia VARCHAR(180) NOT NULL,
  razao_social VARCHAR(200) NULL,
  cnpj VARCHAR(20) NULL,
  telefone VARCHAR(30) NULL,
  contato VARCHAR(150) NULL,
  categoria VARCHAR(30) NOT NULL DEFAULT 'Tinturaria',
  ncm VARCHAR(20) NULL,
  unidade VARCHAR(20) NULL,
  preco_custo DECIMAL(14,4) NULL,
  preco_venda DECIMAL(14,4) NULL,
  estoque_minimo DECIMAL(14,4) NULL,
  observacao TEXT NULL,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tinturarias_codigo (codigo),
  KEY idx_tinturarias_categoria (categoria),
  CONSTRAINT chk_tinturarias_categoria CHECK (
    categoria IN ('Tinturaria','Insumos','Manutenção','Transportadora')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cores (
  id CHAR(36) NOT NULL,
  codigo VARCHAR(100) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  cor VARCHAR(150) NOT NULL,
  valor DECIMAL(14,4) NULL DEFAULT 0,
  valor_complementar DECIMAL(14,4) NULL DEFAULT 0,
  tinturaria_id CHAR(36) NULL,
  observacao TEXT NULL,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cores_codigo (codigo),
  KEY idx_cores_tinturaria (tinturaria_id),
  KEY idx_cores_cor (cor),
  CONSTRAINT fk_cores_tinturaria
    FOREIGN KEY (tinturaria_id) REFERENCES tinturarias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agulhas (
  id CHAR(36) NOT NULL,
  agulha VARCHAR(150) NOT NULL,
  modelo VARCHAR(150) NULL,
  pe INT NULL,
  marca VARCHAR(150) NULL,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_agulhas_agulha (agulha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS correias (
  id CHAR(36) NOT NULL,
  correia VARCHAR(150) NOT NULL,
  modelo VARCHAR(150) NULL,
  marca VARCHAR(150) NULL,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_correias_correia (correia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maquinas (
  id CHAR(36) NOT NULL,
  numero INT NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  maquina VARCHAR(180) NOT NULL,
  modelo VARCHAR(180) NULL,
  n_alimentadores INT NULL,
  diametro DECIMAL(10,3) NULL,
  finura DECIMAL(10,3) NULL,
  disposicao_agulhas VARCHAR(255) NULL,
  producao_media DECIMAL(14,4) NULL,
  carga_agulhas JSON NULL,
  fio_id CHAR(36) NULL,
  data_fabricacao DATE NULL,
  correias JSON NULL,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_maquinas_numero (numero),
  KEY idx_maquinas_tipo (tipo),
  KEY idx_maquinas_fio (fio_id),
  CONSTRAINT fk_maquinas_fio
    FOREIGN KEY (fio_id) REFERENCES fios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
