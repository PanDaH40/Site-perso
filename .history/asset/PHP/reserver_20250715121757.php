<?php
// reserver.php
// Enregistre une réservation et met à jour le nombre de places disponibles

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
$trajetId = isset($input['trajet_id']) ? intval($input['trajet_id']) : 0;
$placesDemandees = isset($input['places']) ? intval($input['places']) : 0;

if ($trajetId <= 0 || $placesDemandees <= 0) {
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

// 3) Connexion à la base de données
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    error_log('Erreur connexion BD: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur connexion base']);
    exit;
}

try {
    // Début de transaction
    $pdo->beginTransaction();

    // 4) Vérifier disponibilité
    $stmt = $pdo->prepare(
        'SELECT places FROM trajets WHERE id = ? FOR UPDATE'
    );
    $stmt->execute([$trajetId]);
    $current = $stmt->fetchColumn();
    if ($current === false) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Trajet non trouvé']);
        exit;
    }
    if ($placesDemandees > (int)$current) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Pas assez de places disponibles']);
        exit;
    }

    // 5) Vérifier double réservation
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ?'
    );
    $stmt->execute([$trajetId, $userId]);
    if ($stmt->fetchColumn() > 0) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Déjà réservé']);
        exit;
    }

    // 6) Insérer réservation
    $stmt = $pdo->prepare(
        'INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)'
    );
    $stmt->execute([$trajetId, $userId, $placesDemandees]);

    // 7) Mettre à jour le nombre de places
    $stmt = $pdo->prepare(
        'UPDATE trajets SET places = places - ? WHERE id = ?'
    );
    $stmt->execute([$placesDemandees, $trajetId]);

    // Commit
    $pdo->commit();

    // 8) Renvoyer le nouveau nombre de places
    $stmt = $pdo->prepare('SELECT places FROM trajets WHERE id = ?');
    $stmt->execute([$trajetId]);
    $newPlaces = (int)$stmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'message' => 'Réservation confirmée !',
        'places_restantes' => $newPlaces
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Erreur SQL reserver.php: ' . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur']);
}
