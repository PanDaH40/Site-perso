<?php
// reserver.php
// Enregistre une réservation et supprime le trajet si complet

session_start();
header('Content-Type: application/json');

// 1) Vérifier que l'utilisateur est connecté
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}
$userId = $_SESSION['user']['id'];

// 2) Récupérer et valider les données JSON
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$trajetId        = isset($input['trajet_id']) ? intval($input['trajet_id']) : 0;
$placesDemandees = isset($input['places'])    ? intval($input['places'])    : 0;

if ($trajetId <= 0 || $placesDemandees <= 0) {
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

// 3) Connexion à la base de données
$host     = 'localhost';
$dbname   = 'covoiturage_db';
$username = 'root';
$password = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    error_log('Erreur connexion BD: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur connexion base de données']);
    exit;
}

try {
    // 4) Vérifier que le trajet existe et calculer les places restantes
    $stmt = $pdo->prepare(
        "SELECT t.places AS total_places,
                (SELECT COALESCE(SUM(r.places_reservees),0) FROM reservations r WHERE r.trajet_id = t.id) AS deja_reservees
           FROM trajets t
          WHERE t.id = ?"
    );
    $stmt->execute([$trajetId]);
    $trajet = $stmt->fetch();

    if (!$trajet) {
        echo json_encode(['error' => 'Trajet non trouvé']);
        exit;
    }

    $placesRestantes = $trajet['total_places'] - $trajet['deja_reservees'];
    if ($placesDemandees > $placesRestantes) {
        echo json_encode(['error' => 'Pas assez de places disponibles']);
        exit;
    }

    // 5) Vérifier que l'utilisateur n'a pas déjà réservé
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ?"
    );
    $stmt->execute([$trajetId, $userId]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['error' => 'Vous avez déjà réservé ce trajet']);
        exit;
    }

    // 6) Enregistrer la réservation
    $stmt = $pdo->prepare(
        "INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)"
    );
    $stmt->execute([$trajetId, $userId, $placesDemandees]);

    // 7) Supprimer le trajet s'il est complet
    $stmt = $pdo->prepare(
        "SELECT SUM(places_reservees) FROM reservations WHERE trajet_id = ?"
    );
    $stmt->execute([$trajetId]);
    $totalReservees = (int)$stmt->fetchColumn();

    if ($totalReservees >= $trajet['total_places']) {
        $del = $pdo->prepare("DELETE FROM trajets WHERE id = ?");
        $del->execute([$trajetId]);
    }

    // Réponse de succès
    echo json_encode(['success' => true, 'message' => 'Réservation confirmée !']);
} catch (PDOException $e) {
    error_log('Erreur SQL reserver: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
