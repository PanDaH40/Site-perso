<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];

// Config BDD (adapte avec tes infos)
$host = "localhost";
$dbname = "covoiturage_db";
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // --- Ajout d'un trajet ---
        $date = $_POST['date'] ?? null;
        $heure = $_POST['heure'] ?? null;
        $depart = $_POST['depart'] ?? null;
        $arrivee = $_POST['arrivee'] ?? null;
        $places = intval($_POST['places'] ?? 0);

        // Validation simple
        if (!$date || !$heure || !$depart || !$arrivee || $places <= 0) {
            echo json_encode(['error' => 'Données invalides']);
            exit;
        }

        $stmtInsert = $pdo->prepare("INSERT INTO trajets (conducteur_id, date, heure, depart, arrivee, places, statut) VALUES (?, ?, ?, ?, ?, ?, 'en attente')");
        $stmtInsert->execute([$userId, $date, $heure, $depart, $arrivee, $places]);

        echo json_encode(['success' => true]);
        exit;
    }

    // --- GET : récupération des trajets ---
    // Trajets proposés (conducteur = utilisateur connecté)
    $stmtProposes = $pdo->prepare("
        SELECT id, date, depart, arrivee, heure, places, statut 
        FROM trajets 
        WHERE conducteur_id = ?
        ORDER BY date DESC, heure DESC
    ");
    $stmtProposes->execute([$userId]);
    $trajetsProposes = $stmtProposes->fetchAll(PDO::FETCH_ASSOC);

    // Trajets réservés (passager = utilisateur connecté)
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
