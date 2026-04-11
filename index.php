<?php
// index.php - Roteador principal
header("Access-Control-Allow-Origin: https://ng-express.netlify.app");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Roteamento das APIs
if (strpos($path, '/api/') === 0) {
    $file = __DIR__ . $path;
    if (file_exists($file)) {
        require $file;
        exit();
    }
    
    // Tenta encontrar em subpastas
    $possible_files = [
        __DIR__ . '/api' . $path . '.php',
        __DIR__ . '/api/pix/' . basename($path) . '.php',
    ];
    
    foreach ($possible_files as $file) {
        if (file_exists($file)) {
            require $file;
            exit();
        }
    }
    
    http_response_code(404);
    echo json_encode(['success' => false, 'erro' => 'Endpoint não encontrado']);
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
        'php_version' => phpversion()
    ]);
    exit();
}

http_response_code(404);
echo json_encode(['success' => false, 'erro' => 'Página não encontrada']);
?>