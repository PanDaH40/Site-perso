<?php
session_start();

// Test session utilisateur
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'Utilisateur non connecté']);
    exit;
}

// Configuration BDD (à adapter)
$host = '';
$dbname = 'covoiturage_db';
$username = 'ton_user';
$password = 'ton_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo json_encode([
        'success' => true,
        'message' => 'Connexion BDD réussie',
        'user_id' => $_SESSION['user']['id']
    ]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur connexion BDD: ' . $e->getMessage()]);
}
?>
