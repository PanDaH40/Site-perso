<?php
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
    // Stockage cohérent dans $_SESSION['user']
    $_SESSION['user'] = [
        "id" => $user['id'],
        "email" => $user['email'],
        "prenom" => $user['prenom'], // attention à bien avoir ce champ en base
        "nom" => $user['nom']
    ];

    echo json_encode([
        "success" => true,
        "message" => "Connecté avec succès"  . $user['prenom'] . " !",
    ]); 
    exit;

} else {
    echo json_encode([
        "success" => false,
        "message" => "Email ou mot de passe incorrect"
    ]);
    exit;
}
