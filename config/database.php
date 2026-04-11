<?php
// api/config/database.php
header("Access-Control-Allow-Origin: https://ng-express.netlify.app");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuração do banco de dados via variáveis de ambiente do Railway
$host = getenv('MYSQLHOST') ?: 'mysql.railway.internal';
$port = getenv('MYSQLPORT') ?: '3306';
$dbname = getenv('MYSQLDATABASE') ?: 'railway';
$username = getenv('MYSQLUSER') ?: 'root';
$password = getenv('MYSQLPASSWORD') ?: '';

// Log para debug
error_log("Conectando ao MySQL: host=$host, port=$port, db=$dbname, user=$username");

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_PERSISTENT => true,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]
    );
    error_log("✅ Conexão com MySQL estabelecida com sucesso!");
} catch(PDOException $e) {
    error_log("❌ Erro de conexão com banco: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erro de conexão com o banco de dados',
        'error' => $e->getMessage()
    ]);
    exit;
}
?>