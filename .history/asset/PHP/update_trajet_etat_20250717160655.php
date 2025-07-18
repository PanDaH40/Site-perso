<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = (int)$_SESSION['user']['id'];
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['trajet_id'], $input['etat'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Données manquantes']);
    exit;
}

$trajetId = (int)$input['trajet_id'];
$etat = $input['etat'];

$etats_valides = ['planifie', 'en_cours', 'termine'];
if (!in_array($etat, $etats_valides, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'État invalide']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Vérifier que le trajet appartient bien au conducteur connecté
    $stmt = $pdo->prepare('SELECT conducteur_id FROM trajets WHERE id = ?');
    $stmt->execute([$trajetId]);
    $conducteurId = $stmt->fetchColumn();

    if ($conducteurId !== $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }

    // Met à jour l'état du trajet
    $stmt = $pdo->prepare('UPDATE trajets SET etat_trajet = ? WHERE id = ?');
    $stmt->execute([$etat, $trajetId]);

    echo json_encode(['success' => true, 'etat' => $etat]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
