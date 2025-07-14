<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];

$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $id = $_POST['id'] ?? null;
    $date = $_POST['date'] ?? null;
    $heure = $_POST['heure'] ?? null;
    $depart = $_POST['depart'] ?? null;
    $arrivee = $_POST['arrivee'] ?? null;
    $places = intval($_POST['places'] ?? 0);

    if (!$id || !$date || !$heure || !$depart || !$arrivee || $places <= 0) {
        echo json_encode(['error' => 'Données incomplètes ou invalides']);
        exit;
    }

    // Vérifie que le trajet appartient bien à l'utilisateur
    $check = $pdo->prepare("SELECT id FROM trajets WHERE id = ? AND conducteur_id = ?");
    $check->execute([$id, $userId]);
    if (!$check->fetch()) {
        echo json_encode(['error' => 'Accès refusé ou trajet introuvable']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE trajets SET date = ?, heure = ?, depart = ?, arrivee = ?, places = ? WHERE id = ?");
    $stmt->execute([$date, $heure, $depart, $arrivee, $places, $id]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB : ' . $e->getMessage()]);
}
