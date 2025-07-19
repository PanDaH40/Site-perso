<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
    echo json_encode(['error' => 'Non connecté']);
    exit;
}

$userId = $_SESSION['user']['id'];

// Connexion à la base (adapte avec tes infos)
$host = 'localhost';
$dbname = 'ta_base';
$username = 'ton_user';
$password = 'ton_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Requête trajets proposés (conducteur = user connecté)
    $stmtProposes = $pdo->prepare("SELECT date, depart, arrivee, places, statut FROM trajets WHERE conducteur_id = ?");
    $stmtProposes->execute([$userId]);
    $trajetsProposes = $stmtProposes->fetchAll(PDO::FETCH_ASSOC);

    // Requête trajets réservés (passager = user connecté)
    $stmtReserves = $pdo->prepare("
        SELECT t.date, t.depart, t.arrivee, u.prenom AS conducteur_prenom, u.nom AS conducteur_nom, t.statut 
        FROM trajets t 
        JOIN utilisateurs u ON t.conducteur_id = u.id 
        JOIN reservations r ON r.trajet_id = t.id 
        WHERE r.passager_id = ?
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
