<?php
session_start();
header('Content-Type: application/json');

// Vérifie si l'utilisateur est connecté
if (!isset($_SESSION['user'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];

// 🔧 Récupérer les données JSON
$data = json_decode(file_get_contents("php://input"), true);
$trajetId = $data['trajet_id'] ?? null;
$placesDemandees = intval($data['places'] ?? 0);

if (!$trajetId || $placesDemandees <= 0) {
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifie que le trajet existe
    $stmt = $pdo->prepare("SELECT t.id, t.places, COALESCE(SUM(r.places_reservees), 0) AS deja_reservees
                           FROM trajets t
                           LEFT JOIN reservations r ON r.trajet_id = t.id
                           WHERE t.id = ?
                           GROUP BY t.id");
    $stmt->execute([$trajetId]);
    $trajet = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trajet) {
        echo json_encode(['error' => 'Trajet non trouvé']);
        exit;
    }

    $placesRestantes = $trajet['places'] - $trajet['deja_reservees'];

    if ($placesRestantes < $placesDemandees) {
        echo json_encode(['error' => 'Pas assez de places disponibles']);
        exit;
    }

    // Vérifie si l'utilisateur a déjà réservé ce trajet
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM reservations WHERE trajet_id = ? AND passager_id = ?");
    $stmt->execute([$trajetId, $userId]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['error' => 'Vous avez déjà réservé ce trajet.']);
        exit;
    }

    // Enregistre la réservation
    $stmt = $pdo->prepare("INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)");
    $stmt->execute([$trajetId, $userId, $placesDemandees]);

    // 🔥 Supprimer le trajet s'il est complet
    $stmt = $pdo->prepare("SELECT SUM(places_reservees) FROM reservations WHERE trajet_id = ?");
    $stmt->execute([$trajetId]);
    $totalReservees = $stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT places FROM trajets WHERE id = ?");
    $stmt->execute([$trajetId]);
    $placesTotal = $stmt->fetchColumn();

    if ($totalReservees >= $placesTotal) {
        $stmt = $pdo->prepare("DELETE FROM trajets WHERE id = ?");
        $stmt->execute([$trajetId]);
    }

    echo json_encode(['success' => true, 'message' => 'Réservation confirmée !']);

} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB: ' . $e->getMessage()]);
} ?>
