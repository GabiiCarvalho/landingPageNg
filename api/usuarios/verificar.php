<?php
require_once(__DIR__ . '/../../cors.php');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

// Verificar se usuário está logado
if (isset($_SESSION['usuario_id']) && isset($_SESSION['usuario_nome'])) {
    echo json_encode([
        'logado' => true,
        'usuario' => [
            'id' => $_SESSION['usuario_id'],
            'nome' => $_SESSION['usuario_nome'],
            'email' => $_SESSION['usuario_email'] ?? '',
            'telefone' => $_SESSION['usuario_telefone'] ?? ''
        ]
    ]);
} else {
    echo json_encode([
        'logado' => false,
        'usuario' => null
    ]);
}
?>