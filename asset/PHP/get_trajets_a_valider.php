<?php
// Afficher toutes les erreurs pour le debug
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');

// Vérification connexion utilisateur
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = (int)$_SESSION['user']['id'];

try {
    // Connexion PDO
    $pdo = new PDO(
        'mysql:host=sql309.infinityfree.com;dbname=if0_39505571_db_projet;charset=utf8',
        'if0_39505571',
        'qBOSjJTyyq5Trff',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Requête pour récupérer les trajets terminés avec réservation validée
    // mais passager n'ayant pas encore validé le trajet
    $sql = "
        SELECT 
            t.id AS trajet_id, t.date, t.heure, t.depart, t.arrivee, r.id AS reservation_id
        FROM reservations r
        JOIN trajets t ON r.trajet_id = t.id
        WHERE r.passager_id = ?
          AND t.etat_trajet = 'termine'
          AND r.statut = 'valide'
          AND (r.validation_passager IS NULL OR r.validation_passager = 0)
        ORDER BY t.date DESC, t.heure DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $trajets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['trajets_a_valider' => $trajets]);

} catch (PDOException $e) {
    // En cas d'erreur, envoyer le message et debug pour diagnostic
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur serveur',
        'debug' => $e->getMessage()
    ]);
}
