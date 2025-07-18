<?php
session_start();
header('Content-Type: application/json');

// Connexion BD
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root', '',
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

        // On récupère la réservation
        $stmt = $pdo->prepare('SELECT statut, trajet_id, passager_id FROM reservations WHERE id = ? AND passager_id = ?');
        $stmt->execute([$reservationId, $userId]);
        $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$reservation) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Réservation introuvable']);
            exit;
        }

        // Si la réservation était "valide", remboursement
        if ($reservation['statut'] === 'valide') {
            $stmt = $pdo->prepare('SELECT conducteur_id, jetons FROM trajets WHERE id = ?');
            $stmt->execute([$reservation['trajet_id']]);
            $trajet = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($trajet) {
                // Retire les jetons du conducteur
                $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits - ? WHERE id = ?');
                $stmt->execute([$trajet['jetons'], $trajet['conducteur_id']]);
                // Rend les jetons au passager
                $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits + ? WHERE id = ?');
                $stmt->execute([$trajet['jetons'], $reservation['passager_id']]);
            }
            // La commission (2 jetons) N'EST PAS remboursée
        }

        // Supprime la réservation
        $del = $pdo->prepare('DELETE FROM reservations WHERE id = ? AND passager_id = ?');
        $del->execute([$reservationId, $userId]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Réservation annulée, jetons remboursés si réservation validée'
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
    exit;
}

// --- Cas 2 : Annulation du trajet par le conducteur (=> annulation pour tous + mail) ---
if (isset($input['annuler_trajet_id'])) {
    $trajetId = intval($input['annuler_trajet_id']);
    if ($trajetId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de trajet invalide']);
        exit;
    }

    // Vérifier que c'est bien le conducteur qui annule
    $stmt = $pdo->prepare('SELECT conducteur_id, depart, arrivee, date, heure FROM trajets WHERE id = ?');
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
            SELECT i.email, i.prenom, i.nom, r.id AS reservation_id, r.passager_id, t.jetons
            FROM reservations r
            JOIN inscrits i ON i.id = r.passager_id
            JOIN trajets t ON t.id = r.trajet_id
            WHERE r.trajet_id = ? AND r.statut = 'valide'
        ");
        $stmt->execute([$trajetId]);
        $passagers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Rembourse et annule chaque réservation
        foreach ($passagers as $p) {
            // Rembourse passager
            $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits + ? WHERE id = ?');
            $stmt->execute([$p['jetons'], $p['passager_id']]);
            // Retire jetons conducteur
            $stmt = $pdo->prepare('UPDATE inscrits SET credits = credits - ? WHERE id = ?');
            $stmt->execute([$p['jetons'], $userId]);
            // Annule réservation
            $del = $pdo->prepare('DELETE FROM reservations WHERE id = ?');
            $del->execute([$p['reservation_id']]);
        }

        // Supprimer (ou update statut) du trajet
        $delT = $pdo->prepare('DELETE FROM trajets WHERE id = ?');
        $delT->execute([$trajetId]);

        $pdo->commit();

        // Envoi des emails après commit
        foreach ($passagers as $p) {
            $to = $p['email'];
            $subject = "Annulation de votre covoiturage";
            $dateStr = date('d/m/Y à H:i', strtotime($trajet['date'] . ' ' . $trajet['heure']));
            $message = "Bonjour {$p['prenom']},\n\nLe conducteur vient d'annuler le trajet du $dateStr entre {$trajet['depart']} et {$trajet['arrivee']}.\n\nVous avez été remboursé des jetons dépensés.\n\nNous sommes désolés pour ce désagrément.\n\nL'équipe Covoiturage";
            $headers = "From: noreply@votre-site.fr\r\nReply-To: contact@votre-site.fr";
            @mail($to, $subject, $message, $headers);
        }

        echo json_encode([
            'success' => true,
            'message' => "Trajet annulé. Tous les passagers ont été informés par email."
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
