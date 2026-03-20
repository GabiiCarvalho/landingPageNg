<?php
// router.php

// CORS — sempre primeiro
header("Access-Control-Allow-Origin: https://ng-express.netlify.app");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Responde preflight imediatamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . $uri;

// Serve arquivos estáticos (css, js, img, html, php)
if ($uri !== '/' && file_exists($file) && !is_dir($file)) {
    // Para arquivos PHP, inclui direto (mantém execução)
    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        include $file;
        exit();
    }
    // Arquivos estáticos — deixa o servidor servir
    return false;
}

// Rota padrão
include __DIR__ . '/index.html';