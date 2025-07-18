<?php
require 'check_admin.php'; // Sécurité : vérifier que l'utilisateur est admin

header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
if (empty($data['id']) || !isset($data['jetons'])) {
    echo json_encode(['error' => 'Données manquantes']);
    exit;
}
$pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
$stmt = $pdo->prepare("UPDATE inscrits SET jetons = ? WHERE id = ?");
$res = $stmt->execute([intval($data['jetons']), intval($data['id'])]);
echo json_encode(['success' => $res]);
