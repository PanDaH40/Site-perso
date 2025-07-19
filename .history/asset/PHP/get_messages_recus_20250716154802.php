<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$me = (int)$_SESSION['user']['id'];

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Liste des utilisateurs ayant envoyé au moins un message à $me
    $stmt = $pdo->prepare("
        SELECT 
            m.sender_id AS user_id,
            i.prenom,
            i.nom,
            COUNT(CASE WHEN m.receiver_id = :me AND m.is_read = 0 THEN 1 END) AS badge
        FROM messages m
        JOIN inscrits i ON i.id = m.sender_id
        WHERE m.receiver_id = :me
        GROUP BY m.sender_id, i.prenom, i.nom
        ORDER BY MAX(m.created_at) DESC
    ");
    $stmt->execute(['me' => $me]);
    $convs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calcul du total de messages non lus
    $totalNonLus = 0;
    foreach ($convs as $conv) {
        $totalNonLus += (int)$conv['badge'];
    }

    echo json_encode([
        'conversations' => $convs,
        'totalNonLus' => $totalNonLus
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
