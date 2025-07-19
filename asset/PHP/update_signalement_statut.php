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
$statut = isset($input['statut']) ? (int)$input['statut'] : null;

if ($id < 1 || !in_array($statut, [0, 1], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $stmt = $pdo->prepare("UPDATE signalements SET statut = ? WHERE id = ?");
    $stmt->execute([$statut, $id]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
