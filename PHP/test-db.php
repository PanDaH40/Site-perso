<?php
$host     = "ecoridt815.mysql.db";
$dbname   = "ecoridt815";
$username = "ecoridt815";
$password = "Thebigdu40";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "Connexion à la base réussie !";
} catch (PDOException $e) {
    echo "Erreur de connexion : " . $e->getMessage();
}
