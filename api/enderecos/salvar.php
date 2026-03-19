<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';
session_start();

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não está logado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit;
}

$usuarioId = $_SESSION['usuario_id'];
$apelido = $data['apelido'] ?? '';
$endereco = $data['endereco'] ?? '';

if (empty($endereco)) {
    echo json_encode(['success' => false, 'message' => 'Endereço não pode estar vazio']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO enderecos_favoritos (usuario_id, nome_endereco, endereco_completo) VALUES (?, ?, ?)");
    $stmt->execute([$usuarioId, $apelido, $endereco]);
    
    echo json_encode(['success' => true, 'message' => 'Endereço salvo com sucesso!']);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao salvar endereço: ' . $e->getMessage()]);
}
?>