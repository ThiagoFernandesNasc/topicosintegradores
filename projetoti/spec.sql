CREATE DATABASE IF NOT EXISTS sistema_voos_spec;
USE sistema_voos_spec;

-- Tabela principal de usuarios/autenticacao
CREATE TABLE IF NOT EXISTS usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('ADMIN','OPERADOR','CIA','PASSAGEIRO') NOT NULL DEFAULT 'OPERADOR',
  companhia VARCHAR(120) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LGPD: consentimentos
CREATE TABLE IF NOT EXISTS consentimento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  concedido TINYINT(1) NOT NULL,
  data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Auditoria de acoes de dados
CREATE TABLE IF NOT EXISTS log_acesso_dado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  acao VARCHAR(50) NOT NULL,
  entidade VARCHAR(50) NOT NULL,
  detalhes TEXT NULL,
  data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Seguranca de conta (2FA)
CREATE TABLE IF NOT EXISTS usuario_seguranca (
  usuario_id INT PRIMARY KEY,
  two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Sessoes de login
CREATE TABLE IF NOT EXISTS sessao_usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  jti VARCHAR(80) NOT NULL,
  user_agent VARCHAR(255) NULL,
  ip VARCHAR(80) NULL,
  ativa TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  revogada_em DATETIME NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Solicitacoes LGPD (exportacao/exclusao)
CREATE TABLE IF NOT EXISTS solicitacao_lgpd (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo VARCHAR(60) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ABERTA',
  detalhes TEXT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Indices recomendados para consultas comuns
CREATE INDEX idx_sessao_usuario_usuario_ativa_criado
  ON sessao_usuario(usuario_id, ativa, criado_em);
CREATE INDEX idx_solicitacao_lgpd_usuario_criado
  ON solicitacao_lgpd(usuario_id, criado_em);
CREATE INDEX idx_log_acesso_dado_usuario_data
  ON log_acesso_dado(usuario_id, data_hora);
