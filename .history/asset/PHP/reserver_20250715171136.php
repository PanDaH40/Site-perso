<?php
// reserver.php
// API JSON : gérer réservations et annulations, renvoyer le nouveau solde de places

session_start();
header('Content-Type: application/json');

// Désactive l’affichage d’erreurs HTML (pour prod)
ini_set('display_errors', 0);

// 1) Authentification
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non connecté']);
    exit;
}
$userId = (int) $_SESSION['user']['id'];

// 2) Lire JSON
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON invalide']);
    exit;
}
$trajetId = isset($input['trajet_id']) ? intval($input['trajet_id']) : 0;
$places   = isset($input['places'])     ? intval($input['places'])     : 0;
$action   = (isset($input['action']) && $input['action'] === 'cancel') ? 'cancel' : 'reserve';

if ($trajetId <= 0 || ($places <= 0 && $action !== 'cancel')) {
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

    if ($action === 'cancel') {
        // Annulation de réservation
        $stmt = $pdo->prepare('SELECT places_reservees FROM reservations WHERE trajet_id = ? AND passager_id = ?');
        $stmt->execute([$trajetId, $userId]);
        $reserved = $stmt->fetchColumn();
        if (!$reserved) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Aucune réservation à annuler']);
            exit;
        }
        // Supprimer la réservation (on NE touche PAS à la table trajets !)
        $pdo->prepare('DELETE FROM reservations WHERE trajet_id = ? AND passager_id = ?')
            ->execute([$trajetId, $userId]);
        $message = 'Réservation annulée';

    } else {
        // Réservation
        // Récupérer total de places déjà réservées pour ce trajet
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(places_reservees),0) FROM reservations WHERE trajet_id = ?');
        $stmt->execute([$trajetId]);
        $totalReservees = (int)$stmt->fetchColumn();

        // Récupérer le nombre TOTAL de places initiales prévues pour le trajet
        $stmt = $pdo->prepare('SELECT places FROM trajets WHERE id = ?');
        $stmt->execute([$trajetId]);
        $placesTotal = (int)$stmt->fetchColumn();

        // Calculer la dispo réelle
        $placesDispo = $placesTotal - $totalReservees;
        if ($places > $placesDispo) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Pas assez de places']);
            exit;
        }

        // Vérifier double réservation (un utilisateur ne peut réserver qu'une fois le même trajet)
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ?');
        $stmt->execute([$trajetId, $userId]);
        if ($stmt->fetchColumn() > 0) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Déjà réservé']);
            exit;
        }

        // Insérer la réservation
        $pdo->prepare('INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)')
            ->execute([$trajetId, $userId, $places]);
        $message = 'Réservation confirmée';
    }

    $pdo->commit();

    // Récupérer solde actuel de places disponibles
    $stmt = $pdo->prepare('SELECT places FROM trajets WHERE id = ?');
    $stmt->execute([$trajetId]);
    $placesTotal = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare('SELECT COALESCE(SUM(places_reservees),0) FROM reservations WHERE trajet_id = ?');
    $stmt->execute([$trajetId]);
    $totalReservees = (int)$stmt->fetchColumn();

    $remaining = $placesTotal - $totalReservees;

    echo json_encode([ 'success' => true, 'message' => $message, 'places_restantes' => $remaining ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
