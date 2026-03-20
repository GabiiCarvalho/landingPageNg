<?php
require_once __DIR__ . '/../../cors.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/database.php';
session_start();

$adminId = $_SESSION['admin_id'] ?? intval($_GET['aid'] ?? 0);
if (!$adminId) {
    echo json_encode(['success' => false, 'message' => 'Acesso negado']);
    exit;
}

try {
    // Total de corridas
    $totalCorridas = $pdo->query("SELECT COUNT(*) FROM historico_orcamentos")->fetchColumn();

    // Total faturado
    $totalFaturado = $pdo->query("SELECT COALESCE(SUM(valor_total), 0) FROM historico_orcamentos")->fetchColumn();

    // Total de usuários
    $totalUsuarios = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();

    // Corridas por veículo
    $porVeiculo = $pdo->query("SELECT tipo_veiculo, COUNT(*) as total FROM historico_orcamentos GROUP BY tipo_veiculo")->fetchAll(PDO::FETCH_ASSOC);

    // Últimas 50 corridas com nome do usuário
    $corridas = $pdo->query("
        SELECT
            h.id, h.numero_pedido, h.tipo_veiculo,
            h.endereco_coleta, h.endereco_entrega,
            h.valor_total, h.status, h.data_orcamento,
            u.nome AS usuario_nome, u.email AS usuario_email, u.telefone AS usuario_telefone
        FROM historico_orcamentos h
        LEFT JOIN usuarios u ON u.id = h.usuario_id
        ORDER BY h.data_orcamento DESC
        LIMIT 50
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Top usuários
    $topUsuarios = $pdo->query("
        SELECT
            u.nome, u.email, u.telefone,
            COUNT(h.id) as total_pedidos,
            COALESCE(SUM(h.valor_total), 0) as total_gasto
        FROM usuarios u
        LEFT JOIN historico_orcamentos h ON h.usuario_id = u.id
        GROUP BY u.id
        ORDER BY total_pedidos DESC
        LIMIT 10
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'        => true,
        'totalCorridas'  => (int) $totalCorridas,
        'totalFaturado'  => (float) $totalFaturado,
        'totalUsuarios'  => (int) $totalUsuarios,
        'porVeiculo'     => $porVeiculo,
        'corridas'       => $corridas,
        'topUsuarios'    => $topUsuarios,
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
}
?>