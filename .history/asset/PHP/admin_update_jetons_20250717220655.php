<?php
require 'check_admin.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
$montant = floatval($data['montant'] ?? 0);

if (!$id || !$montant) { echo json_encode(['error' => "Données invalides"]); exit; }

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
    $stmt = $pdo->prepare("UPDATE inscrits SET jetons = jetons + ? WHERE id = ?");
    $stmt->execute([$montant, $id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => "Erreur serveur"]);
}
