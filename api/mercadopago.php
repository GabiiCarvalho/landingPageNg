<?php
// api/mercadopago.php
require_once __DIR__ . '/config/database.php';

// Configuração do Mercado Pago
define('MP_ACCESS_TOKEN', 'APP_USR-460981285996431-032818-00692b024b5a6ec3db98a3e0645429d3-1651166060');

function criarPagamentoPIX($valor, $descricao, $convId, $emailCliente, $nomeCliente) {
    $url = 'https://api.mercadopago.com/v1/payments';
    
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
        'external_reference' => $convId
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
        'erro' => 'Erro ao criar pagamento: HTTP ' . $httpCode
    ];
}

function consultarStatusPagamento($paymentId) {
    $url = "https://api.mercadopago.com/v1/payments/{$paymentId}";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . MP_ACCESS_TOKEN
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFEYEER, false);
    
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