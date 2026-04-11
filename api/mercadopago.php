<?php
// api/mercadopago.php
require_once __DIR__ . '/../config/database.php';

// Configuração do Mercado Pago
define('MP_ACCESS_TOKEN', 'APP_USR-460981285996431-032818-00692b024b5a6ec3db98a3e0645429d3-1651166060');
define('MP_WEBHOOK_SECRET', '06611dddba6e420e383464cb08e693856ff24d9bfd4038b628ceaf41f6872c07');

function criarPagamentoPIX($valor, $descricao, $convId, $emailCliente, $nomeCliente) {
    $url = 'https://api.mercadopago.com/v1/payments';
    
    // Detectar URL base para webhook
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $baseUrl = $protocol . $host;
    
    // Se estiver no Netlify, usar URL do backend
    if (strpos($host, 'netlify.app') !== false) {
        $baseUrl = 'https://backendlp-4ds4.onrender.com';
    }
    
    $data = [
        'transaction_amount' => round($valor, 2),
        'description' => $descricao,
        'payment_method_id' => 'pix',
        'payer' => [
            'email' => $emailCliente,
            'first_name' => $nomeCliente,
            'last_name' => 'NGExpress',
            'identification' => [
                'type' => 'CPF',
                'number' => '00000000000'
            ]
        ],
        'external_reference' => $convId,
        'notification_url' => $baseUrl . '/api/pix/webhook.php'
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . MP_ACCESS_TOKEN,
        'X-Idempotency-Key: ' . uniqid()
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 201) {
        $result = json_decode($response, true);
        $pix = $result['point_of_interaction']['transaction_data'] ?? [];
        
        return [
            'success' => true,
            'paymentId' => $result['id'],
            'qrCode' => $pix['qr_code'] ?? '',
            'qrCodeBase64' => $pix['qr_code_base64'] ?? null
        ];
    }
    
    return [
        'success' => false,
        'erro' => 'Erro ao criar pagamento: HTTP ' . $httpCode,
        'response' => $response
    ];
}

function consultarStatusPagamento($paymentId) {
    $url = "https://api.mercadopago.com/v1/payments/{$paymentId}";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . MP_ACCESS_TOKEN
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        return [
            'success' => true,
            'status' => $result['status'],
            'valor' => $result['transaction_amount']
        ];
    }
    
    return [
        'success' => false,
        'erro' => 'Erro ao consultar status: HTTP ' . $httpCode
    ];
}
?>