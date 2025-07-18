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
    $stmt = $pdo->prepare("SELECT date, heure, depart, arrivee FROM trajets WHERE id = ? AND conducteur_id = ?");
    $stmt->execute([$id, $userId]);
    $trajet = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trajet) {
        echo json_encode(['error' => 'Trajet introuvable ou non autorisé']);
        exit;
    }

    // Récupérer les passagers avec réservation validée pour ce trajet
    $stmtPassagers = $pdo->prepare("
        SELECT i.prenom, i.email
        FROM reservations r
        JOIN inscrits i ON r.passager_id = i.id
        WHERE r.trajet_id = ? AND r.statut = 'valide'
    ");
    $stmtPassagers->execute([$id]);
    $passagers = $stmtPassagers->fetchAll(PDO::FETCH_ASSOC);

    // Préparer infos trajet pour mail
    $trajetDesc = "trajet du " . date('d/m/Y', strtotime($trajet['date'])) . " de " . $trajet['depart'] . " à " . $trajet['arrivee'] . " à " . substr($trajet['heure'], 0, 5);

    // Envoi mail d'annulation à chaque passager
    foreach ($passagers as $passager) {
        $to = $passager['email'];
        $prenom = $passager['prenom'];
        $subject = "Annulation de votre trajet EcoRide";

        $message = "Bonjour $prenom,\n\n";
        $message .= "Nous vous informons que le conducteur a annulé le $trajetDesc.\n";
        $message .= "Votre réservation a été annulée automatiquement.\n\n";
        $message .= "Nous sommes désolés pour ce désagrément.\n";
        $message .= "Cordialement,\nL'équipe EcoRide";

        $headers = "From: no-reply@ecoride.example.com\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

        @mail($to, $subject, $message, $headers);
    }

    // Supprimer les réservations associées
    $pdo->prepare("DELETE FROM reservations WHERE trajet_id = ?")->execute([$id]);

    // Supprimer le trajet
    $stmtDel = $pdo->prepare("DELETE FROM trajets WHERE id = ?");
    $stmtDel->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Trajet annulé et participants notifiés']);

} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB : ' . $e->getMessage()]);
}
