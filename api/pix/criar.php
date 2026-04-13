<?php
// api/pix/criar.php

header('Content-Type: application/json');

require_once __DIR__ . '/../mercadopago.php';
// mercadopago.php já inclui config/database.php, então $pdo está disponível aqui

session_start();

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    echo json_encode(['success' => false, 'erro' => 'Dados inválidos']);
    exit;
}

$convId      = $data['convId']      ?? 'pedido_' . date('Ymd_His');
$valor       = floatval($data['valor'] ?? 0);
$nomeCliente = trim($data['nomeCliente'] ?? 'Cliente');
$descricao   = trim($data['descricao']   ?? "Entrega N&G Express #" . substr($convId, -6));

if ($valor <= 0) {
    echo json_encode(['success' => false, 'erro' => 'Valor do pagamento é obrigatório']);
    exit;
}

// Obter e-mail do usuário logado
// CORRIGIDO: $pdo já está no escopo global (não precisa de 'global $pdo' dentro de include)
$emailCliente = 'cliente@ngexpress.com.br';
if (isset($_SESSION['usuario_id'])) {
    try {
        global $pdo;
        $stmt = $pdo->prepare("SELECT email FROM usuarios WHERE id = ?");
        $stmt->execute([$_SESSION['usuario_id']]);
        $user = $stmt->fetch();
        if ($user && !empty($user['email'])) {
            $emailCliente = $user['email'];
        }
    } catch (PDOException $e) {
        error_log("Aviso: não foi possível buscar e-mail do usuário: " . $e->getMessage());
    }
}

$resultado = criarPagamentoPIX($valor, $descricao, $convId, $emailCliente, $nomeCliente);

if ($resultado['success']) {
    // Salvar no banco (opcional mas recomendado para rastreabilidade)
    try {
        require_once __DIR__ . '/database.php';
        salvarPagamentoPIX(
            $resultado['paymentId'],
            $convId,
            $valor,
            $resultado['qrCode'],
            $resultado['qrCodeBase64'],
            $nomeCliente,
            $emailCliente
        );
    } catch (Exception $e) {
        error_log("Aviso: não foi possível salvar pagamento no banco: " . $e->getMessage());
    }

    echo json_encode([
        'success'      => true,
        'paymentId'    => $resultado['paymentId'],
        'qrCode'       => $resultado['qrCode'],
        'qrCodeBase64' => $resultado['qrCodeBase64'],
        'valor'        => $valor,
    ]);
} else {
    echo json_encode([
        'success' => false,
        'erro'    => $resultado['erro'],
    ]);
}