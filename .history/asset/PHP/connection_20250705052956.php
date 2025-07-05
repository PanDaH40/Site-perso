<?php
session_start();
header('Content-Type: application/json');

require __DIR__ . '/connection.php'; /*  __DIR__ garantit que le chemin est basé sur le répertoire du fichier courant, ce qui est plus robuste et évite des erreurs de chemin relatif. */


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
    $_SESSION['user'] = [
        "id" => $user['id'],
        "email" => $user['email'],
        "nom" => $user['nom']
    ];

    echo json_encode([
        "success" => true,
        "message" => "Connecté avec succès"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Email ou mot de passe incorrect"
    ]);
} 
