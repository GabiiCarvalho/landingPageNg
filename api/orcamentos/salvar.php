<?php
// api/orcamentos/salvar.php
require_once '../../cors.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
require_once '../../config/database.php';

// ── Verificar sessão ─────────────────────────────────────────────
if (!isset($_SESSION['usuario_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuário não está logado',
        'debug'   => 'session_id=' . session_id()
    ]);
    exit;
}

$usuarioId = $_SESSION['usuario_id'];

// ── Ler body ─────────────────────────────────────────────────────
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Body inválido ou vazio']);
    exit;
}

// ── Extrair campos ───────────────────────────────────────────────
$numeroPedido    = trim($data['numero_pedido']    ?? '');
$tipoVeiculo     = trim($data['tipo_veiculo']     ?? '');
$enderecoColeta  = trim($data['endereco_coleta']  ?? '');
$enderecoEntrega = trim($data['endereco_entrega'] ?? '');
$dimensoes       = trim($data['dimensoes']        ?? '');
$peso            = floatval($data['peso']         ?? 0);
$descricao       = trim($data['descricao']        ?? '');
$valorTotal      = floatval($data['valor_total']  ?? 0);

// ── Validar obrigatórios ─────────────────────────────────────────
if (empty($numeroPedido) || empty($tipoVeiculo) || empty($enderecoColeta) || empty($enderecoEntrega) || $valorTotal <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Campos obrigatórios faltando',
        'debug'   => compact('numeroPedido', 'tipoVeiculo', 'valorTotal')
    ]);
    exit;
}

// ── Decompor endereços em partes ─────────────────────────────────
// Nominatim retorna: "Rua X, 123, Bairro, Cidade, Estado, ..."
// A tabela tem colunas separadas: local_coleta, bairro_coleta, cidade_destino, etc.
$partesColeta  = array_map('trim', explode(',', $enderecoColeta));
$partesEntrega = array_map('trim', explode(',', $enderecoEntrega));

// local_coleta: rua + número (partes 0 e 1 se parte 1 for numérica)
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

// ── Verificar duplicata ──────────────────────────────────────────
try {
    $check = $pdo->prepare("SELECT id FROM historico_orcamentos WHERE numero_pedido = ?");
    $check->execute([$numeroPedido]);
    if ($check->fetch()) {
        echo json_encode(['success' => true, 'message' => 'Pedido já registrado']);
        exit;
    }
} catch (PDOException $e) {
    // ignora — tenta inserir mesmo assim
}

// ── INSERT usando as colunas REAIS da tabela ─────────────────────
// Estrutura confirmada pelo DESCRIBE:
// usuario_id | numero_pedido | tipo_veiculo |
// local_coleta | bairro_coleta | endereco_coleta |
// cidade_destino | bairro_entrega | endereco_entrega |
// dimensoes | peso | descricao | valor_total | status | data_orcamento
try {
    $stmt = $pdo->prepare("
        INSERT INTO historico_orcamentos (
            usuario_id,
            numero_pedido,
            tipo_veiculo,
            local_coleta,
            bairro_coleta,
            endereco_coleta,
            cidade_destino,
            bairro_entrega,
            endereco_entrega,
            dimensoes,
            peso,
            descricao,
            valor_total,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmado')
    ");

    $stmt->execute([
        $usuarioId,
        $numeroPedido,
        $tipoVeiculo,
        $localColeta,       // "Rua São Paulo, 312"
        $bairroColeta,      // "Areias"
        $enderecoColeta,    // endereço completo de coleta
        $cidadeDestino,     // "Camboriú"
        $bairroEntrega,     // "Centro"
        $enderecoEntrega,   // endereço completo de entrega
        $dimensoes,
        $peso,
        $descricao,
        $valorTotal
    ]);

    echo json_encode([
        'success'      => true,
        'message'      => 'Pedido salvo com sucesso!',
        'orcamento_id' => (int) $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro SQL: ' . $e->getMessage()
    ]);
}
?>