<?php
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