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
$nome      = trim($data['nome'] ?? '');
$telefone  = trim($data['telefone'] ?? '');
$senha     = $data['senha'] ?? null;

if (empty($nome)) {
    echo json_encode(['success' => false, 'message' => 'Nome não pode estar vazio']);
    exit;
}

try {
    if ($senha && strlen($senha) >= 6) {
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE usuarios SET nome = ?, telefone = ?, senha = ? WHERE id = ?");
        $stmt->execute([$nome, $telefone, $hash, $usuarioId]);
    } else {
        $stmt = $pdo->prepare("UPDATE usuarios SET nome = ?, telefone = ? WHERE id = ?");
        $stmt->execute([$nome, $telefone, $usuarioId]);
    }

    // Atualizar sessão
    $_SESSION['usuario_nome']     = $nome;
    $_SESSION['usuario_telefone'] = $telefone;

    echo json_encode(['success' => true, 'message' => 'Perfil atualizado com sucesso!']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar: ' . $e->getMessage()]);
}
?>