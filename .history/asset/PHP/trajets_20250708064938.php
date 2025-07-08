<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];

// Config BDD
$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = 'ton_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Récupérer les données envoyées (form-data ou JSON selon client)
        $date = $_POST['date'] ?? null;
        $depart = $_POST['depart'] ?? null;
        $arrivee = $_POST['arrivee'] ?? null;
        $heure = $_POST['heure'] ?? null;
        $places = isset($_POST['places']) ? (int)$_POST['places'] : null;

        // Validation minimale
        if (!$date || !$depart || !$arrivee || !$heure || !$places) {
            echo json_encode(['error' => 'Tous les champs sont obligatoires']);
            exit;
        }

        // Insertion dans la table trajets, conducteur = user connecté
        $stmtInsert = $pdo->prepare("INSERT INTO trajets (date, depart, arrivee, heure, places, conducteur_id, statut) VALUES (?, ?, ?, ?, ?, ?, 'actif')");
        $stmtInsert->execute([$date, $depart, $arrivee, $heure, $places, $userId]);

        echo json_encode(['success' => true]);
        exit;
    }

    // GET : récupération trajets proposés + réservés (comme avant)
    $stmtProposes = $pdo->prepare("
        SELECT id, date, depart, arrivee, heure, places, statut
        FROM trajets
        WHERE conducteur_id = ?
        ORDER BY date DESC, heure DESC
    ");
    $stmtProposes->execute([$userId]);
    $trajetsProposes = $stmtProposes->fetchAll(PDO::FETCH_ASSOC);

    $stmtReserves = $pdo->prepare("
        SELECT t.id, t.date, t.depart, t.arrivee, t.heure, t.places, t.statut,
               u.prenom AS conducteur_prenom, u.nom AS conducteur_nom
        FROM trajets t
        JOIN utilisateurs u ON t.conducteur_id = u.id
        JOIN reservations r ON r.trajet_id = t.id
        WHERE r.passager_id = ?
        ORDER BY t.date DESC, t.heure DESC
    ");
    $stmtReserves->execute([$userId]);
    $trajetsReserves = $stmtReserves->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'trajets_proposes' => $trajetsProposes,
        'trajets_reserves' => $trajetsReserves
    ]);

} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB: ' . $e->getMessage()]);
}
