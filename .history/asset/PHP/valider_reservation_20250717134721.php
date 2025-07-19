<?php
// valider_reservation.php
// Validation d'une demande de réservation : 
// -> prélève 2 jetons commission + prix du trajet au passager, crédite le conducteur

session_start();
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Vérifie que l'utilisateur est connecté
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int)$_SESSION['user']['id'];

// Récupère et valide les données reçues en JSON
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

    // On verrouille la réservation pour éviter toute modification simultanée
    $stmt = $pdo->prepare("
        SELECT r.trajet_id, r.places_reservees, r.statut, t.conducteur_id, t.places,
            (SELECT COALESCE(SUM(CASE WHEN statut = 'valide' THEN places_reservees ELSE 0 END),0) FROM reservations WHERE trajet_id = t.id) AS places_deja_reservees,
            r.passager_id
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

    // Seul le conducteur du trajet peut valider/refuser
    if ($res['conducteur_id'] !== $userId) {
        $pdo->rollBack();
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }

    // On ne traite que les réservations en attente
    if ($res['statut'] !== 'en_attente') {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['error' => 'Cette demande a déjà été traitée']);
        exit;
    }

    if ($action === 'accepter') {
        // 1. Vérifie qu'il reste assez de places à valider
        $places_restantes = $res['places'] - $res['places_deja_reservees'];
        if ($res['places_reservees'] > $places_restantes) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Pas assez de places disponibles pour valider cette réservation']);
            exit;
        }

        // 2. Récupère le prix (en jetons) du trajet
        $stmtJetons = $pdo->prepare("SELECT jetons FROM trajets WHERE id = ?");
        $stmtJetons->execute([$res['trajet_id']]);
        $jetons_trajet = (int)$stmtJetons->fetchColumn();

        // 3. Vérifie que le passager a assez de crédits
        $stmtCredits = $pdo->prepare("SELECT credits FROM inscrits WHERE id = ?");
        $stmtCredits->execute([$res['passager_id']]);
        $credits = (int)$stmtCredits->fetchColumn();

        $total_a_deduire = 2 + $jetons_trajet; // 2 commission + jetons du trajet

        if ($credits < $total_a_deduire) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Crédits insuffisants pour confirmer la réservation']);
            exit;
        }

        // 4. Valide la réservation
        $stmtUpdate = $pdo->prepare("UPDATE reservations SET statut = 'valide' WHERE id = ?");
        $stmtUpdate->execute([$reservationId]);

        // 5. Déduit les crédits du passager
        $stmtDeductCredits = $pdo->prepare("UPDATE inscrits SET credits = credits - ? WHERE id = ?");
        $stmtDeductCredits->execute([$total_a_deduire, $res['passager_id']]);

        // 6. Verse les jetons du trajet au conducteur
        $stmtAddCredits = $pdo->prepare("UPDATE inscrits SET credits = credits + ? WHERE id = ?");
        $stmtAddCredits->execute([$jetons_trajet, $res['conducteur_id']]);

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Réservation acceptée']);
    } else { // Refuser la demande
        $stmtUpdate = $pdo->prepare("UPDATE reservations SET statut = 'annule' WHERE id = ?");
        $stmtUpdate->execute([$reservationId]);

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Réservation refusée']);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Erreur serveur valider_reservation.php : ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
