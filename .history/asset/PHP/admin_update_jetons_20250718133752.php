<?php
require_once 'check_admin.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'] ?? null;
$jetons = $data['jetons'] ?? null;

if (!$id || $jetons === null || $jetons < 0) {
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
    $stmt = $pdo->prepare("UPDATE inscrits SET credits = ? WHERE id = ?");
    $stmt->execute([$jetons, $id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Erreur BD']);
}
