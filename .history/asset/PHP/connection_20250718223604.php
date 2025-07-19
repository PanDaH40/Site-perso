<?php

// clé secrète à garder hors Git/public
define('SITE_ACCESS_KEY', '4f3b2a1c9d8e7f6a5b4c3d2e1f0a9b8c');

// 1) On lit le paramètre "key" dans l'URL
$key = $_GET['key'] ?? '';

// 2) Si ça ne correspond pas, on renvoie un 403
if ($key !== SITE_ACCESS_KEY) {
    header('HTTP/1.1 403 Forbidden');
    exit('Accès restreint.');
}

session_start();
header('Content-Type: application/json');

require __DIR__ . '/login.php'; // connexion PDO

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "success" => false,
        "message" => "Méthode non autorisée."
    ]);
    exit;
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode([
        "success" => false,
        "message" => "Veuillez remplir tous les champs."
    ]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM inscrits WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['mot_de_passe'])) {
    // AJOUT: Empêcher la connexion des comptes suspendus
    if (isset($user['statut']) && $user['statut'] === 'suspendu') {
        echo json_encode([
            "success" => false,
            "message" => "Votre compte est suspendu. Veuillez contacter l'administrateur."
        ]);
        exit;
    }

    // Stockage cohérent dans $_SESSION['user']
    $_SESSION['user'] = [
        "id" => $user['id'],
        "email" => $user['email'],
        "prenom" => $user['prenom'], 
        "nom" => $user['nom'],
        "admin" => $user['admin'],         
        "statut" => $user['statut'] ?? '' 
    ];

    echo json_encode([
        "success" => true,
        "message" => "Connecté avec succès " . $user['prenom'] . " !",
    ]); 
} else {
    echo json_encode([
        "success" => false,
        "message" => "Email ou mot de passe incorrect"
    ]);
    exit;
}
