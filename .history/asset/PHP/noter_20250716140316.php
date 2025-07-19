<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non connecté']);
    exit;
}
$auteur_id = (int)$_SESSION['user']['id'];
$data = json_decode(file_get_contents('php://input'), true);

if (
    !$data || !isset($data['utilisateur_id'], $data['note'])
    || $data['note'] < 1 || $data['note'] > 5
) {
    http_response_code(400);
    echo json_encode(['error' => 'Données invalides']);
    exit;
}
$utilisateur_id = (int)$data['utilisateur_id'];
$note = (int)$data['note'];
$commentaire = trim($data['commentaire'] ?? '');

if ($utilisateur_id === $auteur_id) {
    echo json_encode(['error' => "Impossible de s'auto-noter."]);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $stmt = $pdo->prepare("INSERT INTO avis (utilisateur_id, auteur_id, note, commentaire)
        VALUES (:utilisateur, :auteur, :note, :comment)
        ON DUPLICATE KEY UPDATE note=:note, commentaire=:comment, date=NOW()");
    $stmt->execute([
        ':utilisateur' => $utilisateur_id,
        ':auteur'      => $auteur_id,
        ':note'        => $note,
        ':comment'     => $commentaire,
    ]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
