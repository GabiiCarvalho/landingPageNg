<?php
// router.php - Roteador para PHP built-in server

// Configurar CORS
header("Access-Control-Allow-Origin: https://ng-express.netlify.app");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Log para debug
error_log("Requisição: " . $path);

// Roteamento das APIs
if (strpos($path, '/api/') === 0) {
    // Tenta encontrar o arquivo
    $file = __DIR__ . $path;
    if (file_exists($file) && !is_dir($file)) {
        require $file;
        exit();
    }
    
    // Tenta com .php
    $file_php = $file . '.php';
    if (file_exists($file_php)) {
        require $file_php;
        exit();
    }
    
    // Busca em subpastas
    $possible_files = [
        __DIR__ . '/api/pix/' . basename($path) . '.php',
        __DIR__ . '/api/pix/' . basename($path),
    ];
    
    foreach ($possible_files as $file) {
        if (file_exists($file)) {
            require $file;
            exit();
        }
    }
    
    http_response_code(404);
    echo json_encode(['success' => false, 'erro' => 'Endpoint não encontrado: ' . $path]);
    exit();
}

// Setup (criação de tabelas)
if ($path === '/setup.php') {
    require __DIR__ . '/setup.php';
    exit();
}

// Health check
if ($path === '/health' || $path === '/') {
    echo json_encode([
        'status' => 'online',
        'timestamp' => date('Y-m-d H:i:s'),
        'environment' => 'Railway',
        'php_version' => phpversion(),
        'endpoints' => [
            'POST /api/pix/criar.php',
            'GET /api/pix/status.php?paymentId=123',
            'GET /setup.php'
        ]
    ]);
    exit();
}

// Se o arquivo existe, serve diretamente
$file = __DIR__ . $path;
if (file_exists($file) && !is_dir($file)) {
    return false;
}

http_response_code(404);
echo json_encode(['success' => false, 'erro' => 'Página não encontrada: ' . $path]);
?>