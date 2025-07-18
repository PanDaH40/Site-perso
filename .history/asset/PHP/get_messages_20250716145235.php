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
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $stmt = $pdo->prepare(
        "SELECT m.*, 
                s.prenom AS sender_prenom, 
                s.nom AS sender_nom
         FROM messages m
         JOIN inscrits s ON s.id = m.sender_id
         WHERE 
            (m.sender_id = :me AND m.receiver_id = :with)
            OR (m.sender_id = :with AND m.receiver_id = :me)
         ORDER BY m.created_at ASC"
    );
    $stmt->execute(['me' => $me, 'with' => $with]);
    echo json_encode(['messages' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
