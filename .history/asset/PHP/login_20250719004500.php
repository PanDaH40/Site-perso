<?php

require_once __DIR__ . '/../../config.php';


// contrôle d’accès
if (($_GET['key'] ?? '') !== SITE_ACCESS_KEY) {
  header('HTTP/1.1 403 Forbidden');
  exit('Accès restreint.');
}

$host = "localhost";
$dbname = "if0_39505571_db_projet";
$username = "if0_39505571";
$password = "qBOSjJTyyq5Trff";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Répondre en JSON et arrêter le script
    echo json_encode([
        "success" => false,
        "message" => "Erreur de connexion à la base : " . $e->getMessage()
    ]);
    exit;
}


