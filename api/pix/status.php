<?php
// api/pix/status.php

// 🔥 ADICIONE ESTES HEADERS CORS 🔥
header('Access-Control-Allow-Origin: https://ng-express.netlify.app');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../mercadopago.php';

$paymentId = $_GET['paymentId'] ?? $_POST['paymentId'] ?? null;

if (!$paymentId) {
    echo json_encode(['success' => false, 'erro' => 'paymentId é obrigatório']);
    exit;
}

$resultado = consultarPagamentoPIX($paymentId);

echo json_encode($resultado);