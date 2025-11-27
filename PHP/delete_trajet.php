<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];

try {
    $pdo = new PDO(
        "mysql:host=ecoridt815.mysql.db;dbname=ecoridt815;charset=utf8",
        "ecoridt815",
        "Thebigdu40",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Accepte JSON OU FormData
    $input = json_decode(file_get_contents('php://input'), true);
    if (is_array($input)) {
        $id = $input['id'] ?? null;
    } else {
        $id = $_POST['id'] ?? null;
    }

    if (!$id) {
        echo json_encode(['error' => 'ID manquant']);
        exit;
    }

    // Vérifier qu'on a le droit de supprimer ce trajet
    $stmt = $pdo->prepare("SELECT date, heure, depart, arrivee FROM trajets WHERE id = ? AND conducteur_id = ?");
    $stmt->execute([$id, $userId]);
    $trajet = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trajet) {
        echo json_encode(['error' => 'Trajet introuvable ou non autorisé']);
        exit;
    }

    // Récupérer les passagers validés
    $stmtPassagers = $pdo->prepare("
        SELECT i.prenom, i.email
        FROM reservations r
        JOIN inscrits i ON r.passager_id = i.id
        WHERE r.trajet_id = ? AND r.statut = 'valide'
    ");
    $stmtPassagers->execute([$id]);
    $passagers = $stmtPassagers->fetchAll(PDO::FETCH_ASSOC);

    // Mail
    $trajetDesc = "trajet du " . date('d/m/Y', strtotime($trajet['date'])) . " de " . $trajet['depart'] . " à " . $trajet['arrivee'];

    foreach ($passagers as $p) {
        $to = $p['email'];
        $prenom = $p['prenom'];

        $subject = "Annulation de votre trajet EcoRide";
        $message = "Bonjour $prenom,\n\nLe conducteur a annulé le $trajetDesc.\nVotre réservation est annulée.\n\nL'équipe EcoRide";
        $headers = "From: no-reply@ecoride.example.com\r\nContent-Type: text/plain; charset=UTF-8\r\n";

        @mail($to, $subject, $message, $headers);
    }

    // Suppression
    $pdo->prepare("DELETE FROM reservations WHERE trajet_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM trajets WHERE id = ?")->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Trajet supprimé et participants notifiés']);

} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB : ' . $e->getMessage()]);
}
