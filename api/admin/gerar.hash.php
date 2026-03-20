<?php
$senha = $_GET['s'] ?? '';
if ($senha) {
    echo password_hash($senha, PASSWORD_DEFAULT);
} else {
    echo 'Passe ?s=suasenha na URL';
}
?>