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
        'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    error_log('DB connexion failed in get_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion DB']);
    exit;
}

// 3) Récupération du profil + avatar + conducteurs/passagers
try {
    $sql = "
      SELECT 
        i.prenom       AS user_prenom,
        i.nom          AS user_nom,
        i.email,
        i.avatar,
        c.prenom       AS cond_prenom,
        c.nom          AS cond_nom,
        c.voiture,
        c.carburant,
        c.animaux,
        c.fumeurs,
        p.prenom       AS pass_prenom,
        p.nom          AS pass_nom,
        p.preferences
      FROM inscrits i
      LEFT JOIN conducteurs c ON c.inscrit_id = i.id
      LEFT JOIN passagers  p ON p.inscrit_id   = i.id
      WHERE i.id = :id
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['error' => 'Profil introuvable']);
        exit;
    }

    $profile = [
        'prenom'       => $row['user_prenom'],
        'nom'          => $row['user_nom'],
        'email'        => $row['email'],
        'avatar'       => $row['avatar'] ?? null,
        'cond_prenom'  => $row['cond_prenom']    ?? '',
        'cond_nom'     => $row['cond_nom']       ?? '',
        'voiture'      => $row['voiture']        ?? '',
        'carburant'    => $row['carburant']      ?? '',
        'animaux'      => (int)($row['animaux'] ?? 0),
        'fumeurs'      => (int)($row['fumeurs'] ?? 0),
        'pass_prenom'  => $row['pass_prenom']    ?? '',
        'pass_nom'     => $row['pass_nom']       ?? '',
        'preferences'  => $row['preferences']    ?? ''
    ];

    echo json_encode($profile);
} catch (PDOException $e) {
    error_log('SQL error in get_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur interne']);
}
