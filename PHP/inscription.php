<?php

file_put_contents(__DIR__ . '/debug.txt', json_encode($_POST));

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once __DIR__ . '/db_conn.php'; // connexion PDO

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
