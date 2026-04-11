<?php
// setup.php - Executar UMA VEZ para criar as tabelas
require_once __DIR__ . '/api/config/database.php';

header("Access-Control-Allow-Origin: https://ng-express.netlify.app");
header("Content-Type: application/json; charset=UTF-8");

$sqls = [
    "CREATE TABLE IF NOT EXISTS pagamentos_pix (
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
        INDEX idx_cliente_email (cliente_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    
    "CREATE TABLE IF NOT EXISTS webhook_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payment_id VARCHAR(100),
        tipo VARCHAR(50),
        payload JSON,
        status VARCHAR(20),
        data_recebimento DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_payment_id (payment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
];

$results = [];
foreach ($sqls as $sql) {
    try {
        $pdo->exec($sql);
        $results[] = ['sql' => substr($sql, 0, 80) . '...', 'status' => '✅ OK'];
    } catch (PDOException $e) {
        $results[] = ['sql' => substr($sql, 0, 80) . '...', 'status' => '❌ Erro: ' . $e->getMessage()];
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Setup executado',
    'database' => [
        'host' => getenv('MYSQLHOST') ?: 'não definido',
        'database' => getenv('MYSQLDATABASE') ?: 'não definido',
        'user' => getenv('MYSQLUSER') ?: 'não definido',
        'connected' => true
    ],
    'results' => $results
], JSON_PRETTY_PRINT);
?>