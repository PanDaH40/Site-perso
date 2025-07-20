<?php
require_once 'check_admin.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = isset($data['id']) ? intval($data['id']) : null;
$jetons = isset($data['jetons']) ? intval($data['jetons']) : null;

if (!$id || $jetons === null || $jetons < 0) {
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8','if0_39505571','qBOSjJTyyq5Trff');
    $stmt = $pdo->prepare("UPDATE inscrits SET credits = ? WHERE id = ?");
    $stmt->execute([$jetons, $id]);
    echo json_encode(['success' => true, 'nouveau_jetons' => $jetons]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Erreur BD']);
}
