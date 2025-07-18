<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user']['id'])) { echo json_encode(['error'=>'Non connecté']); exit; }

$me = (int)$_SESSION['user']['id'];
$input = json_decode(file_get_contents('php://input'), true);
$destinataire = (int)($input['destinataire_id'] ?? 0);
$message = trim($input['message'] ?? '');

if ($destinataire <= 0 || !$message) {
    echo json_encode(['error' => 'Paramètres manquants']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, texte, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$me, $destinataire, $message]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Erreur serveur']);
}
