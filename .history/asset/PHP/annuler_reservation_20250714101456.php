<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'])) {
    echo json_encode(['error' => 'ID de réservation manquant']);
    exit;
}

$trajetId = intval($data['id']);

$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifie que l'utilisateur a bien réservé ce trajet
    $stmt = $pdo->prepare("SELECT id FROM reservations WHERE passager_id = ? AND trajet_id = ?");
    $stmt->execute([$userId, $trajetId]);

    $reservation = $stmt->fetch();
    if (!$reservation) {
        echo json_encode(['error' => 'Réservation introuvable ou non autorisée']);
        exit;
    }

    // Supprime la réservation
    $stmt = $pdo->prepare("DELETE FROM reservations WHERE passager_id = ? AND trajet_id = ?");
    $stmt->execute([$userId, $trajetId]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB : ' . $e->getMessage()]);
}
