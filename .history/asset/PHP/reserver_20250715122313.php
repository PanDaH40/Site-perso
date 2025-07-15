<?php
// reserver.php
// Enregistre ou annule une réservation; renvoie le nouveau nombre de places

session_start();
header('Content-Type: application/json');

// 1) Vérifier que l'utilisateur est connecté\if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}
$userId = $_SESSION['user']['id'];

// 2) Récupérer et valider les données JSON
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$trajetId = isset($input['trajet_id']) ? intval($input['trajet_id']) : 0;
$places   = isset($input['places'])    ? intval($input['places'])    : 0;
$action   = (isset($input['action']) && $input['action'] === 'cancel') ? 'cancel' : 'reserve';

if ($trajetId <= 0 || $places <= 0) {
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

// 3) Connexion à la base de données
try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    error_log('Connexion BD: '.$e->getMessage());
    echo json_encode(['error' => 'Erreur connexion base']);
    exit;
}

try {
    $pdo->beginTransaction();
    // Verrouiller la ligne du trajet
    $stmt = $pdo->prepare('SELECT places FROM trajets WHERE id = ? FOR UPDATE');
    $stmt->execute([$trajetId]);
    $current = $stmt->fetchColumn();
    if ($current === false) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Trajet introuvable']);
        exit;
    }

    if ($action === 'cancel') {
        // Annulation: récupérer la réservation
        $stmt = $pdo->prepare('SELECT places_reservees FROM reservations WHERE trajet_id = ? AND passager_id = ?');
        $stmt->execute([$trajetId, $userId]);
        $reserved = $stmt->fetchColumn();
        if (!$reserved) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Aucune réservation à annuler']);
            exit;
        }
        // Supprimer et restituer
        $pdo->prepare('DELETE FROM reservations WHERE trajet_id = ? AND passager_id = ?')->execute([$trajetId, $userId]);
        $pdo->prepare('UPDATE trajets SET places = places + ? WHERE id = ?')->execute([$reserved, $trajetId]);
        $message = 'Réservation annulée';
    } else {
        // Réservation: vérifier la disponibilité
        if ($places > (int)$current) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Pas assez de places']);
            exit;
        }
        // Vérifier si déjà réservé
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ?');
        $stmt->execute([$trajetId, $userId]);
        if ($stmt->fetchColumn() > 0) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Déjà réservé']);
            exit;
        }
        // Insérer puis décrémenter
        $pdo->prepare('INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)')->execute([$trajetId, $userId, $places]);
        $pdo->prepare('UPDATE trajets SET places = places - ? WHERE id = ?')->execute([$places, $trajetId]);
        $message = 'Réservation confirmée';
    }

    $pdo->commit();
    // Récupérer le solde
    $new = $pdo->prepare('SELECT places FROM trajets WHERE id = ?');
    $new->execute([$trajetId]);
    $remaining = (int)$new->fetchColumn();

    echo json_encode(['success' => true, 'message' => $message, 'places_restantes' => $remaining]);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Erreur SQL reserver.php: '.$e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
