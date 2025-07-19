<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];

$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;

    if (!$id) {
        echo json_encode(['error' => 'ID manquant']);
        exit;
    }

    // Vérifie que le trajet appartient à l'utilisateur
    $check = $pdo->prepare("SELECT id FROM trajets WHERE id = ? AND conducteur_id = ?");
    $check->execute([$id, $userId]);
    if (!$check->fetch()) {
        echo json_encode(['error' => 'Trajet introuvable ou non autorisé']);
        exit;
    }

    $pdo->beginTransaction();

    // Récupérer réservations validées associées au trajet
    $stmtResa = $pdo->prepare("
        SELECT r.id, r.passager_id, r.places_reservees, t.jetons, i.email, i.prenom
        FROM reservations r
        JOIN trajets t ON r.trajet_id = t.id
        JOIN inscrits i ON r.passager_id = i.id
        WHERE r.trajet_id = ? AND r.statut = 'valide'
    ");
    $stmtResa->execute([$id]);
    $reservations = $stmtResa->fetchAll(PDO::FETCH_ASSOC);

    foreach ($reservations as $resa) {
        // Calcul montant à rembourser (jetons * places + commission 2 jetons par place)
        $montantRembourse = ($resa['jetons'] * $resa['places_reservees']) + (2 * $resa['places_reservees']);

        // Créditer passager
        $stmtCredit = $pdo->prepare("UPDATE inscrits SET credits = credits + ? WHERE id = ?");
        $stmtCredit->execute([$montantRembourse, $resa['passager_id']]);

        // Mettre à jour réservation en annulé
        $stmtAnnule = $pdo->prepare("UPDATE reservations SET statut = 'annule' WHERE id = ?");
        $stmtAnnule->execute([$resa['id']]);

        // Envoyer mail de notification de remboursement
        $to = $resa['email'];
        $subject = "Annulation de votre réservation";
        $message = "Bonjour " . $resa['prenom'] . ",\n\n"
                 . "Le conducteur a annulé le trajet que vous aviez réservé.\n"
                 . "Votre réservation a été annulée et vos crédits ont été remboursés.\n\n"
                 . "Merci de votre compréhension.\n\nL'équipe EcoRide";
        $headers = "From: no-reply@ecoride.example.com\r\nContent-Type: text/plain; charset=UTF-8\r\n";
        mail($to, $subject, $message, $headers);
    }

    // Supprimer toutes les réservations associées (même celles en attente/refusées)
    $pdo->prepare("DELETE FROM reservations WHERE trajet_id = ?")->execute([$id]);

    // Supprimer le trajet
    $stmt = $pdo->prepare("DELETE FROM trajets WHERE id = ?");
    $stmt->execute([$id]);

    $pdo->commit();

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['error' => 'Erreur DB : ' . $e->getMessage()]);
}
