<?php
header('Content-Type: application/json'); // Indique que la réponse sera JSON

$host = 'ecoridt815.mysql.db';
$db   = 'ecoridt815';
$user = 'ecoridt815';
$pass = 'Thebigdu40';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo json_encode(['success' => true, 'message' => 'Connexion OK']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur connexion : ' . $e->getMessage()]);
    exit;
}


