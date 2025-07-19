<?php
// historique_conducteur.php
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

$host = "sql309.infinityfree.com";
$dbname = "if0_39505571_db_projet";
$username = "if0_39505571_XXX";
$password = "qBOSjJTyyq5Trff";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur connexion BD']);
    exit;
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
