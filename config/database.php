<?php
// api/config/database.php

// CORS só deve ser emitido uma vez; o router.php já cuida disso,
// mas mantemos aqui como fallback para chamadas diretas.
if (!headers_sent()) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = 'https://ng-express.netlify.app';
    if ($origin === $allowed || empty($origin)) {
        header("Access-Control-Allow-Origin: $allowed");
    }
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host     = getenv('MYSQLHOST')     ?: 'mysql.railway.internal';
$port     = getenv('MYSQLPORT')     ?: '3306';
$dbname   = getenv('MYSQLDATABASE') ?: 'railway';
$username = getenv('MYSQLUSER')     ?: 'root';
$password = getenv('MYSQLPASSWORD') ?: '';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_PERSISTENT         => false, // evita conexões zumbi no Railway
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Erro de conexão com o banco de dados',
        'error'   => $e->getMessage(),
    ]);
    exit;
}