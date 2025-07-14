<?php
session_start();
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérification session utilisateur
    $userId = $_SESSION['user']['id'] ?? null;

    // === AJOUT D'UN TRAJET ===
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$userId) {
            echo json_encode(['error' => 'Utilisateur non connecté']);
            exit;
        }

        // Lire le JSON envoyé
        $data = json_decode(file_get_contents('php://input'), true);
        $date = $data['date'] ?? null;
        $heure = $data['heure'] ?? null;
        $depart = $data['depart'] ?? null;
        $arrivee = $data['arrivee'] ?? null;
        $places = intval($data['places'] ?? 0);

        if (!$date || !$heure || !$depart || !$arrivee || $places <= 0) {
            echo json_encode(['error' => 'Données invalides']);
            exit;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO trajets (conducteur_id, date, heure, depart, arrivee, places, statut) 
             VALUES (?, ?, ?, ?, ?, ?, 'disponible')"
        );
        $stmt->execute([$userId, $date, $heure, $depart, $arrivee, $places]);

        echo json_encode(['success' => true]);
        exit;
    }

    // === TRAJETS PUBLICS ===
    if (isset($_GET['all']) && $_GET['all'] == '1') {
        $stmt = $pdo->query(
            "SELECT 
                t.*, 
                u.prenom AS conducteur_prenom, 
                u.nom AS conducteur_nom,
                COALESCE(SUM(r.places_reservees), 0) AS total_reservations
             FROM trajets t
             JOIN inscrits u ON u.id = t.conducteur_id
             LEFT JOIN reservations r ON r.trajet_id = t.id
             GROUP BY t.id
             ORDER BY t.date DESC, t.heure DESC"
        );
        $all = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['all_trajets' => $all]);
        exit;
    }

} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB: ' . $e->getMessage()]);
    exit;
}
