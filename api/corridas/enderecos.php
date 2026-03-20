<?php
// Caminho: /api/corridas/enderecos.php
require_once(__DIR__ . '/../../cors.php');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';
session_start();

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não está logado']);
    exit;
}

$usuarioId = $_SESSION['usuario_id'];

try {
    $stmt = $pdo->prepare("SELECT id, nome_endereco, endereco_completo FROM enderecos_favoritos WHERE usuario_id = ? ORDER BY nome_endereco");
    $stmt->execute([$usuarioId]);
    $enderecos = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'enderecos' => $enderecos
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao buscar endereços']);
}
?>