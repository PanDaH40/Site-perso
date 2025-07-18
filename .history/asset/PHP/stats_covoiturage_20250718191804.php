<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Nombre de covoiturages par jour (trajets planifiés ou réalisés)
    $stmt1 = $pdo->query("
        SELECT DATE(date) as jour, COUNT(*) AS nb_trajets
        FROM trajets
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(date)
        ORDER BY jour ASC
    ");
    $trajetsParJour = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    // Crédits gagnés par jour (addition des jetons de trajets terminés)
    $stmt2 = $pdo->query("
        SELECT DATE(t.date) as jour, SUM(t.jetons) AS credits_gagnes
        FROM trajets t
        WHERE t.etat_trajet = 'termine' AND t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(t.date)
        ORDER BY jour ASC
    ");
    $creditsParJour = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // Total crédits gagnés
    $stmt3 = $pdo->query("
        SELECT SUM(jetons) AS total_credits
        FROM trajets
        WHERE etat_trajet = 'termine'
    ");
    $totalCredits = $stmt3->fetchColumn() ?: 0;

    echo json_encode([
        'trajets_par_jour' => $trajetsParJour,
        'credits_par_jour' => $creditsParJour,
        'total_credits' => floatval($totalCredits),
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
}
