<?php
require_once __DIR__ . '/../../cors.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/database.php';
session_start();

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) { echo json_encode(['success' => false, 'message' => 'Dados inválidos']); exit; }

$email = $data['email'] ?? '';
$senha = $data['senha'] ?? '';

if (empty($email) || empty($senha)) {
    echo json_encode(['success' => false, 'message' => 'E-mail e senha são obrigatórios']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE email = ?");
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($senha, $admin['senha'])) {
        $_SESSION['admin_id']   = $admin['id'];
        $_SESSION['admin_nome'] = $admin['nome'];
        $_SESSION['admin_email']= $admin['email'];

        echo json_encode([
            'success' => true,
            'admin'   => [
                'id'    => $admin['id'],
                'nome'  => $admin['nome'],
                'email' => $admin['email'],
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'E-mail ou senha inválidos']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
}
?>