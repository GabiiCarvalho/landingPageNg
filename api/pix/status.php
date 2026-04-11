<?php
// api/pix/status.php
require_once __DIR__ . '/../mercadopago.php';

$paymentId = $_GET['paymentId'] ?? $_GET['id'] ?? '';

if (empty($paymentId)) {
    echo json_encode(['success' => false, 'erro' => 'ID do pagamento não informado']);
    exit;
}

$status = consultarStatusPagamento($paymentId);

if ($status['success']) {
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