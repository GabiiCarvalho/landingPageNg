<?php
require_once 'config/auth.php';
require_once '../config/database.php';

// Buscar estatísticas
$stats = [];

// Total de usuários
$stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios");
$stats['usuarios'] = $stmt->fetch()['total'];

// Total de orçamentos
$stmt = $pdo->query("SELECT COUNT(*) as total FROM historico_orcamentos");
$stats['orcamentos'] = $stmt->fetch()['total'];

// Valor total de orçamentos
$stmt = $pdo->query("SELECT SUM(valor_total) as total FROM historico_orcamentos");
$stats['valor_total'] = $stmt->fetch()['total'] ?? 0;

// Orçamentos hoje
$stmt = $pdo->query("SELECT COUNT(*) as total FROM historico_orcamentos WHERE DATE(data_orcamento) = CURDATE()");
$stats['orcamentos_hoje'] = $stmt->fetch()['total'];

// Últimos orçamentos
$stmt = $pdo->query("
    SELECT ho.*, u.nome 
    FROM historico_orcamentos ho 
    JOIN usuarios u ON ho.usuario_id = u.id 
    ORDER BY ho.data_orcamento DESC 
    LIMIT 10
");
$ultimos_orcamentos = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Admin - N&G EXPRESS</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="../css/styles.css">
    <style>
        .admin-header {
            background: linear-gradient(135deg, var(--secondary-color), #001a33);
            color: white;
            padding: 20px 0;
            margin-bottom: 30px;
        }
        .admin-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        .admin-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: var(--box-shadow);
            border-left: 4px solid var(--primary-color);
        }
        .stat-icon {
            font-size: 2rem;
            color: var(--primary-color);
            margin-bottom: 10px;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: var(--secondary-color);
            margin: 10px 0;
        }
        .stat-label {
            color: var(--gray-600);
            font-size: 0.9rem;
        }
        .admin-menu {
            background: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 30px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            box-shadow: var(--box-shadow);
        }
        .admin-menu a {
            padding: 10px 20px;
            background: var(--gray-100);
            border-radius: 8px;
            color: var(--secondary-color);
            font-weight: 600;
            transition: var(--transition);
            text-decoration: none;
        }
        .admin-menu a:hover,
        .admin-menu a.active {
            background: var(--primary-color);
            color: white;
        }
        .admin-table {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: var(--box-shadow);
            overflow-x: auto;
        }
        .admin-table table {
            width: 100%;
            border-collapse: collapse;
        }
        .admin-table th {
            background: var(--gray-100);
            padding: 12px;
            text-align: left;
            color: var(--secondary-color);
            font-weight: 600;
        }
        .admin-table td {
            padding: 12px;
            border-bottom: 1px solid var(--gray-200);
        }
        .admin-table tr:hover {
            background: var(--gray-100);
        }
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .badge-success {
            background: #d4edda;
            color: #155724;
        }
        .user-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .logout-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            text-decoration: none;
            transition: var(--transition);
        }
        .logout-btn:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <div class="admin-header">
        <div class="admin-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="user-info">
                    <i class="bi bi-shield-lock" style="font-size: 2rem;"></i>
                    <div>
                        <h1 style="font-size: 1.8rem; margin: 0;">Painel Administrativo</h1>
                        <p style="margin: 5px 0 0; opacity: 0.8;">Bem-vindo, <?php echo $_SESSION['admin_nome']; ?>!</p>
                    </div>
                </div>
                <a href="logout.php" class="logout-btn">
                    <i class="bi bi-box-arrow-right"></i> Sair
                </a>
            </div>
        </div>
    </div>

    <div class="admin-container">
        <div class="admin-menu">
            <a href="index.php" class="active"><i class="bi bi-house-door"></i> Dashboard</a>
            <a href="usuarios.php"><i class="bi bi-people"></i> Usuários</a>
            <a href="orcamentos.php"><i class="bi bi-truck"></i> Orçamentos</a>
            <a href="config.php"><i class="bi bi-gear"></i> Configurações</a>
        </div>

        <div class="admin-stats">
            <div class="stat-card">
                <div class="stat-icon"><i class="bi bi-people"></i></div>
                <div class="stat-number"><?php echo $stats['usuarios']; ?></div>
                <div class="stat-label">Usuários cadastrados</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="bi bi-truck"></i></div>
                <div class="stat-number"><?php echo $stats['orcamentos']; ?></div>
                <div class="stat-label">Total de orçamentos</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="bi bi-cash-stack"></i></div>
                <div class="stat-number">R$ <?php echo number_format($stats['valor_total'], 2, ',', '.'); ?></div>
                <div class="stat-label">Valor total</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="bi bi-calendar-check"></i></div>
                <div class="stat-number"><?php echo $stats['orcamentos_hoje']; ?></div>
                <div class="stat-label">Orçamentos hoje</div>
            </div>
        </div>

        <div style="margin-top: 40px;">
            <h2 style="font-size: 1.5rem; color: var(--secondary-color); margin-bottom: 20px;">
                <i class="bi bi-clock-history"></i> Últimos Orçamentos
            </h2>
            <div class="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Cliente</th>
                            <th>Veículo</th>
                            <th>Destino</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($ultimos_orcamentos as $orc): ?>
                        <tr>
                            <td><strong><?php echo $orc['numero_pedido']; ?></strong></td>
                            <td><?php echo $orc['nome']; ?></td>
                            <td>
                                <?php if($orc['tipo_veiculo'] == 'carro'): ?>
                                    <span class="badge badge-success">🚗 Carro</span>
                                <?php else: ?>
                                    <span class="badge badge-success">🏍️ Moto</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo substr($orc['endereco_entrega'], 0, 30) . '...'; ?></td>
                            <td><strong style="color: var(--success-color);">R$ <?php echo number_format($orc['valor_total'], 2, ',', '.'); ?></strong></td>
                            <td><?php echo date('d/m/Y H:i', strtotime($orc['data_orcamento'])); ?></td>
                            <td><span class="badge badge-success">Confirmado</span></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>