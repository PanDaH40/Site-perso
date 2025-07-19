<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];

$host = 'localhost';
$dbname = 'covoiturage_db';  // ta base ici
$username = 'root';       // à remplacer par ton user MySQL
$password = '';   // à remplacer par ton mot de passe MySQL

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // On ajoute un trajet
        $date = $_POST['date'] ?? null;
        $heure = $_POST['heure'] ?? null;
        $depart = $_POST['depart'] ?? null;
        $arrivee = $_POST['arrivee'] ?? null;
        $places = intval($_POST['places'] ?? 0);

        if (!$date || !$heure || !$depart || !$arrivee || $places <= 0) {
            echo json_encode(['error' => 'Données invalides']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO trajets (conducteur_id, date, heure, depart, arrivee, places, statut) VALUES (?, ?, ?, ?, ?, ?, 'disponible')");
        $stmt->execute([$userId, $date, $heure, $depart, $arrivee, $places]);

        echo json_encode(['success' => true]);
        exit;
    }

    // On récupère les trajets proposés par l'utilisateur
    $stmt = $pdo->prepare("SELECT id, date, heure, depart, arrivee, places, statut FROM trajets WHERE conducteur_id = ? ORDER BY date DESC, heure DESC");
    $stmt->execute([$userId]);
    $trajetsProposes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // On récupère les trajets réservés par l'utilisateur (passager)
    $stmt = $pdo->prepare("
        SELECT t.id, t.date, t.heure, t.depart, t.arrivee, t.places, t.statut,
               u.prenom AS conducteur_prenom, u.nom AS conducteur_nom
        FROM trajets t
        JOIN inscrits u ON u.id = t.conducteur_id
        JOIN reservations r ON r.trajet_id = t.id
        WHERE r.passager_id = ?
        ORDER BY t.date DESC, t.heure DESC
    ");
    $stmt->execute([$userId]);
    $trajetsReserves = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'trajets_proposes' => $trajetsProposes,
        'trajets_reserves' => $trajetsReserves
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB: ' . $e->getMessage()]);
}
