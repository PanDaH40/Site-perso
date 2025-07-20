<?php
// valider_reservation.php
// Validation d'une demande de réservation : 
// -> prélève 2 jetons commission + prix du trajet au passager, crédite le conducteur
// -> envoie un mail au passager pour l'informer

session_start();
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
    $pdo = new PDO("mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8", "if0_39505571", "qBOSjJTyyq5Trff", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données']);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT r.trajet_id, r.places_reservees, r.statut, t.conducteur_id, t.places,
            (SELECT COALESCE(SUM(CASE WHEN statut = 'valide' THEN places_reservees ELSE 0 END),0) FROM reservations WHERE trajet_id = t.id) AS places_deja_reservees,
            r.passager_id,
            i.email, i.prenom
        FROM reservations r
        JOIN trajets t ON r.trajet_id = t.id
        JOIN inscrits i ON r.passager_id = i.id
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

    $mailSubject = '';
    $mailMessage = '';

    if ($action === 'accepter') {
        $places_restantes = $res['places'] - $res['places_deja_reservees'];
        if ($res['places_reservees'] > $places_restantes) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Pas assez de places disponibles pour valider cette réservation']);
            exit;
        }

        $stmtJetons = $pdo->prepare("SELECT jetons FROM trajets WHERE id = ?");
        $stmtJetons->execute([$res['trajet_id']]);
        $jetons_trajet = (int)$stmtJetons->fetchColumn();

        $stmtCredits = $pdo->prepare("SELECT credits FROM inscrits WHERE id = ?");
        $stmtCredits->execute([$res['passager_id']]);
        $credits = (int)$stmtCredits->fetchColumn();

        $total_a_deduire = 2 + $jetons_trajet;

        if ($credits < $total_a_deduire) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Crédits insuffisants pour confirmer la réservation']);
            exit;
        }

        $stmtUpdate = $pdo->prepare("UPDATE reservations SET statut = 'valide' WHERE id = ?");
        $stmtUpdate->execute([$reservationId]);

        $stmtDeductCredits = $pdo->prepare("UPDATE inscrits SET credits = credits - ? WHERE id = ?");
        $stmtDeductCredits->execute([$total_a_deduire, $res['passager_id']]);

        $stmtAddCredits = $pdo->prepare("UPDATE inscrits SET credits = credits + ? WHERE id = ?");
        $stmtAddCredits->execute([$jetons_trajet, $res['conducteur_id']]);

        $mailSubject = "Votre réservation a été acceptée";
        $mailMessage = "Bonjour " . $res['prenom'] . ",\n\n"
                     . "Votre réservation pour le trajet a été acceptée par le conducteur.\n"
                     . "Merci d'utiliser notre service.\n\nL'équipe EcoRide";

    } else { // action = 'refuser'
        $stmtUpdate = $pdo->prepare("UPDATE reservations SET statut = 'annule' WHERE id = ?");
        $stmtUpdate->execute([$reservationId]);

        $mailSubject = "Votre réservation a été refusée";
        $mailMessage = "Bonjour " . $res['prenom'] . ",\n\n"
                     . "Malheureusement, votre demande de réservation a été refusée par le conducteur.\n"
                     . "Vous ne serez pas débité.\n\nL'équipe EcoRide";
    }

    $pdo->commit();

    // Envoi du mail
    $to = $res['email'];
    $headers = "From: no-reply@ecoride.example.com\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    mail($to, $mailSubject, $mailMessage, $headers);

    echo json_encode(['success' => true, 'message' => 'Réservation ' . ($action === 'accepter' ? 'acceptée' : 'refusée')]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Erreur serveur valider_reservation.php : ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
