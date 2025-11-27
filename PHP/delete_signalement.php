<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/db_conn.php';
require_once __DIR__ . '/check_admin.php';

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
    
    $stmt = $pdo->prepare("DELETE FROM signalements WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
