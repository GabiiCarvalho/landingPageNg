<?php
header("Access-Control-Allow-Origin: https://ng-express.netlify.app");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . $uri;

if (file_exists($file) && !is_dir($file)) {
    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        include $file;
        exit();
    }
    return false;
}

include __DIR__ . '/index.html';