<?php
session_start();
require_once '../config/database.php';

// Verificar se já está logado
if (isset($_SESSION['admin_id'])) {
    header('Location: index.php');
    exit;
}

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $senha = $_POST['senha'] ?? '';
    
    // Credenciais fixas do admin (você pode mudar depois)
    if ($email === 'admin@ngexpress.com' && $senha === 'admin123') {
        $_SESSION['admin_id'] = 1;
        $_SESSION['admin_nome'] = 'Administrador';
        $_SESSION['admin_nivel'] = 1;
        header('Location: index.php');
        exit;
    } else {
        $erro = 'E-mail ou senha inválidos';
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin - N&G EXPRESS</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="../css/styles.css">
    <style>
        body {
            background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
        }
        .login-box {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-width: 400px;
            width: 90%;
        }
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-header h1 {
            color: var(--secondary-color);
            font-size: 2rem;
            margin: 10px 0;
        }
        .login-header p {
            color: var(--gray-600);
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: var(--gray-700);
        }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--gray-300);
            border-radius: 8px;
            font-size: 1rem;
            transition: var(--transition);
        }
        .form-group input:focus {
            border-color: var(--primary-color);
            outline: none;
            box-shadow: 0 0 0 3px rgba(255,107,0,0.1);
        }
        .btn {
            width: 100%;
            padding: 14px;
            font-size: 1.1rem;
        }
        .erro {
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="login-box">
        <div class="login-header">
            <i class="bi bi-shield-lock" style="font-size: 3rem; color: var(--primary-color);"></i>
            <h1>N&G EXPRESS</h1>
            <p>Área Administrativa</p>
        </div>
        
        <?php if($erro): ?>
        <div class="erro">
            <i class="bi bi-exclamation-triangle"></i> <?php echo $erro; ?>
        </div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label for="email">E-mail</label>
                <input type="email" id="email" name="email" value="admin@ngexpress.com" required>
            </div>
            <div class="form-group">
                <label for="senha">Senha</label>
                <input type="password" id="senha" name="senha" value="admin123" required>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="bi bi-box-arrow-in-right"></i> Entrar
            </button>
        </form>
    </div>
</body>
</html>