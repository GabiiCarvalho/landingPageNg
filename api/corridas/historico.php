<?php
// Caminho: /api/orcamentos/historico.php
require_once '../../cors.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';
session_start();

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não está logado']);
    exit;
}

$usuarioId = $_SESSION['usuario_id'];

try {
    $stmt = $pdo->prepare("
        SELECT * FROM historico_orcamentos 
        WHERE usuario_id = ? 
        ORDER BY data_orcamento DESC 
        LIMIT 50
    ");
    $stmt->execute([$usuarioId]);
    $orcamentos = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'orcamentos' => $orcamentos
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao buscar histórico']);
}
?>