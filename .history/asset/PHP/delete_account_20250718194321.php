<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userId = intval($_SESSION['user']['id']);

// Connexion DB
try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Erreur connexion DB']);
    exit;
}

// 1. SUPPRIMER les réservations liées à l'utilisateur
try {
    $pdo->beginTransaction();

    // Suppression des réservations du passager
    $pdo->prepare("DELETE FROM reservations WHERE passager_id = ?")->execute([$userId]);

    // Optionnel: Suppression des trajets créés par l'utilisateur (conducteur)
    $pdo->prepare("DELETE FROM trajets WHERE conducteur_id = ?")->execute([$userId]);

    // Optionnel: Suppression des signalements faits par l'utilisateur
    $pdo->prepare("DELETE FROM signalements WHERE signale_par = ?")->execute([$userId]);

    // 2. SUPPRIMER l'utilisateur
    $pdo->prepare("DELETE FROM inscrits WHERE id = ?")->execute([$userId]);

    $pdo->commit();

    // Déconnexion
    session_destroy();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['error' => "Erreur lors de la suppression", 'debug' => $e->getMessage()]);
}
