<?php
declare(strict_types=1);

$cfg = [
  'host'   => 'sql309.infinityfree.com',
  'port'   => 3306,
  'db'     => 'if0_39505571_db_projet',
  'user'   => 'if0_39505571',
  'pass'   => 'qBOSjJTyyq5Trff',
];

$dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $cfg['host'], $cfg['port'], $cfg['db']);

$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];



try {
    $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], $options);
} catch (PDOException $e) {
    error_log('Erreur connexion BD: ' . $e->getMessage());
    die('Erreur de connexion à la base de données.');
}




