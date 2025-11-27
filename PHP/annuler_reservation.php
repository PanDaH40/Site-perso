<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_conn.php';

// -------------------------
// Vérification utilisateur
// -------------------------
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int) $_SESSION['user']['id'];


// ----------------------------------------------------
// RÉCUPÉRATION HYBRIDE : FormData OU JSON
// ----------------------------------------------------
$raw = file_get_contents("php://input");
$json = json_decode($raw, true);

$id               = $_POST['id']                ?? ($json['id']                ?? null);
$annulerTrajetId  = $_POST['annuler_trajet_id'] ?? ($json['annuler_trajet_id'] ?? null);


// ==========================================================================
// CAS 1 : Annulation d’une réservation par le passager
// ==========================================================================
if ($id !== null) {

    $reservationId = intval($id);

    if ($reservationId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de réservation invalide']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Récupération de la réservation
        $stmt = $pdo->prepare('
            SELECT r.statut, r.trajet_id, r.passager_id, r.places_reservees, i.email, i.prenom,
                   t.conducteur_id, t.depart, t.arrivee, t.date, t.heure, t.jetons
            FROM reservations r
            JOIN inscrits i ON i.id = r.passager_id
            JOIN trajets t ON t.id = r.trajet_id
            WHERE r.id = ? AND r.passager_id = ?
        ');
        $stmt->execute([$reservationId, $userId]);
        $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$reservation) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Réservation introuvable']);
            exit;
        }

        // Remboursement si réservation validée
        if ($reservation['statut'] === 'valide') {
            $places = (int)$reservation['places_reservees'];
            $jetonsTrajet = (int)$reservation['jetons'];
            $commission = 2;

            $totalJetons = $places * ($jetonsTrajet + $commission);
            $jetonsConducteur = $places * $jetonsTrajet;

            // Retire jetons conducteur
            $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits - ? WHERE id = ?');
            $stmt->execute([$jetonsConducteur, $reservation['conducteur_id']]);

            // Rembourse passager
            $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits + ? WHERE id = ?');
            $stmt->execute([$totalJetons, $reservation['passager_id']]);
        }

        // Suppression de la réservation
        $del = $pdo->prepare('DELETE FROM reservations WHERE id = ? AND passager_id = ?');
        $del->execute([$reservationId, $userId]);

        $pdo->commit();

        // Email d’annulation
        $to = $reservation['email'];
        $subject = "Annulation de votre réservation de covoiturage";
        $dateStr = date('d/m/Y à H:i', strtotime($reservation['date'] . ' ' . $reservation['heure']));
        $message = "Bonjour {$reservation['prenom']},\n\n"
                 . "Vous avez annulé votre réservation pour le trajet du $dateStr.\n"
                 . "Un remboursement a été effectué si la réservation était validée.\n\n"
                 . "Merci d'utiliser EcoRide.\n";

        @mail($to, $subject, $message,
            "From: noreply@ecoride.fr\r\nContent-Type: text/plain; charset=UTF-8");

        echo json_encode([
            'success' => true,
            'message' => 'Réservation annulée. Remboursement effectué si applicable.'
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }

    exit;
}



// ==========================================================================
// CAS 2 : Annulation complète d’un trajet par le conducteur
// ==========================================================================
if ($annulerTrajetId !== null) {

    $trajetId = intval($annulerTrajetId);

    if ($trajetId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de trajet invalide']);
        exit;
    }

    // Vérifier que c'est bien le conducteur
    $stmt = $pdo->prepare('SELECT conducteur_id, depart, arrivee, date, heure, jetons FROM trajets WHERE id = ?');
    $stmt->execute([$trajetId]);
    $trajet = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trajet || $trajet['conducteur_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Seul le conducteur peut annuler ce trajet']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Récupère les passagers (réservations validées)
        $stmt = $pdo->prepare("
            SELECT i.email, i.prenom, r.id AS reservation_id, r.passager_id, r.places_reservees
            FROM reservations r
            JOIN inscrits i ON i.id = r.passager_id
            WHERE r.trajet_id = ? AND r.statut = 'valide'
        ");
        $stmt->execute([$trajetId]);
        $passagers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $commission = 2;
        $jetonsTrajet = (int)$trajet['jetons'];

        $stmtRemboursePassager = $pdo->prepare('UPDATE inscrits SET credits = credits + ? WHERE id = ?');
        $stmtDebitConducteur = $pdo->prepare('UPDATE inscrits SET credits = credits - ? WHERE id = ?');
        $stmtUpdateRes = $pdo->prepare('UPDATE reservations SET statut="annule" WHERE id=?');

        foreach ($passagers as $p) {
            $places = (int)$p['places_reservees'];

            $remboursement = $places * ($jetonsTrajet + $commission);
            $debitConducteur = $places * $jetonsTrajet;

            $stmtRemboursePassager->execute([$remboursement, $p['passager_id']]);
            $stmtDebitConducteur->execute([$debitConducteur, $userId]);
            $stmtUpdateRes->execute([$p['reservation_id']]);
        }

        // Marquer trajet annulé
        $stmtTrajet = $pdo->prepare('UPDATE trajets SET etat_trajet="annule" WHERE id=?');
        $stmtTrajet->execute([$trajetId]);

        $pdo->commit();

        // Email post-commit
        foreach ($passagers as $p) {
            $to = $p['email'];
            $subject = "Annulation de votre trajet EcoRide";
            $dateStr = date('d/m/Y à H:i', strtotime($trajet['date'] . ' ' . $trajet['heure']));
            $message = "Bonjour {$p['prenom']},\n\n"
                     . "Le conducteur a annulé le trajet du $dateStr entre {$trajet['depart']} et {$trajet['arrivee']}.\n"
                     . "Vous avez été remboursé intégralement.\n\nEcoRide.";

            @mail($to, $subject, $message,
                "From: noreply@ecoride.fr\r\nContent-Type: text/plain; charset=UTF-8");
        }

        echo json_encode([
            'success' => true,
            'message' => 'Trajet annulé. Passagers informés et remboursés.'
        ]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }

    exit;
}


// ==========================================================================
// CAS SANS PARAMÈTRE RECONNU
// ==========================================================================
http_response_code(400);
echo json_encode(['error' => 'Paramètre manquant (id ou annuler_trajet_id)']);
