<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id = isset($input['id']) ? (int)$input['id'] : 0;

if ($id < 1) {
    http_response_code(400);
    echo json_encode(['error' => 'ID invalide']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $stmt = $pdo->prepare("UPDATE signalements SET statut = 'traite' WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Signalement marqué comme traité.']);
    } else {
        echo json_encode(['error' => 'Signalement non trouvé ou déjà traité.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
