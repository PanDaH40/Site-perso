<?php
declare(strict_types=1);

<<<<<<< Updated upstream:asset/PHP/db_conn.php
$cfg = [
  'host'   => 'sql309.infinityfree.com',
  'port'   => 3306,
  'db'     => 'if0_39505571_db_projet',
  'user'   => 'if0_39505571',
  'pass'   => 'qBOSjJTyyq5Trff',
];
=======
// $cfg = [
//   'host'   => 'ecoridt815.mysql.db',
//   'port'   => 3306,
//   'db'     => 'ecoridt815',
//   'user'   => 'ecoridt815',
//   'pass'   => 'Thebigdu40',
// ];
>>>>>>> Stashed changes:PHP/db_conn.php

$dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $_ENV['DB_HOST'], 3306, $_ENV['DB_DATABASE']);

$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $_ENV['DB_USERNAME'], $_ENV['DB_PASSWORD'], $options);
} catch (PDOException $e) {
    error_log('Erreur connexion BD: ' . $e->getMessage());
<<<<<<< Updated upstream:asset/PHP/db_conn.php
    die('Erreur de connexion à la base de données.');
}




=======
    echo json_encode(['error' => 'Erreur de connexion à la base de données']);
    exit;
}
>>>>>>> Stashed changes:PHP/db_conn.php
