<?php
// reserver.php
session_start();
header('Content-Type: application/json');

// 1) Authentification
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non connecté']);
    exit;
}
$userId = (int) $_SESSION['user']['id'];

// 2) Lecture JSON
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON invalide']);
    exit;
}
$trajetId = isset($input['trajet_id']) ? intval($input['trajet_id']) : 0;
$places   = isset($input['places'])     ? intval($input['places'])     : 0;

if ($trajetId <= 0 || $places <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

// 3) Connexion BD
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données']);
    exit;
}

try {
    $pdo->beginTransaction();

    // On récupère le nombre de places dispo (calcul dynamique avec les réservations)
    $sqlPlaces = "SELECT t.places - IFNULL(SUM(r.places_reservees),0) as places_restantes
                  FROM trajets t
                  LEFT JOIN reservations r ON r.trajet_id = t.id
                  WHERE t.id = ?
                  GROUP BY t.id
                  FOR UPDATE";
    $stmt = $pdo->prepare($sqlPlaces);
    $stmt->execute([$trajetId]);
    $placesRestantes = $stmt->fetchColumn();

    if ($placesRestantes === false) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Trajet introuvable']);
        exit;
    }
    if ($places > (int)$placesRestantes) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['error' => 'Pas assez de places disponibles']);
        exit;
    }

    // Vérifie si déjà réservé par cet utilisateur
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ?');
    $stmt->execute([$trajetId, $userId]);
    if ($stmt->fetchColumn() > 0) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['error' => 'Vous avez déjà réservé ce trajet.']);
        exit;
    }

    // Insère la réservation
    $pdo->prepare('INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)')
        ->execute([$trajetId, $userId, $places]);

    $pdo->commit();

    echo json_encode([ 'success' => true, 'message' => 'Réservation confirmée' ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
