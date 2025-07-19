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

if (!isset($input['reservation_id']) || !ctype_digit(strval($input['reservation_id']))) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de réservation invalide']);
    exit;
}

$reservationId = (int)$input['reservation_id'];

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Vérifier que la réservation appartient bien à l'utilisateur
    $stmt = $pdo->prepare("SELECT statut, validation_passager FROM reservations WHERE id = ? AND passager_id = ?");
    $stmt->execute([$reservationId, $userId]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        http_response_code(404);
        echo json_encode(['error' => 'Réservation introuvable']);
        exit;
    }

    if ($reservation['statut'] !== 'valide') {
        http_response_code(400);
        echo json_encode(['error' => 'Réservation non valide, impossible de valider']);
        exit;
    }

    if ($reservation['validation_passager'] == 1) {
        echo json_encode(['success' => true, 'message' => 'Trajet déjà validé']);
        exit;
    }

    // Mise à jour de la validation
    $update = $pdo->prepare("UPDATE reservations SET validation_passager = 1 WHERE id = ?");
    $update->execute([$reservationId]);

    echo json_encode(['success' => true, 'message' => 'Validation du trajet enregistrée']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
