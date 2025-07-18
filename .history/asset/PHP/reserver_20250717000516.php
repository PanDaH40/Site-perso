<?php
// reserver.php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non connecté']);
    exit;
}
$userId = (int)$_SESSION['user']['id'];

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON invalide']);
    exit;
}
$trajetId = isset($input['trajet_id']) ? intval($input['trajet_id']) : 0;
$places   = isset($input['places']) ? intval($input['places']) : 0;

if ($trajetId <= 0 || $places <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

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

    // Vérifier places restantes uniquement sur les réservations validées
    $sqlPlaces = "SELECT t.places - IFNULL(SUM(CASE WHEN r.statut = 'Confirmé' THEN r.places_reservees ELSE 0 END), 0) AS places_restantes
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

    // Vérifier si une demande ou réservation déjà en attente ou validée existe pour cet utilisateur et trajet
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ? AND statut IN ("En_attente", "Confirmé")');
    $stmt->execute([$trajetId, $userId]);
    if ($stmt->fetchColumn() > 0) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['error' => 'Vous avez déjà une réservation ou demande en attente pour ce trajet.']);
        exit;
    }

    // Insérer la réservation avec statut 'en_attente'
    $stmtInsert = $pdo->prepare('INSERT INTO reservations (trajet_id, passager_id, places_reservees, statut) VALUES (?, ?, ?, ?)');
    $stmtInsert->execute([$trajetId, $userId, $places, 'en_attente']);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Demande de réservation envoyée, en attente de validation']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
