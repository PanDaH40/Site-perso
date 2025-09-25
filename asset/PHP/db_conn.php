<?php
declare(strict_types=1);

/**
 * db_conn.php
 * - PROD (hébergé chez InfinityFree) : utilise la base InfinityFree (pas de SSL).
 * - DEV/Local (Docker) : si variables d'env présentes, utilise Aiven en SSL.
 */

/* ---------- Profil PROD (InfinityFree)  ---------- */
$defaults_prod = [
  'host'   => 'sql309.infinityfree.com',   // <- host IF
  'port'   => 3306,
  'db'     => 'if0_39505571_db_projet',      // <- ta base IF
  'user'   => 'if0_39505571',                // <- ton user IF
  'pass'   => 'qBOSjJTyyq5Trff',     // <- ton mot de passe IF
  'ssl_ca' => '',                          // pas de SSL chez InfinityFree
];

/* ---------- Profil DEV (Aiven) : lu via variables d'environnement ---------- */
/* Exemple (dans Docker): DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_SSL_CA */
$env = [
  'host'   => getenv('DB_HOST')     ?: '',
  'port'   => (int)(getenv('DB_PORT') ?: 0),
  'db'     => getenv('DB_DATABASE') ?: '',
  'user'   => getenv('DB_USERNAME') ?: '',
  'pass'   => getenv('DB_PASSWORD') ?: '',
  'ssl_ca' => getenv('DB_SSL_CA')   ?: '',
];

/* ---------- Sélection du profil ---------- */
/* Si on a un DB_HOST en env, on considère que c'est le profil DEV (Aiven).
   Sinon on tombe sur le profil PROD (InfinityFree). */
$cfg = !empty($env['host']) ? $env : $defaults_prod;

/* ---------- Construction PDO ---------- */
$dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $cfg['host'], $cfg['port'], $cfg['db']);

$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

/* Active le SSL uniquement si un CA est fourni et lisible (cas Aiven) */
if (!empty($cfg['ssl_ca'])) {
  $realCa = realpath($cfg['ssl_ca']) ?: $cfg['ssl_ca'];
  if (!is_file($realCa) || filesize($realCa) === 0) {
    throw new RuntimeException('CA introuvable ou vide: ' . $cfg['ssl_ca']);
  }
  $options[PDO::MYSQL_ATTR_SSL_CA] = $realCa;
  $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
}

$pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], $options);


