<?php
// update_profile.php
session_start();
header('Content-Type: application/json');

// 1) Vérification de la session
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int)$_SESSION['user']['id'];

// 2) Lecture du JSON
$input = json_decode(file_get_contents('php://input'), true);
if (
    !is_array($input)
    || empty($input['prenom'])
    || empty($input['nom'])
    || empty($input['email'])
    || !isset($input['voiture'])
    || !isset($input['carburant'])
    || !isset($input['animaux'])
    || !isset($input['fumeurs'])
) {
    http_response_code(400);
    echo json_encode(['error' => 'Données incomplètes']);
    exit;
}

// 3) Validation basique
$prenom    = trim($input['prenom']);
$nom       = trim($input['nom']);
$email     = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
$voiture   = trim($input['voiture']);
$carburant = in_array($input['carburant'], ['electric','essence','gazole']) 
             ? $input['carburant'] : null;
$animaux   = $input['animaux'] ? 1 : 0;
$fumeurs   = $input['fumeurs'] ? 1 : 0;

if (!$email || !$carburant) {
    http_response_code(400);
    echo json_encode(['error' => 'Email ou type de carburant invalide']);
    exit;
}

// 4) Connexion PDO
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

// 5) Mise à jour
try {
    $stmt = $pdo->prepare(
        'UPDATE inscrits
         SET prenom    = :prenom,
             nom       = :nom,
             email     = :email,
             voiture   = :voiture,
             carburant = :carburant,
             animaux   = :animaux,
             fumeurs   = :fumeurs
         WHERE id = :id'
    );
    $stmt->execute([
        ':prenom'    => $prenom,
        ':nom'       => $nom,
        ':email'     => $email,
        ':voiture'   => $voiture,
        ':carburant' => $carburant,
        ':animaux'   => $animaux,
        ':fumeurs'   => $fumeurs,
        ':id'        => $userId
    ]);

    echo json_encode(['success' => true, 'message' => 'Profil mis à jour']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
