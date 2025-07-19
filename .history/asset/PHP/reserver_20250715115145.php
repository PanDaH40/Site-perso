<?php
// reserver.php
// Enregistre une réservation et met à jour les places restantes

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
    // 4) Vérifier que le trajet existe et récupérer les places disponibles
    $stmt = $pdo->prepare(
        "SELECT places - COALESCE(SUM(r.places_reservees),0) AS places_restantes
           FROM trajets t
           LEFT JOIN reservations r ON r.trajet_id = t.id
          WHERE t.id = ?"
    );
    $stmt->execute([$trajetId]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['error' => 'Trajet non trouvé']);
        exit;
    }
    $placesRestantes = (int)$row['places_restantes'];
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

    // 7) Mettre à jour le nombre de places du trajet
    $stmt = $pdo->prepare(
        "UPDATE trajets
           SET places = places - :nb
         WHERE id = :id"
    );
    $stmt->execute([':nb' => $placesDemandees, ':id' => $trajetId]);

    echo json_encode(['success' => true, 'message' => 'Réservation confirmée !']);
} catch (PDOException $e) {
    error_log('Erreur SQL reserver: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
