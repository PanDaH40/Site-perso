<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');

if (!isset($_GET['id']) || !ctype_digit($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID utilisateur invalide']);
    exit;
}

$userId = (int)$_GET['id'];

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Exemple de requête pour récupérer infos publiques
    $stmt = $pdo->prepare("
        SELECT 
            i.prenom, i.nom, i.avatar, i.bio,
            c.voiture IS NOT NULL AS roleConducteur,
            p.preferences IS NOT NULL AS rolePassager,
            p.preferences,
            c.animaux, c.fumeurs,
            (SELECT COUNT(*) FROM trajets WHERE conducteur_id = i.id AND date <= CURDATE()) AS nbTrajets,
            DATE_FORMAT(i.date_inscription, '%M %Y') AS anciennete
        FROM inscrits i
        LEFT JOIN conducteurs c ON c.inscrit_id = i.id
        LEFT JOIN passagers p ON p.inscrit_id = i.id
        WHERE i.id = ?
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Profil introuvable']);
        exit;
    }

    echo json_encode($row);

} catch (Exception $e) { // ← le catch doit être ici, après le try
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur', 'debug' => $e->getMessage()]);
    exit;

    echo json_encode(['debug' => 'Script terminé mais rien renvoyé']);

}
