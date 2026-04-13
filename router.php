<?php
// router.php - Roteador para PHP built-in server

$allowedOrigin = 'https://ng-express.netlify.app';
$origin        = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin === $allowedOrigin) {
    header("Access-Control-Allow-Origin: $allowedOrigin");
} else {
    header("Access-Control-Allow-Origin: $allowedOrigin");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$request_uri = $_SERVER['REQUEST_URI'];
$path        = parse_url($request_uri, PHP_URL_PATH);

error_log("Requisição: " . $_SERVER['REQUEST_METHOD'] . " " . $path);

// Roteamento das APIs
if (strpos($path, '/api/') === 0) {
    $file = __DIR__ . $path;

    if (file_exists($file) && !is_dir($file)) {
        require $file;
        exit();
    }

    $file_php = $file . '.php';
    if (file_exists($file_php)) {
        require $file_php;
        exit();
    }

    $possible = [
        __DIR__ . '/api/pix/' . basename($path) . '.php',
        __DIR__ . '/api/pix/' . basename($path),
    ];
    foreach ($possible as $f) {
        if (file_exists($f)) {
            require $f;
            exit();
        }
    }

    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'erro' => 'Endpoint não encontrado: ' . $path]);
    exit();
}

if ($path === '/setup.php') {
    require __DIR__ . '/setup.php';
    exit();
}

if ($path === '/health' || $path === '/') {
    header('Content-Type: application/json');
    echo json_encode([
        'status'      => 'online',
        'timestamp'   => date('Y-m-d H:i:s'),
        'environment' => 'Railway',
        'php_version' => phpversion(),
        'mp_token'    => getenv('MP_ACCESS_TOKEN') ? 'configurado' : 'NAO CONFIGURADO',
        'endpoints'   => [
            'POST /api/pix/criar.php',
            'GET  /api/pix/status.php?paymentId=123',
            'POST /api/pix/webhook.php',
            'GET  /setup.php',
            'GET  /health',
        ],
    ]);
    exit();
}

$file = __DIR__ . $path;
if (file_exists($file) && !is_dir($file)) {
    return false;
}

http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'erro' => 'Página não encontrada: ' . $path]);