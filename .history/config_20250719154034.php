<?php


// Paramètres de connexion MySQL (InfinityFree)
$host     = "sql309.infinityfree.com";
$dbname   = "if0_39505571_db_projet";
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
