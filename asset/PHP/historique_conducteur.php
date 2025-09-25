<?php
// historique_conducteur.php
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/db_conn.php';
} catch (Throwable $e) {
    echo json_encode(['error' => 'Erreur connexion BD']); exit;
}

$conducteurId = $_GET['id'] ?? null;
if (!$conducteurId) {
    echo json_encode(['error' => 'ID conducteur manquant']);
    exit;
}

// Liste des trajets terminés par le conducteur
try {
    $sql = "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.jetons,
            (SELECT COUNT(*) FROM reservations r WHERE r.trajet_id = t.id AND r.statut = 'valide') AS nb_passagers
            FROM trajets t
            WHERE t.conducteur_id = ? AND t.etat_trajet = 'termine'
            ORDER BY t.date DESC, t.heure DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$conducteurId]);
    $trajets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['trajets' => $trajets]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur serveur']);
}
