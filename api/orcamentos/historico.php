<?php
require_once __DIR__ . '/../../cors.php';
header('Content-Type: application/json');

session_start();
require_once __DIR__ . '/../../config/database.php';

// Aceita uid via GET como fallback quando sessão PHP não persiste
$usuarioId = $_SESSION['usuario_id'] ?? intval($_GET['uid'] ?? 0);

if (!$usuarioId) {
    echo json_encode(['success' => false, 'message' => 'Usuário não está logado']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT
            id,
            numero_pedido,
            tipo_veiculo,
            endereco_coleta,
            endereco_entrega,
            local_coleta,
            bairro_coleta,
            cidade_destino,
            bairro_entrega,
            dimensoes,
            peso,
            descricao,
            valor_total,
            status,
            data_orcamento
        FROM historico_orcamentos
        WHERE usuario_id = ?
        ORDER BY data_orcamento DESC
        LIMIT 100
    ");
    $stmt->execute([$usuarioId]);
    $orcamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'    => true,
        'orcamentos' => $orcamentos,
        'total'      => count($orcamentos)
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao buscar histórico: ' . $e->getMessage()
    ]);
}
?>