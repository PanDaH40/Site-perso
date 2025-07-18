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
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON invalide']);
    exit;
}

$reservationId = isset($input['reservation_id']) ? intval($input['reservation_id']) : 0;
$action = isset($input['action']) ? $input['action'] : '';

if ($reservationId <= 0 || !in_array($action, ['accepter', 'refuser'], true)) {
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

    $stmt = $pdo->prepare("
        SELECT r.trajet_id, r.places_reservees, r.statut, t.conducteur_id, t.places,
            (SELECT COALESCE(SUM(CASE WHEN statut = 'valide' THEN places_reservees ELSE 0 END),0) FROM reservations WHERE trajet_id = t.id) AS places_deja_reservees
        FROM reservations r
        JOIN trajets t ON r.trajet_id = t.id
        WHERE r.id = ?
        FOR UPDATE
    ");
    $stmt->execute([$reservationId]);
    $res = $stmt->fetch();

    if (!$res) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Réservation introuvable']);
        exit;
    }

    if ($res['conducteur_id'] !== $userId) {
        $pdo->rollBack();
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }

    if ($res['statut'] !== 'en_attente') {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['error' => 'Cette demande a déjà été traitée']);
        exit;
    }

    if ($action === 'accepter') {
        $places_restantes = $res['places'] - $res['places_deja_reservees'];
        if ($res['places_reservees'] > $places_restantes) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Pas assez de places disponibles pour valider cette réservation']);
            exit;
        }
        $stmtUpdate = $pdo->prepare("UPDATE reservations SET statut = 'valide' WHERE id = ?");
        $stmtUpdate->execute([$reservationId]);
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Réservation acceptée']);
    } else { // refuser
        $stmtUpdate = $pdo->prepare("UPDATE reservations SET statut = 'annule' WHERE id = ?");
        $stmtUpdate->execute([$reservationId]);
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Réservation refusée']);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
