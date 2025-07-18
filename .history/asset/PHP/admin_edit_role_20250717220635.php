<?php
require 'check_admin.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
$role = strtolower(trim($data['role'] ?? ''));
if (!$id || !in_array($role, ['conducteur', 'passager', 'les deux'])) {
    echo json_encode(['error' => "Paramètres invalides"]); exit;
}

$roleConducteur = ($role === 'conducteur' || $role === 'les deux') ? 1 : 0;
$rolePassager = ($role === 'passager' || $role === 'les deux') ? 1 : 0;

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
    $stmt = $pdo->prepare("UPDATE inscrits SET roleConducteur=?, rolePassager=? WHERE id=?");
    $stmt->execute([$roleConducteur, $rolePassager, $id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => "Erreur serveur"]);
}
