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

    // Récupère l'ID utilisateur si connecté
    $userId = $_SESSION['user']['id'] ?? null;

    // === AJOUT D'UN TRAJET (POST JSON) ===
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$userId) {
            echo json_encode(['error' => 'Utilisateur non connecté']);
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $date     = $input['date'] ?? null;
        $heure    = $input['heure'] ?? null;
        $depart   = trim($input['depart'] ?? '');
        $arrivee  = trim($input['arrivee'] ?? '');
        $places   = intval($input['places'] ?? 0);

        if (!$date || !$heure || !$depart || !$arrivee || $places <= 0) {
            echo json_encode(['error' => 'Données invalides']);
            exit;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO trajets (conducteur_id, date, heure, depart, arrivee, places, statut) \
             VALUES (?, ?, ?, ?, ?, ?, 'disponible')"
        );
        $stmt->execute([$userId, $date, $heure, $depart, $arrivee, $places]);
        echo json_encode(['success' => true]);
        exit;
    }

    // === TRAJETS PUBLICS (GET ?all=1) ===
    if (isset($_GET['all']) && $_GET['all'] == '1') {
        $stmt = $pdo->query(
            "SELECT 
                t.*, 
                u.prenom AS conducteur_prenom, 
                u.nom   AS conducteur_nom,
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

    // === TRAJETS DANS LE DASHBOARD (GET simple) ===
    if ($userId) {
        // Trajets proposés par l'utilisateur
        $stmt = $pdo->prepare(
            "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places,
                    COALESCE(SUM(r.places_reservees), 0) AS total_reservations
             FROM trajets t
             LEFT JOIN reservations r ON r.trajet_id = t.id
             WHERE t.conducteur_id = ?
             GROUP BY t.id
             ORDER BY t.date DESC, t.heure DESC"
        );
        $stmt->execute([$userId]);
        $trajets_proposes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Trajets réservés par l'utilisateur
        $stmt = $pdo->prepare(
            "SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.statut,
                    u.prenom AS conducteur_prenom, u.nom AS conducteur_nom,
                    r.places_reservees
             FROM reservations r
             JOIN trajets t ON t.id = r.trajet_id
             JOIN inscrits u ON u.id = t.conducteur_id
             WHERE r.passager_id = ?
             ORDER BY t.date DESC, t.heure DESC"
        );
        $stmt->execute([$userId]);
        $trajets_reserves = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'trajets_proposes' => $trajets_proposes,
            'trajets_reserves' => $trajets_reserves
        ]);
        exit;
    }

    // Si non connecté et pas de paramètre valide
    echo json_encode(['error' => 'Paramètre invalide ou utilisateur non connecté']);
    exit;

} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB: ' . $e->getMessage()]);
    exit;
}
?>
