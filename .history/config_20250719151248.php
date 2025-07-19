<?php
// config.php (NE PAS COMMITTER)
define('SITE_ACCESS_KEY', '4f3b2a1c9d8e7f6a5b4c3d2e1f0a9b8c');

// Paramètres de connexion MySQL (InfinityFree)
$host     = "sql309.infinityfree.com";
$dbname   = "if0_39505571XXXXXX";
$username = "if0_39505571";
$password = "qBOSjJTyyq5Trff";

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    // En production, ne pas afficher le message complet
    exit("Erreur de connexion à la base de données.");
}
