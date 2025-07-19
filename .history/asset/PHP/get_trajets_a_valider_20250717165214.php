<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = (int)$_SESSION['user']['id'];

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','',[
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $stmt = $pdo->prepare("
        SELECT t.id AS trajet_id, t.date, t.heure, t.depart, t.arrivee, r.id AS reservation_id
        FROM reservations r
        JOIN trajets t ON r.trajet_id = t.id
        WHERE r.passager_id = ?
          AND t.etat_trajet = 'termine'
          AND r.statut = 'valide'
          AND (r.validation_passager IS NULL OR r.validation_passager = 0)
        ORDER BY t.date DESC, t.heure DESC
    ");
    $stmt->execute([$userId]);
    $trajets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['trajets_a_valider' => $trajets]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
