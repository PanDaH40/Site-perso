<?php
// asset/PHP/get_profile.php
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
    error_log('DB connexion failed in get_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion DB']);
    exit;
}

// 3) Récupération du profil complet avec conducteurs et passagers
try {
    $sql = "
      SELECT 
        i.prenom,
        i.nom,
        i.email,
        c.voiture,
        c.carburant,
        c.animaux,
        c.fumeurs,
        p.preferences
      FROM inscrits i
      LEFT JOIN conducteurs c ON c.inscrit_id = i.id
      LEFT JOIN passagers  p ON p.inscrit_id   = i.id
      WHERE i.id = :id
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) {
        echo json_encode(['error' => 'Profil introuvable']);
    } else {
        // Normalisation des types
        $profile['animaux']     = isset($profile['animaux'])   ? (int)$profile['animaux']    : 0;
        $profile['fumeurs']     = isset($profile['fumeurs'])   ? (int)$profile['fumeurs']    : 0;
        $profile['voiture']     = $profile['voiture']   ?? '';
        $profile['carburant']   = $profile['carburant'] ?? '';
        $profile['preferences'] = $profile['preferences'] ?? '';

        echo json_encode($profile);
    }
} catch (PDOException $e) {
    error_log('SQL error in get_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur interne']);
}
