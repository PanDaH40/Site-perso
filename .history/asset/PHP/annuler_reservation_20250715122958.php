<?php
// annuler_reservation.php
// Annule une réservation et restitue les places

session_start();
header('Content-Type: application/json');

// 1) Vérifier l'authentification
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int) $_SESSION['user']['id'];

// 2) Lire et valider les données JSON
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || !isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de trajet manquant']);
    exit;
}
$trajetId = intval($input['id']);

if ($trajetId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de trajet invalide']);
    exit;
}

// 3) Connexion à la base de données
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de se connecter à la base']);
    exit;
}

try {
    // 4) Vérifier l'existence de la réservation
    $stmt = $pdo->prepare(
        'SELECT places_reservees FROM reservations WHERE trajet_id = ? AND passager_id = ?'
    );
    $stmt->execute([$trajetId, $userId]);
    $reserved = $stmt->fetchColumn();
    if (!$reserved) {
        http_response_code(404);
        echo json_encode(['error' => 'Réservation introuvable']);
        exit;
    }

    // 5) Transaction pour annuler et restituer les places
    $pdo->beginTransaction();

    // Supprimer la réservation
    $del = $pdo->prepare(
        'DELETE FROM reservations WHERE trajet_id = ? AND passager_id = ?'
    );
    $del->execute([$trajetId, $userId]);

    // Restituer les places au trajet
    $upd = $pdo->prepare(
        'UPDATE trajets SET places = places + ? WHERE id = ?'
    );
    $upd->execute([$reserved, $trajetId]);

    $pdo->commit();

    // 6) Renvoyer le résultat
    echo json_encode([
        'success' => true,
        'message' => 'Réservation annulée',
        'places_restantes' => (int)($pdo->query("SELECT places FROM trajets WHERE id = $trajetId")->fetchColumn())
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
