<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$me = (int)$_SESSION['user']['id'];
$data = json_decode(file_get_contents('php://input'), true);

$destinataire_id = isset($data['destinataire_id']) ? (int)$data['destinataire_id'] : 0;
$message = trim($data['message'] ?? '');

if ($destinataire_id <= 0 || empty($message)) {
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $stmt = $pdo->prepare("
        INSERT INTO messages (sender_id, receiver_id, content, created_at, is_read)
        VALUES (?, ?, ?, NOW(), 0)
    ");
    $stmt->execute([$me, $destinataire_id, $message]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
