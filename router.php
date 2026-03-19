<?php
// router.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . $uri;

// Serve arquivos estáticos (css, js, img, html)
if ($uri !== '/' && file_exists($file) && !is_dir($file)) {
    return false;
}

// Rota padrão
if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
} else {
    include __DIR__ . '/index.php';
}