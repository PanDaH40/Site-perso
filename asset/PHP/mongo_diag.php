<?php
declare(strict_types=1);
ini_set('display_errors','1'); error_reporting(E_ALL);
header('Content-Type: text/plain; charset=utf-8');

require __DIR__ . '/../../vendor/autoload.php';

$uri = getenv('MONGODB_URI');
$dbn = getenv('MONGODB_DB') ?: 'covoit';
if (!$uri) { exit("MONGODB_URI manquant\n"); }

$client = new MongoDB\Client($uri);
$db     = $client->selectDatabase($dbn);

echo "DB: $dbn\n\n-- Collections --\n";
$names = [];
foreach ($db->listCollections() as $c) {
  $names[] = $c->getName();
}
echo ($names ? implode("\n",$names) : "(aucune)") . "\n\n";

/* Assure les collections clés */
$trajets = $db->selectCollection('trajets');
$resas   = $db->selectCollection('reservations');

/* Index utiles pour tes filtres front */
$trajets->createIndex(['depart'=>1,'arrivee'=>1,'date'=>1,'heure'=>1]);
$trajets->createIndex(['dt'=>1]); // datetime combiné (voir seed)

/* Counts */
echo "-- Counts --\n";
echo "trajets: " . $trajets->countDocuments() . "\n";
echo "reservations: " . $resas->countDocuments() . "\n";

echo "\nOK.\n";
