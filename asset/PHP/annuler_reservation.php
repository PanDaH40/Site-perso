<?php
session_start();
header('Content-Type: application/json');

// Connexion BD
try {
    $pdo = new PDO(
        'mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8',
        'if0_39505571', 'qBOSjJTyyq5Trff',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de se connecter à la base']);
    exit;
}

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int) $_SESSION['user']['id'];

$input = json_decode(file_get_contents('php://input'), true);

// --- Cas 1 : Annulation d’une réservation par un passager ---
if (isset($input['id'])) {
    $reservationId = intval($input['id']);

    if ($reservationId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de réservation invalide']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // On récupère la réservation avec infos passager et trajet
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

        // Si la réservation était "valide", remboursement complet (prix + commission)
        if ($reservation['statut'] === 'valide') {
            $places = (int)$reservation['places_reservees'];
            $jetons_trajet = (int)$reservation['jetons'];
            $commission = 2;
            $total_jetons = $places * ($jetons_trajet + $commission);
            $jetons_conducteur = $places * $jetons_trajet;

            // Retire les jetons du conducteur (prix trajet * places)
            $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits - ? WHERE id = ?');
            $stmt->execute([$jetons_conducteur, $reservation['conducteur_id']]);
            // Rend les jetons + commission au passager
            $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits + ? WHERE id = ?');
            $stmt->execute([$total_jetons, $reservation['passager_id']]);
        }

        // Supprime la réservation
        $del = $pdo->prepare('DELETE FROM reservations WHERE id = ? AND passager_id = ?');
        $del->execute([$reservationId, $userId]);

        $pdo->commit();

        // Envoi mail au passager pour informer de l’annulation et remboursement
        $to = $reservation['email'];
        $subject = "Annulation de votre réservation de covoiturage";
        $dateStr = date('d/m/Y à H:i', strtotime($reservation['date'] . ' ' . $reservation['heure']));
        $message = "Bonjour " . $reservation['prenom'] . ",\n\n"
                 . "Vous avez annulé votre réservation pour le trajet du $dateStr entre "
                 . "{$reservation['depart']} et {$reservation['arrivee']}.\n"
                 . "Si votre réservation était validée, vous avez été remboursé des jetons dépensés (prix + commission).\n\n"
                 . "Merci d'avoir utilisé notre service.\n\nL'équipe Covoiturage";
        $headers = "From: noreply@votre-site.fr\r\nReply-To: contact@votre-site.fr\r\nContent-Type: text/plain; charset=UTF-8";

        @mail($to, $subject, $message, $headers);

        echo json_encode([
            'success' => true,
            'message' => 'Réservation annulée, jetons remboursés si réservation validée. Un email de confirmation vous a été envoyé.'
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// --- Cas 2 : Annulation du trajet par le conducteur (=> annulation pour tous + mail + remboursement complet) ---
if (isset($input['annuler_trajet_id'])) {
    $trajetId = intval($input['annuler_trajet_id']);
    if ($trajetId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de trajet invalide']);
        exit;
    }

    // Vérifier que c'est bien le conducteur qui annule
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

        // Récupère les passagers à prévenir (réservations validées)
        $stmt = $pdo->prepare("
            SELECT i.email, i.prenom, i.nom, r.id AS reservation_id, r.passager_id, r.places_reservees
            FROM reservations r
            JOIN inscrits i ON i.id = r.passager_id
            WHERE r.trajet_id = ? AND r.statut = 'valide'
        ");
        $stmt->execute([$trajetId]);
        $passagers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $jetons_trajet = (int)$trajet['jetons'];
        $commission = 2;

        // Préparer les requêtes à l'avance
        $stmtUpdateCreditsPassager = $pdo->prepare('UPDATE inscrits SET credits = credits + ? WHERE id = ?');
        $stmtUpdateCreditsConducteur = $pdo->prepare('UPDATE inscrits SET credits = credits - ? WHERE id = ?');
        $stmtUpdateReservation = $pdo->prepare('UPDATE reservations SET statut = "annule" WHERE id = ?');

        foreach ($passagers as $p) {
            $places = (int)$p['places_reservees'];
            $totalRembourse = $places * ($jetons_trajet + $commission);
            $totalDebitConducteur = $places * $jetons_trajet;

            // Rembourse passager (prix + commission)
            $stmtUpdateCreditsPassager->execute([$totalRembourse, $p['passager_id']]);
            // Débite conducteur (uniquement prix trajet)
            $stmtUpdateCreditsConducteur->execute([$totalDebitConducteur, $userId]);
            // Annule réservation
            $stmtUpdateReservation->execute([$p['reservation_id']]);
        }

        // Met à jour le trajet en état "annule"
        $stmtUpdateTrajet = $pdo->prepare('UPDATE trajets SET etat_trajet = "annule" WHERE id = ?');
        $stmtUpdateTrajet->execute([$trajetId]);

        $pdo->commit();

        // Envoi des emails après commit
        foreach ($passagers as $p) {
            $to = $p['email'];
            $subject = "Annulation de votre covoiturage";
            $dateStr = date('d/m/Y à H:i', strtotime($trajet['date'] . ' ' . $trajet['heure']));
            $message = "Bonjour {$p['prenom']},\n\nLe conducteur a annulé le trajet du $dateStr entre {$trajet['depart']} et {$trajet['arrivee']}.\n\n"
                     . "Vous avez été remboursé des jetons dépensés (prix + commission).\n\nNous sommes désolés pour ce désagrément.\n\nL'équipe Covoiturage";
            $headers = "From: noreply@votre-site.fr\r\nReply-To: contact@votre-site.fr\r\nContent-Type: text/plain; charset=UTF-8";
            @mail($to, $subject, $message, $headers);
        }

        echo json_encode([
            'success' => true,
            'message' => "Trajet annulé. Tous les passagers ont été informés par email et remboursés."
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// --- Cas sans paramètre reconnu ---
http_response_code(400);
echo json_encode(['error' => 'Paramètre manquant (id ou annuler_trajet_id)']);
