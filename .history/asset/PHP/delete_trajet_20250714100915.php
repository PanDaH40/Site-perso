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

    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;

    if (!$id) {
        echo json_encode(['error' => 'ID manquant']);
        exit;
    }

    // Vérifie que le trajet appartient à l'utilisateur
    $check = $pdo->prepare("SELECT id FROM trajets WHERE id = ? AND conducteur_id = ?");
    $check->execute([$id, $userId]);
    if (!$check->fetch()) {
        echo json_encode(['error' => 'Trajet introuvable ou non autorisé']);
        exit;
    }

    // Supprimer les réservations associées si nécessaire
    $pdo->prepare("DELETE FROM reservations WHERE trajet_id = ?")->execute([$id]);

    // Supprimer le trajet
    $stmt = $pdo->prepare("DELETE FROM trajets WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur DB : ' . $e->getMessage()]);
}
