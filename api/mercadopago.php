<?php
// api/mercadopago.php

require_once __DIR__ . '/config/database.php';

// Token lido via variável de ambiente (configure no Railway Dashboard)
// Nunca commite o token real no código-fonte!
$mpToken = getenv('MP_ACCESS_TOKEN');
if (!$mpToken) {
    error_log("ERRO CRÍTICO: MP_ACCESS_TOKEN não definido nas variáveis de ambiente");
}
define('MP_ACCESS_TOKEN', $mpToken ?: '');

function criarPagamentoPIX($valor, $descricao, $convId, $emailCliente, $nomeCliente) {
    $url  = 'https://api.mercadopago.com/v1/payments';
    $body = [
        'transaction_amount' => round((float)$valor, 2),
        'description'        => $descricao,
        'payment_method_id'  => 'pix',
        'payer'              => [
            'email'          => $emailCliente,
            'first_name'     => $nomeCliente,
            'last_name'      => 'NGExpress',
            'identification' => [
                'type'   => 'CPF',
                'number' => '00000000000',
            ],
        ],
        'external_reference' => $convId,
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_SSL_VERIFYPEER => true,   // era CURLOPT_SSL_VERIFEYEER (typo)
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . MP_ACCESS_TOKEN,
            'X-Idempotency-Key: ' . uniqid('ng_', true),
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        error_log("cURL erro ao criar PIX: $curlErr");
        return ['success' => false, 'erro' => "Erro de rede: $curlErr"];
    }

    if ($httpCode === 201) {
        $result = json_decode($response, true);
        $pix    = $result['point_of_interaction']['transaction_data'] ?? [];
        return [
            'success'       => true,
            'paymentId'     => $result['id'],
            'qrCode'        => $pix['qr_code']        ?? '',
            'qrCodeBase64'  => $pix['qr_code_base64'] ?? null,
        ];
    }

    $detail = json_decode($response, true);
    error_log("MP erro $httpCode: " . json_encode($detail));
    return [
        'success' => false,
        'erro'    => 'Erro Mercado Pago HTTP ' . $httpCode . ': ' . ($detail['message'] ?? $response),
    ];
}

function consultarStatusPagamento($paymentId) {
    $url = "https://api.mercadopago.com/v1/payments/{$paymentId}";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . MP_ACCESS_TOKEN,
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return ['success' => false, 'erro' => "Erro de rede: $curlErr"];
    }

    if ($httpCode === 200) {
        $result = json_decode($response, true);
        return [
            'success' => true,
            'status'  => $result['status'],
            'valor'   => $result['transaction_amount'],
        ];
    }

    return ['success' => false, 'erro' => "HTTP $httpCode ao consultar status"];
}