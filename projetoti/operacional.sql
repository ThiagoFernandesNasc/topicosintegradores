CREATE DATABASE IF NOT EXISTS sistema_voos;
USE sistema_voos;

-- Aeroportos
CREATE TABLE aeroporto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cidade VARCHAR(80) NOT NULL,
  estado CHAR(2) NOT NULL
);

-- Voos
CREATE TABLE voo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_voo VARCHAR(10) NOT NULL UNIQUE,
  companhia VARCHAR(100) NOT NULL,
  origem_id INT NOT NULL,
  destino_id INT NOT NULL,
  horario_previsto DATETIME NOT NULL,
  status ENUM('PREVISTO','EM_VOO','ATRASADO','CANCELADO','CONCLUIDO') DEFAULT 'PREVISTO',
  preco_medio DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (origem_id) REFERENCES aeroporto(id),
  FOREIGN KEY (destino_id) REFERENCES aeroporto(id)
);

-- Tarifas
CREATE TABLE tarifa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voo_id INT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  quantidade INT NOT NULL,
  FOREIGN KEY (voo_id) REFERENCES voo(id)
);

INSERT INTO aeroporto (nome, cidade, estado) VALUES
('Aeroporto de São Paulo', 'São Paulo', 'SP'),
('Aeroporto do Rio', 'Rio de Janeiro', 'RJ');

INSERT INTO voo (numero_voo, companhia, origem_id, destino_id, horario_previsto, status, preco_medio) VALUES
('LA1234', 'LATAM', 1, 2, '2026-02-08 10:00:00', 'PREVISTO', 500.00),
('AZ5678', 'Azul', 2, 1, '2026-02-08 15:30:00', 'EM_VOO', 450.00);
