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

$nome = $data['nome'] ?? '';
$email = $data['email'] ?? '';
$telefone = $data['telefone'] ?? '';
$senha = $data['senha'] ?? '';

if (empty($nome) || empty($email) || empty($telefone) || empty($senha)) {
    echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'E-mail inválido']);
    exit;
}

if (strlen($senha) < 6) {
    echo json_encode(['success' => false, 'message' => 'A senha deve ter no mínimo 6 caracteres']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'E-mail já cadastrado']);
        exit;
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)");
    $stmt->execute([$nome, $email, $telefone, $senhaHash]);
    $usuarioId = $pdo->lastInsertId();

    $_SESSION['usuario_id'] = $usuarioId;
    $_SESSION['usuario_nome'] = $nome;
    $_SESSION['usuario_email'] = $email;
    $_SESSION['usuario_telefone'] = $telefone;

    echo json_encode([
        'success' => true,
        'message' => 'Cadastro realizado com sucesso!',
        'usuario' => [
            'id' => $usuarioId,
            'nome' => $nome,
            'email' => $email,
            'telefone' => $telefone
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
?>