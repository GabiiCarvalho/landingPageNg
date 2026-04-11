<?php
// api/pix/status.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../mercadopago.php';

$paymentId = $_GET['paymentId'] ?? $_GET['id'] ?? '';

if (empty($paymentId)) {
    echo json_encode(['success' => false, 'erro' => 'ID do pagamento não informado']);
    exit;
}

// Buscar status no Mercado Pago
$status = consultarStatusPagamento($paymentId);

if ($status['success']) {
    // Atualizar status no banco
    try {
        $stmt = $pdo->prepare("
            UPDATE pagamentos_pix 
            SET status = ?, data_atualizacao = NOW() 
            WHERE payment_id = ?
        ");
        $stmt->execute([$status['status'], $paymentId]);
        
        // Se aprovado, atualizar pedido
        if ($status['status'] === 'approved') {
            // Buscar o conv_id
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
        }
    } catch (PDOException $e) {
        error_log("Erro ao atualizar status: " . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'status' => $status['status'],
        'paymentId' => $paymentId,
        'valor' => $status['valor'] ?? null
    ]);
} else {
    echo json_encode([
        'success' => false,
        'status' => 'error',
        'erro' => $status['erro']
    ]);
}
?>