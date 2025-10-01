<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['admin']) || $_SESSION['user']['admin'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

try {
    require_once __DIR__ . '/db_conn.php';

    // Générer la liste des 30 derniers jours (format YYYY-MM-DD)
    $dates = [];
    for ($i = 29; $i >= 0; $i--) {
        $dates[] = date('Y-m-d', strtotime("-$i days"));
    }

    // Nombre de trajets par jour sur les 30 derniers jours
    $stmt1 = $pdo->prepare("
        SELECT DATE(date) AS jour, COUNT(*) AS nb_trajets
        FROM trajets
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(date)
        ORDER BY DATE(date)
    ");
    $stmt1->execute();
    $rawTrajets = $stmt1->fetchAll(PDO::FETCH_KEY_PAIR);

    // Crédits gagnés par jour (trajets terminés) sur 30 derniers jours
    $stmt2 = $pdo->prepare("
        SELECT DATE(date) AS jour, SUM(jetons) AS credits_gagnes
        FROM trajets
        WHERE etat_trajet = 'termine' AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(date)
        ORDER BY DATE(date)
    ");
    $stmt2->execute();
    $rawCredits = $stmt2->fetchAll(PDO::FETCH_KEY_PAIR);

    // Total crédits gagnés (sur tous les trajets terminés)
    $stmt3 = $pdo->query("
        SELECT SUM(jetons) AS total_credits
        FROM trajets
        WHERE etat_trajet = 'termine'
    ");
    $totalCredits = $stmt3->fetchColumn() ?: 0;

    // Construire les séries complètes alignées sur les dates
    $trajetsParJour = [];
    $creditsParJour = [];

    foreach ($dates as $date) {
        $trajetsParJour[] = [
            'jour' => $date,
            'nb_trajets' => isset($rawTrajets[$date]) ? (int)$rawTrajets[$date] : 0
        ];
        $creditsParJour[] = [
            'jour' => $date,
            'credits_gagnes' => isset($rawCredits[$date]) ? (float)$rawCredits[$date] : 0
        ];
    }

    echo json_encode([
        'dates' => $dates,
        'trajets_par_jour' => $trajetsParJour,
        'credits_par_jour' => $creditsParJour,
        'total_credits' => (float)$totalCredits,
    ]);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    // En prod, remplacer 'debug' par un message générique
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
    exit;
}
