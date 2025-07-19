<?php
// reserver.php
// Gère la création et l'annulation de réservations, et met à jour le nombre de places disponibles

session_start();
header('Content-Type: application/json');

// Vérifier que l'utilisateur est connecté
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}
$userId = $_SESSION['user']['id'];

// Récupérer et valider les données JSON\:$input = json_decode(file_get_contents('php://input'), true) ?: [];
$trajetId = isset($input['trajet_id']) ? intval($input['trajet_id']) : 0;
$places   = isset($input['places']) ? intval($input['places']) : 0;
$action   = isset($input['action']) ? $input['action'] : 'reserve';

if ($trajetId <= 0 || $places <= 0) {
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

// Connexion à la base de données
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
    $pdo->beginTransaction();

    // Verrouiller la ligne pour éviter race condition
    $lock = $pdo->prepare('SELECT places FROM trajets WHERE id = ? FOR UPDATE');
    $lock->execute([$trajetId]);
    $current = $lock->fetchColumn();
    if ($current === false) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Trajet non trouvé']);
        exit;
    }

    if ($action === 'cancel') {
        // Annulation : récupérer la réservation
        $stmt = $pdo->prepare(
            'SELECT places_reservees FROM reservations WHERE trajet_id = ? AND passager_id = ?'
        );
        $stmt->execute([$trajetId, $userId]);
        $reserved = $stmt->fetchColumn();
        if (!$reserved) {
            $pdo->rollBack();
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
            'UPDATE trajets SET places = places + ? WHERE id = ?'
        );
        $upd->execute([$reserved, $trajetId]);
        $message = 'Réservation annulée';
    } else {
        // Réservation
        if ($places > (int)$current) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Pas assez de places disponibles']);
            exit;
        }
        // Empêcher double réservation
        $chk = $pdo->prepare(
            'SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ?'
        );
        $chk->execute([$trajetId, $userId]);
        if ($chk->fetchColumn() > 0) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Déjà réservé']);
            exit;
        }
        // Insérer
        $ins = $pdo->prepare(
            'INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)'
        );
        $ins->execute([$trajetId, $userId, $places]);
        // Décrémenter
        $upd = $pdo->prepare(
            'UPDATE trajets SET places = places - ? WHERE id = ?'
        );
        $upd->execute([$places, $trajetId]);
        $message = 'Réservation confirmée';
    }

    $pdo->commit();

    // Récupérer le nouveau solde
    $stmt = $pdo->prepare('SELECT places FROM trajets WHERE id = ?');
    $stmt->execute([$trajetId]);
    $new = (int)$stmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'message' => $message,
        'places_restantes' => $new
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Erreur SQL reserver.php: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
