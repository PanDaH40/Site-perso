<?php
declare(strict_types=1);

$cfg = [
  'host'   => 'ecoridt815.mysql.db',
  'port'   => 3306,
  'db'     => 'ecoridt815',
  'user'   => 'ecoridt815',
  'pass'   => 'Thebigdu40',
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
    echo json_encode(['error' => 'Erreur de connexion à la base de données']);
    exit;
}




