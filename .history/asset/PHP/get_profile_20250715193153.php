<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userIdSession = (int)$_SESSION['user']['id'];
// Récupérer id en GET, sinon fallback vers session
$id = isset($_GET['id']) ? (int)$_GET['id'] : $userIdSession;

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $sql = "
      SELECT 
        i.id,
        i.prenom AS user_prenom,
        i.nom AS user_nom,
        i.email,
        i.avatar,
        c.prenom AS cond_prenom,
        c.nom AS cond_nom,
        c.voiture,
        c.carburant,
        c.animaux,
        c.fumeurs,
        p.prenom AS pass_prenom,
        p.nom AS pass_nom,
        p.preferences
      FROM inscrits i
      LEFT JOIN conducteurs c ON c.inscrit_id = i.id
      LEFT JOIN passagers  p ON p.inscrit_id   = i.id
      WHERE i.id = :id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['error' => 'Profil introuvable']);
        exit;
    }

    $row['is_current_user'] = ($id === $userIdSession);

    echo json_encode($row);

} catch (PDOException $e) {
    error_log('SQL error in get_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur interne']);
}
