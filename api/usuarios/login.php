<?php
require_once __DIR__ . '/../../cors.php';
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/database.php';
session_start();

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit;
}

$email = $data['email'] ?? '';
$senha = $data['senha'] ?? '';

if (empty($email) || empty($senha)) {
    echo json_encode(['success' => false, 'message' => 'E-mail e senha são obrigatórios']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if ($usuario && password_verify($senha, $usuario['senha'])) {
        $_SESSION['usuario_id']       = $usuario['id'];
        $_SESSION['usuario_nome']     = $usuario['nome'];
        $_SESSION['usuario_email']    = $usuario['email'];
        $_SESSION['usuario_telefone'] = $usuario['telefone'];

        echo json_encode([
            'success' => true,
            'usuario' => [
                'id'       => $usuario['id'],
                'nome'     => $usuario['nome'],
                'email'    => $usuario['email'],
                'telefone' => $usuario['telefone']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'E-mail ou senha inválidos']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
}
?>