<?php
require_once __DIR__ . '/../../cors.php';
header('Content-Type: application/json');
session_start();

$adminId = $_SESSION['admin_id'] ?? intval($_GET['aid'] ?? 0);

if ($adminId) {
    echo json_encode([
        'logado' => true,
        'admin'  => [
            'id'    => $_SESSION['admin_id']    ?? $adminId,
            'nome'  => $_SESSION['admin_nome']  ?? '',
            'email' => $_SESSION['admin_email'] ?? '',
        ]
    ]);
} else {
    echo json_encode(['logado' => false, 'admin' => null]);
}
?>