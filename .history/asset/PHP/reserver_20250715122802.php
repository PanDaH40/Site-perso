<?php
// reserver.php
// API JSON: gérer réservations et annulations, renvoyer nouveau solde de places

session_start();
header('Content-Type: application/json');

// Désactiver tout affichage d'erreurs HTML
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
    // Verrouillage pour mise à jour
    $stmt = $pdo->prepare('SELECT places FROM trajets WHERE id = ? FOR UPDATE');
    $stmt->execute([$trajetId]);
    $current = $stmt->fetchColumn();
    if ($current === false) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Trajet introuvable']);
        exit;
    }

    if ($action === 'cancel') {
        // Récupérer places réservées
        $stmt = $pdo->prepare('SELECT places_reservees FROM reservations WHERE trajet_id = ? AND passager_id = ?');
        $stmt->execute([$trajetId, $userId]);
        $reserved = $stmt->fetchColumn();
        if (!$reserved) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Aucune réservation à annuler']);
            exit;
        }
        // Supprimer et restituer
        $pdo->prepare('DELETE FROM reservations WHERE trajet_id = ? AND passager_id = ?')
            ->execute([$trajetId, $userId]);
        $pdo->prepare('UPDATE trajets SET places = places + ? WHERE id = ?')
            ->execute([$reserved, $trajetId]);
        $message = 'Réservation annulée';
    } else {
        // Vérifier disponibilité
        if ($places > (int)$current) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Pas assez de places']);
            exit;
        }
        // Vérifier double réservation
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ?');
        $stmt->execute([$trajetId, $userId]);
        if ($stmt->fetchColumn() > 0) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Déjà réservé']);
            exit;
        }
        // Insérer réservation
        $pdo->prepare('INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)')
            ->execute([$trajetId, $userId, $places]);
        // Décrémenter places
        $pdo->prepare('UPDATE trajets SET places = places - ? WHERE id = ?')
            ->execute([$places, $trajetId]);
        $message = 'Réservation confirmée';
    }

    $pdo->commit();
    // Récupérer solde actuel
    $stmt = $pdo->prepare('SELECT places FROM trajets WHERE id = ?');
    $stmt->execute([$trajetId]);
    $remaining = (int)$stmt->fetchColumn();

    echo json_encode([ 'success' => true, 'message' => $message, 'places_restantes' => $remaining ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
