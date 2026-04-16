<?php
// api/health.php

// Headers CORS
header('Access-Control-Allow-Origin: https://seu-site.netlify.app');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode([
    'success' => true,
    'status' => 'online',
    'message' => 'API N&G Express está funcionando!',
    'timestamp' => date('Y-m-d H:i:s')
]);