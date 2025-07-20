<?php


$host = "sql309.infinityfree.com";
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


