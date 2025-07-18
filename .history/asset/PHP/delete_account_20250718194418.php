<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = intval($_SESSION['user']['id']);

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $pdo->beginTransaction();

    // Suppression des réservations du passager
    $pdo->prepare("DELETE FROM reservations WHERE passager_id = ?")->execute([$userId]);
    // Suppression des trajets créés par l'utilisateur
    $pdo->prepare("DELETE FROM trajets WHERE conducteur_id = ?")->execute([$userId]);
    // Suppression des signalements
    $pdo->prepare("DELETE FROM signalements WHERE signale_par = ?")->execute([$userId]);
    // Suppression de l'utilisateur
    $pdo->prepare("DELETE FROM inscrits WHERE id = ?")->execute([$userId]);

    $pdo->commit();

    session_destroy();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['error' => "Erreur lors de la suppression", 'debug' => $e->getMessage()]);
}
