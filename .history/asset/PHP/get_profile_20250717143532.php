<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

$userIdSession = (int)$_SESSION['user']['id'];
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
        i.prenom,
        i.nom,
        i.email,
        i.avatar,
        i.bio,
        i.credits,
        c.prenom AS cond_prenom,
        c.nom AS cond_nom,
        c.marque_vehicule,
        c.modele_vehicule,
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
      LIMIT 1
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
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur serveur interne',
        'debug' => $e->getMessage()
    ]);
}
?>
