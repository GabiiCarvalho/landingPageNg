<?php
require_once '../../cors.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';
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
    // Verificar se o arquivo database.php existe
    if (!file_exists('../../config/database.php')) {
        // Modo desenvolvimento - login simulado
        if ($email === 'teste@teste.com' && $senha === '123456') {
            $_SESSION['usuario_id'] = 1;
            $_SESSION['usuario_nome'] = 'Usuário Teste';
            $_SESSION['usuario_email'] = $email;
            $_SESSION['usuario_telefone'] = '(47) 99999-9999';
            
            echo json_encode([
                'success' => true,
                'message' => 'Login realizado (modo desenvolvimento)!',
                'usuario' => [
                    'id' => 1,
                    'nome' => 'Usuário Teste',
                    'email' => $email,
                    'telefone' => '(47) 99999-9999'
                ]
            ]);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'Use: teste@teste.com / 123456']);
            exit;
        }
    }
    
    // Buscar usuário no banco
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();
    
    if ($usuario && password_verify($senha, $usuario['senha'])) {
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        $_SESSION['usuario_email'] = $usuario['email'];
        $_SESSION['usuario_telefone'] = $usuario['telefone'];
        
        echo json_encode([
            'success' => true,
            'message' => 'Login realizado com sucesso!',
            'usuario' => [
                'id' => $usuario['id'],
                'nome' => $usuario['nome'],
                'email' => $usuario['email'],
                'telefone' => $usuario['telefone']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'E-mail ou senha inválidos']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao fazer login: ' . $e->getMessage()]);
}
?>