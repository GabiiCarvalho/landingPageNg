<?php
require_once(__DIR__ . '/../../cors.php');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';

session_start();
session_destroy();

echo json_encode(['success' => true, 'message' => 'Logout realizado']);
?>