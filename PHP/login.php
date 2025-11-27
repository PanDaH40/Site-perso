<?php

require __DIR__ . '/db_conn.php'; // utilise la connexion centralisée $pdo

// contrôle d’accès
if (($_GET['key'] ?? '') !== SITE_ACCESS_KEY) {
  header('HTTP/1.1 403 Forbidden');
  exit('Accès restreint.');
}

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
