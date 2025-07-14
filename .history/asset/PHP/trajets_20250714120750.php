<?php
ob_start();
session_start();
header('Content-Type: application/json');

ini_set('display_errors', 1);
error_reporting(E_ALL);

$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ajout de trajet
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_SESSION['user']['id'])) {
            echo json_encode(['error' => 'Utilisateur non connecté']);
            ob_end_clean();
            exit;
        }

        $userId = $_SESSION['user']['id'];
        $date = $_POST['date'] ?? null;
        $heure = $_POST['heure'] ?? null;
        $depart = $_POST['depart'] ?? null;
        $arrivee = $_POST['arrivee'] ?? null;
        $places = intval($_POST['places'] ?? 0);

        if (!$date || !$heure || !$depart || !$arrivee || $places <= 0) {
            echo json_encode(['error' => 'Données invalides']);
            ob_end_clean();
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO trajets (conducteur_id, date, heure, depart, arrivee, places, statut) 
                               VALUES (?, ?, ?, ?, ?, ?, 'disponible')");
        $stmt->execute([$userId, $date, $heure, $depart, $arrivee, $places]);

        echo json_encode(['success' => true]);
        ob_end_clean();
        exit;
    }

    $userId = $_SESSION['user']['id'] ?? null;

    // Tous les trajets publics
    if (isset($_GET['all']) && $_GET['all'] == '1') {
        $stmt = $pdo->query("
            SELECT 
                t.*, 
                u.prenom AS conducteur_prenom, 
                u.nom AS conducteur_nom,
                COALESCE(SUM(r.places_reservees), 0) AS total_reservations
            FROM trajets t
            JOIN inscrits u ON u.id = t.conducteur_id
            LEFT JOIN reservations r ON r.trajet_id = t.id
            GROUP BY t.id
            ORDER BY t.date DESC, t.heure DESC
        ");
        $all = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['all_trajets' => $all]);
        ob_end_clean();
        exit;
    }

    $trajetsProposes = [];
    $trajetsReserves = [];

    if ($userId) {
        // Trajets proposés
        $stmt = $pdo->prepare("
            SELECT 
                t.*, 
                COALESCE(SUM(r.places_reservees), 0) AS total_reservations
            FROM trajets t
            LEFT JOIN reservations r ON r.trajet_id = t.id
            WHERE t.conducteur_id = ?
            GROUP BY t.id
            ORDER BY t.date DESC, t.heure DESC
        ");
        $stmt->execute([$userId]);
        $trajetsProposes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Détails des réservataires
        foreach ($trajetsProposes as &$trajet) {
            $stmt = $pdo->prepare("
                SELECT i.prenom, i.nom, r.places_reservees
                FROM reservations r
                JOIN inscrits i ON i.id = r.passager_id
                WHERE r.trajet_id = ?
            ");
            $stmt->execute([$trajet['id']]);
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $noms = [];
            foreach ($reservations as $r) {
                $noms[] = "{$r['prenom']} {$r['nom']} ({$r['places_reservees']})";
            }

            $trajet['reservataires'] = implode(', ', $noms);
        }

        // Trajets réservés
        $stmt = $pdo->prepare("
            SELECT 
                t.id, t.date, t.heure, t.depart, t.arrivee, t.statut,
                r.places_reservees,
                u.prenom AS conducteur_prenom, u.nom AS conducteur_nom
            FROM trajets t
            JOIN inscrits u ON u.id = t.conducteur_id
            JOIN reservations r ON r.trajet_id = t.id
            WHERE r.passager_id = ?
            ORDER BY t.date DESC, t.heure DESC
        ");
        $stmt->execute([$userId]);
        $trajetsReserves = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        'trajets_proposes' => $trajetsProposes,
        'trajets_reserves' => $trajetsReserves
    ]);
    ob_end_clean();
    exit;

} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB: ' . $e->getMessage()]);
    ob_end_clean();
    exit;
}
