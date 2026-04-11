<?php
// api/pix/webhook.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../mercadopago.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

error_log("Webhook PIX recebido: " . $input);

if (!isset($data['type']) || $data['type'] !== 'payment') {
    http_response_code(200);
    echo json_encode(['message' => 'Ignorado']);
    exit;
}

$paymentId = $data['data']['id'] ?? null;

if (!$paymentId) {
    http_response_code(200);
    echo json_encode(['message' => 'Payment ID não encontrado']);
    exit;
}

// Consultar status
$status = consultarStatusPagamento($paymentId);

if ($status['success'] && $status['status'] === 'approved') {
    try {
        $stmt = $pdo->prepare("
            UPDATE pagamentos_pix 
            SET status = 'approved', data_aprovacao = NOW(), data_atualizacao = NOW() 
            WHERE payment_id = ?
        ");
        $stmt->execute([$paymentId]);
        
        // Buscar conv_id
        $stmt = $pdo->prepare("SELECT conv_id FROM pagamentos_pix WHERE payment_id = ?");
        $stmt->execute([$paymentId]);
        $pagamento = $stmt->fetch();
        
        if ($pagamento && !empty($pagamento['conv_id'])) {
            $stmt = $pdo->prepare("
                UPDATE historico_orcamentos 
                SET status = 'pago', data_pagamento = NOW() 
                WHERE numero_pedido = ?
            ");
            $stmt->execute([$pagamento['conv_id']]);
        }
        
        error_log("✅ Pagamento PIX aprovado: $paymentId");
    } catch (PDOException $e) {
        error_log("Erro no webhook: " . $e->getMessage());
    }
}

http_response_code(200);
echo json_encode(['message' => 'Webhook processado']);
?>