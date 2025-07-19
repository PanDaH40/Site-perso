<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$me = (int)$_SESSION['user']['id'];
$with = isset($_GET['with']) ? (int)$_GET['with'] : 0;

if ($with <= 0) {
    echo json_encode(['error' => 'Paramètre manquant']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Marquer les messages reçus comme lus
    $pdo->prepare("UPDATE messages SET is_read=1 WHERE sender_id = ? AND receiver_id = ?")->execute([$with, $me]);

    // Récupérer la conversation
    $stmt = $pdo->prepare("
        SELECT 
            m.id, m.sender_id, m.receiver_id, m.message AS texte, m.created_at AS date,
            (m.sender_id = :me) AS from_me
        FROM messages m
        WHERE (m.sender_id = :me AND m.receiver_id = :with)
           OR (m.sender_id = :with AND m.receiver_id = :me)
        ORDER BY m.created_at ASC
    ");
    $stmt->execute(['me' => $me, 'with' => $with]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['messages' => $messages]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
