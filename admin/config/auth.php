<?php
// admin/config/auth.php
session_start();

// Verificar se está logado como admin
if (!isset($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit;
}

// Função para verificar permissões
function checkAdminPermission($nivel = 1) {
    if ($_SESSION['admin_nivel'] < $nivel) {
        header('HTTP/1.0 403 Forbidden');
        echo 'Acesso negado';
        exit;
    }
}
?>