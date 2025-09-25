<?php

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_conn.php';

$userId = (int)($_SESSION['user']['id'] ?? 0);
if ($userId <= 0) { echo json_encode(['error'=>'Utilisateur non connecté']); exit; }
?>

