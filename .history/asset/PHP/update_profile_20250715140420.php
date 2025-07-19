<?php
// update_profile.php
session_start();
header('Content-Type: application/json');

// 1) Vérifier la session
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}
$userId = (int)$_SESSION['user']['id'];

// 2) Lecture du JSON d’entrée
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Payload JSON invalide']);
    exit;
}

// 3) Récupérer et valider les champs
$prenom    = trim($input['prenom']   ?? '');
$nom       = trim($input['nom']      ?? '');
$email     = trim($input['email']    ?? '');
$voiture   = trim($input['voiture']  ?? '');
$carburant = $input['carburant']     ?? '';
$animaux   = isset($input['animaux']) ? (int)$input['animaux'] : 0;
$fumeurs   = isset($input['fumeurs']) ? (int)$input['fumeurs'] : 0;

// Validation basique
if (
    !$prenom ||
    !$nom ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !$voiture ||
    !in_array($carburant, ['electric','essence','gazole'], true)
) {
    http_response_code(400);
    echo json_encode(['error' => 'Données invalides ou manquantes']);
    exit;
}

// 4) Connexion à la base
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=covoiturage_db;charset=utf8',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la base']);
    exit;
}

// 5) Mise à jour du profil
try {
    $stmt = $pdo->prepare(
        'UPDATE inscrits SET
            prenom    = :prenom,
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

    echo json_encode(['success' => true, 'message' => 'Profil mis à jour avec succès']);
} catch (PDOException $e) {
    error_log('Erreur SQL update_profile: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur interne']);
}
