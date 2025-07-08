<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];

// Récupérer les données POST
$trajetId = $_POST['trajet_id'] ?? null;
$placesDemandees = intval($_POST['places'] ?? 0);

if (!$trajetId || $placesDemandees <= 0) {
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

$host = 'localhost';
$dbname = 'ta_base';
$username = 'ton_user';
$password = 'ton_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifier les places restantes
    $stmt = $pdo->prepare("SELECT places FROM trajets WHERE id = ?");
    $stmt->execute([$trajetId]);
    $trajet = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trajet) {
        echo json_encode(['error' => 'Trajet non trouvé']);
        exit;
    }

    if ($trajet['places'] < $placesDemandees) {
        echo json_encode(['error' => 'Places insuffisantes disponibles']);
        exit;
    }

    // Ajouter la réservation
    $stmt = $pdo->prepare("INSERT INTO reservations (trajet_id, passager_id, places_reservees) VALUES (?, ?, ?)");
    $stmt->execute([$trajetId, $userId, $placesDemandees]);

    // Mettre à jour le nombre de places restantes dans trajets
    $stmt = $pdo->prepare("UPDATE trajets SET places = places - ? WHERE id = ?");
    $stmt->execute([$placesDemandees, $trajetId]);

    echo json_encode(['success' => true, 'message' => 'Réservation confirmée !']);

} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB: ' . $e->getMessage()]);
}
