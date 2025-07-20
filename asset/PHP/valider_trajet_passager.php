<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int)$_SESSION['user']['id'];
$input = json_decode(file_get_contents('php://input'), true);

$reservationId = (int)($input['reservation_id'] ?? 0);
$action = $input['action'] ?? '';
$note = isset($input['note']) ? (int)$input['note'] : null;
$avis = trim($input['avis'] ?? '');
$commentaire = trim($input['commentaire'] ?? '');

if (!$reservationId || !in_array($action, ['valider', 'probleme'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètres invalides']);
    exit;
}

try {
    $pdo = new PDO(
    "mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8",
    "if0_39505571",
    "qBOSjJTyyq5Trff",
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);


    // Vérifier réservation et passager
    $stmt = $pdo->prepare("SELECT statut, trajet_id FROM reservations WHERE id = ? AND passager_id = ?");
    $stmt->execute([$reservationId, $userId]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reservation) {
        http_response_code(404);
        echo json_encode(['error' => 'Réservation introuvable']);
        exit;
    }
    if ($reservation['statut'] !== 'valide') {
        http_response_code(400);
        echo json_encode(['error' => 'Réservation non valide']);
        exit;
    }

    if ($action === 'valider') {
        // Mise à jour réservation
        $stmtUpdate = $pdo->prepare(
            "UPDATE reservations 
             SET validation_passager=1, note=?, avis=?, avis_valide=0, date_validation=NOW() 
             WHERE id=?"
        );
        $stmtUpdate->execute([
            $note ?: null,
            $avis ?: null,
            $reservationId
        ]);

        // Récupérer conducteur et passager pour insert/update dans avis
        $stmtCond = $pdo->prepare(
            "SELECT t.conducteur_id, r.passager_id FROM trajets t 
             JOIN reservations r ON t.id = r.trajet_id WHERE r.id = ?"
        );
        $stmtCond->execute([$reservationId]);
        $dataCond = $stmtCond->fetch(PDO::FETCH_ASSOC);

        if ($dataCond && $dataCond['conducteur_id'] && $dataCond['passager_id']) {
            $stmtAvis = $pdo->prepare(
                "INSERT INTO avis (utilisateur_id, auteur_id, note, commentaire, date)
                 VALUES (?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE note = VALUES(note), commentaire = VALUES(commentaire), date = VALUES(date)"
            );
            $stmtAvis->execute([
                $dataCond['conducteur_id'],   // utilisateur_id = conducteur
                $dataCond['passager_id'],     
                $note ?: null,
                $avis ?: null
            ]);
        }

    } else { // problème signalé
        if (!$commentaire) {
            http_response_code(400);
            echo json_encode(['error' => 'Merci de décrire le problème']);
            exit;
        }

        $pdo->beginTransaction();
        try {
            $pdo->prepare("UPDATE reservations SET validation_passager=-1, date_validation=NOW() WHERE id=?")
                ->execute([$reservationId]);

            // Vérifier que le conducteur existe pour la réservation
            $stmtCible = $pdo->prepare("SELECT t.conducteur_id FROM trajets t JOIN reservations r ON t.id = r.trajet_id WHERE r.id = ?");
            $stmtCible->execute([$reservationId]);
            $cible = $stmtCible->fetchColumn();

            if (!$cible) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['error' => 'Impossible de trouver le conducteur lié à la réservation']);
                exit;
            }

            $pdo->prepare(
                "INSERT INTO signalements 
                 (signale_par, cible, type, motif, description, traite, date_signalement)
                 VALUES (?, ?, 'trajet', 'Problème trajet', ?, 0, NOW())"
            )->execute([
                $userId, $cible, $commentaire
            ]);

            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de l\'enregistrement du signalement', 'debug' => $e->getMessage()]);
            exit;
        }

        // Notification admins
        $admins = $pdo->query("SELECT email FROM inscrits WHERE admin=1")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($admins as $mailadmin) {
            @mail($mailadmin, "Trajet signalé", "Un problème a été signalé sur une réservation. Merci de consulter l'administration.");
        }
    }

    // Après validation, vérifier si tous les passagers ont validé
    if ($action === 'valider') {
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) FROM reservations 
             WHERE trajet_id=? AND statut='valide' AND (validation_passager IS NULL OR validation_passager!=1)"
        );
        $stmt->execute([$reservation['trajet_id']]);
        if ((int)$stmt->fetchColumn() === 0) {
            $stmt = $pdo->prepare("SELECT jetons, conducteur_id FROM trajets WHERE id=?");
            $stmt->execute([$reservation['trajet_id']]);
            $trajet = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($trajet) {
                $pdo->prepare("UPDATE inscrits SET credits = credits + ? WHERE id = ?")
                    ->execute([$trajet['jetons'], $trajet['conducteur_id']]);

                $stmtCond = $pdo->prepare("SELECT email, prenom FROM inscrits WHERE id = ?");
                $stmtCond->execute([$trajet['conducteur_id']]);
                $conducteur = $stmtCond->fetch(PDO::FETCH_ASSOC);

                if ($conducteur && !empty($conducteur['email'])) {
                    $to = $conducteur['email'];
                    $subject = "Vos crédits ont été mis à jour sur EcoRide";
                    $message = "Bonjour {$conducteur['prenom']},\n\nTous les passagers ont validé votre trajet. Vos crédits ont été crédités de +{$trajet['jetons']} jetons.\nMerci d'utiliser EcoRide.";
                    $headers = "From: no-reply@ecoride.example.com\r\nContent-Type: text/plain; charset=UTF-8\r\n";
                    mail($to, $subject, $message, $headers);
                }
            }
        }
    }

    echo json_encode(['success' => true, 'message' => 'Validation enregistrée.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
