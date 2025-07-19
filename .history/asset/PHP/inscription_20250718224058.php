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

file_put_contents(__DIR__ . '/debug.txt', json_encode($_POST));

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require __DIR__ . '/login.php'; // connexion PDO

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée'
    ]);
    exit;
}

$nom = trim($_POST['nom'] ?? '');
$prenom = trim($_POST['prenom'] ?? '');
$age = intval($_POST['age'] ?? 0);
$telephone = trim($_POST['telephone'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!$nom || !$prenom || !$age || !$telephone || !$email || !$password) {
    echo json_encode([
        'success' => false,
        'message' => 'Veuillez remplir tous les champs'
    ]);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Insertion avec 20 crédits offerts par défaut
    $stmt = $pdo->prepare("INSERT INTO inscrits (nom, prenom, age, telephone, email, mot_de_passe, credits) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nom, $prenom, $age, $telephone, $email, $hash, 20]);

    echo json_encode([
        'success' => true,
        'message' => 'Inscription réussie ! Vous bénéficiez de 20 crédits.'
    ]);
    exit;
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode([
            'success' => false,
            'message' => 'Cet email est déjà utilisé.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur SQL : ' . $e->getMessage()
        ]);
    }
    exit;
}
