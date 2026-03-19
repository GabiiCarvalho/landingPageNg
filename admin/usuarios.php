<?php
// admin/usuarios.php
require_once 'config/auth.php';
require_once '../config/database.php';

// Buscar todos os usuários
$stmt = $pdo->query("SELECT * FROM usuarios ORDER BY data_cadastro DESC");
$usuarios = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Usuários - Admin N&G EXPRESS</title>
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
        }
        .admin-table tr:hover {
            background: var(--gray-100);
        }
        .btn-action {
            padding: 5px 10px;
            border-radius: 4px;
            text-decoration: none;
            margin: 0 2px;
        }
        .btn-view {
            background: var(--info-color);
            color: white;
        }
        .btn-edit {
            background: var(--warning-color);
            color: var(--dark-color);
        }
        .logout-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="admin-header">
        <div class="admin-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h1 style="font-size: 1.8rem;"><i class="bi bi-people"></i> Gerenciar Usuários</h1>
                <a href="logout.php" class="logout-btn"><i class="bi bi-box-arrow-right"></i> Sair</a>
            </div>
        </div>
    </div>

    <div class="admin-container">
        <div class="admin-menu">
            <a href="index.php"><i class="bi bi-house-door"></i> Dashboard</a>
            <a href="usuarios.php" class="active"><i class="bi bi-people"></i> Usuários</a>
            <a href="orcamentos.php"><i class="bi bi-truck"></i> Orçamentos</a>
            <a href="config.php"><i class="bi bi-gear"></i> Configurações</a>
        </div>

        <div class="admin-table">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Telefone</th>
                        <th>Data Cadastro</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($usuarios as $user): ?>
                    <tr>
                        <td>#<?php echo $user['id']; ?></td>
                        <td><?php echo $user['nome']; ?></td>
                        <td><?php echo $user['email']; ?></td>
                        <td><?php echo $user['telefone']; ?></td>
                        <td><?php echo date('d/m/Y', strtotime($user['data_cadastro'])); ?></td>
                        <td>
                            <a href="ver_usuario.php?id=<?php echo $user['id']; ?>" class="btn-action btn-view"><i class="bi bi-eye"></i></a>
                            <a href="editar_usuario.php?id=<?php echo $user['id']; ?>" class="btn-action btn-edit"><i class="bi bi-pencil"></i></a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>