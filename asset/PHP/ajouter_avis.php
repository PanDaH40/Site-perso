<?php

session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$utilisateur_id = (int)($input['utilisateur_id'] ?? 0);
$note = (int)($input['note'] ?? 0);
$commentaire = trim($input['commentaire'] ?? '');
$auteur_id = (int)$_SESSION['user']['id'];

if ($utilisateur_id < 1 || $note < 1 || $note > 5 || $utilisateur_id === $auteur_id) {
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8',
        'if0_39505571', 'qBOSjJTyyq5Trff',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // INSERT ou UPDATE si déjà un avis existant (clé UNIQUE sur utilisateur_id + auteur_id)
    $stmt = $pdo->prepare("
        INSERT INTO avis (utilisateur_id, auteur_id, note, commentaire, date)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            note = VALUES(note),
            commentaire = VALUES(commentaire),
            date = NOW()
    ");
    $stmt->execute([$utilisateur_id, $auteur_id, $note, $commentaire]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
