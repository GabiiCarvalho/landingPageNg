<?php
// admin/orcamentos.php
require_once 'config/auth.php';
require_once '../config/database.php';

// Buscar todos os orçamentos
$stmt = $pdo->query("
    SELECT ho.*, u.nome, u.email, u.telefone 
    FROM historico_orcamentos ho 
    JOIN usuarios u ON ho.usuario_id = u.id 
    ORDER BY ho.data_orcamento DESC 
    LIMIT 100
");
$orcamentos = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orçamentos - Admin N&G EXPRESS</title>
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
            font-size: 0.9rem;
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
        .badge-warning {
            background: #fff3cd;
            color: #856404;
        }
        .logout-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            text-decoration: none;
        }
        .filters {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .filter-input {
            flex: 1;
            min-width: 200px;
            padding: 10px;
            border: 1px solid var(--gray-300);
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="admin-header">
        <div class="admin-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h1 style="font-size: 1.8rem;"><i class="bi bi-truck"></i> Gerenciar Orçamentos</h1>
                <a href="logout.php" class="logout-btn"><i class="bi bi-box-arrow-right"></i> Sair</a>
            </div>
        </div>
    </div>

    <div class="admin-container">
        <div class="admin-menu">
            <a href="index.php"><i class="bi bi-house-door"></i> Dashboard</a>
            <a href="usuarios.php"><i class="bi bi-people"></i> Usuários</a>
            <a href="orcamentos.php" class="active"><i class="bi bi-truck"></i> Orçamentos</a>
            <a href="config.php"><i class="bi bi-gear"></i> Configurações</a>
        </div>

        <div class="filters">
            <input type="text" id="searchInput" class="filter-input" placeholder="🔍 Buscar por cliente, pedido ou endereço...">
            <select id="veiculoFilter" class="filter-input">
                <option value="">Todos os veículos</option>
                <option value="moto">🏍️ Moto</option>
                <option value="carro">🚗 Carro</option>
            </select>
        </div>

        <div class="admin-table">
            <table id="orcamentosTable">
                <thead>
                    <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Veículo</th>
                        <th>Coleta</th>
                        <th>Entrega</th>
                        <th>Valor</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($orcamentos as $orc): ?>
                    <tr>
                        <td><strong><?php echo $orc['numero_pedido']; ?></strong></td>
                        <td><?php echo $orc['nome']; ?><br><small><?php echo $orc['email']; ?></small></td>
                        <td>
                            <?php if($orc['tipo_veiculo'] == 'carro'): ?>
                                <span class="badge badge-success">🚗 Carro</span>
                            <?php else: ?>
                                <span class="badge badge-success">🏍️ Moto</span>
                            <?php endif; ?>
                        </td>
                        <td><?php echo substr($orc['endereco_coleta'], 0, 30) . '...'; ?></td>
                        <td><?php echo substr($orc['endereco_entrega'], 0, 30) . '...'; ?></td>
                        <td><strong style="color: var(--success-color);">R$ <?php echo number_format($orc['valor_total'], 2, ',', '.'); ?></strong></td>
                        <td><?php echo date('d/m/Y H:i', strtotime($orc['data_orcamento'])); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Filtro simples na tabela
        document.getElementById('searchInput').addEventListener('keyup', function() {
            const search = this.value.toLowerCase();
            const rows = document.querySelectorAll('#orcamentosTable tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(search) ? '' : 'none';
            });
        });

        document.getElementById('veiculoFilter').addEventListener('change', function() {
            const filter = this.value;
            const rows = document.querySelectorAll('#orcamentosTable tbody tr');
            
            rows.forEach(row => {
                if (!filter) {
                    row.style.display = '';
                    return;
                }
                const veiculo = row.cells[2].textContent.toLowerCase();
                row.style.display = veiculo.includes(filter) ? '' : 'none';
            });
        });
    </script>
</body>
</html>