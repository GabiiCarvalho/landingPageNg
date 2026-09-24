<?php
// api/migrations/run.php
// Roda todas as migrações pendentes.
// Execute uma vez: https://seu-backend/api/migrations/run.php?token=SEU_TOKEN

require_once __DIR__ . '/../config/database.php';

$TOKEN_ESPERADO = 'ngx-9f3a7b2c-migrate-2025';
$token = $_GET['token'] ?? '';
if ($token !== $TOKEN_ESPERADO) {
    http_response_code(403);
    exit(json_encode(['erro' => 'Token inválido']));
}

header('Content-Type: application/json');

$pasta = __DIR__;
$arquivos = glob($pasta . '/*.sql');
sort($arquivos);

$resultados = [];

foreach ($arquivos as $sqlFile) {
    $nome = basename($sqlFile);

    // Verifica se já foi rodada (tabela de controle)
    $pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        arquivo VARCHAR(255) UNIQUE,
        rodado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $stmt = $pdo->prepare("SELECT 1 FROM migrations WHERE arquivo = ?");
    $stmt->execute([$nome]);
    if ($stmt->fetch()) {
        $resultados[] = ['arquivo' => $nome, 'status' => 'já rodado'];
        continue;
    }

    // Executa o SQL
    $sql = file_get_contents($sqlFile);
    try {
        // Separa por ; para rodar statement por statement
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        foreach ($statements as $stmt_sql) {
            if ($stmt_sql === '' || str_starts_with($stmt_sql, '--')) continue;
            $pdo->exec($stmt_sql);
        }

        // Marca como rodado
        $pdo->prepare("INSERT INTO migrations (arquivo) VALUES (?)")->execute([$nome]);
        $resultados[] = ['arquivo' => $nome, 'status' => '✅ rodado com sucesso'];
    } catch (PDOException $e) {
        $resultados[] = ['arquivo' => $nome, 'status' => '❌ erro', 'detalhe' => $e->getMessage()];
    }
}

echo json_encode([
    'success' => true,
    'total'   => count($resultados),
    'detalhes' => $resultados
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);