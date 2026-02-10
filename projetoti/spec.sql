CREATE DATABASE IF NOT EXISTS sistema_voos_spec;
USE sistema_voos_spec;

-- Usuário
CREATE TABLE usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('ADMIN','OPERADOR','CIA','VISUALIZADOR') NOT NULL DEFAULT 'OPERADOR',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consentimento LGPD
CREATE TABLE consentimento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  concedido TINYINT(1) NOT NULL,
  data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Log de acesso a dados
CREATE TABLE log_acesso_dado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  acao VARCHAR(50) NOT NULL,
  entidade VARCHAR(50) NOT NULL,
  detalhes TEXT NULL,
  data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

USE sistema_voos_spec;
SELECT id, nome, email, perfil, senha_hash FROM usuario;
SELECT * FROM log_acesso_dado;
