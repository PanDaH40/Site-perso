<?php
declare(strict_types=1);

/**
 * MySQL (Aiven) -> MongoDB Atlas
 * - Copie 1:1 chaque table vers une collection du même nom
 * - Ajoute trajets.legacyId = id (MySQL) et trajets.dt (date+heure en UTC)
 * - Ajoute reservations.trajet_legacy_id = trajet_id (MySQL)
 * Usage:
 *   php asset/PHP/mysql_to_mongo_full_dump.php [--reset]
 */

ini_set('display_errors','1'); ini_set('display_startup_errors','1'); error_reporting(E_ALL);

require __DIR__ . '/../../vendor/autoload.php';

use MongoDB\Client as Mongo;
use MongoDB\BSON\UTCDateTime;

// ---- Lecture config MySQL depuis ENV (avec valeurs par défaut sûres) ----
$host = getenv('DB_HOST')     ?: 'mysql-2795339d-tpcovoiturage.h.aivencloud.com';
$port = (int)(getenv('DB_PORT') ?: 18502);
$db   = getenv('DB_DATABASE') ?: 'covoit';           // tu viens d'importer dans "covoit"
$user = getenv('DB_USERNAME') ?: 'avnadmin';
$pass = getenv('DB_PASSWORD') ?: '';
$ca   = getenv('DB_SSL_CA')   ?: '/var/www/html/asset/certs/aiven-ca.pem';

$dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $db);
$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];
if (is_readable($ca)) {
  $options[PDO::MYSQL_ATTR_SSL_CA] = $ca;
  $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
}

// ---- Connexions ----
echo "[MySQL] Connexion $host:$port/$db ...\n";
$pdo = new PDO($dsn, $user, $pass, $options);
$pdo->exec("SET NAMES utf8mb4");

// Mongo
$mongoUri = getenv('MONGODB_URI');
$mongoDb  = getenv('MONGODB_DB') ?: 'covoit';
if (!$mongoUri) {
  fwrite(STDERR, "ERROR: MONGODB_URI manquante (définis-la dans .env / docker-compose)\n");
  exit(1);
}
echo "[Mongo] Connexion Atlas -> DB $mongoDb ...\n";
$m = new Mongo($mongoUri);
$md = $m->selectDatabase($mongoDb);
$md->command(['ping'=>1]);

// ---- Options ----
$reset = in_array('--reset', $argv, true);

// ---- Liste des tables à migrer (dans un ordre safe) ----
$tables = [
  'inscrits',
  'conducteurs',
  'trajets',
  'reservations',
  'messages',
  'avis',
  'signalements',
  'passagers',
  'transactions_jetons',
  'logs_connexions',
];

// ---- Reset éventuel ----
if ($reset) {
  echo "[Mongo] --reset -> drop collections si elles existent...\n";
  foreach ($tables as $t) {
    try { $md->dropCollection($t); } catch (\Throwable $e) {}
  }
}

// ---- Fonctions utilitaires ----
function toUtcDateTimeFromLocal(string $date, string $time = '00:00', string $tz = 'Europe/Paris'): ?UTCDateTime {
  $date = trim($date); $time = trim($time);
  if ($date === '') return null;
  try {
    $dt = new DateTime($date.' '.$time, new DateTimeZone($tz));
    $dt->setTimezone(new DateTimeZone('UTC'));
    return new UTCDateTime($dt->getTimestamp() * 1000);
  } catch (\Throwable $e) { return null; }
}

// ---- Migration table par table ----
$total = [];
foreach ($tables as $t) {
  echo "[RUN] $t ... ";

  // Récupération des lignes MySQL
  $stmt = $pdo->query("SELECT * FROM `$t`");
  $rows = $stmt->fetchAll();
  $n = count($rows);

  // Transformation spécifique selon table
  foreach ($rows as &$r) {
    // Normalise encodage
    foreach ($r as $k=>$v) {
      if (is_string($v)) { /* $r[$k] = mb_convert_encoding($v, 'UTF-8', 'UTF-8'); */ }
    }

    if ($t === 'trajets') {
      // legacyId et dt (UTC à partir de date+heure, timezone locale supposée Europe/Paris)
      if (isset($r['id']))        $r['legacyId'] = (int)$r['id'];
      $date  = (string)($r['date'] ?? '');
      $heure = (string)($r['heure'] ?? '00:00');
      $r['dt'] = toUtcDateTimeFromLocal($date, $heure) ?? null;
    }

    if ($t === 'reservations') {
      if (isset($r['trajet_id'])) $r['trajet_legacy_id'] = (int)$r['trajet_id'];
    }
  }
  unset($r);

  // Insertion Mongo (bulk)
  if ($n > 0) {
    $col = $md->selectCollection($t);
    // Indexes utiles
    if ($t === 'trajets') {
      try { $col->createIndex(['legacyId'=>1], ['unique'=>false, 'sparse'=>true]); } catch (\Throwable $e) {}
      try { $col->createIndex(['dt'=>1]); } catch (\Throwable $e) {}
      try { $col->createIndex(['depart'=>1,'arrivee'=>1]); } catch (\Throwable $e) {}
    } elseif ($t === 'reservations') {
      try { $col->createIndex(['trajet_legacy_id'=>1]); } catch (\Throwable $e) {}
      try { $col->createIndex(['statut'=>1]); } catch (\Throwable $e) {}
    } elseif ($t === 'conducteurs') {
      try { $col->createIndex(['inscrit_id'=>1]); } catch (\Throwable $e) {}
    } elseif ($t === 'inscrits') {
      try { $col->createIndex(['id'=>1], ['unique'=>false]); } catch (\Throwable $e) {}
    }

    // insert en paquets
    $batch = 1000;
    for ($i=0; $i<$n; $i+=$batch) {
      $slice = array_slice($rows, $i, $batch);
      $col->insertMany($slice);
    }
  }

  $total[$t] = $n;
  echo "OK ($n)\n";
}

echo "\n--- Résumé ---\n";
foreach ($total as $k=>$v) {
  echo sprintf("%-20s : %d\n", $k, $v);
}

echo "\n[OK] Migration MySQL(%s) -> MongoDB(%s) terminée.\n", $db, $mongoDb;
