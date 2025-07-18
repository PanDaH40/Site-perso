<?php
require 'check_admin.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
if (!$id) { echo json_encode(['error' => "ID invalide"]); exit; }

try {
    $pdo = new PDO('mysql:host=localhost;dbname=covoiturage_db;charset=utf8','root','');
    // On récupère le statut actuel
    $stmt = $pdo->prepare("SELECT statut FROM inscrits WHERE id=?");
    $stmt->execute([$id]);
    $statut = $stmt->fetchColumn();
    if (!$statut) { echo json_encode(['error' => "Utilisateur introuvable"]); exit; }

    $nouveau = ($statut === 'actif') ? 'suspendu' : 'actif';
    $stmt2 = $pdo->prepare("UPDATE inscrits SET statut=? WHERE id=?");
    $stmt2->execute([$nouveau, $id]);
    echo json_encode(['success' => true, 'statut' => $nouveau]);
} catch (Exception $e) {
    echo json_encode(['error' => "Erreur serveur"]);
}
