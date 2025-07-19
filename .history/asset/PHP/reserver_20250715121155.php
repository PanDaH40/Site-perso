<?php
// reserver.php
// Gère la création et l'annulation de réservations, et met à jour les places disponibles

session_start();
header('Content-Type: application/json');

// 1) Vérifier que l'utilisateur est connecté
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}
$userId = $_SESSION['user']['id'];

// 2) Récupérer et valider les données JSON
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$trajetId = isset($input['trajet_id']) ? intval($input['trajet_id']) : 0;
$places   = isset($input['places']) ? intval($input['places']) : 0;
$action   = isset($input['action']) ? $input['action'] : 'reserve';

if ($trajetId <= 0 || $places <= 0) {
    echo json_encode(['error' => 'Données invalides']);
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
    error_log('Erreur connexion BD: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur connexion base']);
    exit;
}

try {
    if ($action === 'cancel') {
        // Annulation de la réservation
        $stmt = $pdo->prepare(
            'SELECT places_reservees FROM reservations WHERE trajet_id = ? AND passager_id = ?'
        );
        $stmt->execute([$trajetId, $userId]);
        $reserved = $stmt->fetchColumn();
        if (!$reserved) {
            echo json_encode(['error' => 'Réservation introuvable']);
            exit;
        }
        // Supprimer la réservation
        $del = $pdo->prepare(
            'DELETE FROM reservations WHERE trajet_id = ? AND passager_id = ?'
        );
        $del->execute([$trajetId, $userId]);
        // Restituer les places
        $upd = $pdo->prepare(
            'UPDATE trajets SET places = places + :n WHERE id = :id'
        );
        $upd->execute([':n' => $reserved, ':id' => $trajetId]);
        echo json_encode(['success' => true, 'message' => 'Réservation annulée']);
    } else {
        // Vérifier places disponibles
        $stmt = $pdo->prepare('SELECT places FROM trajets WHERE id = ?');
        $stmt->execute([$trajetId]);
        $avail = $stmt->fetchColumn();
        if ($avail === false || $places > $avail) {
            echo json_encode(['error' => 'Pas assez de places']);
            exit;
        }
        // Vérifier double réservation
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ?'
        );
        $stmt->execute([$trajetId, $userId]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['error' => 'Déjà réservé']);
            exit;
        }
        // Insérer la réservation
        $ins = $pdo->prepare(
            'INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)'
        );
        $ins->execute([$trajetId, $userId, $places]);
        // Mettre à jour les places du trajet
        $upd = $pdo->prepare(
            'UPDATE trajets SET places = places - :n WHERE id = :id'
        );
        $upd->execute([':n' => $places, ':id' => $trajetId]);
        echo json_encode(['success' => true, 'message' => 'Réservation confirmée']);
    }
} catch (PDOException $e) {
    error_log('Erreur SQL reserver.php: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
