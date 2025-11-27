<?php
require __DIR__.'/config.php';

header("Location: /PageDaccueil.html");
exit;

$host = getenv('DB_HOST') ?: 'db';
$db   = getenv('DB_DATABASE') ?: 'app_db';
$user = getenv('DB_USERNAME') ?: 'app_user';
$pass = getenv('DB_PASSWORD') ?: 'secret123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "<p>Connexion MySQL réussie ✅</p>";
} catch (Throwable $e) {
    echo "<p>Erreur MySQL ❌ : " . $e->getMessage() . "</p>";
}
