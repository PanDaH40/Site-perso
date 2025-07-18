<?php
// historique_conducteur.php
header('Content-Type: application/json');
require_once 'db.php'; // ta connexion PDO

$conducteurId = $_GET['conducteur_id'] ?? null;

if (!$conducteurId) {
    echo json_encode(['error' => 'ID conducteur manquant']);
    exit;
}

// On prend TOUS les trajets même terminés/annulés
$stmt = $pdo->prepare("
    SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.jetons, t.etat_trajet,
        (SELECT COALESCE(SUM(r.places_reservees),0) FROM reservations r WHERE r.trajet_id = t.id AND r.statut = 'valide') AS total_reservations
    FROM trajets t
    WHERE t.conducteur_id = ?
    ORDER BY t.date DESC, t.heure DESC
");
$stmt->execute([$conducteurId]);
$trajets = $stmt->fetchAll();

echo json_encode(['historique' => $trajets]);
