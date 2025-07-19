<?php
// get_profile.php
session_start();
header('Content-Type: application/json');

// 1) Vérifier la session
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int)$_SESSION['user']['id'];

// 2) Connexion PDO
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion DB']);
    exit;
}

// 3) Récupération du profil
try {
    $stmt = $pdo->prepare(
        'SELECT prenom, nom, email, voiture, carburant, animaux, fumeurs
         FROM inscrits
         WHERE id = ?'
    );
    $stmt->execute([$userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) {
        echo json_encode(['error' => 'Profil introuvable']);
    } else {
        // Retourner les booléens correctement
        $profile['animaux'] = (int)$profile['animaux'];
        $profile['fumeurs'] = (int)$profile['fumeurs'];
        echo json_encode($profile);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
