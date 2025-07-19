<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];
$input = json_decode(file_get_contents("php://input"), true);
$trajetId = $input['id'] ?? null;

if (!$trajetId) {
    echo json_encode(['error' => 'ID de trajet manquant']);
    exit;
}

$host = 'localhost';
$dbname = 'covoiturage_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Supprimer la réservation uniquement si elle appartient à l'utilisateur
    $stmt = $pdo->prepare("DELETE FROM reservations WHERE passager_id = ? AND trajet_id = ?");
    $stmt->execute([$userId, $trajetId]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB : ' . $e->getMessage()]);
}
