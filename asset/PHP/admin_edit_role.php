<?php
require_once 'check_admin.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
$role = strtolower(trim($data['role'] ?? ''));
if (!$id || !in_array($role, ['conducteur', 'passager', 'les deux'])) {
    echo json_encode(['error' => "Paramètres invalides"]); exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');

    // On commence par tout supprimer (pour éviter les doublons)
    $pdo->prepare("DELETE FROM conducteurs WHERE inscrit_id=?")
    ->execute([$id]);
$pdo->prepare("DELETE FROM passagers WHERE inscrit_id=?")
    ->execute([$id]);

// Réinsertion selon le rôle choisi
if ($role === 'conducteur' || $role === 'les deux') {
    $pdo->prepare("INSERT IGNORE INTO conducteurs (inscrit_id) VALUES (?)")
        ->execute([$id]);
}
if ($role === 'passager' || $role === 'les deux') {
    $pdo->prepare("INSERT IGNORE INTO passagers (inscrit_id) VALUES (?)")
        ->execute([$id]);
}
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => "Erreur serveur"]);
}
