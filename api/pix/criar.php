<?php
// api/pix/criar.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../mercadopago.php';

session_start();

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'erro' => 'Dados inválidos']);
    exit;
}

$convId = $data['convId'] ?? 'pedido_' . date('Ymd_His');
$valor = floatval($data['valor'] ?? 0);
$nomeCliente = trim($data['nomeCliente'] ?? 'Cliente');
$descricao = trim($data['descricao'] ?? "Entrega N&G Express #" . substr($convId, -6));

if ($valor <= 0) {
    echo json_encode(['success' => false, 'erro' => 'Valor do pagamento é obrigatório']);
    exit;
}

// Obter e-mail do usuário logado
$emailCliente = 'cliente@ngexpress.com.br';
if (isset($_SESSION['usuario_id'])) {
    try {
        $stmt = $pdo->prepare("SELECT email FROM usuarios WHERE id = ?");
        $stmt->execute([$_SESSION['usuario_id']]);
        $user = $stmt->fetch();
        if ($user && !empty($user['email'])) {
            $emailCliente = $user['email'];
        }
    } catch (PDOException $e) {
        // Usar email padrão
    }
}

// Criar pagamento no Mercado Pago
$resultado = criarPagamentoPIX($valor, $descricao, $convId, $emailCliente, $nomeCliente);

if ($resultado['success']) {
    // Salvar no banco de dados
    try {
        $stmt = $pdo->prepare("
            INSERT INTO pagamentos_pix (
                payment_id, conv_id, valor, qr_code, qr_code_base64, 
                status, cliente_nome, cliente_email, data_criacao
            ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NOW())
        ");
        $stmt->execute([
            $resultado['paymentId'],
            $convId,
            $valor,
            $resultado['qrCode'],
            $resultado['qrCodeBase64'],
            $nomeCliente,
            $emailCliente
        ]);
    } catch (PDOException $e) {
        error_log("Erro ao salvar pagamento: " . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'paymentId' => $resultado['paymentId'],
        'qrCode' => $resultado['qrCode'],
        'qrCodeBase64' => $resultado['qrCodeBase64'],
        'valor' => $valor
    ]);
} else {
    echo json_encode([
        'success' => false,
        'erro' => $resultado['erro']
    ]);
}
?>