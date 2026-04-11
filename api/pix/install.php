<?php
// api/pix/install.php - Executar uma vez para criar as tabelas
require_once __DIR__ . '/../config/database.php';

$sql = "
-- Tabela principal de pagamentos PIX
CREATE TABLE IF NOT EXISTS pagamentos_pix (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(100) NOT NULL UNIQUE,
    conv_id VARCHAR(100),
    valor DECIMAL(10,2) NOT NULL,
    qr_code TEXT,
    qr_code_base64 TEXT,
    status ENUM('pending', 'approved', 'rejected', 'refunded', 'cancelled') DEFAULT 'pending',
    cliente_nome VARCHAR(100),
    cliente_email VARCHAR(100),
    cliente_telefone VARCHAR(20),
    descricao VARCHAR(255),
    payment_method VARCHAR(50) DEFAULT 'pix',
    external_reference VARCHAR(100),
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME ON UPDATE CURRENT_TIMESTAMP,
    data_aprovacao DATETIME,
    data_expiracao DATETIME,
    webhook_recebido TINYINT DEFAULT 0,
    INDEX idx_payment_id (payment_id),
    INDEX idx_conv_id (conv_id),
    INDEX idx_status (status),
    INDEX idx_cliente_email (cliente_email),
    INDEX idx_data_criacao (data_criacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para logs de webhook
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(100),
    tipo VARCHAR(50),
    payload JSON,
    status VARCHAR(20),
    data_recebimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payment_id (payment_id),
    INDEX idx_data_recebimento (data_recebimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para tentativas de pagamento
CREATE TABLE IF NOT EXISTS tentativas_pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conv_id VARCHAR(100),
    valor DECIMAL(10,2),
    payment_id VARCHAR(100),
    status VARCHAR(20),
    erro_mensagem TEXT,
    tentativa INT DEFAULT 1,
    data_tentativa DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conv_id (conv_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

try {
    $pdo->exec($sql);
    echo json_encode(['success' => true, 'message' => 'Tabelas criadas com sucesso!']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
}
?>