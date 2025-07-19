<?php
session_start();
header('Content-Type: application/json');

// Ici, tu peux ajouter une vérif admin, exemple :
// if (!isset($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
//     http_response_code(403);
//     echo json_encode(['error' => 'Accès refusé']);
//     exit;
// }

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $stmt = $pdo->prepare("
        SELECT s.id, s.signale_par, s.type, s.motif, s.description, s.statut, s.date_signalement,
               u.prenom AS nom_utilisateur, u.email AS email_utilisateur
        FROM signalements s
        LEFT JOIN inscrits u ON s.signale_par = u.id
        ORDER BY s.date_signalement DESC
    ");
    $stmt->execute();
    $signalements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($signalements);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
