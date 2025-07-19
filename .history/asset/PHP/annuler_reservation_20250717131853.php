<?php
// annuler_reservation.php
// Annule une réservation via l'ID de réservation (clé primaire), sécurisé pour l'utilisateur connecté

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
    echo json_encode(['error' => 'ID de réservation manquant']);
    exit;
}
$reservationId = intval($input['id']);

if ($reservationId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de réservation invalide']);
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
    // 4) Vérifier que la réservation existe et appartient à l'utilisateur connecté
    $stmt = $pdo->prepare('SELECT trajet_id FROM reservations WHERE id = ? AND passager_id = ?');
    $stmt->execute([$reservationId, $userId]);
    $trajetId = $stmt->fetchColumn();

    if (!$trajetId) {
        http_response_code(404);
        echo json_encode(['error' => 'Réservation introuvable ou accès interdit']);
        exit;
    }

    $pdo->beginTransaction();

    // 5) Supprimer la réservation par son ID
    $del = $pdo->prepare('DELETE FROM reservations WHERE id = ? AND passager_id = ?');
    $del->execute([$reservationId, $userId]);

    $pdo->commit();

    // 6) Calculer les places restantes pour ce trajet
    $stmt = $pdo->prepare('SELECT places FROM trajets WHERE id = ?');
    $stmt->execute([$trajetId]);
    $placesTotal = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare('SELECT COALESCE(SUM(places_reservees),0) FROM reservations WHERE trajet_id = ?');
    $stmt->execute([$trajetId]);
    $totalReservees = (int)$stmt->fetchColumn();

    $placesRestantes = $placesTotal - $totalReservees;

    echo json_encode([
        'success' => true,
        'message' => 'Réservation annulée',
        'places_restantes' => $placesRestantes
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
