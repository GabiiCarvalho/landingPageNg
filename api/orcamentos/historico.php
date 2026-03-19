<?php
// api/orcamentos/historico.php
require_once '../../cors.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não está logado']);
    exit;
}

$usuarioId = $_SESSION['usuario_id'];

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