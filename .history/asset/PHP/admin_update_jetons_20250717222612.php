<?php
// admin_jetons.php
require 'check_admin.php';
header('Content-Type: application/json');
$pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');

// Récupère POST : id, action (add/remove), nb_jetons
$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? null;
$nb = intval($input['nb_jetons'] ?? 0);
$type = $input['action'] ?? '';

if (!$id || !$nb || !in_array($type, ['add','remove'])) {
    echo json_encode(['error'=>'Paramètres invalides']); exit;
}

$op = $type == 'add' ? '+' : '-';
$stmt = $pdo->prepare("UPDATE inscrits SET jetons = jetons $op ? WHERE id=?");
$stmt->execute([$nb, $id]);
echo json_encode(['success'=>true]);
