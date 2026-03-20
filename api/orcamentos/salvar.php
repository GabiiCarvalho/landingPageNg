<?php
require_once __DIR__ . '/../../cors.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
require_once __DIR__ . '/../../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Body inválido ou vazio']);
    exit;
}

// Aceita usuario_id do body como fallback quando sessão PHP não persiste
$usuarioId = $_SESSION['usuario_id'] ?? intval($data['usuario_id'] ?? 0);

if (!$usuarioId) {
    echo json_encode(['success' => false, 'message' => 'Usuário não está logado']);
    exit;
}

$numeroPedido    = trim($data['numero_pedido']    ?? '');
$tipoVeiculo     = trim($data['tipo_veiculo']     ?? '');
$enderecoColeta  = trim($data['endereco_coleta']  ?? '');
$enderecoEntrega = trim($data['endereco_entrega'] ?? '');
$dimensoes       = trim($data['dimensoes']        ?? '');
$peso            = floatval($data['peso']         ?? 0);
$descricao       = trim($data['descricao']        ?? '');
$valorTotal      = floatval($data['valor_total']  ?? 0);

if (empty($numeroPedido) || empty($tipoVeiculo) || empty($enderecoColeta) || empty($enderecoEntrega) || $valorTotal <= 0) {
    echo json_encode(['success' => false, 'message' => 'Campos obrigatórios faltando']);
    exit;
}

$partesColeta  = array_map('trim', explode(',', $enderecoColeta));
$partesEntrega = array_map('trim', explode(',', $enderecoEntrega));

$localColeta = $partesColeta[0] ?? $enderecoColeta;
if (isset($partesColeta[1]) && preg_match('/^\d/', $partesColeta[1])) {
    $localColeta .= ', ' . $partesColeta[1];
    $bairroColeta  = $partesColeta[2] ?? '';
    $cidadeDestino = $partesEntrega[3] ?? ($partesEntrega[2] ?? '');
    $bairroEntrega = $partesEntrega[2] ?? '';
} else {
    $bairroColeta  = $partesColeta[1] ?? '';
    $cidadeDestino = $partesEntrega[2] ?? ($partesEntrega[1] ?? '');
    $bairroEntrega = $partesEntrega[1] ?? '';
}

try {
    $check = $pdo->prepare("SELECT id FROM historico_orcamentos WHERE numero_pedido = ?");
    $check->execute([$numeroPedido]);
    if ($check->fetch()) {
        echo json_encode(['success' => true, 'message' => 'Pedido já registrado']);
        exit;
    }
} catch (PDOException $e) {}

try {
    $stmt = $pdo->prepare("
        INSERT INTO historico_orcamentos (
            usuario_id, numero_pedido, tipo_veiculo,
            local_coleta, bairro_coleta, endereco_coleta,
            cidade_destino, bairro_entrega, endereco_entrega,
            dimensoes, peso, descricao, valor_total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmado')
    ");

    $stmt->execute([
        $usuarioId, $numeroPedido, $tipoVeiculo,
        $localColeta, $bairroColeta, $enderecoColeta,
        $cidadeDestino, $bairroEntrega, $enderecoEntrega,
        $dimensoes, $peso, $descricao, $valorTotal
    ]);

    echo json_encode([
        'success'      => true,
        'message'      => 'Pedido salvo com sucesso!',
        'orcamento_id' => (int) $pdo->lastInsertId()
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro SQL: ' . $e->getMessage()]);
}
?>