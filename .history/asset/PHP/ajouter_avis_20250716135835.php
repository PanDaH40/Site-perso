<?php

session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']); exit;
}
$input = json_decode(file_get_contents('php://input'), true);
$utilisateur_id = (int)($input['utilisateur_id'] ?? 0);
$note = (int)($input['note'] ?? 0);
$commentaire = trim($input['commentaire'] ?? '');
$auteur_id = (int)$_SESSION['user']['id'];
if ($utilisateur_id < 1 || $note < 1 || $note > 5 || $utilisateur_id == $auteur_id) {
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}
try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','',
        [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->prepare("
        INSERT INTO avis (utilisateur_id, auteur_id, note, commentaire)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE note=VALUES(note), commentaire=VALUES(commentaire), date=NOW()
    ");
    $stmt->execute([$utilisateur_id, $auteur_id, $note, $commentaire]);
    echo json_encode(['success'=>true]);
} catch(Exception $e) {
    echo json_encode(['error'=>'Erreur serveur']);
}
