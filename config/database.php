<?php
header("Access-Control-Allow-Origin: https://ng-express.netlify.app");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$pdo = new PDO(
    "mysql:host=" . getenv('MYSQLHOST') . 
    ";port=" . getenv('MYSQLPORT') . 
    ";dbname=" . getenv('MYSQLDATABASE') . 
    ";charset=utf8mb4",
    getenv('MYSQLUSER'),
    getenv('MYSQLPASSWORD')
);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
?>