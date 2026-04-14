<?php
// chat-session.php
// Inclua este arquivo no header do seu site (index.html -> index.php ou via include)
// Ele verifica a sessão PHP e injeta os dados do usuário para o chat widget

session_start();

// Retorna JSON se chamado via AJAX
if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
    header('Content-Type: application/json');
    if (isset($_SESSION['usuario']) && !empty($_SESSION['usuario']['id'])) {
        echo json_encode([
            'logado'  => true,
            'id'      => $_SESSION['usuario']['id'],
            'nome'    => $_SESSION['usuario']['nome']    ?? 'Cliente',
            'email'   => $_SESSION['usuario']['email']   ?? '',
            'telefone'=> $_SESSION['usuario']['telefone'] ?? '',
        ]);
    } else {
        echo json_encode(['logado' => false]);
    }
    exit;
}

// Se chamado via include, injeta variável JS na página
if (isset($_SESSION['usuario']) && !empty($_SESSION['usuario']['id'])) {
    $u = $_SESSION['usuario'];
    echo '<script>';
    echo 'window.__NG_USER__ = ' . json_encode([
        'logado'   => true,
        'id'       => $u['id'],
        'nome'     => $u['nome']     ?? 'Cliente',
        'email'    => $u['email']    ?? '',
        'telefone' => $u['telefone'] ?? '',
    ]) . ';';
    echo '</script>';
} else {
    echo '<script>window.__NG_USER__ = { logado: false };</script>';
}
?>